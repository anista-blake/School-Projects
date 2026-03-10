from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, abort, current_app

from ..extensions import get_db
from ..utils import (current_user_id, get_csrf_token, check_csrf, 
                     allowed, _hash_token, _now_utc, send_real_email,
                     get_user_by_id, get_user_by_email)
from werkzeug.utils import secure_filename
from pathlib import Path
from bson.objectid import ObjectId
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient

settings_bp = Blueprint("settings", __name__, url_prefix="")

def users():
    return get_db()["users"]

def cycle_entries():
    uri = current_app.config.get("MONGO_URI")
    client = MongoClient(uri, tz_aware=True)
    db_cycle = client["Cycle_Tracker"]
    return db_cycle["Cycle_entry"]

#SETTINGS
@settings_bp.route("/settings", methods=['GET', 'POST', 'DELETE'])
def settings():
    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "error")
        return redirect(url_for("auth.login"))

    # normalize uid for DB queries if needed
    user = get_user_by_id(uid)  # ensure this helper accepts ObjectId or str
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("auth.login"))

    user_period = None
    try:
        user_period = cycle_entries().find_one({"user_id": uid})
    except Exception:
        user_period = None

    bg_theme = user.get("pref_theme", "") if user else ""

    if request.method == "POST":
        # Get form data, use safe parsing for ints
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        new_email = request.form.get("new_email", "").strip()
        confirm_email = request.form.get("confirm_email", "").strip()
        current_password = request.form.get("current_password", "")
        new_password = request.form.get("new_password", "")
        confirm_password = request.form.get("confirm_password", "")
        notifications = bool(request.form.get("notifications"))
        period_tracking = bool(request.form.get("period"))
        bg_theme = request.form.get("pref_theme", "")

        #Sets to default if nothing is saved for the user.
        bg_theme = request.form.get("pref_theme")
        if not bg_theme:
            bg_theme = "system"
        
        accent_color = request.form.get("pref_accent_color", "pink")
        font_size = request.form.get("pref_font_size", "large")

        def safe_int(val, default=None):
            try:
                return int(val) if val not in (None, "") else default
            except Exception:
                return default

        cycle_length = safe_int(request.form.get("cycle_length"))
        period_length = safe_int(request.form.get("period_length"))
        fertility_tracking = bool(request.form.get("fertility"))

        updates = {}
        period_var = {}

        # Update username and email
        if username:
            updates["display_name"] = username

        if email and email != user.get("email"):
            if get_user_by_email(email):
                flash("Email already in use.", "error")
                return redirect(url_for("settings.settings"))
            updates["email"] = email

        # Update Email if new one is sent
        if email and new_email and confirm_email:
            if new_email != confirm_email:
                flash("New emails do not match.", "error")
                return redirect(url_for("settings.settings"))
            updates["email"] = new_email

        # Update password
        if current_password or new_password or confirm_password:
            if not (current_password and new_password and confirm_password):
                flash("To change password, fill current and new password fields.", "error")
                return redirect(url_for("settings.settings"))
            if not check_password_hash(user["password_hash"], current_password):
                flash("Current password is incorrect.", "error")
                return redirect(url_for("settings.settings"))
            if new_password != confirm_password:
                flash("New passwords do not match.", "error")
                return redirect(url_for("settings.settings"))
            updates["password_hash"] = generate_password_hash(new_password)

        # Update preferences
        updates["notifications_enabled"] = notifications
        updates["pref_theme"] = bg_theme

        updates["pref_accent_color"] = accent_color
        updates["pref_font_size"] = font_size

        # Update period related info
        #if period_tracking is not None:

        confirm_delete = request.form.get('confirm_delete_period') == '1'

        if confirm_delete:
            period_tracking = False
            
        updates["track_period_data"] = period_tracking
        if period_tracking == False:
            cycle_entries().delete_one(
                {"user_id": uid}
            )
        else:
            if cycle_length is not None:
                period_var["cycle_length"] = cycle_length
            if period_length is not None:
                period_var["period_length"] = period_length
            if fertility_tracking is not None:
                period_var["fertility_tracking"] = fertility_tracking

            if period_var:
                cycle_entries().update_one(
                    {"user_id": uid},
                    {"$set": period_var},
                    upsert=True
                )

        if updates:
            users().update_one({"_id": user["_id"]}, {"$set": updates})
            flash("Settings updated successfully.", "success")
        else:
            flash("No changes submitted.", "info")

        return redirect(url_for("settings.settings"))

    return render_template("settings.html", user_period=user_period, current_theme=bg_theme, user=user)