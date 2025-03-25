from flask import Flask, request, jsonify
from werkzeug.security import check_password_hash
import jwt
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

SECRET_KEY = os.getenv("JWT_SECRET")


def handle_login(db):
    data = request.json
    identifier = data.get("identifier")
    password = data.get("password")

    print(
        f"Authorization request received, \n identifier: {identifier} \n \
        password: {password}"
    )

    if not identifier or not password:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Missing identifier \
            or password",
                }
            ),
            400,
        )
    try:
        user = db.users.find_one({"email": identifier})
        print(type(identifier))
        if not user:
            print("no user")
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid email or password, \
                    no user",
                    }
                ),
                400,
            )

        if not check_password_hash(user["password"], password):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid email or password, password \
                        not match",
                    }
                ),
                400,
            )
        payload = {
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
                "email": user.get("email"),
            },
            "exp": datetime.datetime.utcnow()
            + datetime.timedelta(hours=1),  # expire in 1 hour
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        print(f"Sending userId: {user['_id']}")

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Login successful",
                    "token": token,
                    "userId": str(user["_id"]),
                }
            ),
            200,
        )

    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "message": "Server error"}), 500
