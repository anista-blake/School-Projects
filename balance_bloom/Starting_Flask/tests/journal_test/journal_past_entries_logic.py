# tests how the PastEntriesLogic class interacts with the db layer
# must run from a root of Starting_Flask
import pytest
from unittest.mock import MagicMock, PropertyMock, patch
from datetime import datetime, timezone
from bson.objectid import ObjectId

from bloom.journal.db_helpers import PastEntriesDB
from bloom.journal.journal_helpers import PastEntriesLogic

@pytest.fixture
def mock_db(monkeypatch):
    db = PastEntriesDB()
    mock_collection = MagicMock()
    
    # Patch the class property _collection to return our mock
    monkeypatch.setattr(
        type(db),                # The class itself
        "_collection",           # Name of the property
        PropertyMock(return_value=mock_collection)
    )
    
    # Optional: attach mock_collection to db for easy access in tests
    db._mock_collection = mock_collection
    return db

@pytest.fixture
def past_entries_logic(mock_db):
    return PastEntriesLogic(mock_db)

def make_entry(title="Test", content="Content", mood="great", _id=None):
    return {
        "_id": _id or ObjectId(),
        "title": title,
        "content": content,
        "mood": mood,
        "created_at": datetime(2025, 11, 25, tzinfo=timezone.utc),
        "last_edit": datetime(2025, 11, 25, tzinfo=timezone.utc)
    }

def test_get_all_entries_formats_entries(past_entries_logic, mock_db):
    entry1 = make_entry(title="Entry1")
    entry2 = make_entry(title="Entry2")
    
    mock_db.get_all_entries = MagicMock(return_value=[entry1, entry2])
    
    results = past_entries_logic.get_all_entries("user123")
    
    assert len(results) == 2
    assert results[0]["title"] == "Entry1"
    assert results[1]["title"] == "Entry2"
    assert results[0]["mood_filename"] == "emotion1.png"

def test_count_entries_returns_value(past_entries_logic, mock_db):
    mock_db.count_entries = MagicMock(return_value=5)
    
    count = past_entries_logic.count_entries("user123")
    
    assert count == 5

def test_last_date_returns_iso_string(past_entries_logic, mock_db):
    last_entry = make_entry(title="LastEntry")
    mock_db.last_date = MagicMock(return_value=last_entry)
    
    last_date = past_entries_logic.last_date("user123")
    
    assert last_date == last_entry["created_at"].isoformat()

def test_last_date_returns_none_if_no_entry(past_entries_logic, mock_db):
    mock_db.last_date = MagicMock(return_value=None)
    
    last_date = past_entries_logic.last_date("user123")
    
    assert last_date is None

def test_get_entry_by_id_formats_entry(past_entries_logic, mock_db):
    entry = make_entry(title="FoundEntry")
    mock_db.get_entry_by_id = MagicMock(return_value=entry)
    
    result = past_entries_logic.get_entry_by_id(ObjectId())
    
    assert result["_id"] == str(entry["_id"])
    assert result["title"] == "FoundEntry"
    assert result["mood_filename"] == "emotion1.png"

def test_get_entry_by_id_returns_none_if_missing(past_entries_logic, mock_db):
    mock_db.get_entry_by_id = MagicMock(return_value=None)
    
    result = past_entries_logic.get_entry_by_id(ObjectId())
    
    assert result is None