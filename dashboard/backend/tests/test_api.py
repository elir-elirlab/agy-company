# API tests for FastAPI backend using TestClient
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from dashboard.backend.main import app
import dashboard.backend.main as backend_main


@pytest.fixture
def client_with_vault(tmp_path: Path):
    """Fixture to configure FastAPI TestClient with an isolated test vault."""
    vault = tmp_path / "vault"
    inbox = vault / "01_Inbox" / "research"
    daily = vault / "02_Daily"
    inbox.mkdir(parents=True)
    daily.mkdir(parents=True)

    # Today's daily note using timezone-aware helper
    from dashboard.backend.parser import get_current_datetime
    today_str = get_current_datetime().strftime("%Y-%m-%d")
    daily_content = f"""# {today_str}

## High Priority
- [ ] Implement backend unit test
- [x] Design dashboard architecture
"""
    (daily / f"{today_str}.md").write_text(daily_content, encoding="utf-8")

    # Point backend to the temporary vault
    original_vault = backend_main.VAULT_DIR
    backend_main.VAULT_DIR = vault

    client = TestClient(app)
    yield client

    # Restore original vault path
    backend_main.VAULT_DIR = original_vault


def test_api_status(client_with_vault: TestClient):
    """Test /api/status endpoint returns task statistics and active departments."""
    response = client_with_vault.get("/api/status")
    assert response.status_code == 200
    data = response.json()

    assert data["has_daily_note"] is True
    assert data["todos"]["total"] == 2
    assert data["todos"]["completed"] == 1
    assert data["todos"]["completion_rate"] == 50
    assert "research" in data["departments"]


def test_api_todos_today(client_with_vault: TestClient):
    """Test /api/todos/today endpoint returns task items."""
    response = client_with_vault.get("/api/todos/today")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    assert items[0]["completed"] is False
    assert items[1]["completed"] is True


def test_api_toggle_todo(client_with_vault: TestClient):
    """Test /api/todos/toggle endpoint successfully updates the task state."""
    # Obtain current date string respecting configured timezone
    from dashboard.backend.parser import get_current_datetime
    today_str = get_current_datetime().strftime("%Y-%m-%d")

    # Get today's todos first
    get_res = client_with_vault.get("/api/todos/today")
    todos = get_res.json()
    target_line = todos[0]["line_number"]

    # Toggle the first todo
    payload = {
        "relative_path": f"02_Daily/{today_str}.md",
        "line_number": target_line
    }
    toggle_res = client_with_vault.post("/api/todos/toggle", json=payload)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["toggled"] is True

    # Check updated state
    re_get = client_with_vault.get("/api/todos/today")
    assert re_get.json()[0]["completed"] is True


def test_api_create_quick_note(client_with_vault: TestClient):
    """Test /api/inbox/quick endpoint creates note in 01_Inbox."""
    payload = {
        "title": "API Test Note",
        "content": "Testing quick capture API.",
        "department": "engineering"
    }
    res = client_with_vault.post("/api/inbox/quick", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "created"
    assert "01_Inbox/engineering" in res.json()["relative_path"]


def test_api_org(client_with_vault: TestClient):
    """Test /api/org endpoint returns owner, secretary, and department details."""
    res = client_with_vault.get("/api/org")
    assert res.status_code == 200
    data = res.json()

    assert "owner" in data
    assert "secretary" in data
    assert "departments" in data
    assert len(data["departments"]) >= 1
    assert data["departments"][0]["id"] == "research"
    assert data["departments"][0]["name"] == "リサーチ部門 (Research)"

