# backend/notifications.py
from datetime import datetime
from bson import ObjectId
from flask import request, jsonify



def list_notifications(db):
    """
    POST /api/notifications
    Body: { "userId": "..." }
    """
    data = request.get_json(force=True)
    uid_str = data.get("userId", "")
    if not ObjectId.is_valid(uid_str):
        return jsonify({"success": False, "message": "Invalid userId"}), 400
    uid = ObjectId(uid_str)

    cursor = db.notifications.find({
        "receiverId": uid,
        "status": "pending",
    })

    notes = [{
        "id": str(n["_id"]),
        "groupId": str(n["groupId"]),
        "senderId": str(n["senderId"]),
        "status": n["status"],
        "createdAt": n.get("createdAt", datetime.utcnow()).isoformat()
    } for n in cursor]

    return jsonify({"success": True, "notifications": notes}), 200



def respond_invite(db, invite_id):
    """
    PATCH /api/notifications/<invite_id>
    Body: { "userId": "...", "action": "accept" | "decline" }
    """
    data = request.get_json(force=True)
    action  = data.get("action")
    uid_str = data.get("userId", "")

    if action not in ("accept", "decline"):
        return jsonify({"success": False, "message": "action must be accept|decline"}), 400
    if not (ObjectId.is_valid(invite_id) and ObjectId.is_valid(uid_str)):
        return jsonify({"success": False, "message": "Bad id"}), 400

    uid = ObjectId(uid_str)
    invite = db.notifications.find_one({
        "_id": ObjectId(invite_id),
        "receiverId": uid,
        "status": "pending",
    })
    if not invite:
        return jsonify({"success": False, "message": "Invite not found"}), 404

    new_status = "accepted" if action == "accept" else "declined"

   
    db.notifications.update_one(
        {"_id": invite["_id"]},
        {"$set": {"status": new_status}}
    )

   
    if new_status == "accepted":
        db.groups.update_one(
            {"_id": invite["groupId"]},
            {"$addToSet": {"members": uid}}
        )

    return jsonify({"success": True, "status": new_status}), 200
