from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from datetime import datetime, timezone, time, timedelta
from ..utils import current_user_id
from bson.objectid import ObjectId
from .db_helpers import JournalDB, PastEntriesDB
from .journal_helpers import JournalLogic, PastEntriesLogic

journal_bp = Blueprint("journal", __name__, url_prefix="")

def get_journal_service():
    # ensures this runs inside an app/request context
    return JournalLogic(JournalDB())

@journal_bp.route("/journal", methods=["GET","POST"])
def journal():
    service = PastEntriesLogic(PastEntriesDB())

    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "debug")
        return redirect(url_for("auth.login"))
    
    entry = service.get_daily_entry(uid)
    all_entries = service.get_all_entries(uid)
    total_entries = service.count_entries(uid)
    latest_date = service.last_date(uid)
    if entry is not None:
        # if entry is not none it will render the template and passes 
        # the info in the entry dictionary to the template 
        return render_template("journal_entries.html", 
                            current_title= entry["title"],
                           current_created_at=entry["created_at"],
                           current_content=entry["content"],
                           current_mood=entry["mood"],
                           mood_filename=entry["mood_filename"],
                            all_entries= all_entries,
                            total_entries= total_entries,
                            latest_date= latest_date,
                            current_user_exists=bool(current_user_id()))
    
    return render_template("journal_entries.html",
                           current_title="No Entry for today",
                           current_created_at=datetime.now(timezone.utc).isoformat(),
                           current_content="",
                           current_mood="",
                           mood_filename="emotionDefault.png",
                           all_entries= all_entries,
                           total_entries = total_entries,
                           latest_date = latest_date,
                           current_user_exists=bool(current_user_id()))

@journal_bp.route("/journal/new-entry", methods=["GET","POST"])
def create_new_entry():

    service = get_journal_service()

    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "debug")
        return redirect(url_for("auth.login"))
    
    existing_entry = service.get_daily_entry(uid)
    if existing_entry:
        flash("You already created a journal entry for today.", "warning")
        return redirect(url_for("journal.journal"))
    
    if request.method == "POST":
        action = request.form.get("action")
        if action == "cancel":
            return redirect(url_for("journal.journal"))
        try: 
            service.create_entry(uid, request.form.get("title",""), request.form.get("content",""),request.form.get("mood",""))
            flash("New entry created.")
        except ValueError as e:
            flash(str(e), "error")
        return redirect(url_for("journal.journal"))
    
    return render_template("journal_add_entry.html", show_button=False)

@journal_bp.route("/journal/edit-entry", methods=["GET","POST"])
def edit_entry():

    service = get_journal_service()

    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "debug")
        return redirect(url_for("auth.login"))
    
    entry = service.get_daily_entry(uid)
    if not entry:
        flash("No entry exists. Please create one first.", "error")
        return redirect(url_for("journal.journal"))
    
    if request.method == "POST":
        action = request.form.get("action")
        if action == "cancel":
            return redirect(url_for("journal.journal"))
        try:
            service.update_daily_entry(uid, request.form.get("title",""), request.form.get("content",""), request.form.get("mood",""))
            flash("Entry updated successfully.", "success")
        except ValueError as e:
            flash(str(e), "error") #catches the ValueError from journal_helpers.py and displays the message
        return redirect(url_for("journal.journal"))
    
    return render_template("journal_add_entry.html",
                           entry_title= entry["title"],
                           entry_content= entry["content"],
                           entry_mood= entry["mood"],
                           show_button=True)

@journal_bp.route("/journal/delete", methods=["POST"])
def delete_entry():

    service = get_journal_service()

    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "debug")
        return redirect(url_for("auth.login"))
    
    service.delete_daily_entry(uid)

    flash("Entry deleted successfully.", "success")
    return redirect(url_for("journal.journal"))

@journal_bp.route("/journal/get-entry", methods=["POST"])
def get_entry():

    service = PastEntriesLogic(PastEntriesDB())

    uid = current_user_id()
    if not uid:
        flash("Please log in first.")
        return redirect(url_for("auth.login"))
    
    data = request.get_json()
    entry_id = data.get("entry_id")

    if not entry_id:
        return {"error": "missing_entry_id"}, 400

    try:
        entry = service.get_entry_by_id( ObjectId(entry_id))
    except:
        return {"error": "bad_id"}, 400

    if not entry:
        return {"error": "not_found"}, 404

    entry["_id"] = str(entry["_id"])
    return jsonify(entry)
    
