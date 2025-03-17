from flask import request, jsonify

# from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash
import re

# import os


def handle_register(db):
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    print(f"Handling registration...\nReceived JSON: {data}")

    if not username:
        return jsonify({"success": False, "message": "Username is \
        required"}), 400
    if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"success": False, "message": "Invalid email"}), 400
    if not password or len(password) < 8:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Password must be at least 8 characters long",
                }
            ),
            400,
        )

    try:
        user_exists = db.users.find_one({"email": email})
        if user_exists:
            return (
                jsonify(
                    {"success": False, "message": "User with this email \
                    already exists"}
                ),
                400,
            )

        hashed_password = generate_password_hash(password)

        new_user = {"username": username, "email": email,
                    "password": hashed_password}
        db.users.insert_one(new_user)

        print("Insert successful:", new_user)

        return (
            jsonify({"success": True, "message": "User registered \
            successfully"}),
            201,
        )

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500
