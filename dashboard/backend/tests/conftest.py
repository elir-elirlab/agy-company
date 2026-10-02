import sys
from pathlib import Path

# Ensure backend package and modules are discoverable regardless of execution directory
tests_dir = Path(__file__).resolve().parent
backend_dir = tests_dir.parent
# When running inside Docker (/app/backend/tests), /app is backend_dir.parent
# When running in repo root (dashboard/backend/tests), agy-company is repo_root
dashboard_dir = backend_dir.parent
repo_root = dashboard_dir.parent

for path in [repo_root, dashboard_dir, backend_dir.parent]:
    path_str = str(path)
    if path.exists() and path_str not in sys.path:
        sys.path.insert(0, path_str)
