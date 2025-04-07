from flask import request, jsonify
import time
import secrets
import smtplib
from email.mime.text import MIMEText
from werkzeug.security import generate_password_hash
import re


def handle_verify_email(db):
    data = request.json
    token = data.get("token")
    print(token)
    if not token:
        return jsonify({"success": False, "message": "Missing token"}), 400

    try:
        pending_user = db.pending_users.find_one({"verify_token": token})
        if not pending_user:
            print("Pending_user doesn't exist.")
            return (
                jsonify({"success": False, "message": "Invalid or expired token"}),
                400,
            )

        user = {
            "username": pending_user["username"],
            "email": pending_user["email"],
            "password": pending_user["password"],
        }
        db.users.insert_one(user)
        print("User inserted successfully")
        db.pending_users.delete_one({"_id": pending_user["_id"]})

        return (
            jsonify(
                {"success": True, "message": "Email verified. Registration completed."}
            ),
            200,
        )

    except Exception as e:
        print("Error during email verification:", e)
        return jsonify({"success": False, "message": "Server error"}), 500
