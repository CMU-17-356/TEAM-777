from flask import request, jsonify
from bson.objectid import ObjectId
from dateutil.rrule import rrule, WEEKLY
from datetime import datetime

from notifications import _send_notification


def create_event(db, group_id):
    data = request.get_json()

    required = ["title", "start", "end", "people"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        start_dt = datetime.fromisoformat(data["start"])
        end_dt = datetime.fromisoformat(data["end"])
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    now = datetime.now(start_dt.tzinfo)
    if start_dt < now:
        return jsonify({"error": "Start time must be in the future"}), 400
    if start_dt >= end_dt:
        return jsonify({"error": "Start time must be before end time"}), 400
    if start_dt.date() != end_dt.date():
        return jsonify({"error": "Start and end must be on the same day"}), 400
    if len(data["title"]) > 20:
        return jsonify({"error": "Title ≤ 20 characters"}), 400
    if len(data.get("description", "")) > 100:
        return jsonify({"error": "Description ≤ 100 characters"}), 400

    people_ids = []
    for person in data["people"]:
        if ObjectId.is_valid(person):
            people_ids.append(person)
        else:
            doc = db.users.find_one({"username": person}, {"_id": 1})
            if doc:
                people_ids.append(str(doc["_id"]))
    data["people"] = people_ids

    duration = end_dt - start_dt
    repeat = data.get("repeat", "None")
    interval = 1 if repeat == "Weekly" else 2 if repeat == "Biweekly" else 0
    repeat_count = 5

    docs = []
    if interval:
        for dt in rrule(
            WEEKLY, dtstart=start_dt, interval=interval, count=repeat_count
        ):
            docs.append(
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
        docs.append(
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

    result = db.events.insert_many(docs)

    grp = db.groups.find_one({"_id": ObjectId(group_id)}, {"name": 1})
    group_name = grp["name"] if grp and "name" in grp else "Unknown Group"

    creator_id = (
        ObjectId(data.get("created_by"))
        if data.get("created_by") and ObjectId.is_valid(data["created_by"])
        else None
    )

    for pid in data["people"]:
        if not ObjectId.is_valid(pid):
            continue
        if creator_id and ObjectId(pid) == creator_id:
            continue
        _send_notification(
            db,
            sender_id=creator_id,
            receiver_id=ObjectId(pid),
            group_id=group_id,
            ntype="chore",
            extra={
                "title": data["title"],
                "groupName": group_name,
            },
        )

    return (
        jsonify(
            {
                "message": "Event(s) created",
                "event_ids": [str(_id) for _id in result.inserted_ids],
            }
        ),
        201,
    )


def edit_event(db, group_id, event_id):
    data = request.get_json()
    update_fields = {}

    title = data.get("title")
    start = data.get("start")
    end = data.get("end")
    desc = data.get("description", "")

    try:
        start_dt = datetime.fromisoformat(start) if start else None
        end_dt = datetime.fromisoformat(end) if end else None
    except ValueError as ve:
        return jsonify({"error": f"Invalid datetime format: {ve}"}), 400

    now = datetime.now(start_dt.tzinfo) if start_dt else datetime.utcnow()
    if start_dt and start_dt < now:
        return jsonify({"error": "Start must be in the future"}), 400
    if start_dt and end_dt and start_dt >= end_dt:
        return jsonify({"error": "Start before end"}), 400
    if start_dt and end_dt and start_dt.date() != end_dt.date():
        return jsonify({"error": "Must be same day"}), 400
    if title and len(title) > 20:
        return jsonify({"error": "Title too long"}), 400
    if desc and len(desc) > 100:
        return jsonify({"error": "Description too long"}), 400

    for field in ["title", "start", "end", "description", "people", "repeat"]:
        if field in data:
            key = (
                field
                if field in ["title", "start", "end"]
                else f"extendedProps.{field}"
            )
            update_fields[key] = data[field]

    res = db.events.update_one(
        {"_id": ObjectId(event_id), "group_id": group_id}, {"$set": update_fields}
    )

    if res.matched_count == 0:
        return jsonify({"error": "Event not found"}), 404

    return jsonify({"message": "Event updated"}), 200


def get_events(db, group_id):
    start = request.args.get("start")
    end = request.args.get("end")

    query = {"group_id": group_id}
    if start and end:
        query["$or"] = [
            {"start": {"$gte": start, "$lt": end}},
            {"end": {"$gte": start, "$lt": end}},
        ]

    events = list(db.events.find(query))
    for ev in events:
        ev["_id"] = str(ev["_id"])
    return jsonify(events), 200


def delete_event(db, group_id, event_id):
    res = db.events.delete_one({"_id": ObjectId(event_id), "group_id": group_id})
    if res.deleted_count == 0:
        return jsonify({"error": "Event not found"}), 404
    return jsonify({"message": "Event deleted"}), 200
