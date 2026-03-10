import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
REACT_BUILD_DIR = os.path.join(BASE_DIR, "balance_bloom", "Recipe_React", "build")

class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET", "BLOOM")
    MONGO_URI = os.getenv("MONGO_URI")
    REACT_BUILD_DIR = REACT_BUILD_DIR
    RESET_TTL = timedelta(hours=2)
    RECOVERY_TTL = timedelta(minutes=15)
    RECOVERY_SEND_COOLDOWN = timedelta(seconds=60)
    ALLOWED_EXTS = {".png", ".jpg", ".jpeg", ".gif"}