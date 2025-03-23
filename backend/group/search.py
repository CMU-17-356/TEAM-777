from flask import Flask, request, jsonify

app = Flask(__name__)

def search_users(db):
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({"success": False, "message": "Missing query parameter"}), 400

    try:
        users = list(db.users.find({
            "$or": [
                {"username": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}}
            ]
        }))

        # Prepare a safe response with public info only
        result = [
            {
                "id": str(user["_id"]),
                "username": user.get("username"),
                "email": user.get("email"),
                # Optionally include avatar or other public profile fields
            }
            for user in users
        ]

        return jsonify({"success": True, "users": result}), 200

    except Exception as e:
        print("Search error:", str(e))
        return jsonify({"success": False, "message": "Server error"}), 500



