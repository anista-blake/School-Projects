# tests/utils_test/test_utils.py
"""
SCRUM-150: Testing Plan for util.py

Feature: The utility helpers used across the app (session helpers, DB lookups, token helpers, time helpers, email sending, and filename/extension validation).

Unit test targets:
- current_user_id: verify correct ObjectId conversion and safe failure when missing or invalid.
- get_user_by_id / get_user_by_email: verify lookup behavior for ObjectId and string inputs, and empty/invalid inputs.
- humanize: verify formatting and handling of None values.
- CSRF helpers (get_csrf_token, check_csrf): verify token generation, persistence in session, and validation logic.
- Token functions (_make_reset_token, _hash_token) and _now_utc: verify uniqueness, deterministic hashing, and timezone-awareness.
- send_real_email: monkeypatch SMTP to assert correct usage and environment handling (success and failure paths).
- allowed: verify extension checks and use of current_app.config override.

Tests operate at the unit level using mongomock and Flask test/request contexts to isolate behavior without external side effects.

Test Implementation Notes
- Use fixtures in tests/conftest.py (app, client, db) to provide a test Flask app and a mongomock-backed DB.
- Use app.test_request_context and client.session_transaction to exercise session- and request-dependent functions.
- Monkeypatch standard library modules (smtplib, os.environ) are used to avoid network I/O and to simulate environment conditions.
- Normalize datetime comparisons to handle datetimes for portability across environments.

Assertions and Coverage Expectations
- Each unit test asserts one focused behavior (one logical condition) to keep failures easy to interpret.
- Tests assert return values and side effects (e.g., session changes, DB updates) where applicable.
- Aim to cover both success and failure branches for each helper function (e.g., missing env vars, invalid input, empty values).
"""

import hashlib
from datetime import datetime, timezone

from bson import ObjectId

#Import the functions under test (adjust path if needed)
from bloom.utils import (
    current_user_id,
    get_user_by_id,
    get_user_by_email,
    humanize,
    get_csrf_token,
    check_csrf,
    _hash_token,
    _make_reset_token,
    _now_utc,
    send_real_email,
    allowed,
)

#Helpers for test DB documents
def make_user_doc(email="u@example.com", pwd_hash=None):
    doc = {"_id": ObjectId(), "email": email}
    if pwd_hash:
        doc["password_hash"] = pwd_hash
    return doc


def test_humanize_none():
    assert humanize(None) == "—"


def test_humanize_datetime():
    dt = datetime(2020, 1, 2, 15, 4, tzinfo=timezone.utc)
    #Format check (month name and year are present)
    s = humanize(dt)
    assert "2020" in s
    assert "Jan" in s


def test_hash_token_and_make_token_uniqueness():
    t1 = _make_reset_token()
    t2 = _make_reset_token()
    assert isinstance(t1, str) and isinstance(t2, str)
    assert t1 != t2
    #_hash_token produces deterministic sha256 hex digest
    h1 = _hash_token("abc")
    assert h1 == hashlib.sha256(b"abc").hexdigest()


def test_now_utc_is_aware_and_recent():
    now = _now_utc()
    assert now.tzinfo is not None
    delta = datetime.now(timezone.utc) - now
    assert 0 <= delta.total_seconds() < 5


def test_get_user_by_id_and_email_using_db_fixture(app, db):
    #Insert a user doc into the mongomock DB used by your app
    user = make_user_doc("someone@example.com")
    db.get_collection("users").insert_one(user)

    #get_user_by_id should accept both ObjectId and string
    assert get_user_by_id(user["_id"])["_id"] == user["_id"]
    assert get_user_by_id(str(user["_id"]))["_id"] == user["_id"]

    #get_user_by_email returns the same doc
    assert get_user_by_email("someone@example.com")["_id"] == user["_id"]
    #Case: empty email returns None
    assert get_user_by_email("") is None


def test_current_user_id_and_csrf_tokens(client, app):
    from flask import session as _sess

    #Current_user_id via a request context with no user_id
    with app.test_request_context("/", method="GET"):
        assert current_user_id() is None

    #Set a user_id inside a request context and check current_user_id
    uid_str = str(ObjectId())
    with app.test_request_context("/", method="GET"):
        _sess["user_id"] = uid_str
        uid = current_user_id()
        assert isinstance(uid, ObjectId)
        assert str(uid) == uid_str

    #Csrf token creation and retrieval inside a request context
    with app.test_request_context("/", method="GET"):
        #Csrf token will be generated and stored in this session
        token = get_csrf_token()
        assert isinstance(token, str)
        assert get_csrf_token() == token

    #Positive check_csrf: set session token then POST with matching form token
    with app.test_request_context("/", method="POST", data={"csrf_token": token}):
        _sess["csrf_token"] = token
        assert check_csrf() is True

    #Negative case
    with app.test_request_context("/", method="POST", data={"csrf_token": "nope"}):
        _sess["csrf_token"] = token
        assert check_csrf() is False

def test_send_real_email_monkeypatched(monkeypatch):
    sent = {}

    #Fake SMTP class to capture calls
    class FakeSMTP:
        def __init__(self, host, port):
            sent['host'] = host
            sent['port'] = port
        def starttls(self, context=None):
            sent['starttls'] = True
        def login(self, user, pw):
            sent['login'] = (user, pw)
        def send_message(self, msg):
            #Record some fields
            sent['to'] = msg['To']
            sent['subject'] = msg['Subject']
            sent['body'] = msg.get_payload()
        def quit(self):
            pass
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc, tb):
            return False

    #Monkeypatch smtplib.SMTP to FakeSMTP
    monkeypatch.setattr("smtplib.SMTP", FakeSMTP)

    #Set env vars to enable sending
    monkeypatch.setenv("GMAIL_USER", "me@example.com")
    monkeypatch.setenv("GMAIL_APP_PASSWORD", "secretpw")

    ok = send_real_email("dest@example.com", "subj", "hello body")
    assert ok is True
    assert sent['host'] == "smtp.gmail.com"
    assert sent['to'] == "dest@example.com"
    assert sent['subject'] == "subj"

    #If missing env vars -> returns False
    monkeypatch.delenv("GMAIL_USER", raising=False)
    monkeypatch.delenv("GMAIL_APP_PASSWORD", raising=False)
    assert send_real_email("x@y", "s", "b") is False


def test_allowed_uses_current_app_config(app):
    #Default allowed extensions include png; this function looks at current_app.config["ALLOWED_EXTS"]
    from flask import current_app
    with app.app_context():
        #Not set: fallback default should allow .png
        assert allowed("image.PNG") is True

        #Override config
        current_app.config["ALLOWED_EXTS"] = {".foo"}
        assert allowed("file.foo") is True
        assert allowed("file.png") is False
