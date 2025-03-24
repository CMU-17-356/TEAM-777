from flask import request, jsonify
import datetime

def calculate_net_balances(balance_record):
    """Calculate net balances for each person and minimize transactions."""
    # Calculate net position for each person
    net_positions = {}
    for person in balance_record:
        net_positions[person] = sum(balance_record[person].values())
    
    # Separate into receivers (positive) and payers (negative)
    receivers = {p: v for p, v in net_positions.items() if v > 0}
    payers = {p: v for p, v in net_positions.items() if v < 0}
    
    # Initialize minimized transactions
    minimized_balances = {}
    for person in balance_record:
        minimized_balances[person] = {}
    
    # Match payers to receivers to minimize transactions
    for payer, amount in payers.items():
        remaining_amount = abs(amount)
        for receiver, receive_amount in receivers.items():
            if remaining_amount <= 0:
                break
            if receive_amount > 0:
                transfer_amount = min(remaining_amount, receive_amount)
                minimized_balances[payer][receiver] = transfer_amount
                minimized_balances[receiver][payer] = -transfer_amount
                remaining_amount -= transfer_amount
                receivers[receiver] -= transfer_amount
    
    return minimized_balances

def handle_add_expense(db):
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        # Validate required fields
        required_fields = ["_id", "initiator", "splitters", "amount", "description"]
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Validate data types and values
        if not isinstance(data["amount"], (int, float)) or data["amount"] <= 0:
            return jsonify({"success": False, "message": "Amount must be a positive number"}), 400
        
        if not isinstance(data["splitters"], list) or len(data["splitters"]) == 0:
            return jsonify({"success": False, "message": "Splitters must be a non-empty list"}), 400

        if not isinstance(data["initiator"], str) or not data["initiator"]:
            return jsonify({"success": False, "message": "Initiator must be a non-empty string"}), 400

        group_id = data["_id"]
        timestamp = datetime.datetime.utcnow().isoformat()

        new_transaction = {
            "initiator": data["initiator"],
            "splitters": data["splitters"],
            "amount": float(data["amount"]),
            "description": data["description"],
            "timestamp": timestamp
        }

        # Get collections from the provided db
        collection = db["transactions"]
        ledger_collection = db["balances"]

        # Fetch existing transaction record
        record = collection.find_one({"_id": group_id})
        if not record:
            record = {
                "_id": group_id,
                "history": {}
            }

        # Add new transaction to history with content structure
        transaction_id = str(len(record["history"]) + 1)
        record["history"][transaction_id] = {
            "content": new_transaction
        }

        # Fetch or initialize the balance ledger
        balance_record = ledger_collection.find_one({"_id": group_id})
        if not balance_record:
            balance_record = {"_id": group_id, "balances": {}}

        # Update initial balances
        initiator = new_transaction["initiator"]
        splitters = new_transaction["splitters"]
        amount = new_transaction["amount"]
        share = amount / len(splitters)

        if initiator not in balance_record["balances"]:
            balance_record["balances"][initiator] = {}

        for person in splitters:
            if person == initiator:
                continue

            if person not in balance_record["balances"]:
                balance_record["balances"][person] = {}

            # Update debt: person owes initiator
            balance_record["balances"][person][initiator] = balance_record["balances"][person].get(initiator, 0) + share
            balance_record["balances"][initiator][person] = balance_record["balances"][initiator].get(person, 0) - share

        # Calculate minimized balances
        minimized_balances = calculate_net_balances(balance_record["balances"])
        balance_record["balances"] = minimized_balances

        # Save updated records to the database
        collection.update_one({"_id": group_id}, {"$set": record}, upsert=True)
        ledger_collection.update_one({"_id": group_id}, {"$set": balance_record}, upsert=True)

        return jsonify({
            "success": True,
            "message": "Expense added successfully",
            "updated_history": record["history"],
            "updated_balances": minimized_balances,
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500
