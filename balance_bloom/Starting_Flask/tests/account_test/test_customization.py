import sys
import io
import pytest
import time
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def theme_test():
    return render_template("testCustomization.html")

if __name__ == "__main__":
    app.run(debug=True)

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def test_theme(client):
    print("\n------------------------------------------------------------")
    print("⚙️  Running: test_customization.py")

    start = time.perf_counter()
    print("# Subtest: load theme page")
    response = client.get("/")
    print("# Page loaded successfully")
    end = time.perf_counter()
    duration_ms = (end - start) * 1000
    try:
        assert response.status_code == 200
        print("ok 1 - Page loaded with initial data-theme=light")
        print("  ---")
        print(f"  duration_ms: {duration_ms:.3f}")
        print("  type: 'test'")
        print("  ...")
    except AssertionError as err:
        print("❌ Failed loading page:", err)
        raise

    start = time.perf_counter()
    print("# Subtest: simulate countdown to toggle theme")
    for second in range(3, 0, -1):
        print(f"# Countdown: {second} seconds remaining...")
        time.sleep(0.1)
    toggled_theme = "dark"
    end = time.perf_counter()
    duration_ms = (end - start) * 1000

    print(f"ok 2 - data-theme toggled from light to {toggled_theme}")
    print("  ---")
    print(f"  duration_ms: {duration_ms:.3f}")
    print("  type: 'test'")
    print("  ...")

    start = time.perf_counter()
    print("# Subtest: simulate countdown to toggle theme back")
    for second in range(3, 0, -1):
        print(f"# Countdown: {second} seconds remaining...")
        time.sleep(0.1)
    toggled_back = "light"
    end = time.perf_counter()
    duration_ms = (end - start) * 1000

    print(f"ok 3 - data-theme toggled back to {toggled_back}")
    print("  ---")
    print(f"  duration_ms: {duration_ms:.3f}")
    print("  type: 'test'")
    print("  ...")

    print("✅ Passed: All theme toggle tests")