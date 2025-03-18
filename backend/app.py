import os
import subprocess
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv  # Import dotenv to load environment variables
from auth.signin import handle_login
from auth.register import handle_register

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
    return handle_register(db)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
