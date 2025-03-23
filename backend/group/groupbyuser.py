from flask import Flask, request, jsonify
from bson import ObjectId


app = Flask(__name__)

def groups_by_user(db):
    data = request.get_json()
    user_id = data.get("userId")

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"success": False, "message": "Invalid userId"}), 400

    try:
        user_oid = ObjectId(user_id)

        pipeline = [
            { "$match": { "members": user_oid } },
            {
                "$lookup": {
                    "from": "users",  # your users collection name
                    "localField": "members",
                    "foreignField": "_id",
                    "as": "memberDetails"
                }
            }
        ]

        groups_cursor = db.groups.aggregate(pipeline)
        groups = []

        for group in groups_cursor:
            groups.append({
                "id": str(group["_id"]),
                "name": group["name"],
                "address": group.get("address", ""),
                "notes": group.get("notes", ""),
                "creatorId": str(group.get("creatorId")) if group.get("creatorId") else None,
                "members": [
                    {
                        "id": str(user["_id"]),
                        "name": user.get("username", "Unknown User")
                    } for user in group.get("memberDetails", [])
                ]
            })

        return jsonify({ "success": True, "groups": groups }), 200

    except Exception as e:
        print("Error fetching groups:", str(e))
        return jsonify({ "success": False, "message": "Server error" }), 500

