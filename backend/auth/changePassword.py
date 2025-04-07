from flask import request, jsonify
import time
from werkzeug.security import generate_password_hash
import re

def handle_change_password(db):
    data = request.json
    print("Handling password change...")
    print(f"The received JSON is: {data}")
    token = data.get("token", "")
    password = data.get("password", "")
    print(f"Token: {token}, New Password: {password}")

    # Validate password length (minimum 8 characters)
    if not password or len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must be at least 8 characters long"
        }), 400

    # Remove any leading colon from the token
    token = token.lstrip(":")

    try:
        current_timestamp = int(time.time())

        # Check if the reset token is valid and has not expired
        user = db.users.find_one({
            "reset_token": token,
            "reset_token_expiration": {"$gt": current_timestamp}
        })

        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid or expired token"
            }), 400

        hashed_password = generate_password_hash(password)

        # Update the password and clear the reset token fields in the database
        update_result = db.users.update_one(
            {"reset_token": token},
            {"$set": {"password": hashed_password},
             "$unset": {"reset_token": "", "reset_token_expiration": ""}}
        )

        if update_result.modified_count > 0:
            print("Password updated successfully for user:", user)
            return jsonify({
                "success": True,
                "message": "Password changed successfully"
            }), 200
        else:
            print("Password update failed")
            return jsonify({
                "success": False,
                "message": "Failed to change password"
            }), 500

    except Exception as err:
        print("Server error:", str(err))
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500
