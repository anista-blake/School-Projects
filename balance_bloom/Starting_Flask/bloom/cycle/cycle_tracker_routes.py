from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, current_app
from datetime import datetime, timezone
from ..utils import current_user_id
from ..extensions import get_db
from bson.objectid import ObjectId
from pymongo import MongoClient

cycle_bp = Blueprint("cycle", __name__, url_prefix="")

def cycle_entries():
    uri = current_app.config.get("MONGO_URI")
    client = MongoClient(uri, tz_aware=True)
    db_cycle = client["Cycle_Tracker"]
    return db_cycle["Cycle_entry"]

@cycle_bp.route("/cycle", methods=["GET"])
def cycle():
    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "error")
        return redirect(url_for("auth.login"))
    return render_template("cycle_tracker_page.html")

@cycle_bp.route("/cycle_entry", methods=["PUT"])
def cycle_entry():
    uid = current_user_id()
    if not uid:
        return jsonify({"error": "auth required"}), 401
    data = request.get_json(silent=True) or {}
    try:
        user_id = uid
        cycle_entries().update_one(
            {"user_id": user_id},
            {
                "$addToSet": {
                    "start_dates": {"$each": data.get("start_dates", [])},
                    "end_dates": {"$each": data.get("end_dates", [])},
                    "marked_dates": {"$each": data.get("marked_dates", [])}
                },
                "$set": {
                    "period_length": int(data.get("period_length")) if data.get("period_length") else None,
                    "cycle_length": int(data.get("cycle_length")) if data.get("cycle_length") else None,
                    "client_ts": data.get("client_ts"),
                    "server_ts": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        return jsonify({"ok": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cycle_bp.route("/cycle_delete", methods=["POST"])
def cycle_delete():
    uid = current_user_id()
    if not uid:
        return jsonify({"error": "auth required"}), 401
    data = request.get_json(silent=True) or {}
    try:
        user_id = uid
        dates = data.get("marked_dates", [])
        cycle_entries().update_one(
            {"user_id": user_id},
            {
                "$pull": {
                    "start_dates": data.get("start_dates", []),
                    "end_dates": data.get("end_dates", [])
                },
                "$set": {
                    "marked_dates": dates,
                    "period_length": int(data.get("period_length")) if data.get("period_length") else None,
                    "cycle_length": int(data.get("cycle_length")) if data.get("cycle_length") else None,
                    "client_ts": data.get("client_ts"),
                    "server_ts": datetime.now(timezone.utc)
                }
            },
            upsert=False
        )
        return jsonify({"ok": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@cycle_bp.route("/cycle_clear", methods=["POST"])
def cycle_clear():
    uid = current_user_id()
    if not uid:
        return jsonify({"error": "auth required"}), 401
    data = request.get_json(silent=True) or {}
    try:
        user_id = uid
        cycle_entries().update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "start_dates": data.get("start_dates"),
                    "end_dates": data.get("end_dates"),
                    "marked_dates": data.get("marked_dates"),
                    "period_length": int(data.get("period_length")) if data.get("period_length") else None,
                    "cycle_length": int(data.get("cycle_length")) if data.get("cycle_length") else None,
                    "client_ts": data.get("client_ts"),
                    "server_ts": datetime.now(timezone.utc)
                }
            },
            upsert=False
        )
        return jsonify({"ok": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cycle_bp.route("/get_cycle", methods=["GET"])
def get_cycle():
    uid = current_user_id()
    doc = cycle_entries().find_one({"user_id": ObjectId(uid)}, {"_id": 0})
    if doc:
        doc["user_id"] = str(doc["user_id"])
        return jsonify(doc), 200
    else:
        return jsonify({"error": "No data found"}), 404