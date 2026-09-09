# Unit tests for markdown parser and todo toggler
import pytest
from pathlib import Path
from dashboard.backend.parser import (
    parse_daily_todos,
    toggle_daily_todo,
    get_inbox_deliverables,
    create_quick_inbox_note,
    extract_frontmatter
)


@pytest.fixture
def sample_vault(tmp_path: Path):
    """Fixture providing a temporary Vault structure with sample markdown files."""
    vault = tmp_path / "vault"
    inbox = vault / "01_Inbox" / "research"
    daily = vault / "02_Daily"
    inbox.mkdir(parents=True)
    daily.mkdir(parents=True)

    # Sample daily note
    daily_content = """# 2026-09-08 (Tue)

> [!nav]
> ◀ 前日: [[2026-09-07]] | 翌日: 未作成 ▶

## High Priority
- [ ] Task 1: Write technical specification | Priority: High
- [x] Task 2: Review PR #12 | Priority: Normal

## Completed
- [x] Task 3: Morning standup
"""
    (daily / "2026-09-08.md").write_text(daily_content, encoding="utf-8")

    # Sample deliverable in 01_Inbox/research
    deliverable_content = """---
id: 2026-09-08-231720
aliases:
  - CompSurvey
tags:
  - リサーチ
  - CompetitiveAnalysis
created: 2026-09-08-231720
updated: 2026-09-08-231900
link:
  - "[[2026-09-07-010834-PreviousReport]]"
---

# Competitor Research Report

Executive summary of competitor survey findings.
"""
    (inbox / "2026-09-08-231720-Competitor-Research.md").write_text(deliverable_content, encoding="utf-8")

    return vault


def test_parse_daily_todos(sample_vault: Path):
    """Verify that daily TODO items are extracted correctly with completed statuses."""
    daily_file = sample_vault / "02_Daily" / "2026-09-08.md"
    todos = parse_daily_todos(daily_file)

    assert len(todos) == 3
    assert todos[0].completed is False
    assert "Task 1" in todos[0].text
    assert todos[0].priority == "High"

    assert todos[1].completed is True
    assert "Task 2" in todos[1].text

    assert todos[2].completed is True
    assert "Task 3" in todos[2].text


def test_toggle_daily_todo(sample_vault: Path):
    """Verify toggling a TODO checkbox updates the file directly."""
    daily_file = sample_vault / "02_Daily" / "2026-09-08.md"
    todos = parse_daily_todos(daily_file)

    # Line 7 is Task 1 (- [ ])
    line_num = todos[0].line_number
    assert todos[0].completed is False

    # Toggle to checked
    toggled = toggle_daily_todo(daily_file, line_num)
    assert toggled is True

    # Re-parse to verify persistence
    updated_todos = parse_daily_todos(daily_file)
    assert updated_todos[0].completed is True

    # Toggle back to unchecked
    toggled_back = toggle_daily_todo(daily_file, line_num)
    assert toggled_back is True
    reverted_todos = parse_daily_todos(daily_file)
    assert reverted_todos[0].completed is False


def test_get_inbox_deliverables(sample_vault: Path):
    """Verify inbox scanner extracts deliverables and frontmatter metadata correctly."""
    deliverables = get_inbox_deliverables(sample_vault)

    assert len(deliverables) == 1
    item = deliverables[0]
    assert item.id == "2026-09-08-231720"
    assert "リサーチ" in item.tags
    assert item.department == "research"
    assert "[[2026-09-07-010834-PreviousReport]]" in item.links
    assert item.title == "Competitor Research Report"


def test_create_quick_inbox_note(sample_vault: Path):
    """Verify creation of quick note in 01_Inbox with timestamp naming."""
    created_file = create_quick_inbox_note(
        vault_path=sample_vault,
        title="Quick Brainstorming",
        content="Testing note creation.",
        department="engineering"
    )

    assert created_file.exists()
    assert "Quick-Brainstorming.md" in created_file.name
    assert created_file.parent.name == "engineering"

    # Verify content and frontmatter
    meta, body = extract_frontmatter(created_file.read_text(encoding="utf-8"))
    assert "engineering" in meta.get("tags", [])
    assert "quick-capture" in meta.get("tags", [])
    assert "Testing note creation." in body
