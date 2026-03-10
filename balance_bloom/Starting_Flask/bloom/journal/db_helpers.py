# This is all functionality relating to the Journal Database
from datetime import datetime, timezone, time, timedelta
from bson.objectid import ObjectId
from bloom.extensions import get_db

class JournalDB:
    
    @property
    def _collection(self):
        # Dynamically fetch MongoDB collection from Flask context
        return get_db()["Journal_entry"]

    # checks userID to make sure that it is valid and that the user has an id
    def user_filter(self,user_id):
        return ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id 
    
    # creates a query for a specific user's journal entry created sometime in a day
    def today_query(self,user_id):
        today = datetime.now(timezone.utc).date()
        start_of_today = datetime.combine(today, time.min, tzinfo=timezone.utc)
        start_of_tomorrow = start_of_today + timedelta(days=1)
        return {"user_id": self.user_filter(user_id), "created_at": {"$gte": start_of_today, "$lt": start_of_tomorrow}}
    
    # gets the daily entry
    def get_daily_entry(self,user_id):
        return self._collection.find_one(self.today_query(user_id))

    # creates a journal entry
    def create_entry(self,entry):
        return self._collection.insert_one(entry)
    
    # updates an exhisting Journal entry that was created today
    def update_daily_entry(self,user_id, update_data):
        return self._collection.find_one_and_update(self.today_query(user_id),{'$set': update_data})
    
    # deletes a daily entry if there is one
    def delete_daily_entry(self, user_id):
        entry = self.get_daily_entry(user_id)
        if entry:
            self._collection.delete_one({'_id':entry['_id']})


class PastEntriesDB(JournalDB):
    # returns all of a users entries sorted by date created
    def get_all_entries(self,user_id):
        return list(
            self._collection.find({"user_id": self.user_filter(user_id)}).sort("created_at", -1)
        )
    
    # returns the total number of entries a user has
    def count_entries(self,user_id):
        return self._collection.count_documents({"user_id": self.user_filter(user_id)})
    
    # returns the latest entry created, used for the past entries date 
    def last_date(self,user_id):
        return self._collection.find_one({"user_id": self.user_filter(user_id)}, sort=[("created_at",-1)] )
    
    def get_entry_by_id(self,entry_id):
        return self._collection.find_one({"_id": entry_id })