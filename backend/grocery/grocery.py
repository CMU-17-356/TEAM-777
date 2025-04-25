from flask import request, jsonify
from datetime import datetime
from bson import ObjectId


def handle_edit_grocery(db):
    """Edit a grocery request in the database."""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        required_fields = ["_id", "requester", "item", "place", "itemId"]
        if not all(field in data for field in required_fields):
            return (
                jsonify({"success": False, "message": "Missing required fields"}),
                400,
            )

        group_id = data["_id"]
        item_id = data["itemId"]

        # Check if the user is the creator
        record = db.groceries.find_one({"_id": group_id})
        item = record["items"].get(item_id)
        if not item or item["content"]["requester"] != data["requester"]:
            return (
                jsonify(
                    {"success": False, "message": "Unauthorized to edit this item"}
                ),
                403,
            )

        # Update the item
        updated_item = {
            "item": data["item"],
            "quantity": data.get("quantity", "1"),
            "place": data["place"],
            "requester": data["requester"],
            "timestamp": datetime.utcnow().isoformat(),
            "acceptedBy": None,
            "purchaseTime": None,
        }
        record["items"][item_id]["content"] = updated_item
        db.groceries.update_one({"_id": group_id}, {"$set": record})

        groceries = get_formatted_groceries(db, group_id)
        return jsonify({"success": True, "groceries": groceries}), 200
    except Exception as e:
        print("Error in handle_edit_grocery:", str(e))
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


def handle_add_grocery(db):
    """Add a grocery request to the database."""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        required_fields = ["_id", "requester", "item", "place"]
        if not all(field in data for field in required_fields):
            return (
                jsonify({"success": False, "message": "Missing required fields"}),
                400,
            )

        group_id = data["_id"]
        timestamp = datetime.utcnow().isoformat()

        new_grocery = {
            "requester": data["requester"],
            "item": data["item"],
            "quantity": data.get("quantity", "1"),  # default to 1 if not provided
            "place": data["place"],
            "timestamp": timestamp,
            "acceptedBy": None,
            "purchaseTime": None,
        }

        collection = db.groceries
        record = collection.find_one({"_id": group_id}) or {
            "_id": group_id,
            "items": {},
        }
        item_id = str(len(record["items"]) + 1)
        record["items"][item_id] = {"content": new_grocery}

        collection.update_one({"_id": group_id}, {"$set": record}, upsert=True)

        groceries = get_formatted_groceries(db, group_id)
        return (
            jsonify(
                {"success": True, "message": "Grocery added", "groceries": groceries}
            ),
            200,
        )

    except Exception as e:
        print("Error in handle_add_grocery:", str(e))
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


def handle_accept_grocery(db):
    """Accept a grocery request."""
    try:
        data = request.json
        group_id = data.get("groupId")
        item_id = data.get("itemId")
        user_id = data.get("userId")
        purchase_time = data.get("purchaseTime")

        if not group_id or not item_id or not user_id:
            return (
                jsonify({"success": False, "message": "Missing required fields"}),
                400,
            )

        record = db.groceries.find_one({"_id": group_id})
        if not record:
            return jsonify({"success": False, "message": "Group not found"}), 404

        # Mark the item as accepted
        record["items"][item_id]["content"]["acceptedBy"] = user_id
        record["items"][item_id]["content"]["purchaseTime"] = purchase_time
        db.groceries.update_one({"_id": group_id}, {"$set": record})

        groceries = get_formatted_groceries(db, group_id)
        return jsonify({"success": True, "groceries": groceries}), 200
    except Exception as e:
        print("Error in handle_accept_grocery:", str(e))
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


def grocery_remove_accept(db):
    """Remove the user's acceptance to buy a grocery item."""
    data = request.get_json()  # Get data from the request body
    group_id = data.get("groupId")
    item_id = data.get("itemId")
    user_id = data.get("userId")

    if not group_id or not item_id or not user_id:
        return jsonify({"success": False, "message": "Missing required data"}), 400

    try:
        # Fetch the grocery record from the database
        record = db.groceries.find_one({"_id": group_id})
        if not record:
            return jsonify({"success": False, "message": "Group not found"}), 404

        # Fetch the item data
        item = record["items"].get(item_id)
        if not item:
            return jsonify({"success": False, "message": "Item not found"}), 404

        # Check if the user is the one who accepted the item
        if item["content"].get("acceptedBy") != user_id:
            return (
                jsonify(
                    {"success": False, "message": "You haven't accepted this item"}
                ),
                403,
            )

        # Remove the user's acceptance
        item["content"]["acceptedBy"] = None
        item["content"]["purchaseTime"] = None

        # Update the grocery item in the database
        db.groceries.update_one({"_id": group_id}, {"$set": record})

        # Return a success message
        return jsonify({"success": True, "message": "Acceptance removed"}), 200
    except Exception as e:
        print(f"Error in grocery_remove_acceptance: {e}")
        return jsonify({"success": False, "message": "Error occurred"}), 500


def get_formatted_groceries(db, group_id):
    try:
        record = db.groceries.find_one({"_id": group_id})
        if not record or "items" not in record:
            return []

        groceries = []
        for item_id, item_data in record["items"].items():
            content = item_data["content"]
            accepter = db.users.find_one({"_id": ObjectId(content["acceptedBy"])})
            accepter_username = accepter["username"] if accepter else "Unknown"
            purchase_time = content["purchaseTime"]
            requester = db.users.find_one({"_id": ObjectId(content["requester"])})
            requester_username = requester["username"] if requester else "Unknown"

            groceries.append(
                {
                    "id": item_id,
                    "item": content["item"],
                    "quantity": content.get("quantity", "1"),  # default fallback
                    "place": content["place"],
                    "requester": content["requester"],
                    "requester_username": requester_username,
                    "date": content["timestamp"],
                    "acceptedBy": content["acceptedBy"],
                    "accepter": accepter_username,
                }
            )

        groceries.sort(key=lambda x: x["date"], reverse=True)
        return groceries

    except Exception as e:
        print("Error formatting groceries:", str(e))
        return []


def handle_delete_grocery(db):
    try:
        data = request.get_json()
        group_id = data.get("groupId")
        item_id = data.get("itemId")

        if not group_id or not item_id:
            return (
                jsonify({"success": False, "message": "Missing groupId or itemId"}),
                400,
            )

        result = db.groceries.update_one(
            {"_id": group_id}, {"$unset": {f"items.{item_id}": ""}}
        )

        return jsonify({"success": True, "message": "Item deleted"}), 200

    except Exception as e:
        print("Error deleting grocery:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500
