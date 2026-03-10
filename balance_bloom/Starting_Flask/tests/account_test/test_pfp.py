import io
import pytest
from unittest.mock import patch
from flask import Flask, session, request, redirect, url_for, flash

app = Flask(__name__)
app.config["TESTING"] = True
app.config["SECRET_KEY"] = "testing-secret-key"

users = {}

@app.route("/account/avatar", methods=["POST"])
def update_avatar():
    csrf_token = request.form.get("csrf_token")
    if csrf_token != "testtoken":
        return "CSRF token invalid", 400

    uid = session.get("uid")
    if not uid:
        return "Not logged in", 403

    file = request.files.get("avatar")
    if not file:
        return "No file uploaded", 400

    users.setdefault(uid, {})["avatar"] = file.read()

    flash("Profile image updated!")
    return "Profile image updated!", 200

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def test_account_update_avatar_basic(client):
    """Test uploading a profile avatar image."""
    
    with client.session_transaction() as sess:
        sess["uid"] = "test_user_id"

    with patch("builtins.print"):
        fake_file = (io.BytesIO(b"fake image bytes"), "avatar.png")

        response = client.post(
            "/account/avatar",
            data={"avatar": fake_file, "csrf_token": "testtoken"},
            content_type="multipart/form-data",
            follow_redirects=True
        )

        assert response.status_code == 200
        assert b"Profile image updated!" in response.data
        assert users["test_user_id"]["avatar"] == b"fake image bytes"

def test_account_update_avatar_logging(client):
    print("\n------------------------------------------------------------")
    print("⚙️  Running: test_account_update_avatar")

    print("[INFO] Setting session for test_user_id ...")
    with client.session_transaction() as sess:
        sess["uid"] = "test_user_id"
    print("[INFO] Session set successfully")

    print("[INFO] Preparing fake avatar file ...")
    fake_file = (io.BytesIO(b"fake image bytes"), "avatar.png")
    print("[INFO] Fake file ready")

    print("[INFO] Sending POST request to /account/avatar ...")
    response = client.post(
        "/account/avatar",
        data={"avatar": fake_file, "csrf_token": "testtoken"},
        content_type="multipart/form-data",
        follow_redirects=True
    )
    print(f"[INFO] Response received: status {response.status_code}")

    try:
        assert response.status_code == 200
        assert b"Profile image updated!" in response.data
        assert users["test_user_id"]["avatar"] == b"fake image bytes"
        print(f"✅ Passed: Avatar upload works correctly for uid='test_user_id' → returned status {response.status_code}")
    except AssertionError as err:
        print("❌ Failed:", err)
        raise
    