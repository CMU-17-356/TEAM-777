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
            {"$match": {"members": user_oid}},
            {
                "$lookup": {
                    "from": "users",  # your users collection name
                    "localField": "members",
                    "foreignField": "_id",
                    "as": "memberDetails",
                }
            },
        ]

        groups_cursor = db.groups.aggregate(pipeline)
        groups = []

        for group in groups_cursor:
            groups.append(
                {
                    "id": str(group["_id"]),
                    "name": group["name"],
                    "address": group.get("address", ""),
                    "notes": group.get("notes", ""),
                    "creatorId": (
                        str(group.get("creatorId")) if group.get("creatorId") else None
                    ),
                    "members": [
                        {
                            "id": str(user["_id"]),
                            "name": user.get("username", "Unknown User"),
                        }
                        for user in group.get("memberDetails", [])
                    ],
                }
            )

        return jsonify({"success": True, "groups": groups}), 200

    except Exception as e:
        print("Error fetching groups:", str(e))
        return jsonify({"success": False, "message": "Server error"}), 500


def group_by_id(db, group_id):
    if not group_id or not ObjectId.is_valid(group_id):
        return jsonify({"success": False, "message": "Invalid group ID"}), 400

    try:
        pipeline = [
            {"$match": {"_id": ObjectId(group_id)}},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "members",
                    "foreignField": "_id",
                    "as": "memberDetails",
                }
            },
            {
                "$project": {
                    "groupName": "$name",  # assuming name is the actual group name field
                    "memberDetails.username": 1,
                }
            },
        ]

        result = list(db.groups.aggregate(pipeline))

        if not result:
            return jsonify({"success": False, "message": "Group not found"}), 404

        group = result[0]

        response = {
            "success": True,
            "groupName": group.get("groupName", ""),
            "members": [
                {"username": member.get("username", "")}
                for member in group.get("memberDetails", [])
            ],
        }

        return jsonify(response), 200

    except Exception as e:
        print("Error fetching group:", str(e))
        return jsonify({"success": False, "message": "Server error"}), 500


def get_users_in_group(db, group_id):
    if not group_id or not ObjectId.is_valid(group_id):
        return jsonify({"success": False, "message": "Invalid group ID"}), 400

    try:
        group = db.groups.find_one({"_id": ObjectId(group_id)})

        if not group:
            return jsonify({"success": False, "message": "Group not found"}), 404

        member_ids = group.get("members", [])
        users_cursor = db.users.find({"_id": {"$in": member_ids}})

        users = [
            {
                "id": str(user["_id"]),
                "username": user.get("username", ""),
                "email": user.get("email", ""),
                "name": user.get("name", ""),
            }
            for user in users_cursor
        ]

        return jsonify({"success": True, "users": users}), 200

    except Exception as e:
        print("Error fetching users in group:", str(e))
        return jsonify({"success": False, "message": "Server error"}), 500
