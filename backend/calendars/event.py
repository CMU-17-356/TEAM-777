from flask import request, jsonify
from bson.objectid import ObjectId
from dateutil.rrule import rrule, WEEKLY
from datetime import datetime, timedelta

# CREATE EVENT
from flask import request, jsonify
from bson.objectid import ObjectId
from dateutil.rrule import rrule, WEEKLY
from datetime import datetime


def create_event(db, group_id):
    data = request.get_json()

    required_fields = ["title", "start", "end", "people"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        start_dt = datetime.fromisoformat(data["start"])
        end_dt = datetime.fromisoformat(data["end"])
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    now = datetime.now(start_dt.tzinfo)

    # ❌ Rule 1: Start must be in the future
    if start_dt < now:
        return jsonify({"error": "Start time must be in the future"}), 400

    # ❌ Rule 2: Start must be before end
    if start_dt >= end_dt:
        return jsonify({"error": "Start time must be before end time"}), 400

    # ❌ Rule 3: Must be same calendar day
    if start_dt.date() != end_dt.date():
        return jsonify({"error": "Start and end times must be on the same day"}), 400

    # ❌ Rule 4: Title must be short
    if len(data["title"]) > 20:
        return jsonify({"error": "Title must be at most 20 characters"}), 400

    # ❌ Rule 5: Description length
    if len(data.get("description", "")) > 100:
        return jsonify({"error": "Description must be at most 100 characters"}), 400

    duration = end_dt - start_dt
    repeat = data.get("repeat", "None")
    repeat_count = 5
    interval = 1 if repeat == "Weekly" else 2 if repeat == "Biweekly" else 0

    events_to_insert = []

    if interval > 0:
        for dt in rrule(
            WEEKLY, dtstart=start_dt, interval=interval, count=repeat_count
        ):
            events_to_insert.append(
                {
                    "title": data["title"],
                    "start": dt.isoformat(),
                    "end": (dt + duration).isoformat(),
                    "group_id": group_id,
                    "extendedProps": {
                        "people": data["people"],
                        "description": data.get("description", ""),
                        "repeat": repeat,
                        "created_by": data.get("created_by"),
                    },
                }
            )
    else:
        events_to_insert.append(
            {
                "title": data["title"],
                "start": data["start"],
                "end": data["end"],
                "group_id": group_id,
                "extendedProps": {
                    "people": data["people"],
                    "description": data.get("description", ""),
                    "repeat": "None",
                    "created_by": data.get("created_by"),
                },
            }
        )

    result = db.events.insert_many(events_to_insert)
    return (
        jsonify(
            {
                "message": "Event(s) created",
                "event_ids": [str(_id) for _id in result.inserted_ids],
            }
        ),
        201,
    )


# EDIT EVENT
def edit_event(db, group_id, event_id):
    data = request.get_json()
    update_fields = {}

    # Extract for validation
    title = data.get("title")
    start_str = data.get("start")
    end_str = data.get("end")
    description = data.get("description", "")

    # Validate datetime formats
    try:
        start_dt = datetime.fromisoformat(start_str) if start_str else None
        end_dt = datetime.fromisoformat(end_str) if end_str else None
    except ValueError as ve:
        return jsonify({"error": f"Invalid datetime format: {ve}"}), 400

    now = datetime.now(start_dt.tzinfo)

    # ✅ Rule 1: Future start time
    if start_dt and start_dt < now:
        return jsonify({"error": "Start time must be in the future"}), 400

    # ✅ Rule 2: Start before end
    if start_dt and end_dt and start_dt >= end_dt:
        return jsonify({"error": "Start time must be before end time"}), 400

    # ✅ Rule 3: Same day check
    if start_dt and end_dt and start_dt.date() != end_dt.date():
        return jsonify({"error": "Start and end times must be on the same day"}), 400

    # ✅ Rule 4: Title length
    if title and len(title) > 20:
        return jsonify({"error": "Title must be at most 20 characters"}), 400

    # ✅ Rule 5: Description length
    if description and len(description) > 100:
        return jsonify({"error": "Description must be at most 100 characters"}), 400

    # Prepare update fields
    for field in ["title", "start", "end", "description", "people", "repeat"]:
        if field in data:
            key = (
                field
                if field in ["title", "start", "end"]
                else f"extendedProps.{field}"
            )
            update_fields[key] = data[field]

    result = db.events.update_one(
        {"_id": ObjectId(event_id), "group_id": group_id}, {"$set": update_fields}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Event not found or does not belong to group"}), 404

    return jsonify({"message": "Event updated successfully"}), 200


# GET EVENTS BY GROUP AND RANGE
def get_events(db, group_id):
    start = request.args.get("start")
    end = request.args.get("end")

    try:
        query = {"group_id": group_id}
        if start and end:
            query["$or"] = [
                {"start": {"$gte": start, "$lt": end}},
                {"end": {"$gte": start, "$lt": end}},
            ]
        events = list(db.events.find(query))
        for event in events:
            event["_id"] = str(event["_id"])
        return jsonify(events), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE EVENT BY GROUP AND ID
def delete_event(db, group_id, event_id):
    result = db.events.delete_one({"_id": ObjectId(event_id), "group_id": group_id})

    if result.deleted_count == 0:
        return jsonify({"error": "Event not found or not owned by group"}), 404

    return jsonify({"message": "Event deleted successfully"}), 200
