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

account_bp = Blueprint("account", __name__, url_prefix="")

def users():
    return get_db()["users"]

def cycle_entries():
    uri = current_app.config.get("MONGO_URI")
    client = MongoClient(uri, tz_aware=True)
    db_cycle = client["Cycle_Tracker"]
    return db_cycle["Cycle_entry"]

@account_bp.route("/account", methods=["GET"])
def account():
    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "error")
        return redirect(url_for("auth.login"))
    user = users().find_one({"_id": uid, "deactivated": {"$ne": True}})
    return render_template("account.html",
                           user=user,
                           member_since=user.get("created_at"),
                           last_seen=user.get("last_login_at"),
                           csrf_token=get_csrf_token())

@account_bp.post("/account/profile")
def account_update_profile():
    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "error")
        return redirect(url_for("auth.login"))
    
    user = users().find_one({"_id": uid})
    display_name = (request.form.get("display_name") or "").strip()
    bio = (request.form.get("bio") or "").strip()
    if not display_name:
        flash("Display name cannot be empty.", "error")
        return redirect(url_for("account.account"))
    
    users().update_one({"_id": user["_id"]}, {"$set": {"display_name": display_name, "bio": bio}})
    flash("Profile updated.", "success")
    return redirect(url_for("account.account"))

@account_bp.post("/account/avatar", endpoint="account_update_avatar")
def account_update_avatar():
    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "error")
        return redirect(url_for("auth.login"))
    
    if not check_csrf():
        abort(400)

    file = request.files.get("avatar")
    if not file or file.filename == "":
        flash("Please choose an image.", "error")
        return redirect(url_for("account.account"))
    
    if not allowed(file.filename):
        flash("Unsupported file type.", "error")
        return redirect(url_for("account.account"))
    
    ext = Path(file.filename).suffix.lower()
    filename = f"{uid}_{uuid.uuid4().hex}{ext}"
    rel_posix = Path("uploads") / "avatars" / secure_filename(filename)
    abs_path = Path(current_app.static_folder) / rel_posix
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    file.save(str(abs_path))

    users().update_one(
        {"_id": uid},
        {"$set": {"avatar_url": url_for("static", filename=rel_posix.as_posix())},
         "$inc": {"avatar_version": 1}}
    )
    flash("Profile image updated!", "success")
    return redirect(url_for("account.account"))

@account_bp.post("/account/password", endpoint="account_update_password")
def account_update_password():
    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "error")
        return redirect(url_for("auth.login"))

    # CSRF check
    if not check_csrf():
        abort(400)

    user = get_user_by_id(uid)
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("auth.login"))

    current_password = (request.form.get("current_password") or "").strip()
    new_password     = (request.form.get("new_password") or "").strip()
    confirm_password = (request.form.get("confirm_password") or "").strip()

    if not (current_password and new_password and confirm_password):
        flash("Please fill out all password fields.", "error")
        return redirect(url_for("account.account"))

    if new_password != confirm_password:
        flash("New passwords do not match.", "error")
        return redirect(url_for("account.account"))

    pwd_hash = user.get("password_hash")
    if not pwd_hash or not check_password_hash(pwd_hash, current_password):
        flash("Current password is incorrect.", "error")
        return redirect(url_for("account.account"))

    # persist new password
    users().update_one({"_id": user["_id"]}, {"$set": {"password_hash": generate_password_hash(new_password)}})

    flash("Password updated.", "success")
    return redirect(url_for("account.account"))

@account_bp.post("/account/logout")
def account_logout():
    session.clear()
    flash("You've been logged out.", "debug")
    return redirect(url_for("main.home"))

@account_bp.post("/account/deactivate")
def account_deactivate():
    uid = current_user_id()
    if not uid:
        flash("No account to deactivate.", "error")
        return redirect(url_for("auth.login"))
    users().update_one({"_id": uid}, {"$set": {"deactivated": True}})
    session.clear()
    flash("Account deactivated. We're sorry to see you go. 💔🥺", "success")
    return redirect(url_for("main.home"))

@account_bp.post("/verify-recovery-code")
def verify_recovery_code():
    uid = current_user_id()
    if not uid:
        return jsonify({"verified": False, "message": "auth required"}), 401
    data = request.get_json(silent=True) or request.form or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()
    if not email or not code:
        return jsonify({"verified": False, "message": "Missing email or code"}), 400
    user = get_user_by_id(uid)
    if not user:
        return jsonify({"verified": False, "message": "User not found"}), 404
    pending_email = (user.get("recovery_email_pending") or "").strip().lower()
    if pending_email != email:
        return jsonify({"verified": False, "message": "No pending verification for that email"}), 400
    code_hash = user.get("recovery_code_hash")
    expires = user.get("recovery_code_expires")
    now = _now_utc()
    if not code_hash or not expires or (expires < now):
        return jsonify({"verified": False, "message": "Code expired or not found"}), 400
    if _hash_token(code) != code_hash:
        return jsonify({"verified": False, "message": "Invalid code"}), 400
    verified_at = now
    filter_primary = {"_id": user.get("_id")}
    update_spec = {
        "$set": {
            "recovery_email": pending_email,
            "recovery_email_verified_at": verified_at
        },
        "$unset": {
            "recovery_email_pending": "",
            "recovery_code_hash": "",
            "recovery_code_expires": "",
            "recovery_code_sent_at": ""
        }
    }
    res = users().update_one(filter_primary, update_spec)
    if getattr(res, "matched_count", 0) == 0:
        try:
            fallback_id = ObjectId(str(user.get("_id")))
            res = users().update_one({"_id": fallback_id}, update_spec)
        except Exception:
            pass
    # notify account email if present
    account_email = user.get("email")
    try:
        if account_email:
            subject = "Recovery email added to your Balance Bloom account"
            body = f"""Hello {user.get('display_name') or ''},

The email address {pending_email} was verified and added to your Balance Bloom account.

If you did not perform this action, secure your account immediately.
"""
            send_real_email(to_email=account_email, subject=subject, body=body)
    except Exception:
        print("[WARNING] failed to send recovery notification email")
    if getattr(res, "matched_count", 0) > 0:
        return jsonify({"verified": True})
    else:
        return jsonify({"verified": False, "message": "DB update failed"}), 500

@account_bp.post("/account/save-recovery")
def account_save_recovery():
    uid = current_user_id()
    if not uid:
        flash("Please log in first.", "error")
        return redirect(url_for("auth.login"))
    
    if not check_csrf():
        abort(400)

    email = (request.form.get("recovery_email") or "").strip().lower()
    if not email:
        flash("Please enter a recovery email.", "error")
        return redirect(url_for("account.account"))
    
    user = get_user_by_id(uid)
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("account.account"))
    
    if (user.get("email") or "").strip().lower() == email:
        flash("Recovery email can't match your account email.", "error")
        return redirect(url_for("account.account"))
    
    verified_at = user.get("recovery_email_verified_at")
    verified_email = (user.get("recovery_email") or "").strip().lower()
    if not verified_at or verified_email != email:
        flash("That recovery email is not verified. Please verify it first.", "error")
        return redirect(url_for("account.account"))
    
    users().update_one({"_id": user["_id"]}, {"$set": {
        "recovery_email": email,
        "recovery_email_verified_at": verified_at
    }})

    flash("Recovery email saved.", "success")
    return redirect(url_for("account.account"))
