#!/usr/bin/env python3
"""
Lightweight note search script for agy-company Obsidian Vault (01_Inbox).
Uses only Python standard library modules so it can run in any environment without venv or pip.
Extracts YAML frontmatter (id, aliases, tags, created, updated, link, summary) and outputs
concise note summaries to minimize LLM context consumption.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def extract_setting_from_agents_md(cwd: Path, label: str) -> Optional[str]:
    """
    Extract a directory path setting (such as 'Config Directory' or 'Vault Directory')
    from .company/AGENTS.md if present in the workspace.
    Matches lines like: - **Config Directory**: `.company/.config` or - **Vault Directory**: ./vault
    """
    agents_md = cwd / ".company" / "AGENTS.md"
    if not agents_md.exists() or not agents_md.is_file():
        return None
    try:
        content = agents_md.read_text(encoding="utf-8")
        # Match markdown bullet with optional backticks or quotes around the path
        pattern = rf"^\s*-\s*\*\*\s*{re.escape(label)}\s*\*\*\s*:\s*[`'\"]?([^`'\"\r\n]+)[`'\"]?"
        match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
        if match:
            val = match.group(1).strip()
            # Ignore unexpanded template placeholders like {{CONFIG_DIR}}
            if val and not val.startswith("{{"):
                return val
    except Exception:
        pass
    return None


def resolve_config_dir(
    explicit_config_dir: Optional[str] = None,
    cwd: Optional[Path] = None
) -> Path:
    """
    Resolve the configuration directory using the unified precedence order:
    1. Explicit --config-dir CLI argument
    2. CONFIG_DIR or CONFIG_PATH environment variable
    3. 'Config Directory' recorded in <cwd>/.company/AGENTS.md
    4. Hidden '.company/.config' directory in <cwd> (if it exists)
    5. Default '<cwd>/config' in current working directory
    """
    base_cwd = (cwd or Path.cwd()).resolve()

    # 1. Explicit CLI argument
    if explicit_config_dir:
        candidate = Path(explicit_config_dir).expanduser()
        return candidate.resolve() if candidate.is_absolute() else (base_cwd / candidate).resolve()

    # 2. Environment variables
    env_cfg = os.getenv("CONFIG_DIR") or os.getenv("CONFIG_PATH")
    if env_cfg:
        candidate = Path(env_cfg).expanduser()
        return candidate.resolve() if candidate.is_absolute() else (base_cwd / candidate).resolve()

    # 3. Setting recorded in .company/AGENTS.md
    agents_cfg = extract_setting_from_agents_md(base_cwd, "Config Directory")
    if agents_cfg:
        candidate = Path(agents_cfg).expanduser()
        return candidate.resolve() if candidate.is_absolute() else (base_cwd / candidate).resolve()

    # 4. Hidden .company/.config directory (distinguished from department folders)
    hidden_company_cfg = base_cwd / ".company" / ".config"
    if hidden_company_cfg.exists() and hidden_company_cfg.is_dir():
        return hidden_company_cfg.resolve()

    # 5. Default project root ./config
    return (base_cwd / "config").resolve()


def resolve_vault_dir(
    explicit_vault_dir: Optional[str] = None,
    explicit_config_dir: Optional[str] = None,
    cwd: Optional[Path] = None
) -> Path:
    """
    Resolve the path to the Obsidian Vault directory using the unified precedence order:
    1. Explicit --vault-dir CLI argument
    2. OBSIDIAN_VAULT_PATH or VAULT_DIR environment variable
    3. 'vault_dir' defined in <resolved_config_dir>/config.json (or config.example.json)
    4. 'Vault Directory' recorded in <cwd>/.company/AGENTS.md
    5. Default '<cwd>/vault' in current working directory
    """
    base_cwd = (cwd or Path.cwd()).resolve()

    # 1. Check explicit CLI argument
    if explicit_vault_dir:
        candidate = Path(explicit_vault_dir).expanduser()
        return candidate.resolve() if candidate.is_absolute() else (base_cwd / candidate).resolve()

    # 2. Check environment variables
    env_vault = os.getenv("OBSIDIAN_VAULT_PATH") or os.getenv("VAULT_DIR")
    if env_vault:
        candidate = Path(env_vault).expanduser()
        return candidate.resolve() if candidate.is_absolute() else (base_cwd / candidate).resolve()

    # 3. Check config.json / config.example.json inside resolved config_dir
    config_dir = resolve_config_dir(explicit_config_dir=explicit_config_dir, cwd=base_cwd)
    for cfg_name in ("config.json", "config.example.json"):
        config_path = config_dir / cfg_name
        if config_path.exists() and config_path.is_file():
            try:
                config_data = json.loads(config_path.read_text(encoding="utf-8"))
                vault_dir_setting = config_data.get("vault_dir")
                if vault_dir_setting:
                    candidate = Path(vault_dir_setting).expanduser()
                    if not candidate.is_absolute():
                        # Always resolve relative vault_dir against workspace root (base_cwd)
                        candidate = (base_cwd / candidate).resolve()
                    else:
                        candidate = candidate.resolve()
                    return candidate
            except Exception:
                # Ignore malformed JSON and continue fallback resolution
                pass

    # 4. Check setting recorded in .company/AGENTS.md
    agents_vault = extract_setting_from_agents_md(base_cwd, "Vault Directory")
    if agents_vault:
        candidate = Path(agents_vault).expanduser()
        return candidate.resolve() if candidate.is_absolute() else (base_cwd / candidate).resolve()

    # 5. Final fallback: './vault' in current working directory
    return (base_cwd / "vault").resolve()


def strip_quotes(value: str) -> str:
    """
    Remove surrounding single or double quotes from a YAML scalar string.
    """
    val = value.strip()
    if len(val) >= 2 and ((val[0] == '"' and val[-1] == '"') or (val[0] == "'" and val[-1] == "'")):
        return val[1:-1]
    return val


def parse_simple_yaml(yaml_text: str) -> Dict[str, Any]:
    """
    Parse standard agy-company YAML frontmatter using only the Python standard library.
    Supports key-value scalars, inline lists (e.g. [a, b]), and indented block lists (- item).
    """
    result: Dict[str, Any] = {}
    current_key: Optional[str] = None

    for raw_line in yaml_text.splitlines():
        # Skip empty lines or full-line YAML comments
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        # Check if the line is a list item under the current key (e.g., '  - "item"')
        list_match = re.match(r"^\s*-\s+(.*)$", raw_line)
        if list_match and current_key is not None:
            item_val = strip_quotes(list_match.group(1))
            if not isinstance(result.get(current_key), list):
                result[current_key] = []
            if item_val != "":
                result[current_key].append(item_val)
            continue

        # Check if the line is a top-level key: value pair
        kv_match = re.match(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$", raw_line)
        if kv_match:
            key = kv_match.group(1).strip()
            val_str = kv_match.group(2).strip()
            current_key = key

            # Case 1: Empty value means a block list or empty field follows on subsequent lines
            if val_str == "":
                result[key] = []
            # Case 2: Inline list syntax such as `link: []` or `tags: [a, b]`
            elif val_str.startswith("[") and val_str.endswith("]"):
                inner = val_str[1:-1].strip()
                if not inner:
                    result[key] = []
                else:
                    items = [strip_quotes(x) for x in inner.split(",") if strip_quotes(x)]
                    result[key] = items
            # Case 3: Standard scalar value
            else:
                result[key] = strip_quotes(val_str)

    return result


def extract_frontmatter_and_body(content: str) -> Tuple[Dict[str, Any], str]:
    """
    Split a Markdown file's content into its parsed YAML frontmatter dictionary and body string.
    """
    # Match YAML frontmatter block delimited by '---' at the beginning of the file
    pattern = r"^---\s*\r?\n(.*?)\r?\n---\s*(?:\r?\n(.*))?$"
    match = re.match(pattern, content, re.DOTALL)
    if not match:
        return {}, content

    yaml_block = match.group(1)
    body = match.group(2) or ""
    metadata = parse_simple_yaml(yaml_block)
    return metadata, body


def ensure_str_list(val: Any) -> List[str]:
    """
    Normalize a frontmatter field value into a list of non-empty strings.
    """
    if val is None:
        return []
    if isinstance(val, list):
        return [str(x).strip() for x in val if str(x).strip()]
    if isinstance(val, str):
        stripped = val.strip()
        return [stripped] if stripped else []
    return [str(val).strip()]


def extract_heading_title(body: str, fallback_stem: str) -> str:
    """
    Extract the first level-1 Markdown heading ('# Title') from the body,
    or fall back to the filename stem if no H1 heading exists.
    """
    for line in body.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback_stem


def normalize_date_prefix(date_str: str) -> str:
    """
    Extract the YYYY-MM-DD date prefix from a timestamp string like '2026-10-25-231720'.
    """
    match = re.match(r"^(\d{4}-\d{2}-\d{2})", str(date_str).strip())
    return match.group(1) if match else ""


def scan_notes(vault_dir: Path, department_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Scan vault/01_Inbox/ recursively and parse metadata and body for each Markdown note.
    """
    inbox_dir = vault_dir / "01_Inbox"
    if not inbox_dir.exists():
        return []

    notes: List[Dict[str, Any]] = []

    for md_file in inbox_dir.rglob("*.md"):
        # Ignore hidden files such as .gitkeep or .DS_Store
        if md_file.name.startswith("."):
            continue

        # Determine department from parent directory under 01_Inbox
        rel_to_inbox = md_file.relative_to(inbox_dir)
        dept = rel_to_inbox.parts[0] if len(rel_to_inbox.parts) > 1 else "general"

        # Apply department filter if specified
        if department_filter and dept.lower() != department_filter.lower():
            continue

        try:
            raw_content = md_file.read_text(encoding="utf-8")
        except Exception:
            continue

        meta, body = extract_frontmatter_and_body(raw_content)

        aliases = ensure_str_list(meta.get("aliases"))
        tags = ensure_str_list(meta.get("tags"))
        links = ensure_str_list(meta.get("link") or meta.get("links"))
        summary = ensure_str_list(meta.get("summary"))

        created_str = str(meta.get("created") or meta.get("id") or "")
        updated_str = str(meta.get("updated") or created_str)
        title = extract_heading_title(body, md_file.stem)

        # Normalize doc_type (defaults to 'undefined' if absent or empty)
        raw_doc_type = meta.get("doc_type")
        doc_type = str(raw_doc_type).strip().lower() if raw_doc_type else "undefined"
        if not doc_type:
            doc_type = "undefined"

        # Build a relative path from workspace root if possible, otherwise relative to vault_dir
        try:
            display_path = str(md_file.relative_to(Path.cwd()))
        except ValueError:
            display_path = f"vault/{md_file.relative_to(vault_dir)}"

        notes.append({
            "path": display_path,
            "filename": md_file.name,
            "stem": md_file.stem,
            "department": dept,
            "id": str(meta.get("id") or md_file.stem),
            "doc_type": doc_type,
            "title": title,
            "aliases": aliases,
            "tags": tags,
            "created": created_str,
            "updated": updated_str,
            "links": links,
            "summary": summary,
            "body": body,
        })

    # Sort descending by created timestamp or filename so newest notes appear first
    notes.sort(key=lambda n: (n["created"] or n["filename"]), reverse=True)
    return notes


def matches_filters(
    note: Dict[str, Any],
    keywords: List[str],
    use_or: bool = False,
    fulltext: bool = False,
    tag_filter: Optional[str] = None,
    doc_type_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    missing_summary: bool = False,
    missing_type: bool = False,
    filename_filter: Optional[str] = None,
) -> bool:
    """
    Evaluate whether a parsed note satisfies all specified CLI search criteria.
    """
    # 0. Check --filename filter (case-insensitive substring match against filename)
    if filename_filter and filename_filter.strip():
        target_filename = filename_filter.strip().lower()
        if target_filename not in note["filename"].lower():
            return False

    # 1. Check --missing-summary filter
    has_summary = len(note["summary"]) > 0
    if missing_summary and has_summary:
        return False

    # 2. Check --missing-type filter (notes without a defined doc_type)
    is_type_undefined = note.get("doc_type", "undefined") == "undefined"
    if missing_type and not is_type_undefined:
        return False

    # 3. Check --type / doc_type filter (case-insensitive exact match)
    if doc_type_filter:
        target_doc_type = doc_type_filter.strip().lower()
        if note.get("doc_type", "undefined").lower() != target_doc_type:
            return False

    # 4. Check --tag filter (case-insensitive substring match against note tags)
    if tag_filter:
        tag_lower = tag_filter.lower()
        if not any(tag_lower in t.lower() for t in note["tags"]):
            return False

    # 5. Check --from and --to date range filters against created/updated date prefix (YYYY-MM-DD)
    if date_from or date_to:
        note_date = normalize_date_prefix(note["created"]) or normalize_date_prefix(note["updated"]) or normalize_date_prefix(note["filename"])
        if not note_date:
            return False
        if date_from and note_date < date_from:
            return False
        if date_to and note_date > date_to:
            return False

    # 6. Check keyword matching
    if not keywords:
        return True

    # Build searchable text target (metadata + filename by default; include body if --fulltext)
    searchable_parts = [
        note["filename"],
        note["title"],
        note.get("doc_type", ""),
        " ".join(note["aliases"]),
        " ".join(note["tags"]),
        " ".join(note["summary"]),
    ]
    if fulltext:
        searchable_parts.append(note["body"])

    haystack = "\n".join(searchable_parts).lower()

    if use_or:
        return any(kw.lower() in haystack for kw in keywords)
    else:
        return all(kw.lower() in haystack for kw in keywords)


def format_note_text(index: int, note: Dict[str, Any]) -> str:
    """
    Format a single note's metadata and summary for human/LLM-friendly terminal output.
    Includes bilingual doc_type labels (knowledge, proposal, discussion, undefined).
    """
    doc_type_labels = {
        "knowledge": "knowledge (知見)",
        "proposal": "proposal (提案)",
        "discussion": "discussion (議論)",
        "undefined": "undefined (未定義)",
    }
    raw_type = note.get("doc_type", "undefined").lower()
    type_display = doc_type_labels.get(raw_type, f"{raw_type} (カスタム)")

    lines = [f"[{index}] {note['path']}"]
    lines.append(f"  Title: {note['title']}")
    lines.append(f"  Type: {type_display}")
    if note["aliases"]:
        lines.append(f"  Aliases: {', '.join(note['aliases'])}")
    if note["tags"]:
        lines.append(f"  Tags: {', '.join(note['tags'])}")
    if note["created"]:
        lines.append(f"  Created: {note['created']}")
    if note["links"]:
        lines.append(f"  Links: {', '.join(note['links'])}")

    if note["summary"]:
        lines.append("  Summary:")
        for item in note["summary"]:
            lines.append(f"    - {item}")
    else:
        lines.append("  Summary: [MISSING SUMMARY]")

    return "\n".join(lines)


def build_arg_parser() -> argparse.ArgumentParser:
    """
    Construct the CLI argument parser for search_notes.py.
    """
    parser = argparse.ArgumentParser(
        description="Search Obsidian Vault deliverable notes (01_Inbox) and output frontmatter summaries."
    )
    parser.add_argument(
        "keywords",
        nargs="*",
        help="Search keywords (matched against filename, title, aliases, tags, and summary by default).",
    )
    parser.add_argument(
        "-n",
        "--filename",
        dest="filename",
        type=str,
        default=None,
        help="Filter by note filename (case-insensitive substring match, with or without .md).",
    )
    parser.add_argument(
        "-f",
        "--fulltext",
        action="store_true",
        help="Also search inside the Markdown body text (output still shows only metadata and summary).",
    )
    parser.add_argument(
        "--or",
        dest="use_or",
        action="store_true",
        help="Use OR logic for multiple keywords instead of the default AND logic.",
    )
    parser.add_argument(
        "-t",
        "--type",
        dest="doc_type",
        type=str,
        default=None,
        help="Filter by document type (knowledge, proposal, discussion, or undefined).",
    )
    parser.add_argument(
        "--missing-type",
        action="store_true",
        help="Only list notes that do not have a defined 'doc_type' in their frontmatter (or are undefined).",
    )
    parser.add_argument(
        "--dept",
        type=str,
        default=None,
        help="Filter by department folder name under 01_Inbox (e.g., research, engineering, pm).",
    )
    parser.add_argument(
        "--tag",
        type=str,
        default=None,
        help="Filter by tag name (case-insensitive match).",
    )
    parser.add_argument(
        "--from",
        dest="date_from",
        type=str,
        default=None,
        help="Filter notes created on or after YYYY-MM-DD.",
    )
    parser.add_argument(
        "--to",
        dest="date_to",
        type=str,
        default=None,
        help="Filter notes created on or before YYYY-MM-DD.",
    )
    parser.add_argument(
        "--missing-summary",
        action="store_true",
        help="Only list notes that do not have a 'summary' field in their frontmatter.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Maximum number of matching notes to display (default: 20).",
    )
    parser.add_argument(
        "--json",
        dest="as_json",
        action="store_true",
        help="Output results as a JSON array (excludes full Markdown body).",
    )
    parser.add_argument(
        "--vault-dir",
        type=str,
        default=None,
        help="Explicit path to the Obsidian vault directory.",
    )
    parser.add_argument(
        "--config-dir",
        type=str,
        default=None,
        help="Explicit path to config directory (default: auto-resolved from env, .company/.config, or ./config).",
    )
    return parser


def main() -> int:
    """
    Main entry point for CLI execution.
    """
    parser = build_arg_parser()
    args = parser.parse_args()

    vault_dir = resolve_vault_dir(args.vault_dir, args.config_dir)
    all_notes = scan_notes(vault_dir, department_filter=args.dept)

    matched = [
        note
        for note in all_notes
        if matches_filters(
            note=note,
            keywords=args.keywords,
            use_or=args.use_or,
            fulltext=args.fulltext,
            tag_filter=args.tag,
            doc_type_filter=args.doc_type,
            date_from=args.date_from,
            date_to=args.date_to,
            missing_summary=args.missing_summary,
            missing_type=args.missing_type,
            filename_filter=args.filename,
        )
    ]

    total_matched = len(matched)
    limited = matched[: max(0, args.limit)]

    # Output JSON if requested
    if args.as_json:
        json_ready = [
            {k: v for k, v in n.items() if k != "body"}
            for n in limited
        ]
        print(json.dumps({
            "total_matched": total_matched,
            "shown": len(json_ready),
            "results": json_ready,
        }, ensure_ascii=False, indent=2))
        return 0

    # Output structured human/LLM text
    if total_matched == 0:
        print("No matching notes found.")
        return 0

    print(f"Found {total_matched} note(s) (showing {len(limited)}):")
    print()
    blocks = [format_note_text(idx + 1, note) for idx, note in enumerate(limited)]
    print("\n\n".join(blocks))
    return 0


if __name__ == "__main__":
    sys.exit(main())
