from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, g
from bson.objectid import ObjectId
from datetime import datetime, timezone
from ..extensions import get_db
from ..utils import (get_csrf_token, _make_reset_token, _hash_token, _now_utc,
                     send_real_email, login_required, current_user_id, get_user_by_id, 
                     RESET_TTL, RECOVERY_TTL, RECOVERY_SEND_COOLDOWN)
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__, url_prefix="")

def users():
    return get_db()["users"]

@auth_bp.route("/sign-up", methods=["GET","POST"])
def signup():
    if request.method == "POST":
        first_name = request.form.get("first_name","").strip()
        middle_initial = request.form.get("middle_initial","").strip()
        last_name = request.form.get("last_name","").strip()
        dob = request.form.get("dob","").strip()
        email = request.form.get("email","").lower().strip()
        password = request.form.get("password","")
        if not (first_name and last_name and dob and email and password):
            flash("Please fill all required fields.", "error")
            return redirect(url_for("auth.signup"))
        if users().find_one({"email": email}):
            flash("An account with that email already exists.", "error")
            return redirect(url_for("auth.signup"))
        doc = {
            "first_name": first_name,
            "middle_initial": middle_initial,
            "last_name": last_name,
            "dob": dob,
            "email": email,
            "password_hash": generate_password_hash(password),
            "display_name": first_name,
            "bio": "",
            "avatar_url": None,
            "created_at": datetime.now(timezone.utc),
            "last_login_at": datetime.now(timezone.utc),
            "deactivated": False,
        }
        res = users().insert_one(doc)
        session["user_id"] = str(res.inserted_id)
        flash("Welcome to Balance Bloom!", "success")
        return redirect(url_for("main.home"))
    return render_template("sign-up.html")

@auth_bp.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email","").lower().strip()
        password = request.form.get("password","")

        if not email or not password:
            flash("Please provide both email and password.", "error")
            return redirect(url_for("auth.login"))
        
        user = users().find_one({"email": email, "deactivated": {"$ne": True}})
        if not user:
            flash("No account found for that email.", "error")
            return redirect(url_for("auth.login"))
        
        #Ensure password hash exists
        pwd_hash = user.get("password_hash")
        if not pwd_hash:
            flash("Account has no password set. Contact support.", "error")
            return redirect(url_for("auth.login"))
        
        #Verify password
        if not check_password_hash(pwd_hash, password):
            flash("Invalid email or password.", "error")
            return redirect(url_for("auth.login"))
        
        #Successful login
        session["user_id"] = str(user["_id"])
        users().update_one({"_id": user["_id"]}, {"$set": {"last_login_at": datetime.now(timezone.utc)}})
        flash("Logged in.", "debug")
        return redirect(url_for("main.home"))
    return render_template("login.html")

@auth_bp.route('/auth/get_last_seen')
@login_required
def get_last_seen():
    if g.user and "last_seen" in g.user:
        last_seen_iso = g.user["last_seen"].isoformat()
        return jsonify(success=True, last_seen=last_seen_iso)
    
    return jsonify(success=False, error="User data not found."), 404

@auth_bp.post("/auth/reset-password/start")
def reset_password_start():
    email = (request.form.get("email") or "").lower().strip()
    if not email:
        return jsonify({"ok": True})  # do not reveal whether email exists

    user = users().find_one({"email": email, "deactivated": {"$ne": True}})
    if user:
        raw = _make_reset_token()
        hashed = _hash_token(raw)
        expires = datetime.now(timezone.utc) + RESET_TTL

        users().update_one(
            {"_id": user["_id"]},
            {"$set": {"reset_token_hash": hashed, "reset_token_expires": expires}}
        )

        reset_url = url_for("auth.reset_password_finish", token=raw, _external=True)

        body = f"""Hello Bloomer!

You requested a password reset for your Balance Bloom account.
Click the link below to reset it (valid for {int(RESET_TTL.total_seconds()/3600)} hours):

{reset_url}

If you didn't request this, please consider changing your password.
If this is a mistake, ignore this email.
"""
        send_real_email(to_email=email, subject="Balance Bloom password reset", body=body)
        print(f"[RESET] Sent reset link to {email}: {reset_url}")

    return jsonify({"ok": True})


@auth_bp.get("/auth/reset-password/finish", endpoint="reset_password_finish")
def reset_password_finish():
    token = (request.args.get("token") or "").strip()
    if not token:
        flash("Invalid or expired reset link.", "error")
        return redirect(url_for("auth.login"))
    return render_template("reset_password_finish.html", token=token)


@auth_bp.post("/auth/reset-password/finish")
def reset_password_finish_post():
    raw = (request.form.get("token") or "").strip()
    new_password = (request.form.get("new_password") or "").strip()
    confirm_password = (request.form.get("confirm_password") or "").strip()

    if not (raw and new_password and confirm_password):
        flash("Please complete all fields.", "error")
        return redirect(url_for("auth.reset_password_finish", token=raw))
    if new_password != confirm_password:
        flash("Passwords do not match.", "error")
        return redirect(url_for("auth.reset_password_finish", token=raw))

    hashed = _hash_token(raw)
    now = datetime.now(timezone.utc)

    user = users().find_one({
        "reset_token_hash": hashed,
        "reset_token_expires": {"$gt": now},
        "deactivated": {"$ne": True}
    })
    if not user:
        flash("Invalid or expired reset link.", "error")
        return redirect(url_for("auth.login"))

    users().update_one({"_id": user["_id"]}, {"$set": {
        "password_hash": generate_password_hash(new_password)
    }, "$unset": {
        "reset_token_hash": "", "reset_token_expires": ""
    }})

    flash("Your password has been updated. You can log in now.", "success")
    return redirect(url_for("auth.login"))


@auth_bp.post("/send-recovery-code")
def send_recovery_code():
    uid = current_user_id()
    if not uid:
        return jsonify({"error": "auth required"}), 401

    data = request.get_json(silent=True) or request.form or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "missing email"}), 400
    if "@" not in email or "." not in email:
        return jsonify({"error": "invalid email"}), 400

    user = get_user_by_id(uid)
    if not user:
        return jsonify({"error": "user not found"}), 404

    account_email = (user.get("email") or "").strip().lower()
    if account_email and email == account_email:
        return jsonify({"error": "recovery_cannot_match_account"}), 400

    last_sent = user.get("recovery_code_sent_at")
    now = _now_utc()
    if last_sent and isinstance(last_sent, datetime) and (now - last_sent) < RECOVERY_SEND_COOLDOWN:
        return jsonify({"error": "rate_limited"}), 429

    raw_code = f"{secrets.randbelow(1000000):06d}"
    hashed = _hash_token(raw_code)
    expires = now + RECOVERY_TTL

    users().update_one({"_id": user["_id"]}, {"$set": {
        "recovery_email_pending": email,
        "recovery_code_hash": hashed,
        "recovery_code_expires": expires,
        "recovery_code_sent_at": now
    }})

    body = f"""Hello {user.get('display_name') or ''},

A request was made to add email [{email}] as your recovery email for your Balance Bloom account.
Confirm this email using the verification code below (valid for {int(RECOVERY_TTL.total_seconds()/60)} minutes):

{raw_code}

If you did not request this, please consider changing your password.

If this is a mistake, ignore this message.
"""
    ok = send_real_email(to_email=email, subject="Balance Bloom recovery email verification", body=body)
    if not ok:
        return jsonify({"error": "email_failed"}), 502

    return jsonify({"ok": True})

@auth_bp.post("/auth/recover-email")
def recover_email_start():
    data = request.get_json(silent=True) or request.form or {}
    recovery_email = (data.get("email") or "").lower().strip()
    if not recovery_email:
        return jsonify({"error": "missing email"}), 400
    # find user by verified recovery email
    user = users().find_one({
        "recovery_email": recovery_email,
        "recovery_email_verified_at": {"$exists": True, "$ne": None},
        "deactivated": {"$ne": True}
    })
    if user:
        account_email = user.get("email")
        display_name = user.get("display_name") or "Bloomer"
        if account_email:
            body = f"""Hello {display_name},

You requested the email address associated with your Balance Bloom account.
The email for this account is: {account_email}

If this was not you, consider changing your password.
"""
            send_real_email(to_email=recovery_email, subject="Balance Bloom Account Email Recovery", body=body)
            print(f"[RECOVER] Sent account email reminder to {recovery_email}")
    return jsonify({"ok": True})