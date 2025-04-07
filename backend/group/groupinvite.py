from flask import Flask, request, jsonify
from bson import ObjectId
import uuid
from datetime import datetime, timedelta

app = Flask(__name__)

# Serialize group for output (without notes and creatorId)
def serialize_group(group):
    return {
        "id": str(group["_id"]),
        "name": group["name"],
        "address": group["address"],
        "members": [str(member_id) for member_id in group["members"]],
    }

# Mock email sending (for now just print)
def send_invite_email(to_email, token):
    invite_link = f"http://localhost:3000/accept-invite?token={token}"
    print(f"[MOCK EMAIL] Invite sent to {to_email}: {invite_link}")
    # Replace with actual email service (SMTP or SendGrid) for real emails

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
        # Extract valid member ObjectIds from member dicts
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

        # Create group
        group = {
            "name": group_name,
            "address": address,
            "members": member_object_ids,
        }

        db.groups.insert_one(group)
        group_id = group["_id"]  # for invites

        # Send invites to users (mock)
        for member in members:
            member_id_str = member.get("id")
            member_email = member.get("email")

            if not member_email:
                continue  # skip if no email provided

            if member_id_str != str(current_user_id):  # skip creator
                token = str(uuid.uuid4())
                db.invites.insert_one({
                    "token": token,
                    "email": member_email,
                    "groupId": group_id,
                    "expiresAt": datetime.utcnow() + timedelta(days=2),
                    "accepted": False
                })
                send_invite_email(member_email, token)

        # Fetch updated groups list for the creator
        groups_cursor = db.groups.find({"members": current_user_id})
        groups = [serialize_group(g) for g in groups_cursor]

        return jsonify({"success": True, "groups": groups}), 201

    except Exception as e:
        print("Error creating group:", str(e))
        return jsonify({"success": False, "message": "Server error"}), 500
