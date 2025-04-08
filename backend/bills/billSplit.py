from flask import request, jsonify
import datetime
from bson import ObjectId


def calculate_user_balance(db, group_id, user_id):
    """Calculate the total balance for a specific user in a group."""
    try:
        transactions = db.transactions.find_one({"_id": group_id})
        if not transactions or "history" not in transactions:
            return 0

        balance = 0
        for _, transaction in transactions["history"].items():
            content = transaction["content"]
            amount = float(content["amount"])
            splitters = content["splitters"]
            initiator = content["initiator"]
            
            if initiator == user_id:
                balance -= amount
            elif user_id in splitters:
                balance += amount / len(splitters)

        return balance
    except Exception as e:
        print(f"Error calculating balance: {str(e)}")
        return 0


def get_formatted_transactions(db, group_id):
    """Get formatted transactions with user emails instead of IDs."""
    try:
        record = db.transactions.find_one({"_id": group_id})
        if not record or "history" not in record:
            return []

        transactions = []
        for transaction_id, transaction_data in record["history"].items():
            content = transaction_data["content"]
            
            # Get initiator's email and ID
            initiator_id = content["initiator"]
            initiator = db.users.find_one({"_id": ObjectId(initiator_id)})
            initiator_email = initiator["email"] if initiator else "Unknown"

            # Get splitters' emails
            splitter_emails = []
            for splitter_id in content["splitters"]:
                # Ensure splitter_id is valid before querying
                if ObjectId.is_valid(splitter_id):
                    splitter = db.users.find_one({"_id": ObjectId(splitter_id)})
                    if splitter:
                        splitter_emails.append(splitter["email"])
                else:
                    # Handle cases where an invalid ID might be stored (optional)
                    print(f"Warning: Invalid splitter ID found in transaction {transaction_id}: {splitter_id}")
                    splitter_emails.append("Invalid User ID")

            formatted_transaction = {
                "id": transaction_id,
                "description": content["description"],
                "amount": float(content["amount"]),
                "paidBy": initiator_email,
                "initiatorId": initiator_id,  # Add initiator ID here
                "date": content["timestamp"],
                "splitBetween": splitter_emails
            }
            transactions.append(formatted_transaction)

        # Sort transactions by date, newest first
        transactions.sort(key=lambda x: x["date"], reverse=True)
        return transactions
    except Exception as e:
        print(f"Error formatting transactions: {str(e)}")
        return []


def handle_add_expense(db):
    """Handle adding an expense."""
    try:
        data = request.json
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400

        required_fields = [
            "_id",
            "initiator",
            "splitters",
            "amount",
            "description"
        ]
        if not all(field in data for field in required_fields):
            return jsonify({
                "success": False,
                "message": "Missing required fields"
            }), 400

        if not isinstance(data["amount"], (int, float)):
            return jsonify({
                "success": False,
                "message": "Amount must be positive"
            }), 400

        if not isinstance(data["splitters"], list) or not data["splitters"]:
            return jsonify({
                "success": False,
                "message": "Splitters must be a list"
            }), 400

        if not isinstance(data["initiator"], str) or not data["initiator"]:
            return jsonify({
                "success": False,
                "message": "Invalid initiator"
            }), 400

        group_id = data["_id"]
        timestamp = datetime.datetime.utcnow().isoformat()

        new_transaction = {
            "initiator": data["initiator"],
            "splitters": data["splitters"],
            "amount": float(data["amount"]),
            "description": data["description"],
            "timestamp": timestamp,
        }

        collection = db.transactions
        record = collection.find_one({"_id": group_id}) or {
            "_id": group_id,
            "history": {}
        }
        transaction_id = str(len(record["history"]) + 1)
        record["history"][transaction_id] = {"content": new_transaction}

        # Save the new transaction
        collection.update_one(
            {"_id": group_id},
            {"$set": record},
            upsert=True
        )

        # Get updated transactions
        transactions = get_formatted_transactions(db, group_id)
        
        # Calculate balance for the initiator
        balance = calculate_user_balance(db, group_id, data["initiator"])

        return jsonify({
            "success": True,
            "message": "Expense added successfully",
            "transactions": transactions,  # This will now be the full list of transactions
            "balance": balance
        }), 200

    except Exception as e:
        print(f"Error in handle_add_expense: {str(e)}")  # Add debug logging
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500