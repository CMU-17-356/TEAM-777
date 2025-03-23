from flask import Flask, request, jsonify
from bson import ObjectId

app = Flask(__name__)


# Serialize group for output (without notes and creatorId)
def serialize_group(group):
    return {
        "id": str(group["_id"]),
        "name": group["name"],
        "address": group["address"],
        "members": [str(member_id) for member_id in group["members"]],
    }


# Group creation endpoint
def create_group(db):
    data = request.get_json()

    # Extract creator ID
    current_user_id_str = data.get("creatorId")
    if not current_user_id_str or not ObjectId.is_valid(current_user_id_str):
        return jsonify({"success": False, "message": "Invalid creatorId"}), 400

    current_user_id = ObjectId(current_user_id_str)

    # Extract and validate form fields
    group_name = data.get("groupName", "").strip()
    address = data.get("address", "").strip()
    members = data.get("members", [])

    if (
        not group_name
        or not address
        or not isinstance(members, list)
        or len(members) == 0
    ):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        # Extract valid member ObjectIds from member dicts (from frontend)
        member_object_ids = [
            ObjectId(member["id"])
            for member in members
            if isinstance(member, dict)
            and "id" in member
            and ObjectId.is_valid(member["id"])
        ]

        # Ensure creator is in the member list
        if current_user_id not in member_object_ids:
            member_object_ids.append(current_user_id)

        # Create group object
        group = {
            "name": group_name,
            "address": address,
            "members": member_object_ids,
        }

        # Insert into DB
        db.groups.insert_one(group)

        # Fetch all groups current user belongs to
        groups_cursor = db.groups.find({"members": current_user_id})
        groups = [serialize_group(g) for g in groups_cursor]

        return jsonify({"success": True, "groups": groups}), 201

    except Exception as e:
        print("Error creating group:", str(e))
        return jsonify({"success": False, "message": "Server error"}), 500
