from flask import request, jsonify
import time
import secrets
import smtplib
from email.mime.text import MIMEText
from werkzeug.security import generate_password_hash
import re


def handle_register(db, api):
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    print(f"Handling registration...\nReceived JSON: {data}")

    if not username:
        return jsonify({"success": False, "message": "Username is required"}), 400
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
        if db.users.find_one({"email": email}):
            return (
                jsonify(
                    {"success": False, "message": "User with this email already exists"}
                ),
                400,
            )

        verify_token = secrets.token_hex(32)
        hashed_password = generate_password_hash(password)
        current_time = int(time.time())

        pending_user = db.pending_users.find_one({"email": email})
        if pending_user:
            update_data = {
                "username": username,
                "password": hashed_password,
                "verify_token": verify_token,
                "created_at": current_time,
            }
            db.pending_users.update_one({"email": email}, {"$set": update_data})
            print(f"Pending user record updated for email: {email}")
        else:
            pending_user = {
                "username": username,
                "email": email,
                "password": hashed_password,
                "verify_token": verify_token,
                "created_at": current_time,
            }
            db.pending_users.insert_one(pending_user)
            print(f"New pending user record inserted for email: {email}")

        verify_link = f"{api}/auth/verify-email?token={verify_token}"
        print("Verification link:", verify_link)

        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "roommatemanageteam777@gmail.com"
        sender_password = "qxpt ekwa eidj rmgn"
        subject = "Please verify your email to complete the registration"
        body = f"Please click the link below to verify your email address and complete the registration process:\n\n{verify_link}"

        message = MIMEText(body)
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = email

        try:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, [email], message.as_string())
            server.quit()
            print("Verification email sent successfully.")
        except Exception as email_err:
            print("Error sending email:", email_err)
            return (
                jsonify(
                    {"success": False, "message": "Failed to send verification email"}
                ),
                500,
            )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Verification email sent. Please check your email to complete registration.",
                }
            ),
            200,
        )

    except Exception as e:
        print("Error:", e)
        return jsonify({"success": False, "message": "Server error"}), 500
