import os
import subprocess
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv  # Import dotenv to load environment variables
from auth.signin import handle_login
from auth.register import handle_register
from auth.verifyEmail import handle_verify_email
from auth.resetPassword import handle_reset_password
from auth.changePassword import handle_change_password
from group.search import search_users
from group.groupinvite import create_group
from group.groupSearch import groups_by_user, group_by_id, get_users_in_group
from calendars.event import create_event, delete_event, edit_event, get_events
from bills.billSplit import handle_add_expense
from bills.transactions import get_transactions
from grocery.grocery import (
    handle_add_grocery,
    get_formatted_groceries,
    handle_delete_grocery,
)


from notifications import list_notifications, respond_invite

# Load environment variables from .env file (for local testing)
load_dotenv()

# Automatically build React when deploying
if not os.path.exists("../frontend/build"):
    subprocess.run(["npm", "install"], cwd="../frontend")
    subprocess.run(["npm", "run", "build"], cwd="../frontend")

app = Flask(__name__, static_folder="../frontend/build")
# CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for frontend requests
CORS(app)
# Connect to MongoDB using environment variable
MONGO_URI = os.getenv(
    "MONGO_URI", "mongodb://localhost:27017/mydatabase"
)  # Default to local MongoDB if not set
client = MongoClient(MONGO_URI)
db = client["DEV"]  # Change "mydatabase" to your database name
collection = db["TEST"]  # Change "mycollection" to your collection name
print("MONGO_URI =", os.getenv("MONGO_URI"))

# db.users.delete_one({"email": "jianingshi1417@gmail.com"})


def get_api_base_url():
    hostname = request.host  # request.host returns the hostname (and port if present)
    if "pr-" in hostname:
        # PR Preview Environment
        return f"https://{hostname}/#"
    elif "team-777.onrender.com" in hostname:
        # Production Environment
        return "https://team-777.onrender.com/#"
    else:
        # Local Development
        return "http://127.0.0.1:3001/#"


# API to insert data into MongoDB
@app.route("/api/add", methods=["POST"])
def add_data():
    data = request.json  # Get JSON data from request
    collection.insert_one(data)  # Insert into MongoDB
    return jsonify({"status": "Data added!"})


# API to retrieve data from MongoDB
@app.route("/api/get", methods=["GET"])
def get_data():
    data = collection.find_one({}, {"_id": 0})  # Get first entry, ignore `_id`
    return jsonify(data or {"message": "No data found"})


# API to test Flask connection
@app.route("/api/hello")
def hello():
    return jsonify(message="Hello from Flask!")


# Serve React Frontend
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(f"../frontend/build/{path}"):
        return send_from_directory("../frontend/build", path)
    return send_from_directory("../frontend/build", "index.html")


@app.route("/auth/login", methods=["POST"])
def login():
    return handle_login(db)


@app.route("/auth/register", methods=["POST"])
def register():
    return handle_register(db, get_api_base_url())


@app.route("/auth/verify-email", methods=["POST"])
def verifyEmail():
    return handle_verify_email(db)


@app.route("/auth/reset-password", methods=["POST"])
def resetPassword():
    return handle_reset_password(db, get_api_base_url())


@app.route("/auth/change-password", methods=["POST"])
def changePassword():
    return handle_change_password(db)


@app.route("/api/search-users", methods=["GET"])
def search():
    return search_users(db)


@app.route("/api/group-create", methods=["POST"])
def group_create():
    return create_group(db)


@app.route("/api/groups-by-user", methods=["POST"])
def group_by_user():
    return groups_by_user(db)


@app.route("/api/groups/<string:group_id>", methods=["POST"])
def groups_by_id(group_id):
    return group_by_id(db, group_id)


@app.route("/api/users/<string:group_id>", methods=["GET"])
def users_by_groupid(group_id):
    return get_users_in_group(db, group_id)


@app.route("/api/events", methods=["POST"])
def handle_create_event():
    data = request.get_json()
    group_id = data.get("group_id")
    return create_event(db, group_id)


@app.route("/api/events/<string:group_id>", methods=["GET"])
def handle_get_event(group_id):
    return get_events(db, group_id)


@app.route(
    "/api/events/<string:group_id>/<string:event_id>", methods=["PATCH", "OPTIONS"]
)
def handle_edit_event(group_id, event_id):
    if request.method == "OPTIONS":
        return "", 204
    return edit_event(db, group_id, event_id)


@app.route(
    "/api/events/<string:group_id>/<string:event_id>", methods=["DELETE", "OPTIONS"]
)
def handle_delete_event(group_id, event_id):
    if request.method == "OPTIONS":
        return "", 204
    return delete_event(db, group_id, event_id)


@app.route("/auth/billSplit", methods=["POST"])
def add_expense():
    return handle_add_expense(db)


@app.route("/api/transactions/<string:group_id>", methods=["GET"])
def handle_get_transactions(group_id):
    return get_transactions(db, group_id)


@app.route("/api/notifications", methods=["POST"])
def notifications_list():
    return list_notifications(db)


@app.route("/api/notifications/<string:invite_id>", methods=["PATCH"])
def notifications_respond(invite_id):
    return respond_invite(db, invite_id)


@app.route("/api/groceryAdd", methods=["POST"])
def grocery_add():
    return handle_add_grocery(db)


@app.route("/api/groceries/<string:group_id>", methods=["GET"])
def get_groceries(group_id):

    groceries = get_formatted_groceries(db, group_id)
    return jsonify(groceries)


@app.route("/api/groceryDelete", methods=["DELETE"])
def grocery_delete():
    return handle_delete_grocery(db)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
