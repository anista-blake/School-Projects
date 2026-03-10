import pytest
import time
import io
import sys

class TestCounter:
    def __init__(self):
        self.passed = 0

    def pytest_runtest_logreport(self, report):
        if report.when == "call" and report.outcome == "passed":
            self.passed += 1

counter = TestCounter()
start_all = time.perf_counter()

output_buffer = io.StringIO()
original_stdout = sys.stdout
sys.stdout = output_buffer

try:
    pytest.main(["Starting_Flask/tests/account_test", "-s"], plugins=[counter])
finally:
    sys.stdout = original_stdout

content = output_buffer.getvalue()

replacements = {
    "ΓÜÖ∩╕Å": "⚙️",
    "Γ£à": "✅",
    "ΓåÆ": "→",
}

for wrong, correct in replacements.items():
    content = content.replace(wrong, correct)

file_path = "account_test_output.txt"
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

end_all = time.perf_counter()
total_duration = end_all - start_all

print("✅ Emoji replacements done!")
