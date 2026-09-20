# FastAPI application for agy-company dashboard backend
import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .parser import (
    parse_daily_todos,
    toggle_daily_todo,
    get_inbox_deliverables,
    create_quick_inbox_note,
    extract_frontmatter,
    get_current_datetime,
    TodoItem,
    DeliverableMeta
)

# Initialize FastAPI application
app = FastAPI(title="agy-company Dashboard API", version="1.0.0")

# Enable CORS for local Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base project root path resolution (three levels above dashboard/backend/main.py)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Configurable config directory (default: project root config/)
CONFIG_DIR = Path(os.getenv("CONFIG_DIR", PROJECT_ROOT / "config"))


def load_common_config() -> Dict[str, Any]:
    """
    Load common application configuration from config/config.json.
    Returns default settings dictionary if file is absent or invalid.
    """
    config_file = CONFIG_DIR / "config.json"
    if config_file.exists() and config_file.is_file():
        try:
            return json.loads(config_file.read_text(encoding="utf-8"))
        except Exception:
            # Fallback to empty dictionary on JSON syntax or file read error
            return {}
    return {}


COMMON_CONFIG = load_common_config()

# Configurable vault path with precedence:
# 1. VAULT_DIR environment variable
# 2. vault_dir specified in config/config.json
# 3. Default fallback: PROJECT_ROOT / "vault"
raw_vault = os.getenv("VAULT_DIR") or COMMON_CONFIG.get("vault_dir", "vault")
vault_candidate = Path(raw_vault)
if not vault_candidate.is_absolute():
    # Resolve relative path against PROJECT_ROOT for consistent directory navigation
    VAULT_DIR = (PROJECT_ROOT / vault_candidate).resolve()
else:
    VAULT_DIR = vault_candidate.resolve()


class ToggleTodoRequest(BaseModel):
    """Request payload for toggling a TODO status."""
    relative_path: str
    line_number: int


class QuickNoteRequest(BaseModel):
    """Request payload for creating a quick note."""
    title: str
    content: str
    department: str = "general"


class WebSocketManager:
    """Manages active WebSocket connections to broadcast file updates."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


ws_manager = WebSocketManager()


def get_today_daily_path() -> Path:
    """Return the Path object for today's daily note, respecting configured timezone."""
    # Compute today's date formatted as YYYY-MM-DD using timezone-aware current time
    today_str = get_current_datetime().strftime("%Y-%m-%d")
    return VAULT_DIR / "02_Daily" / f"{today_str}.md"


@app.get("/api/status")
def get_status():
    """
    Get dashboard summary status: daily task completion and deliverable count.
    """
    # Use timezone-aware date string for today
    today_str = get_current_datetime().strftime("%Y-%m-%d")
    daily_file = get_today_daily_path()
    todos = parse_daily_todos(daily_file) if daily_file.exists() else []

    completed_count = sum(1 for t in todos if t.completed)
    total_count = len(todos)
    deliverables = get_inbox_deliverables(VAULT_DIR)

    # Detect active departments from 01_Inbox subdirectories
    inbox_dir = VAULT_DIR / "01_Inbox"
    departments = []
    if inbox_dir.exists():
        departments = [d.name for d in inbox_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]

    return {
        "today": today_str,
        "has_daily_note": daily_file.exists(),
        "todos": {
            "total": total_count,
            "completed": completed_count,
            "completion_rate": round(completed_count / total_count * 100) if total_count > 0 else 0
        },
        "deliverables_count": len(deliverables),
        "departments": departments
    }


# Default organization and department fallbacks if JSON configuration files are missing or incomplete
DEFAULT_ORG_JA = {
    "owner": {"title": "オーナー (Owner)", "role": "事業推進・意思決定・統括"},
    "secretary": {"title": "秘書室 (Executive Secretary)", "role": "窓口対応・タスク管理・壁打ち・部署への作業委譲", "permanent_badge": "常設・専属窓口"},
    "departments": {
        "research": {"name": "リサーチ部門 (Research)", "role": "市場調査・競合分析・技術サーベイ"},
        "engineering": {"name": "開発部門 (Engineering)", "role": "アーキテクチャ設計・技術仕様・プロトタイプ"},
        "pm": {"name": "PM部門 (PM Office)", "role": "プロジェクト進捗・マイルストーン・タスクチケット"},
        "marketing": {"name": "マーケティング部門 (Marketing)", "role": "コンテンツ企画・SNS・プロモーション"},
        "finance": {"name": "経理部門 (Finance)", "role": "請求書・経費管理・収支記録"},
        "sales": {"name": "営業部門 (Sales)", "role": "クライアント管理・提案書・商談メモ"},
        "creative": {"name": "クリエイティブ部門 (Creative)", "role": "デザイン方針・ブランドガイド・UI/UX"},
        "hr": {"name": "人事部門 (HR)", "role": "採用管理・チーム編成・オンボーディング"},
    }
}

DEFAULT_ORG_EN = {
    "owner": {"title": "Owner", "role": "Business Strategy, Decisions & Oversight"},
    "secretary": {"title": "Executive Secretary", "role": "Concierge, Task Management, Brainstorming & Delegation", "permanent_badge": "Permanent Interface"},
    "departments": {
        "research": {"name": "Research Department", "role": "Market research, competitor analysis & tech survey"},
        "engineering": {"name": "Engineering Department", "role": "Architecture design, technical specs & prototyping"},
        "pm": {"name": "PM Office", "role": "Project progress, milestones & task ticketing"},
        "marketing": {"name": "Marketing Department", "role": "Content planning, social media & promotions"},
        "finance": {"name": "Finance Department", "role": "Invoicing, expense tracking & financial records"},
        "sales": {"name": "Sales Department", "role": "Client relations, proposals & sales meetings"},
        "creative": {"name": "Creative Department", "role": "Design guidelines, brand identity & UI/UX"},
        "hr": {"name": "HR Department", "role": "Recruiting, team structuring & onboarding"},
    }
}


def load_locale_config(lang: str) -> Dict[str, Any]:
    """
    Load locale-specific department and org configuration from config/departments-{lang}.json.
    Falls back to embedded defaults if file is missing or invalid.
    """
    file_path = CONFIG_DIR / f"departments-{lang}.json"
    fallback = DEFAULT_ORG_JA if lang == "ja" else DEFAULT_ORG_EN
    if file_path.exists() and file_path.is_file():
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return data
        except Exception:
            # Fallback on JSON parse error
            pass
    return fallback


@app.get("/api/org")
def get_organization():
    """
    Get organization structure and department details for Org Chart visualization.
    Dynamically loads configuration from config/departments-ja.json and config/departments-en.json.
    """
    config_ja = load_locale_config("ja")
    config_en = load_locale_config("en")

    deliverables = get_inbox_deliverables(VAULT_DIR)
    inbox_dir = VAULT_DIR / "01_Inbox"

    # Count deliverables per department
    dept_counts: Dict[str, int] = {}
    for d in deliverables:
        dept_counts[d.department] = dept_counts.get(d.department, 0) + 1

    active_departments = []
    if inbox_dir.exists():
        for folder in sorted(inbox_dir.iterdir()):
            if folder.is_dir() and not folder.name.startswith("."):
                dept_id = folder.name

                # Retrieve Japanese metadata with fallback
                dept_ja = config_ja.get("departments", {}).get(dept_id, {})
                ja_name = dept_ja.get("name") or f"{dept_id.capitalize()} 部門"
                ja_role = dept_ja.get("role") or "専門業務の遂行と成果物の作成"

                # Retrieve English metadata with fallback to Japanese or capitalized name
                dept_en = config_en.get("departments", {}).get(dept_id, {})
                en_name = dept_en.get("name") or ja_name or f"{dept_id.capitalize()} Department"
                en_role = dept_en.get("role") or ja_role or "Specialized operational tasks and deliverables"

                active_departments.append({
                    "id": dept_id,
                    "name": ja_name,
                    "role": ja_role,
                    "translations": {
                        "ja": {"name": ja_name, "role": ja_role},
                        "en": {"name": en_name, "role": en_role}
                    },
                    "deliverables_count": dept_counts.get(dept_id, 0),
                    "path": f"01_Inbox/{dept_id}"
                })

    # Owner and Secretary definitions with bilingual translations
    owner_ja = config_ja.get("owner", DEFAULT_ORG_JA["owner"])
    owner_en = config_en.get("owner", DEFAULT_ORG_EN["owner"])
    secretary_ja = config_ja.get("secretary", DEFAULT_ORG_JA["secretary"])
    secretary_en = config_en.get("secretary", DEFAULT_ORG_EN["secretary"])

    return {
        "owner": {
            "title": owner_ja.get("title", "オーナー (Owner)"),
            "role": owner_ja.get("role", "事業推進・意思決定・統括"),
            "translations": {
                "ja": {
                    "title": owner_ja.get("title", "オーナー (Owner)"),
                    "role": owner_ja.get("role", "事業推進・意思決定・統括")
                },
                "en": {
                    "title": owner_en.get("title", "Owner"),
                    "role": owner_en.get("role", "Business Strategy, Decisions & Oversight")
                }
            }
        },
        "secretary": {
            "title": secretary_ja.get("title", "秘書室 (Executive Secretary)"),
            "role": secretary_ja.get("role", "窓口対応・タスク管理・壁打ち・部署への作業委譲"),
            "is_permanent": True,
            "translations": {
                "ja": {
                    "title": secretary_ja.get("title", "秘書室 (Executive Secretary)"),
                    "role": secretary_ja.get("role", "窓口対応・タスク管理・壁打ち・部署への作業委譲"),
                    "permanent_badge": secretary_ja.get("permanent_badge", "常設・専属窓口")
                },
                "en": {
                    "title": secretary_en.get("title", "Executive Secretary"),
                    "role": secretary_en.get("role", "Concierge, Task Management, Brainstorming & Delegation"),
                    "permanent_badge": secretary_en.get("permanent_badge", "Permanent Interface")
                }
            }
        },
        "departments": active_departments
    }


@app.get("/api/todos/today", response_model=List[TodoItem])
def get_today_todos():
    """
    Retrieve task items for today's daily note.
    """
    daily_file = get_today_daily_path()
    return parse_daily_todos(daily_file)


@app.post("/api/todos/toggle")
def toggle_todo(req: ToggleTodoRequest):
    """
    Toggle a TODO item checkbox state in a markdown file.
    """
    target_path = VAULT_DIR / req.relative_path
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Target markdown file not found")

    success = toggle_daily_todo(target_path, req.line_number)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to toggle TODO item")

    return {"status": "ok", "toggled": True}


@app.get("/api/inbox", response_model=List[DeliverableMeta])
def get_inbox():
    """
    List all deliverables and notes from 01_Inbox/.
    """
    return get_inbox_deliverables(VAULT_DIR)


@app.post("/api/inbox/quick")
def create_quick_note(req: QuickNoteRequest):
    """
    Quickly capture a note or deliverable into 01_Inbox/.
    """
    file_path = create_quick_inbox_note(
        vault_path=VAULT_DIR,
        title=req.title,
        content=req.content,
        department=req.department
    )
    return {
        "status": "created",
        "relative_path": str(file_path.relative_to(VAULT_DIR))
    }


@app.get("/api/file")
def get_file(path: str):
    """
    Fetch raw markdown content and metadata for a specific file.
    """
    target_path = VAULT_DIR / path
    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    content = target_path.read_text(encoding="utf-8")
    meta, body = extract_frontmatter(content)

    return {
        "path": path,
        "filename": target_path.name,
        "frontmatter": meta,
        "body": body,
        "raw": content
    }


@app.get("/api/daily/calendar")
def get_daily_calendar(year: int, month: int):
    """
    Get active daily note dates for a specific month and year.
    """
    if month < 1 or month > 12:
        raise HTTPException(status_code=422, detail="Month must be between 1 and 12")

    daily_dir = VAULT_DIR / "02_Daily"
    active_dates = []

    if daily_dir.exists():
        prefix = f"{year}-{month:02d}-"
        for filename in os.listdir(daily_dir):
            if filename.startswith(prefix) and filename.endswith(".md"):
                # Extract date part by stripping .md extension
                active_dates.append(filename[:-3])

    active_dates.sort()
    
    # Get timezone-consistent today's date
    today_str = get_current_datetime().strftime("%Y-%m-%d")

    return {
        "year": year,
        "month": month,
        "today": today_str,
        "active_dates": active_dates
    }


@app.get("/api/tree")
def get_tree():
    """
    Generate directory and file tree for 01_Inbox and 02_Daily.
    """
    def build_tree(directory: Path) -> List[Dict[str, Any]]:
        items = []
        if not directory.exists():
            return items

        for entry in sorted(directory.iterdir(), key=lambda p: (not p.is_dir(), p.name)):
            if entry.name.startswith("."):
                continue
            item = {
                "name": entry.name,
                "relative_path": str(entry.relative_to(VAULT_DIR)),
                "is_dir": entry.is_dir()
            }
            if entry.is_dir():
                item["children"] = build_tree(entry)
            items.append(item)
        return items

    return {
        "inbox": build_tree(VAULT_DIR / "01_Inbox"),
        "daily": build_tree(VAULT_DIR / "02_Daily")
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for live reloading and event broadcasting."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# Mount static production frontend build if available
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
