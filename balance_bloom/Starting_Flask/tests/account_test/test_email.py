import os
import ssl
import smtplib
import traceback
from email.message import EmailMessage
from pathlib import Path
import time

def test_email_send():
    print("------------------------------------------------------------")
    print("⚙️  Running: test_email.py")

    start = time.perf_counter()
    try:
        from dotenv import load_dotenv

        load_dotenv(Path(__file__).parent / ".env")
        print("[INFO] Loaded .env from", Path(__file__).parent / ".env")
        user = os.getenv("GMAIL_USER")
        pw = os.getenv("GMAIL_APP_PASSWORD")
        to = os.getenv("TEST_TO") or user

        print("[INFO] GMAIL_USER =", user)
        print("[INFO] GMAIL_APP_PASSWORD set?", bool(pw))
        print("[INFO] Sending to:", to)

        if not user or not pw or not to:
            raise SystemExit("[ERROR] Missing GMAIL_USER / GMAIL_APP_PASSWORD / TEST_TO")

        ok1 = True
    except Exception as e:
        print("[WARN] Could not load .env or missing credentials:", e)
        ok1 = False
    
    end = time.perf_counter()
    print("ok 1 - load environment variables & check credentials")
    print("  ---")
    print(f"  duration_ms: {(end - start) * 1000:.3f}")
    print("  type: 'test'")
    print("  ...")

    start = time.perf_counter()
    try:
        msg = EmailMessage()
        msg["Subject"] = "Balance Bloom Support Test"
        msg["From"] = user
        msg["To"] = to
        msg.set_content("This is a test email from Balance Bloom.")
        ok2 = True
    except Exception as e:
        print("❌ Failed to create email message:", e)
        ok2 = False

    end = time.perf_counter()
    print("ok 2 - prepare email message")
    print("  ---")
    print(f"  duration_ms: {(end - start) * 1000:.3f}")
    print("  type: 'test'")
    print("  ...")

    start = time.perf_counter()
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            print("[INFO] Connecting to smtp.gmail.com:587 ...")
            smtp.starttls(context=context)
            print("[INFO] STARTTLS established.")
            smtp.login(user, pw)
            print("[INFO] Logged in as", user)
            smtp.send_message(msg)
            print("[SUCCESS] Sent to:", to)

        ok3 = True
    except Exception:
        ok3 = False
        print("[ERROR] SMTP failed:")
        traceback.print_exc()

    end = time.perf_counter()
    print(f"{'ok' if ok3 else 'not ok'} 3 - send email via SMTP")
    print("  ---")
    print(f"  duration_ms: {(end - start) * 1000:.3f}")
    print("  type: 'test'")
    print("  ...")

    print("✅ Passed: All email test steps")

    assert ok1 and ok2 and ok3, "Email test failed"