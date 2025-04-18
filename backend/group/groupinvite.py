from datetime import datetime
from bson import ObjectId
from flask import request, jsonify


def _serialize_group(group):
    return {
        "id": str(group["_id"]),
        "name": group["name"],
        "address": group["address"],
        "members": [str(mid) for mid in group["members"]],
    }


def create_group(db):
    data = request.get_json(force=True)

    creator_id_str = data.get("creatorId", "")
    if not ObjectId.is_valid(creator_id_str):
        return jsonify({"success": False, "message": "Invalid creatorId"}), 400
    creator_oid = ObjectId(creator_id_str)

    name = data.get("groupName", "").strip()
    address = data.get("address", "").strip()
    invitees = data.get("members", [])

    if not name or not address:
        return jsonify({"success": False, "message": "Missing fields"}), 400

    res = db.groups.insert_one(
        {
            "name": name,
            "address": address,
            "members": [creator_oid],
        }
    )
    group_id = res.inserted_id

    creator_doc = db.users.find_one({"_id": creator_oid}, {"username": 1})
    creator_name = creator_doc["username"] if creator_doc else "Someone"

    notes = []
    for person in invitees:
        uid = person.get("id") if isinstance(person, dict) else None
        if uid and ObjectId.is_valid(uid) and uid != creator_id_str:
            notes.append(
                {
                    "senderId": creator_oid,
                    "receiverId": ObjectId(uid),
                    "groupId": group_id,
                    "status": "pending",
                    "type": "invite",
                    "createdAt": datetime.utcnow(),
                    "senderName": creator_name,
                    "groupName": name,
                }
            )
    if notes:
        db.notifications.insert_many(notes)

    my_groups = db.groups.find({"members": creator_oid})
    return (
        jsonify({"success": True, "groups": [_serialize_group(g) for g in my_groups]}),
        201,
    )
