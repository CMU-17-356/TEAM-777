from flask import request, jsonify
from bson import ObjectId
from datetime import datetime

def accept_invite(db):
    token = request.args.get("token")

    if not token:
        return jsonify({"success": False, "message": "Missing token"}), 400

    invite = db.invites.find_one({"token": token, "accepted": False})
    if not invite:
        return jsonify({"success": False, "message": "Invalid or expired invite"}), 400

    if invite["expiresAt"] < datetime.utcnow():
        return jsonify({"success": False, "message": "Invite has expired"}), 400

    invited_user = db.users.find_one({"email": invite["email"]})
    if not invited_user:
        return jsonify({"success": False, "message": "User must register before accepting invite"}), 400

    user_id = invited_user["_id"]
    group_id = invite["groupId"]

    # Add user to group if not already a member
    db.groups.update_one(
        {"_id": ObjectId(group_id)},
        {"$addToSet": {"members": user_id}}
    )

    db.invites.update_one({"token": token}, {"$set": {"accepted": True}})

    return jsonify({"success": True, "message": "You have successfully joined the group!"}), 200
