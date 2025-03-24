from flask import Flask, request, jsonify
import datetime
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/mydatabase")
client = MongoClient(MONGO_URI)
db = client["DEV"]  # Change this to your database name
collection = db["transactions"]  # Collection storing group transactions
ledger_collection = db["balances"]  # Collection storing debt balances

def update_balances(balance_record, new_transaction):
    """Update balance ledger based on the new transaction."""
    initiator = new_transaction["initiator"]
    splitters = new_transaction["splitters"]
    amount = new_transaction["amount"]
    share = amount / len(splitters)  # Evenly split the expense

    if initiator not in balance_record:
        balance_record[initiator] = {}

    for person in splitters:
        if person == initiator:
            continue  # Skip the initiator paying themselves

        if person not in balance_record:
            balance_record[person] = {}

        # Update debt: person owes initiator
        balance_record[person][initiator] = balance_record[person].get(initiator, 0) + share
        balance_record[initiator][person] = balance_record[initiator].get(person, 0) - share

    return balance_record

def handle_add_expense():
    data = request.json

    # Validate required fields
    required_fields = ["_id", "initiator", "splitters", "amount", "description"]
    if not all(field in data for field in required_fields):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    group_id = data["_id"]
    timestamp = datetime.datetime.utcnow().isoformat()

    new_transaction = {
        "initiator": data["initiator"],
        "splitters": data["splitters"],
        "amount": data["amount"],
        "description": data["description"],
        "timestamp": timestamp,
    }

    # Fetch existing transaction record
    record = collection.find_one({"_id": group_id})
    if not record:
        record = {"_id": group_id, "history": []}

    # Append new transaction to history
    record["history"].append(new_transaction)

    # Fetch or initialize the balance ledger
    balance_record = ledger_collection.find_one({"_id": group_id})
    if not balance_record:
        balance_record = {"_id": group_id, "balances": {}}

    # Update balance record
    updated_balances = update_balances(balance_record["balances"], new_transaction)
    balance_record["balances"] = updated_balances

    # Save updated records to the database
    collection.update_one({"_id": group_id}, {"$set": record}, upsert=True)
    ledger_collection.update_one({"_id": group_id}, {"$set": balance_record}, upsert=True)

    return jsonify({
        "success": True,
        "message": "Expense added successfully",
        "updated_history": record["history"],
        "updated_balances": updated_balances,
    }), 200
