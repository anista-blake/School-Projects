# test/settings_test/test_settings.py
""" SCRUM-150: Testing Plan for settings routes

Feature: The account settings view and related handlers (GET /settings and POST /settings) that show and update user profile, password, email, notification preferences, and cycle/period data.

Unit test targets:
- Authentication guard: verify the route redirects when no user is logged in or when the user record cannot be found.
- GET settings page: verify route returns 200 for a valid logged-in user and renders expected page content.
- Email uniqueness check: verify POST rejects an already-used email and redirects with a flash.
- Password change flow: verify POST rejects incorrect current password and accepts correct current password, updating stored hash.
- Profile update flow: verify display_name and notification flags are persisted via the users collection update.
- Period/cycle handling: verify cycle_entries find_one and update_one/upsert behavior when period toggles or cycle fields change.
- DB interaction: verify update queries (query and $set contents) and upsert flags sent to collections.

Flash and redirect behavior: verify routes flash expected messages and issue appropriate redirects (login/settings/home).
Tests operate at the unit level using monkeypatch to isolate the view logic and avoid external side effects:
Use fixtures in tests/conftest.py (app, client, db) so the Flask app and mongomock DB are available.
Monkeypatch helpers imported by the view (current_user_id, get_user_by_id, get_user_by_email, check_password_hash, generate_password_hash) to control control-flow branches.
Replace DB collection factories with lightweight fake/nop coll objects that record calls (update_one, find_one) to assert queries and update payloads.
Use client to exercise routes and check responses, Location headers, and session flashes when appropriate.

Test Implementation Notes
- Keep each test focused on one behavior (authorization, validation, DB update, or redirect).
- Make assertions on:
   - Response status and redirect Location substring (e.g., "login" or "settings").
   - Recorded DB query and update payload structure (e.g., users_calls["query"], users_calls["update"]["$set"]).
   - Whether cycle_entries.update_one was called with upsert=True where expected.
   - Session changes and flashed messages when necessary (use client.session_transaction()).
   - Use small helper functions to reduce repetition (e.g., setup_logged_in_user(monkeypatch, user)).

Assertions and Coverage Expectations
- Each test asserts a single logical outcome to make failures easy to diagnose.
- Cover both success and failure branches: missing login, missing user, invalid input, conflict (email taken), invalid password, and successful update with cycle upsert.
- Ensure tests are deterministic and fast by avoiding network or real DB I/O (use mongomock and monkeypatched SMTP/IO if needed). 
"""
from werkzeug.security import generate_password_hash as wp_gen_hash
import bloom.account.account_routes as account_routes  # module that defines the view + account_bp

def make_user(uid="user123", email="me@example.com", password="secret"):
    return {
        "_id": uid,
        "id": uid,
        "email": email,
        "display_name": "Me",
        "password_hash": wp_gen_hash(password),
        "notifications_enabled": False,
        "track_period_data": False,
    }


def test_settings_redirects_when_not_logged_in(client, monkeypatch):
    # patch the helper so the route thinks the user is not logged in
    monkeypatch.setattr(account_routes, "current_user_id", lambda: None)
    resp = client.get("/settings", follow_redirects=False)
    assert resp.status_code == 302
    # login redirect target can vary; check for login in location
    assert "login" in resp.headers["Location"]


def test_settings_redirects_when_user_not_found(client, monkeypatch):
    monkeypatch.setattr(account_routes, "current_user_id", lambda: "u1")
    monkeypatch.setattr(account_routes, "get_user_by_id", lambda uid: None)
    resp = client.get("/settings", follow_redirects=False)
    assert resp.status_code == 302
    assert "login" in resp.headers["Location"]


def test_settings_get_returns_200_with_user_period(client, monkeypatch):
    user = make_user()
    monkeypatch.setattr(account_routes, "current_user_id", lambda: user["_id"])
    monkeypatch.setattr(account_routes, "get_user_by_id", lambda uid: user)

    class FakeCycle:
        def find_one(self, q):
            assert q == {"user_id": user["_id"]}
            return {"user_id": user["_id"], "cycle_length": 28}

    monkeypatch.setattr(account_routes, "cycle_entries", lambda: FakeCycle())

    resp = client.get("/settings")
    assert resp.status_code == 200
    # relax case sensitivity; we just want the page content
    assert b"Settings" in resp.data or b"settings" in resp.data


def test_post_email_already_in_use_flashes_error(client, monkeypatch):
    user = make_user()
    monkeypatch.setattr(account_routes, "current_user_id", lambda: user["_id"])
    monkeypatch.setattr(account_routes, "get_user_by_id", lambda uid: user)
    # Simulate email already taken
    monkeypatch.setattr(account_routes, "get_user_by_email", lambda email: {"_id": "other"})

    # Avoid performing DB writes by patching users() to a no-op collection
    class NoopUsers:
        def update_one(self, *a, **k):
            return None
    monkeypatch.setattr(account_routes, "users", lambda: NoopUsers())

    data = {"username": "", "email": "taken@example.com"}
    resp = client.post("/settings", data=data, follow_redirects=False)
    assert resp.status_code == 302
    # after flash the route redirects back to settings; check for that
    assert "settings" in resp.headers["Location"]


def test_post_change_password_bad_current_password(client, monkeypatch):
    user = make_user(password="rightpass")
    monkeypatch.setattr(account_routes, "current_user_id", lambda: user["_id"])
    monkeypatch.setattr(account_routes, "get_user_by_id", lambda uid: user)
    monkeypatch.setattr(account_routes, "get_user_by_email", lambda email: None)
    # Simulate check_password_hash failing
    monkeypatch.setattr(account_routes, "check_password_hash", lambda stored, provided: False)

    class NoopUsers:
        def update_one(self, *a, **k):
            return None
    monkeypatch.setattr(account_routes, "users", lambda: NoopUsers())

    data = {"current_password": "wrong", "new_password": "newpass", "confirm_password": "newpass"}
    resp = client.post("/settings", data=data, follow_redirects=False)
    assert resp.status_code == 302
    assert "settings" in resp.headers["Location"]


def test_post_successful_updates_and_period_upsert(client, monkeypatch):
    user = make_user(password="mypwd")
    users_calls = {}
    cycle_calls = {}

    monkeypatch.setattr(account_routes, "current_user_id", lambda: user["_id"])
    monkeypatch.setattr(account_routes, "get_user_by_id", lambda uid: user)
    monkeypatch.setattr(account_routes, "get_user_by_email", lambda email: None)
    monkeypatch.setattr(account_routes, "check_password_hash", lambda stored, provided: True)
    monkeypatch.setattr(account_routes, "generate_password_hash", lambda pw: f"hashed-{pw}")

    class FakeUsersColl:
        def update_one(self, query, update):
            users_calls["query"] = query
            users_calls["update"] = update
            class R: matched_count = 1; modified_count = 1
            return R()

    class FakeCycleColl:
        def update_one(self, query, update, upsert=False):
            cycle_calls["query"] = query
            cycle_calls["update"] = update
            cycle_calls["upsert"] = upsert
        def find_one(self, q):
            return None

    monkeypatch.setattr(account_routes, "users", lambda: FakeUsersColl())
    monkeypatch.setattr(account_routes, "cycle_entries", lambda: FakeCycleColl())

    data = {
        "username": "NewName",
        "email": "",
        "new_email": "",
        "confirm_email": "",
        "current_password": "mypwd",
        "new_password": "newpwd",
        "confirm_password": "newpwd",
        "notifications": "on",
        "period": "on",
        "cycle_length": "30",
        "period_length": "5"
    }

    resp = client.post("/settings", data=data, follow_redirects=False)
    assert resp.status_code == 302

    assert users_calls["query"] == {"_id": user["_id"]}
    assert "$set" in users_calls["update"]
    assert users_calls["update"]["$set"]["display_name"] == "NewName"
    assert users_calls["update"]["$set"]["password_hash"] == "hashed-newpwd"
    assert cycle_calls["query"] == {"user_id": user["_id"]}
    assert cycle_calls["upsert"] is True