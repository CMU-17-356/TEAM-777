from flask import jsonify
from bson import ObjectId
from datetime import datetime


def get_transactions(db, group_id):
    if not group_id or not ObjectId.is_valid(group_id):
        return jsonify({"success": False, "message": "Invalid group ID"}), 400

    try:
        # Find the transactions document for this group
        record = db.transactions.find_one({"_id": group_id})
        if not record or "history" not in record:
            return jsonify([]), 200

        # Convert the history dict to a list of transactions
        transactions = []
        for transaction_id, transaction_data in record["history"].items():
            content = transaction_data["content"]

            # Get initiator's email
            initiator = db.users.find_one({"_id": ObjectId(content["initiator"])})
            initiator_email = initiator["email"] if initiator else "Unknown"

            # Format the transaction for frontend
            formatted_transaction = {
                "id": transaction_id,
                "description": content["description"],
                "amount": float(content["amount"]),
                "paidBy": initiator_email,
                "date": content["timestamp"],
                "splitBetween": content["splitters"],
            }
            transactions.append(formatted_transaction)

        # Sort transactions by date, newest first
        transactions.sort(key=lambda x: x["date"], reverse=True)
        return jsonify(transactions), 200

    except Exception as e:
        print("Error fetching transactions:", str(e))
        return jsonify({"success": False, "message": "Server error"}), 500
