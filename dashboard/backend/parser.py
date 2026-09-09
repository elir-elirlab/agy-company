# Markdown parsing and file manipulation utilities for Obsidian Vault
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml
from pydantic import BaseModel


class TodoItem(BaseModel):
    """Represents a single TODO item parsed from daily notes."""
    line_number: int
    text: str
    completed: bool
    priority: Optional[str] = None


class DeliverableMeta(BaseModel):
    """Represents metadata extracted from a deliverable note's frontmatter."""
    id: Optional[str] = None
    aliases: Optional[List[str]] = None
    tags: List[str] = []
    created: Optional[str] = None
    updated: Optional[str] = None
    links: List[str] = []
    title: str = ""
    relative_path: str = ""
    department: str = "general"


def extract_frontmatter(content: str) -> tuple[Dict[str, Any], str]:
    """
    Extract YAML frontmatter and body text from markdown content.
    Returns a tuple of (metadata_dict, body_text).
    """
    # Regex to match YAML frontmatter enclosed between '---' at file start
    pattern = r"^---\s*\n(.*?)\n---\s*\n(.*)$"
    match = re.match(pattern, content, re.DOTALL)
    if match:
        yaml_content = match.group(1)
        body = match.group(2)
        try:
            metadata = yaml.safe_load(yaml_content) or {}
            return metadata, body
        except Exception:
            # Fallback if YAML is malformed
            return {}, content
    return {}, content


def parse_daily_todos(file_path: Path) -> List[TodoItem]:
    """
    Extract all '- [ ]' and '- [x]' TODO items from a daily note file.
    """
    if not file_path.exists():
        return []

    todos: List[TodoItem] = []
    lines = file_path.read_text(encoding="utf-8").splitlines()

    # Regex to match markdown task checkboxes
    task_regex = re.compile(r"^\s*-\s*\[([ xX])\]\s*(.*)$")

    for idx, line in enumerate(lines):
        match = task_regex.match(line)
        if match:
            status_char = match.group(1)
            task_text = match.group(2)
            is_completed = (status_char.lower() == "x")

            # Extract optional priority if formatted like: 'Task text | Priority: High'
            priority = None
            if "優先度:" in task_text or "Priority:" in task_text:
                parts = re.split(r"\|", task_text)
                for part in parts[1:]:
                    if "優先度" in part or "Priority" in part:
                        priority = part.split(":")[-1].strip()

            todos.append(TodoItem(
                line_number=idx + 1,
                text=task_text,
                completed=is_completed,
                priority=priority
            ))

    return todos


def toggle_daily_todo(file_path: Path, line_number: int) -> bool:
    """
    Toggle a TODO checkbox at the specified 1-indexed line number.
    Returns True if successfully toggled, False otherwise.
    """
    if not file_path.exists():
        return False

    lines = file_path.read_text(encoding="utf-8").splitlines()
    target_idx = line_number - 1

    if target_idx < 0 or target_idx >= len(lines):
        return False

    line = lines[target_idx]

    # Toggle from unchecked to checked
    if re.search(r"^\s*-\s*\[\s*\]", line):
        lines[target_idx] = re.sub(r"^(\s*-\s*)\[\s*\]", r"\1[x]", line)
    # Toggle from checked to unchecked
    elif re.search(r"^\s*-\s*\[[xX]\]", line):
        lines[target_idx] = re.sub(r"^(\s*-\s*)\[[xX]\]", r"\1[ ]", line)
    else:
        return False

    # Save back to file with newline preservation
    file_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return True


def get_inbox_deliverables(vault_path: Path) -> List[DeliverableMeta]:
    """
    Scan '01_Inbox' recursively for all deliverable markdown notes.
    """
    inbox_dir = vault_path / "01_Inbox"
    if not inbox_dir.exists():
        return []

    deliverables: List[DeliverableMeta] = []

    for file in inbox_dir.rglob("*.md"):
        if file.name.startswith("."):
            continue

        content = file.read_text(encoding="utf-8")
        meta, body = extract_frontmatter(content)

        # Determine department based on parent folder or tags
        department = "general"
        if file.parent != inbox_dir:
            department = file.parent.name
        elif "tags" in meta and isinstance(meta["tags"], list) and len(meta["tags"]) > 0:
            department = meta["tags"][0]

        # Extract title: either from first # heading or filename
        title = file.stem
        for line in body.splitlines():
            if line.startswith("# "):
                title = line[2:].strip()
                break

        # Normalize links
        raw_links = meta.get("link") or meta.get("links") or []
        if isinstance(raw_links, str):
            raw_links = [raw_links]

        deliverables.append(DeliverableMeta(
            id=str(meta.get("id", file.stem)),
            aliases=meta.get("aliases", []),
            tags=meta.get("tags", []),
            created=str(meta.get("created", "")),
            updated=str(meta.get("updated", "")),
            links=raw_links,
            title=title,
            relative_path=str(file.relative_to(vault_path)),
            department=department
        ))

    # Sort descending by created or filename
    deliverables.sort(key=lambda d: d.created or d.relative_path, reverse=True)
    return deliverables


def create_quick_inbox_note(vault_path: Path, title: str, content: str, department: str = "general") -> Path:
    """
    Create a new quick note in '01_Inbox/' following the timestamped naming standard.
    """
    inbox_dir = vault_path / "01_Inbox"
    if department != "general":
        target_dir = inbox_dir / department
    else:
        target_dir = inbox_dir

    target_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now()
    timestamp_str = now.strftime("%Y-%m-%d-%H%M%S")
    safe_title = re.sub(r'[^\w\-\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]', '-', title).strip("-")
    filename = f"{timestamp_str}-{safe_title}.md"
    file_path = target_dir / filename

    # Build standardized frontmatter
    frontmatter = f"""---
id: {timestamp_str}
aliases:
tags:
  - {department}
  - quick-capture
created: {timestamp_str}
updated: {timestamp_str}
link: []
---

# {title}

{content}
"""
    file_path.write_text(frontmatter, encoding="utf-8")
    return file_path
