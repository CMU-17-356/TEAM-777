from datetime import datetime
from bson import ObjectId
from flask import request, jsonify


def _send_notification(db, *, sender_id, receiver_id, group_id, ntype, extra=None):
    """
    ntype  : 'invite' | 'chore' | …
    status : 'pending' for invites, 'unread' for everything else
    """
    note = {
        "senderId": sender_id,
        "receiverId": receiver_id,
        "groupId": group_id,
        "status": "pending" if ntype == "invite" else "unread",
        "type": ntype,
        "createdAt": datetime.utcnow(),
        **(extra or {}),
    }
    db.notifications.insert_one(note)


def list_notifications(db):
    data = request.get_json(force=True)
    uid_str = data.get("userId", "")
    if not ObjectId.is_valid(uid_str):
        return jsonify({"success": False, "message": "Invalid userId"}), 400
    uid = ObjectId(uid_str)

    cursor = db.notifications.find(
        {
            "receiverId": uid,
            "status": {"$in": ["pending", "unread"]},
        }
    )

    notes = []
    for n in cursor:

        group_name = n.get("groupName")
        if not group_name:
            grp = db.groups.find_one({"_id": n["groupId"]}, {"name": 1})
            group_name = grp["name"] if grp else None

        notes.append(
            {
                "id": str(n["_id"]),
                "groupId": str(n["groupId"]),
                "senderId": str(n["senderId"]),
                "status": n["status"],
                "type": n.get("type", "invite"),
                "title": n.get("title"),
                "senderName": n.get("senderName"),
                "groupName": group_name,
                "createdAt": n["createdAt"].isoformat(),
            }
        )

    return jsonify({"success": True, "notifications": notes}), 200


def respond_invite(db, invite_id):
    data = request.get_json(force=True)
    action = data.get("action")
    uid_str = data.get("userId", "")

    if action not in ("accept", "decline"):
        return jsonify({"success": False, "message": "Bad action"}), 400
    if not (ObjectId.is_valid(invite_id) and ObjectId.is_valid(uid_str)):
        return jsonify({"success": False, "message": "Bad id"}), 400

    uid = ObjectId(uid_str)
    invite = db.notifications.find_one(
        {
            "_id": ObjectId(invite_id),
            "receiverId": uid,
            "status": {"$in": ["pending", "unread"]},
        }
    )
    if not invite:
        return jsonify({"success": False, "message": "Notification not found"}), 404

    if invite.get("type") == "invite":
        new_status = "accepted" if action == "accept" else "declined"
        db.notifications.update_one(
            {"_id": invite["_id"]}, {"$set": {"status": new_status}}
        )
        if new_status == "accepted":
            db.groups.update_one(
                {"_id": invite["groupId"]}, {"$addToSet": {"members": uid}}
            )
        return jsonify({"success": True, "status": new_status}), 200

    db.notifications.update_one({"_id": invite["_id"]}, {"$set": {"status": "read"}})
    return jsonify({"success": True, "status": "read"}), 200
