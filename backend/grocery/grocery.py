from flask import request, jsonify
from datetime import datetime
from bson import ObjectId

def handle_add_grocery(db):
    """Add a grocery request to the database."""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        required_fields = ["_id", "requester", "item", "place"]
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        group_id = data["_id"]
        timestamp = datetime.utcnow().isoformat()

        new_grocery = {
            "requester": data["requester"],
            "item": data["item"],
			"quantity": data.get("quantity", "1"),  # default to 1 if not provided
            "place": data["place"],
            "timestamp": timestamp
        }

        collection = db.groceries
        record = collection.find_one({"_id": group_id}) or {"_id": group_id, "items": {}}
        item_id = str(len(record["items"]) + 1)
        record["items"][item_id] = {"content": new_grocery}

        collection.update_one({"_id": group_id}, {"$set": record}, upsert=True)

        groceries = get_formatted_groceries(db, group_id)
        return jsonify({"success": True, "message": "Grocery added", "groceries": groceries}), 200

    except Exception as e:
        print("Error in handle_add_grocery:", str(e))
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


def get_formatted_groceries(db, group_id):
    try:
        record = db.groceries.find_one({"_id": group_id})
        if not record or "items" not in record:
            return []

        groceries = []
        for item_id, item_data in record["items"].items():
            content = item_data["content"]
            requester = db.users.find_one({"_id": ObjectId(content["requester"])})
            requester_email = requester["email"] if requester else "Unknown"

            groceries.append({
                "id": item_id,
                "item": content["item"],
				"quantity": content.get("quantity", "1"),  # default fallback
                "place": content["place"],
                "requester": requester_email,
                "date": content["timestamp"]
            })

        groceries.sort(key=lambda x: x["date"], reverse=True)
        return groceries

    except Exception as e:
        print("Error formatting groceries:", str(e))
        return []
