from flask import request, jsonify
import re
import secrets
import time
import smtplib
from email.mime.text import MIMEText

def handle_reset_password(db, api):
    data = request.json
    print("Handling reset password request...")
    print(f"Received JSON: {data}")
    email = data.get("email")
    print(f"Email: {email}")

    # Validate email format
    if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({
            "success": False,
            "message": "Invalid email format"
        }), 400

    try:
        # Check if a user with this email exists in the database
        user = db.users.find_one({"email": email})
        if not user:
            return jsonify({
                "success": False,
                "message": "No user found with this email address"
            }), 400

        # Generate a password reset token (32-byte hex token)
        reset_token = secrets.token_hex(32)
        expiration_time = int(time.time()) + 3600  # 1 hour from now

        # Update the user record with the reset token and expiration time.
        db.users.update_one(
            {"email": email},
            {"$set": {"reset_token": reset_token, "reset_token_expiration": expiration_time}}
        )

        reset_link = f"{api}/auth/change-password/:{reset_token}"
        print(f"Reset Link: {reset_link}")

        # Set up the SMTP server for sending the email.
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "roommatemanageteam777@gmail.com"
        sender_password = "qxpt ekwa eidj rmgn"
        subject = "Password Reset Request"
        body = f"To reset your password, please click the link below:\n\n{reset_link}"

        # Create the email message.
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

            print("Password reset email sent successfully.")
            return jsonify({
                "success": True,
                "message": "Password reset email sent successfully"
            }), 200

        except Exception as email_err:
            print("Error sending email:", email_err)
            return jsonify({
                "success": False,
                "message": "Failed to send password reset email"
            }), 500

    except Exception as err:
        print("Server error:", str(err))
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500
