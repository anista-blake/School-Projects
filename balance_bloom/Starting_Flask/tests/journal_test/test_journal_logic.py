import unittest
from unittest.mock import MagicMock
from datetime import datetime, timezone
import sys
import os


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from bloom.journal.journal_helpers import JournalLogic  # Import from journal logic class


class TestJournalLogic(unittest.TestCase):
    def setUp(self):
        # Mock the database dependency
        self.mock_db = MagicMock()
        self.logic = JournalLogic(self.mock_db)
        self.user_id = "user123"

    def test_create_entry_success(self):
        """Test creating a new journal entry successfully."""
        self.mock_db.get_daily_entry.return_value = None

        title = "My Journal Title"
        content = "Today I learned something new."
        mood = "great"

        self.logic.create_entry(self.user_id, title, content, mood)

        # Ensure DB create_entry was called once
        self.mock_db.create_entry.assert_called_once()
        entry_created = self.mock_db.create_entry.call_args[0][0]
        self.assertEqual(entry_created["title"], title)
        self.assertEqual(entry_created["content"], content)
        self.assertEqual(entry_created["mood"], mood)
        self.assertIsInstance(entry_created["created_at"], datetime)
        self.assertIsInstance(entry_created["last_edit"], datetime)

    def test_create_entry_duplicate_raises(self):
        """Test that creating a duplicate entry raises ValueError."""
        self.mock_db.get_daily_entry.return_value = {"title": "Existing Entry"}

        with self.assertRaises(ValueError) as context:
            self.logic.create_entry(self.user_id, "New Title", "Some content", "ok")

        self.assertIn("Entry for today already exists", str(context.exception))
        self.mock_db.create_entry.assert_not_called()

    def test_create_entry_title_too_long(self):
        """Test that a title exceeding max length raises ValueError."""
        self.mock_db.get_daily_entry.return_value = None
        long_title = "A" * 101  # exceeds 100 characters

        with self.assertRaises(ValueError) as context:
            self.logic.create_entry(self.user_id, long_title, "Valid content", "ok")

        self.assertIn("Title exceeds maximum length", str(context.exception))
        # Should not create entry if validation fails
        self.mock_db.create_entry.assert_not_called()

    def test_create_entry_content_too_long(self):
        """Test that content exceeding max length raises ValueError."""
        self.mock_db.get_daily_entry.return_value = None
        long_content = "C" * 5001  # exceeds 5000 characters

        with self.assertRaises(ValueError) as context:
            self.logic.create_entry(self.user_id, "Valid Title", long_content, "ok")

        self.assertIn("Content exceeds maximum length", str(context.exception))
        self.mock_db.create_entry.assert_not_called()

    def test_delete_daily_entry_calls_db(self):
        """Test that deleting an entry calls the DB method."""
        self.logic.delete_daily_entry(self.user_id)
        self.mock_db.delete_daily_entry.assert_called_once_with(self.user_id)


if __name__ == "__main__":
    unittest.main()
