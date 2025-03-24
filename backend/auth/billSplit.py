from flask import request, jsonify
import datetime


def calculate_net_balances(balance_record):
    """Calculate net balances for each person and minimize transactions."""
    net_positions = {
        p: sum(b.values()) for p, b in balance_record.items()
    }

    receivers = {p: v for p, v in net_positions.items() if v > 0}
    payers = {p: v for p, v in net_positions.items() if v < 0}

    minimized_balances = {p: {} for p in balance_record}

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
    """Handle adding an expense."""
    try:
        data = request.json
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400

        required_fields = ["_id", "initiator", "splitters", "amount", "description"]
        if not all(field in data for field in required_fields):
            return jsonify({
                "success": False,
                "message": "Missing required fields"
            }), 400

        if not isinstance(data["amount"], (int, float)) or data["amount"] <= 0:
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

        collection = db["transactions"]
        ledger_collection = db["balances"]

        record = collection.find_one({"_id": group_id}) or {
            "_id": group_id,
            "history": {}
        }
        transaction_id = str(len(record["history"]) + 1)
        record["history"][transaction_id] = {"content": new_transaction}

        balance_record = ledger_collection.find_one({"_id": group_id}) or {
            "_id": group_id,
            "balances": {}
        }

        initiator = new_transaction["initiator"]
        splitters = new_transaction["splitters"]
        amount = new_transaction["amount"]
        share = amount / len(splitters)

        balance_record["balances"].setdefault(initiator, {})

        for person in splitters:
            if person == initiator:
                continue
            balance_record["balances"].setdefault(person, {})
            balance_record["balances"][person][initiator] = (
                balance_record["balances"][person].get(initiator, 0) + share
            )
            balance_record["balances"][initiator][person] = (
                balance_record["balances"][initiator].get(person, 0) - share
            )

        minimized_balances = calculate_net_balances(balance_record["balances"])
        balance_record["balances"] = minimized_balances

        collection.update_one(
            {"_id": group_id},
            {"$set": record},
            upsert=True
        )
        ledger_collection.update_one(
            {"_id": group_id},
            {"$set": balance_record},
            upsert=True
        )

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