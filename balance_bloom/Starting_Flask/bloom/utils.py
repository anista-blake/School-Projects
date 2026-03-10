from functools import wraps
import os, secrets, ssl, smtplib, traceback, hashlib
from datetime import datetime, timezone, timedelta
from email.message import EmailMessage
from flask import flash, g, redirect, session, request, url_for, abort, current_app
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from pathlib import Path
from bson.objectid import ObjectId
from .extensions import get_db

RESET_TTL = timedelta(hours=2)
RECOVERY_TTL = timedelta(minutes=15)
RECOVERY_SEND_COOLDOWN = timedelta(seconds=60)
ALLOWED_EXTS = {".png", ".jpg", ".jpeg", ".gif"}

def current_user_id():
    uid = session.get("user_id")
    try:
        from bson.objectid import ObjectId
        return ObjectId(uid) if uid else None
    except Exception:
        return None

def _users_collection():
    return get_db()["users"]

def get_user_by_id(uid):
    """Accept either str or ObjectId. Return user dict or None."""
    if uid is None:
        return None
    try:
        oid = uid if isinstance(uid, ObjectId) else ObjectId(uid)
    except Exception:
        # if uid is already some other form your app uses, adjust accordingly
        oid = uid
    return _users_collection().find_one({"_id": oid})

def get_user_by_email(email):
    if not email:
        return None
    return _users_collection().find_one({"email": email})

def humanize(dt):
    if not dt:
        return "—"
    return dt.strftime("%b %d, %Y • %I:%M %p")

def get_csrf_token():
    token = session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        session["csrf_token"] = token
    return token

def check_csrf():
    return request.form.get("csrf_token") == session.get("csrf_token")

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        uid = current_user_id()
        if uid is None:
            flash("Please log in to access this page.", "error")
            return redirect(url_for("auth.login"))
        
        now = datetime.now(timezone.utc)
        
        _users_collection().update_one(
            {"_id": uid},
            {"$set": {"last_seen": now}}
        )

        user = get_user_by_id(uid)
        if not user:
            session.clear()
            flash("Your user session was invalid. Please log in again.", "error")
            return redirect(url_for("auth.login"))
            
        g.user = user
        
        return f(*args, **kwargs)
    return decorated_function

def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def _make_reset_token() -> str:
    return secrets.token_urlsafe(32)

def _now_utc():
    return datetime.now(timezone.utc)

def send_real_email(to_email: str, subject: str, body: str):
    user = os.getenv("GMAIL_USER")
    pw = os.getenv("GMAIL_APP_PASSWORD")
    if not user or not pw:
        print("[EMAIL] Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env")
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = to_email
    msg.set_content(body)

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls(context=context)
            smtp.login(user, pw)
            smtp.send_message(msg)
        print(f"[EMAIL] Sent successfully to {to_email}")
        return True
    except Exception:
        print("[EMAIL] Failed to send:")
        traceback.print_exc()
        return False

def allowed(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in current_app.config.get("ALLOWED_EXTS", {".png", ".jpg", ".jpeg", ".gif"})