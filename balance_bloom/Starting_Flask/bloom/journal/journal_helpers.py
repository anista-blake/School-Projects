from datetime import datetime, timezone
from .db_helpers import JournalDB, PastEntriesDB

# map for the mood selection
mood_to_file = {
    "great": "emotion1.png",
    "alright": "emotion2.png",
    "ok": "emotion3.png",
    "not_great": "emotion4.png",
    "bad": "emotion5.png"
}
class JournalLogic:
    MAX_TITLE_LENGTH = 100
    MAX_CONTENT_LENGTH = 5000

    # 
    def __init__(self, db: JournalDB):
        self.db = db
    
    # creates a dictionary for the journal entry
    def format_entry(self,entry):
        if not entry:
            return None
        mood_file = mood_to_file.get(entry.get("mood"), "emotionDefault.png")
        return{
            "title": entry.get("title"),
            "content": entry.get("content"),
            "mood": entry.get("mood"),
            "mood_filename": mood_file,
            "created_at": entry.get("created_at").isoformat() if entry.get("created_at") else "",
            "last_edit": entry.get("last_edit").isoformat() if entry.get("last_edit") else "",
            "_id": str(entry.get("_id"))
        }
    
    #Validation helper funtion for title and content length
    def validate_entry_length(self, title, content):
        if len(title.strip()) > self.MAX_TITLE_LENGTH:
            raise ValueError(f"Title exceeds maximum length of {self.MAX_TITLE_LENGTH} characters.")
        if len(content.strip()) > self.MAX_CONTENT_LENGTH:
            raise ValueError(f"Content exceeds maximum length of {self.MAX_CONTENT_LENGTH} characters.")
        

    # retrives the daily entry and formats it 
    def get_daily_entry(self,user_id):
        entry = self.db.get_daily_entry(user_id)
        return self.format_entry(entry)

    # adds new entry based on user input
    def create_entry(self, user_id, title, content, mood):
        title = title.strip()
        content = content.strip()

        # validate title and content length
        self.validate_entry_length(title, content)

        existing_entry = self.db.get_daily_entry(user_id)
        if existing_entry:
            raise ValueError("Entry for today already exists")
        now = datetime.now(timezone.utc)
        entry = {
            "user_id": user_id,
            "title": title.strip(),
            "content": content.strip(),
            "created_at": now,
            "last_edit": now,
            "mood": mood.strip()
        }
        self.db.create_entry(entry)
        

    # updates existing daily entry baised on user input
    def update_daily_entry(self, user_id, title, content, mood):
        title = title.strip()
        content = content.strip()

        # validate title and content length
        self.validate_entry_length(title, content)

        self.db.update_daily_entry(user_id, {
            "title": title.strip(),
            "content": content.strip(),
            "last_edit": datetime.now(timezone.utc),
            "mood": mood.strip()
        })
        
    
    # deletes a daily entry
    def delete_daily_entry(self,user_id):
        self.db.delete_daily_entry(user_id)


class PastEntriesLogic(JournalLogic,PastEntriesDB):

    def get_all_entries(self,user_id):
        entries = self.db.get_all_entries(user_id)
        return [self.format_entry(entry) for entry in entries if entry]
    
    def count_entries(self,user_id):
        return self.db.count_entries(user_id)
    
    def last_date(self, user_id):
        last_entry = self.db.last_date(user_id)
        if last_entry:
            date = last_entry.get("created_at").isoformat()
        else:
            date = None    
        return date
         
    def get_entry_by_id(self, entry_id):
        entry = self.db.get_entry_by_id(entry_id)
        return self.format_entry(entry)