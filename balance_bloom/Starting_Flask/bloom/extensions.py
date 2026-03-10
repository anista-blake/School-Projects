from pymongo import MongoClient
from pymongo.errors import ConfigurationError, ServerSelectionTimeoutError

_client = None
_db = None

def init_extensions(app):
    global _client, _db
    uri = app.config.get("MONGO_URI")
    
    if not uri:
        raise RuntimeError("MONGO_URI not set")
    try:
        _client = MongoClient(uri, tz_aware=True, serverSelectionTimeoutMS=5000)
        _client.admin.command("ping")
    except ConfigurationError as e:
        #DNS SRV/dnspython or bad URI
        raise RuntimeError("MongoDB configuration/resolution error: " + str(e))
    except ServerSelectionTimeoutError as e:
        raise RuntimeError("MongoDB server selection timed out: " + str(e))
    
    _db = _client[app.config.get("MONGO_DBNAME", "balance_bloom")]

def get_db():
    if _db is None:
        raise RuntimeError("Database not initialized. Call init_extensions(app) from create_app().")
    return _db