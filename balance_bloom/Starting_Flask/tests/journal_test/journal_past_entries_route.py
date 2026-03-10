# must run from a root of Starting_Flask

import pytest
from unittest.mock import MagicMock
from bson.objectid import ObjectId

from bloom.journal.journal_routes import journal_bp
from flask import Flask


@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(journal_bp)
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def mock_service(monkeypatch):
    mock = MagicMock()
    # Patch the constructor call inside the route:
    monkeypatch.setattr(
        "bloom.journal.journal_routes.PastEntriesLogic",
        lambda db: mock
    )
    return mock


def test_missing_entry_id(client, mock_service, monkeypatch):
    monkeypatch.setattr(
        "bloom.journal.journal_routes.current_user_id",
        lambda: "abc123"
    )

    res = client.post("/journal/get-entry", json={})
    assert res.status_code == 400
    assert res.json["error"] == "missing_entry_id"


def test_bad_objectid(client, mock_service, monkeypatch):
    monkeypatch.setattr(
        "bloom.journal.journal_routes.current_user_id",
        lambda: "abc123"
    )

    res = client.post("/journal/get-entry", json={"entry_id": "not-valid"})
    assert res.status_code == 400
    assert res.json["error"] == "bad_id"


def test_not_found_entry(client, mock_service, monkeypatch):
    monkeypatch.setattr(
        "bloom.journal.journal_routes.current_user_id",
        lambda: "abc123"
    )

    mock_service.get_entry_by_id.return_value = None

    res = client.post("/journal/get-entry", json={"entry_id": str(ObjectId())})
    assert res.status_code == 404
    assert res.json["error"] == "not_found"


def test_get_entry_success(client, mock_service, monkeypatch):
    monkeypatch.setattr(
        "bloom.journal.journal_routes.current_user_id",
        lambda: "abc123"
    )

    oid = ObjectId()
    mock_service.get_entry_by_id.return_value = {
        "_id": oid,
        "title": "Test",
        "content": "Body",
        "mood": "ok",
        "created_at": "2024-01-01T00:00:00Z",
        "last_edit": "2024-01-01T01:00:00Z",
    }

    res = client.post("/journal/get-entry", json={"entry_id": str(oid)})

    assert res.status_code == 200
    assert res.json["_id"] == str(oid)
    assert res.json["title"] == "Test"