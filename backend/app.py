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
from group.groupSearch import groups_by_user, group_by_id

# Load environment variables from .env file (for local testing)
load_dotenv()

# Automatically build React when deploying
if not os.path.exists("../frontend/build"):
    subprocess.run(["npm", "install"], cwd="../frontend")
    subprocess.run(["npm", "run", "build"], cwd="../frontend")

app = Flask(__name__, static_folder="../frontend/build")
CORS(app)  # Enable CORS for frontend requests

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


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
