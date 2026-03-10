
"""
SCRUM-150: Testing Plan for login routes

Feature: The login view and related authentication helpers (GET /login and POST /login) handling user credential validation, session creation, last-login updates, and flash/redirect behavior.

Unit test targets:
- GET /login page: verify the page renders successfully for unauthenticated requests.
- Missing fields validation: verify POST without email or password flashes an appropriate error and redirects.
- Nonexistent user: verify POST with an unknown email flashes an account-not-found message and redirects.
- Missing password hash: verify POST for a user without a stored password_hash flashes an instructive message and redirects.
- Incorrect password: verify POST with wrong password flashes an invalid-credentials message and redirects.
- Successful login: verify POST with valid credentials sets session['user_id'], flashes success, and updates last_login_at in the users collection (timestamp is recent, UTC-aware or normalized).
- Flash handling: assert flashes are produced (use session inspection via client.session_transaction when follow_redirects=False).
- DB interactions: verify user lookup by email and last_login_at update are performed against the users collection.

Tests operate at the unit level using mongomock and Flask test/request contexts to isolate behavior without external side effects.

Test Implementation Notes
- Use fixtures in tests/conftest.py (app, client, db) to provide the Flask app and mongomock-backed DB.
- Create test user documents with deterministic password_hash values using werkzeug.security.generate_password_hash and insert directly into the test DB.
- Post with follow_redirects=False and inspect session['_flashes'] via client.session_transaction() to assert flashed messages reliably.
- For time assertions, normalize datetimes returned by the DB to UTC-aware before comparing to datetime.now(timezone.utc).
- Keep each test focused on one behavior; use helpers (make_user_doc, get_flash_messages_from_session) to reduce duplication.
- Avoid network I/O and external dependencies; tests should only use the fake mongomock DB and in-process Flask contexts.

Assertions and Coverage Expectations
- Each test asserts a single logical outcome to simplify failure diagnosis (status code, flash content, session entry, or DB update).
- Cover both negative and positive branches for the login flow.
- Ensure tests are deterministic and fast so they are suitable for CI runs.
"""

from werkzeug.security import generate_password_hash
from bson import ObjectId
from datetime import datetime, timezone

LOGIN_URL = "/login"

def test_login_get_page_debug(client):
    resp = client.get("/login")
    print("GET /login status:", resp.status_code)
    print("GET /login body snippet:", resp.data.decode("utf-8")[:400])
    assert resp.status_code == 200

def test_login_post_debug(client):
    resp = client.post("/login", data={"email": "", "password": ""}, follow_redirects=False)
    print("POST /login status:", resp.status_code)
    print("POST /login headers:", dict(resp.headers))
    # If it's a redirect, show Location
    if resp.status_code in (301, 302, 303, 307):
        print("Location:", resp.headers.get("Location"))

def make_user_doc(email="user@example.com", password="secret", with_hash=True, deactivated=False):
    """Return a user document shaped like your app expects."""
    doc = {
        "_id": ObjectId(),
        "email": email.lower().strip(),
        "deactivated": deactivated,
    }
    if with_hash:
        doc["password_hash"] = generate_password_hash(password)
    return doc


def get_flash_messages_from_session(client):
    """Helper: return list of flashed message strings from the test client session."""
    with client.session_transaction() as sess:
        flashes = sess.get("_flashes", [])  # list of (category, message)
    return [msg for category, msg in flashes]


def test_login_missing_fields(client, db):
    resp = client.post(LOGIN_URL, data={"email": "", "password": ""}, follow_redirects=False)
    assert resp.status_code in (302, 303)
    flashes = get_flash_messages_from_session(client)
    assert any("Please provide both email and password." in f for f in flashes)


def test_login_nonexistent_user(client, db):
    db.get_collection("users").delete_many({})
    resp = client.post(LOGIN_URL, data={"email": "noone@example.com", "password": "x"}, follow_redirects=False)
    assert resp.status_code in (302, 303)
    flashes = get_flash_messages_from_session(client)
    assert any("No account found for that email." in f for f in flashes)


def test_login_no_password_hash(client, db):
    user = make_user_doc(with_hash=False)
    db.get_collection("users").insert_one(user)

    resp = client.post(LOGIN_URL, data={"email": user["email"], "password": "anything"}, follow_redirects=False)
    assert resp.status_code in (302, 303)
    flashes = get_flash_messages_from_session(client)
    assert any("Account has no password set. Contact support." in f for f in flashes)


def test_login_wrong_password(client, db):
    user = make_user_doc(password="rightpass")
    db.get_collection("users").insert_one(user)

    resp = client.post(LOGIN_URL, data={"email": user["email"], "password": "wrongpass"}, follow_redirects=False)
    assert resp.status_code in (302, 303)
    flashes = get_flash_messages_from_session(client)
    assert any("Invalid email or password." in f for f in flashes)


def test_login_success_sets_session_and_updates_last_login(client, db):
    user = make_user_doc(password="correct")
    users_coll = db.get_collection("users")
    users_coll.insert_one(user)

    resp = client.post(LOGIN_URL, data={"email": user["email"], "password": "correct"}, follow_redirects=False)
    assert resp.status_code in (302, 303)

    # flashed message
    flashes = get_flash_messages_from_session(client)
    assert any("Logged in." in f for f in flashes)

    # Verify session contains the user id
    with client.session_transaction() as sess:
        assert sess.get("user_id") == str(user["_id"])

    # Verify last_login_at was updated in DB and is recent (UTC)
    stored = users_coll.find_one({"_id": user["_id"]})

    stored_dt = stored["last_login_at"]
    # If the DB returned a naive datetime, assume it's UTC and make it aware
    if stored_dt.tzinfo is None:
        stored_dt = stored_dt.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    delta = now - stored_dt
    assert 0 <= delta.total_seconds() < 60
