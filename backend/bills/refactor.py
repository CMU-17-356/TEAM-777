from bson import ObjectId
from datetime import datetime
from typing import List, Dict, Any, Optional
from flask import request, jsonify
from pymongo import MongoClient
from fastapi import HTTPException


def get_user_info(db, user_id):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"email": "Unknown", "username": "Unknown"}
    return {"email": user.get("email", ""), "username": user.get("username", "")}


def get_member_balances(db, group_id, user_id):
    try:
        if not hasattr(db, "transactions") or not hasattr(db, "groups"):
            return {}
        if not ObjectId.is_valid(group_id):
            return {}
        transactions = (
            list(db.transactions.find({"groupId": ObjectId(group_id)}))
            if hasattr(db.transactions, "find")
            else []
        )
        group = (
            db.groups.find_one({"_id": ObjectId(group_id)})
            if hasattr(db.groups, "find_one")
            else None
        )
        if (
            not group
            or "members" not in group
            or not isinstance(group["members"], list)
        ):
            return {}
        # Convert all member IDs to strings
        member_ids = [
            str(member_id)
            for member_id in group["members"]
            if str(member_id) != str(user_id)
        ]
        member_balances = {member_id: 0.0 for member_id in member_ids}
        for transaction in transactions:
            if not all(
                k in transaction
                for k in ("type", "initiatorId", "recipientId", "amount")
            ):
                continue
            initiator_id = str(transaction["initiatorId"])
            recipient_id = str(transaction["recipientId"])
            if transaction["type"] == "request":
                if recipient_id == str(user_id):
                    member_balances[initiator_id] = member_balances.get(
                        initiator_id, 0.0
                    ) + float(transaction["amount"])
                elif initiator_id == str(user_id):
                    member_balances[recipient_id] = member_balances.get(
                        recipient_id, 0.0
                    ) - float(transaction["amount"])
            elif transaction["type"] == "pay":
                if recipient_id == str(user_id):
                    member_balances[initiator_id] = member_balances.get(
                        initiator_id, 0.0
                    ) - float(transaction["amount"])
                elif initiator_id == str(user_id):
                    member_balances[recipient_id] = member_balances.get(
                        recipient_id, 0.0
                    ) + float(transaction["amount"])
        return member_balances
    except Exception:
        return {}


def get_recent_transactions(db, group_id, limit=5):
    transactions = list(
        db.transactions.find({"groupId": ObjectId(group_id)})
        .sort("date", -1)
        .limit(limit)
    )
    formatted_transactions = []
    for transaction in transactions:
        initiator = get_user_info(db, transaction["initiatorId"])
        recipient = get_user_info(db, transaction["recipientId"])
        formatted_transactions.append(
            {
                "id": str(transaction["_id"]),
                "description": transaction["description"],
                "amount": transaction["amount"],
                "type": transaction["type"],
                "date": transaction["date"],
                "initiatorUsername": initiator["username"],
                "recipientUsername": recipient["username"],
            }
        )
    return formatted_transactions


def create_transaction(db):
    try:
        data = request.json or {}
        required_fields = [
            "group_id",
            "initiator_id",
            "recipient_id",
            "amount",
            "description",
            "transaction_type",
        ]
        if not all(field in data for field in required_fields):
            return (
                jsonify({"success": False, "message": "Missing required fields"}),
                400,
            )
        if not hasattr(db, "groups") or not hasattr(db, "transactions"):
            return (
                jsonify(
                    {"success": False, "message": "Database not properly configured"}
                ),
                500,
            )
        if not ObjectId.is_valid(data["group_id"]):
            return jsonify({"success": False, "message": "Invalid group_id"}), 400
        group = (
            db.groups.find_one({"_id": ObjectId(data["group_id"])})
            if hasattr(db.groups, "find_one")
            else None
        )
        if (
            not group
            or "members" not in group
            or not isinstance(group["members"], list)
        ):
            return (
                jsonify(
                    {"success": False, "message": "Group not found or has no members"}
                ),
                404,
            )
        group_member_ids = [str(mid) for mid in group["members"]]
        if (
            str(data["initiator_id"]) not in group_member_ids
            or str(data["recipient_id"]) not in group_member_ids
        ):
            return (
                jsonify({"success": False, "message": "Users must be group members"}),
                400,
            )
        if data["transaction_type"] not in ["request", "pay"]:
            return (
                jsonify({"success": False, "message": "Invalid transaction type"}),
                400,
            )
        try:
            amount = float(data["amount"])
        except Exception:
            return (
                jsonify({"success": False, "message": "Amount must be a number"}),
                400,
            )
        if amount <= 0:
            return (
                jsonify({"success": False, "message": "Amount must be positive"}),
                400,
            )
        transaction = {
            "groupId": ObjectId(data["group_id"]),
            "initiatorId": data["initiator_id"],
            "recipientId": data["recipient_id"],
            "amount": amount,
            "description": data["description"],
            "type": data["transaction_type"],
            "date": datetime.utcnow(),
        }
        result = (
            db.transactions.insert_one(transaction)
            if hasattr(db.transactions, "insert_one")
            else None
        )
        transaction["_id"] = result.inserted_id if result else ""
        initiator = get_user_info(db, data["initiator_id"])
        recipient = get_user_info(db, data["recipient_id"])
        return jsonify(
            {
                "success": True,
                "transaction": {
                    "id": str(transaction.get("_id", "")),
                    "description": transaction["description"],
                    "amount": transaction["amount"],
                    "type": transaction["type"],
                    "date": transaction["date"],
                    "initiatorUsername": initiator["username"],
                    "recipientUsername": recipient["username"],
                },
            }
        )
    except Exception as e:
        return (
            jsonify({"success": False, "message": f"An error occurred: {str(e)}"}),
            500,
        )


def format_transactions(db, group_id: str) -> List[Dict[str, Any]]:
    """
    Return a list of formatted transactions for a given group, with initiator and splitters identified by username.
    """
    record = db.transactions.find_one({"_id": group_id})
    history = record.get("history", {}) if record else {}

    transactions = []
    for entry in history.values():
        content = entry.get("content", {})
        initiator_id = content.get("initiator", "")
        splitters = content.get("splitters", [])
        amount = float(content.get("amount", 0))
        description = content.get("description", "")
        timestamp = content.get("timestamp", "")

        initiator = get_user_info(db, initiator_id)["username"]
        splitter_usernames = [
            get_user_info(db, uid)["username"]
            for uid in splitters
            if ObjectId.is_valid(uid)
        ]

        transactions.append(
            {
                "description": description,
                "amount": amount,
                "date": timestamp,
                "initiatorUsername": initiator,
                "splitBetweenUsernames": splitter_usernames,
            }
        )

    # Sort transactions by date in descending order
    return sorted(transactions, key=lambda t: t["date"], reverse=True)


def calculate_user_balance(db, group_id: str, user_id: str) -> float:
    """
    Calculate the total balance of a user in a group.
    Positive balance means owed to the user, negative means they owe.
    """
    try:
        record = db.transactions.find_one({"_id": group_id})
        history = record.get("history", {}) if record else {}
        balance = 0.0

        for entry in history.values():
            content = entry.get("content", {})
            amount = float(content.get("amount", 0))
            initiator = content.get("initiator", "")
            splitters = content.get("splitters", [])

            # Decrease balance if user is the initiator of the transaction
            if initiator == user_id:
                balance -= amount
            # Add split amount to balance if user is in the splitters list
            if user_id in splitters and len(splitters) > 0:
                balance += amount / len(splitters)

        return balance
    except Exception as e:
        print(f"Error calculating balance: {e}")
        return 0.0


def handle_add_expense(db):
    """Handle adding an expense."""
    try:
        data = request.json or {}
        required_fields = ["_id", "initiator", "splitters", "amount", "description"]

        # Check for missing required fields
        if not all(field in data for field in required_fields):
            return (
                jsonify({"success": False, "message": "Missing required fields"}),
                400,
            )

        # Validate amount (should be a positive number)
        if not isinstance(data["amount"], (int, float)) or data["amount"] <= 0:
            return (
                jsonify({"success": False, "message": "Amount must be positive"}),
                400,
            )

        # Validate splitters (should be a non-empty list)
        if not isinstance(data["splitters"], list) or not data["splitters"]:
            return (
                jsonify({"success": False, "message": "Splitters must be a list"}),
                400,
            )

        # Validate initiator (should be a string)
        if not isinstance(data["initiator"], str):
            return jsonify({"success": False, "message": "Invalid initiator"}), 400

        group_id = data["_id"]
        timestamp = datetime.utcnow().isoformat()

        # Create a new transaction object
        new_transaction = {
            "initiator": data["initiator"],
            "splitters": data["splitters"],
            "amount": float(data["amount"]),
            "description": data["description"],
            "timestamp": timestamp,
        }

        # Retrieve the current record, or create a new one
        collection = db.transactions
        record = collection.find_one({"_id": group_id}) or {
            "_id": group_id,
            "history": {},
        }
        transaction_id = str(len(record["history"]) + 1)
        record["history"][transaction_id] = {"content": new_transaction}

        # Update the record in the database
        collection.update_one({"_id": group_id}, {"$set": record}, upsert=True)

        # Get formatted transactions and updated balance
        transactions = format_transactions(db, group_id)
        balance = calculate_user_balance(db, group_id, data["initiator"])

        # Return success response
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Expense added successfully",
                    "transactions": transactions,
                    "balance": balance,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Error in handle_add_expense: {str(e)}")
        return (
            jsonify({"success": False, "message": f"An error occurred: {str(e)}"}),
            500,
        )
