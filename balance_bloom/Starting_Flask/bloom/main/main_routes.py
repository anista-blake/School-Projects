from flask import Blueprint, render_template, redirect, send_from_directory, current_app, url_for, abort
from ..utils import current_user_id, get_user_by_id
from pathlib import Path
import os
from bloom.journal.db_helpers import JournalDB #import todays journal entry db helper
from bloom.journal.journal_helpers import mood_to_file
from datetime import datetime
from bloom.reciperoute.routesrecipe import favorites_entries
from flask import jsonify

main_bp = Blueprint("main", __name__, url_prefix="")

@main_bp.route("/")
def home():
    #check if user logged in, if not show home page
    uid = current_user_id()
    if not uid:
        return render_template("home.html")
    
    #if logged in, show dashboard with today's journal entry
    
    user = get_user_by_id(uid)

    journal_db = JournalDB()
    today = datetime.now().date()
    todays_entry = journal_db.get_daily_entry(current_user_id())

    # compute mood filename and current mood for template rendering
    if todays_entry:
        current_mood = todays_entry.get("mood", "")
        mood_filename = mood_to_file.get(current_mood, "emotionDefault.png")
    else:
        current_mood = ""
        mood_filename = "emotionDefault.png"

    #fetch favorite recipes for user
    favorites_col = favorites_entries()
    fav_doc = favorites_col.find_one(
        {"user_id": uid},
        {"_id": 0, "recipes": 1}
        )
    
    recipes_list = fav_doc.get("recipes", []) if fav_doc else []
    recent_favorites = recipes_list[-3:]   # last 3 recipes only
   
    return render_template(
        "dashboard.html",
        user=user,
        todays_entry=todays_entry,
        current_mood=current_mood,
        mood_filename=mood_filename,
        recent_favorites=recent_favorites
        )

@main_bp.route("/about")
def about():
    return render_template("about.html")

@main_bp.route("/faq")
def faq():
    return render_template("faq.html")

@main_bp.route("/img/<path:filename>")
def image(filename):
    return send_from_directory(current_app.root_path + "/img", filename)

# React static serving
@main_bp.route("/recipe/static/<path:path>")
def react_static(path):
    return send_from_directory(current_app.config["REACT_BUILD_DIR"] + "/static", path)

@main_bp.route("/manifest.json")
def manifest():
    return send_from_directory(current_app.config["REACT_BUILD_DIR"], "manifest.json")

@main_bp.route("/favicon.ico")
def favicon():
    return send_from_directory(current_app.config["REACT_BUILD_DIR"], "favicon.ico")

@main_bp.route("/logo192.png")
def logo192():
    return send_from_directory(current_app.config["REACT_BUILD_DIR"], "logo192.png")

@main_bp.route("/recipe", defaults={"path": ""})
@main_bp.route("/recipe/<path:path>")
def serve_react(path):
    build_dir = Path(current_app.static_folder) / "recipe_react"
    if not build_dir.exists():
        abort(404, f"Recipe build not found at {build_dir}")
    if path:
        candidate = build_dir / path
        if candidate.exists() and candidate.is_file():
            return send_from_directory(build_dir, path)
    index = build_dir / "index.html"
    if index.exists():
        return send_from_directory(build_dir, "index.html")
    abort(404, "index.html not found")

@main_bp.route("/api/current-user")
def current_user_api():
    uid = current_user_id()
    if not uid:
        return jsonify(None)  # no user logged in

    user = get_user_by_id(uid)

    return jsonify({
        "first_name": user.get("first_name"),
        "display_name": user.get("display_name"),
        "track_period_data": user.get("track_period_data", False),
        "avatar_url": user.get("avatar_url", "/static/img/account-placeholder-image.png"),
        "pref_accent_color": user.get("pref_accent_color", "pink"),
        "pref_font_size": user.get("pref_font_size", "large")
    })