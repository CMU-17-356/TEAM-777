
# backend/groupinvite.py
from datetime import datetime
from bson import ObjectId
from flask import request, jsonify

# ------------------------ helpers ------------------------ #
def _serialize_group(group):
    """Return a lightweight group object for the front‑end."""
    return {
        "id": str(group["_id"]),
        "name": group["name"],
        "address": group["address"],
        "members": [str(mid) for mid in group["members"]],
    }


# ---------------------- main handler --------------------- #
def create_group(db):
    """
    POST /api/group-create
    Body: {
        "creatorId": "...",
        "groupName": "...",
        "address": "...",
        "members": [ { "id": "..." }, ... ]   # people you want to invite
    }
    """
    data = request.get_json(force=True)

    creator_id_str = data.get("creatorId", "")
    if not ObjectId.is_valid(creator_id_str):
        return jsonify({"success": False, "message": "Invalid creatorId"}), 400
    creator_id = ObjectId(creator_id_str)

    name    = data.get("groupName", "").strip()
    address = data.get("address",    "").strip()
    invitee_dicts = data.get("members", [])  # list of dicts

    if not name or not address:
        return jsonify({"success": False, "message": "Missing fields"}), 400

    # 1️⃣  create the group with ONLY the creator inside
    group_doc = {
        "name": name,
        "address": address,
        "members": [creator_id],
    }
    res = db.groups.insert_one(group_doc)
    group_id = res.inserted_id

    # 2️⃣  create pending notifications for everyone else
    note_bulk = []
    for person in invitee_dicts:
        uid = person.get("id") if isinstance(person, dict) else None
        if uid and ObjectId.is_valid(uid) and uid != creator_id_str:
            note_bulk.append({
                "senderId":   creator_id,
                "receiverId": ObjectId(uid),
                "groupId":    group_id,
                "status":     "pending",
                "createdAt":  datetime.utcnow(),
            })
    if note_bulk:
        db.notifications.insert_many(note_bulk)

    # 3️⃣  return the groups the creator belongs to (fresh list)
    my_groups = db.groups.find({"members": creator_id})
    return jsonify({
        "success": True,
        "groups": [_serialize_group(g) for g in my_groups]
    }), 201
