from pymongo import MongoClient, ASCENDING
from bson.objectid import ObjectId
import os

def get_client(uri: str):
    client = MongoClient(uri, tz_aware=True, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
        print("Connected to MongoDB")
    except Exception as err:
        print("MongoDB connection failed:", err)
    return client

# helper to build db/collection objects after app is created
def init_db_collections(app):
    uri = app.config.get("MONGO_URI")
    if not uri:
        raise RuntimeError("MONGO_URI is not set. check if it's in .env")
    client = get_client(uri)
    
    db = client["balance_bloom"]
    users = db["users"]
    users.create_index([("email", ASCENDING)], unique=True)

    dbJOURNAL = client["Mood_Journal"]
    journal_entries = dbJOURNAL["Journal_entry"]

    dbCYCLE = client["Cycle_Tracker"]
    cycle_entries = dbCYCLE["Cycle_entry"]

    dbRECIPE = client["Recipes"]
    favorites = dbRECIPE["Favorites"]

    # expose collections on app for simple access
    app.mongo_client = client
    app.users = users
    app.journal_entries = journal_entries
    app.cycle_entries = cycle_entries
    app.favorites = favorites