#!/usr/bin/env python3
"""
Unit tests for search_notes.py.
Written using Python's built-in unittest module so it can be executed both via
standard `python3 -m unittest` (zero external dependencies) and `pytest` in CI.
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

# Add the parent scripts/ directory to sys.path so search_notes can be imported directly
SCRIPT_DIR = Path(__file__).resolve().parent.parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import search_notes  # noqa: E402


class TestSearchNotes(unittest.TestCase):
    """Test suite covering YAML frontmatter parsing, filtering, and CLI execution of search_notes.py."""

    def setUp(self) -> None:
        """Create a temporary Obsidian Vault directory structure with sample notes before each test."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.vault_dir = Path(self.temp_dir.name) / "vault"

        # Create department subdirectories under 01_Inbox
        self.research_dir = self.vault_dir / "01_Inbox" / "research"
        self.eng_dir = self.vault_dir / "01_Inbox" / "engineering"
        self.research_dir.mkdir(parents=True)
        self.eng_dir.mkdir(parents=True)

        # Note 1: Research note with complete frontmatter and summary (type: knowledge)
        note1_content = """---
id: 2026-10-20-100000
doc_type: knowledge
aliases:
  - "VectorDB Survey"
  - "ベクトルDB比較"
tags:
  - リサーチ
  - VectorDB
  - Qdrant
created: 2026-10-20-100000
updated: 2026-10-20-120000
link:
  - "[[2026-10-20]]"
summary:
  - "[Topic] Optimization of vector DB latency and resource usage"
  - "[Key Takeaway] Qdrant offers the best memory efficiency for under 10M vectors"
  - "[References] Detailed benchmark script in scripts/benchmark.py"
---

# Vector Database Performance Comparison

Detailed benchmark results comparing Qdrant, Milvus, and Weaviate in local Docker environments.
UniqueBodyKeywordAlpha is present only in the body of Note 1.
"""
        (self.research_dir / "2026-10-20-100000-VectorDB-Comparison.md").write_text(
            note1_content, encoding="utf-8"
        )

        # Note 2: Engineering note with complete frontmatter and summary (type: proposal)
        note2_content = """---
id: 2026-10-25-153000
doc_type: proposal
aliases:
  - "Auth Architecture"
tags:
  - 開発
  - Security
  - JWT
created: 2026-10-25-153000
updated: 2026-10-25-160000
link:
  - "[[2026-10-25]]"
summary:
  - "[Proposal] Implement OAuth2 PKCE flow for CLI and SPA clients"
  - "[Summary & Impact] Reduces token leakage risks with short-lived JWT (15 min)"
  - "[Status & Deadline] Awaiting review / Needed by 11/10"
---

# Authentication Architecture Specification

Specification for JWT rotation and OAuth2 PKCE implementation.
"""
        (self.eng_dir / "2026-10-25-153000-Auth-Architecture.md").write_text(
            note2_content, encoding="utf-8"
        )

        # Note 3: Legacy note WITHOUT a summary field (for testing --missing-summary)
        note3_content = """---
id: 2026-10-10-090000
aliases:
  - "Legacy Note"
tags:
  - リサーチ
  - Legacy
created: 2026-10-10-090000
updated: 2026-10-10-090000
link: []
---

# Old Research Memo Without Summary

This note was created before the summary frontmatter standard was introduced.
"""
        (self.research_dir / "2026-10-10-090000-Legacy-Memo.md").write_text(
            note3_content, encoding="utf-8"
        )

    def tearDown(self) -> None:
        """Clean up the temporary directory after each test."""
        self.temp_dir.cleanup()

    def test_extract_frontmatter_and_body(self) -> None:
        """Verify that YAML frontmatter fields (including block lists and inline lists) parse accurately."""
        sample_md = """---
id: 2026-11-01-120000
aliases:
  - "Alias One"
  - 'Alias Two'
tags: [開発, Python]
summary:
  - "Point 1"
  - "Point 2"
---

# Sample Heading
Body text here.
"""
        meta, body = search_notes.extract_frontmatter_and_body(sample_md)
        self.assertEqual(meta["id"], "2026-11-01-120000")
        self.assertEqual(meta["aliases"], ["Alias One", "Alias Two"])
        self.assertEqual(meta["tags"], ["開発", "Python"])
        self.assertEqual(meta["summary"], ["Point 1", "Point 2"])
        self.assertIn("# Sample Heading", body)

    def test_scan_notes_and_sorting(self) -> None:
        """Verify that scan_notes finds all markdown files in 01_Inbox and sorts newest first."""
        notes = search_notes.scan_notes(self.vault_dir)
        self.assertEqual(len(notes), 3)
        # Newest note (2026-10-25) should be first, oldest (2026-10-10) should be last
        self.assertEqual(notes[0]["id"], "2026-10-25-153000")
        self.assertEqual(notes[1]["id"], "2026-10-20-100000")
        self.assertEqual(notes[2]["id"], "2026-10-10-090000")

    def test_keyword_matching_and_vs_or(self) -> None:
        """Verify default AND keyword matching and --or keyword matching against metadata."""
        notes = search_notes.scan_notes(self.vault_dir)

        # AND search: both "Qdrant" and "memory" appear in Note 1's metadata/summary
        matched_and = [
            n for n in notes
            if search_notes.matches_filters(
                n, keywords=["Qdrant", "memory"], use_or=False, fulltext=False,
                tag_filter=None, date_from=None, date_to=None, missing_summary=False
            )
        ]
        self.assertEqual(len(matched_and), 1)
        self.assertEqual(matched_and[0]["id"], "2026-10-20-100000")

        # AND search with keywords across different notes should return 0 matches
        matched_cross_and = [
            n for n in notes
            if search_notes.matches_filters(
                n, keywords=["Qdrant", "JWT"], use_or=False, fulltext=False,
                tag_filter=None, date_from=None, date_to=None, missing_summary=False
            )
        ]
        self.assertEqual(len(matched_cross_and), 0)

        # OR search with ["Qdrant", "JWT"] should return both Note 1 and Note 2
        matched_or = [
            n for n in notes
            if search_notes.matches_filters(
                n, keywords=["Qdrant", "JWT"], use_or=True, fulltext=False,
                tag_filter=None, date_from=None, date_to=None, missing_summary=False
            )
        ]
        self.assertEqual(len(matched_or), 2)

    def test_fulltext_search_mode(self) -> None:
        """Verify that body-only keywords are ignored by default and matched when fulltext=True."""
        notes = search_notes.scan_notes(self.vault_dir)

        # Default metadata-only search should NOT match "UniqueBodyKeywordAlpha"
        meta_only = [
            n for n in notes
            if search_notes.matches_filters(
                n, keywords=["UniqueBodyKeywordAlpha"], use_or=False, fulltext=False,
                tag_filter=None, date_from=None, date_to=None, missing_summary=False
            )
        ]
        self.assertEqual(len(meta_only), 0)

        # Fulltext search SHOULD match Note 1
        fulltext_matches = [
            n for n in notes
            if search_notes.matches_filters(
                n, keywords=["UniqueBodyKeywordAlpha"], use_or=False, fulltext=True,
                tag_filter=None, date_from=None, date_to=None, missing_summary=False
            )
        ]
        self.assertEqual(len(fulltext_matches), 1)
        self.assertEqual(fulltext_matches[0]["id"], "2026-10-20-100000")

    def test_department_tag_and_date_filters(self) -> None:
        """Verify --dept, --tag, --from, and --to filtering behavior."""
        # Department filter: engineering only
        eng_notes = search_notes.scan_notes(self.vault_dir, department_filter="engineering")
        self.assertEqual(len(eng_notes), 1)
        self.assertEqual(eng_notes[0]["id"], "2026-10-25-153000")

        all_notes = search_notes.scan_notes(self.vault_dir)

        # Tag filter: "VectorDB"
        tag_matches = [
            n for n in all_notes
            if search_notes.matches_filters(
                n, keywords=[], use_or=False, fulltext=False,
                tag_filter="vectordb", date_from=None, date_to=None, missing_summary=False
            )
        ]
        self.assertEqual(len(tag_matches), 1)
        self.assertEqual(tag_matches[0]["id"], "2026-10-20-100000")

        # Date range filter: 2026-10-15 to 2026-10-22 (should only match Note 1 from 2026-10-20)
        date_matches = [
            n for n in all_notes
            if search_notes.matches_filters(
                n, keywords=[], use_or=False, fulltext=False,
                tag_filter=None, date_from="2026-10-15", date_to="2026-10-22", missing_summary=False
            )
        ]
        self.assertEqual(len(date_matches), 1)
        self.assertEqual(date_matches[0]["id"], "2026-10-20-100000")

    def test_missing_summary_filter(self) -> None:
        """Verify that --missing-summary returns only notes without a summary field."""
        all_notes = search_notes.scan_notes(self.vault_dir)
        missing = [
            n for n in all_notes
            if search_notes.matches_filters(
                n, keywords=[], use_or=False, fulltext=False,
                tag_filter=None, date_from=None, date_to=None, missing_summary=True
            )
        ]
        self.assertEqual(len(missing), 1)
        self.assertEqual(missing[0]["id"], "2026-10-10-090000")

    def test_doc_type_filters(self) -> None:
        """Verify filtering by --type (knowledge, proposal) and --missing-type (undefined)."""
        all_notes = search_notes.scan_notes(self.vault_dir)

        # 1. Filter by doc_type: knowledge
        knowledge_notes = [
            n for n in all_notes
            if search_notes.matches_filters(
                n, keywords=[], doc_type_filter="knowledge"
            )
        ]
        self.assertEqual(len(knowledge_notes), 1)
        self.assertEqual(knowledge_notes[0]["id"], "2026-10-20-100000")
        self.assertEqual(knowledge_notes[0]["doc_type"], "knowledge")

        # 2. Filter by doc_type: proposal
        proposal_notes = [
            n for n in all_notes
            if search_notes.matches_filters(
                n, keywords=[], doc_type_filter="proposal"
            )
        ]
        self.assertEqual(len(proposal_notes), 1)
        self.assertEqual(proposal_notes[0]["id"], "2026-10-25-153000")
        self.assertEqual(proposal_notes[0]["doc_type"], "proposal")

        # 3. Filter by missing_type (Note 3 lacks doc_type, so it defaults to 'undefined')
        missing_type_notes = [
            n for n in all_notes
            if search_notes.matches_filters(
                n, keywords=[], missing_type=True
            )
        ]
        self.assertEqual(len(missing_type_notes), 1)
        self.assertEqual(missing_type_notes[0]["id"], "2026-10-10-090000")
        self.assertEqual(missing_type_notes[0]["doc_type"], "undefined")

    def test_filename_filter(self) -> None:
        """Verify case-insensitive substring filename filtering (with or without .md) via function and CLI."""
        all_notes = search_notes.scan_notes(self.vault_dir)

        # 1. Partial match without .md (case-insensitive)
        matches_no_ext = [
            n for n in all_notes
            if search_notes.matches_filters(
                n, keywords=[], filename_filter="vectordb-comparison"
            )
        ]
        self.assertEqual(len(matches_no_ext), 1)
        self.assertEqual(matches_no_ext[0]["id"], "2026-10-20-100000")

        # 2. Partial match with .md (case-insensitive)
        matches_with_ext = [
            n for n in all_notes
            if search_notes.matches_filters(
                n, keywords=[], filename_filter="auth-architecture.md"
            )
        ]
        self.assertEqual(len(matches_with_ext), 1)
        self.assertEqual(matches_with_ext[0]["id"], "2026-10-25-153000")

        # 3. Metadata-only terms not present in the filename should NOT match
        matches_non_filename = [
            n for n in all_notes
            if search_notes.matches_filters(
                n, keywords=[], filename_filter="Qdrant"
            )
        ]
        self.assertEqual(len(matches_non_filename), 0)

        # 4. End-to-end CLI execution with -n / --filename and --json
        script_file = SCRIPT_DIR / "search_notes.py"
        cmd = [
            sys.executable,
            str(script_file),
            "-n",
            "Legacy-Memo",
            "--vault-dir",
            str(self.vault_dir),
            "--json",
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
        payload = json.loads(proc.stdout)
        self.assertEqual(payload["total_matched"], 1)
        self.assertEqual(payload["results"][0]["id"], "2026-10-10-090000")
        self.assertTrue(payload["results"][0]["path"].endswith("2026-10-10-090000-Legacy-Memo.md"))

    def test_cli_json_and_text_output(self) -> None:
        """Verify end-to-end CLI execution with --json and standard text output including doc_type."""
        script_file = SCRIPT_DIR / "search_notes.py"

        # 1. Test --json output (ensuring doc_type is included in JSON payload)
        cmd_json = [
            sys.executable,
            str(script_file),
            "Qdrant",
            "--vault-dir",
            str(self.vault_dir),
            "--json",
        ]
        proc_json = subprocess.run(cmd_json, capture_output=True, text=True, check=True)
        payload = json.loads(proc_json.stdout)
        self.assertEqual(payload["total_matched"], 1)
        self.assertEqual(payload["results"][0]["id"], "2026-10-20-100000")
        self.assertEqual(payload["results"][0]["doc_type"], "knowledge")
        self.assertNotIn("body", payload["results"][0])
        self.assertEqual(len(payload["results"][0]["summary"]), 3)

        # 2. Test standard text output (ensuring doc_type display and summary output)
        cmd_text = [
            sys.executable,
            str(script_file),
            "UniqueBodyKeywordAlpha",
            "--fulltext",
            "--vault-dir",
            str(self.vault_dir),
        ]
        proc_text = subprocess.run(cmd_text, capture_output=True, text=True, check=True)
        self.assertIn("Found 1 note(s)", proc_text.stdout)
        self.assertIn("Type: knowledge (知見)", proc_text.stdout)
        self.assertIn("Qdrant offers the best memory efficiency", proc_text.stdout)
        self.assertNotIn("UniqueBodyKeywordAlpha", proc_text.stdout)

    def test_resolve_config_and_vault_precedence(self) -> None:
        """Verify unified precedence for config_dir and vault_dir resolution."""
        with tempfile.TemporaryDirectory() as tmp_root:
            workspace = Path(tmp_root).resolve()

            # Ensure clean environment variables during test execution
            with patch.dict(os.environ, {}, clear=True):
                # 1. Default fallback: <cwd>/config and <cwd>/vault
                default_cfg = search_notes.resolve_config_dir(cwd=workspace)
                default_vault = search_notes.resolve_vault_dir(cwd=workspace)
                self.assertEqual(default_cfg, workspace / "config")
                self.assertEqual(default_vault, workspace / "vault")

                # 2. Hidden .company/.config directory precedence
                company_dir = workspace / ".company"
                hidden_cfg_dir = company_dir / ".config"
                hidden_cfg_dir.mkdir(parents=True)
                hidden_cfg_file = hidden_cfg_dir / "config.json"
                hidden_cfg_file.write_text(
                    json.dumps({"vault_dir": "custom_vault"}),
                    encoding="utf-8"
                )

                resolved_cfg = search_notes.resolve_config_dir(cwd=workspace)
                self.assertEqual(resolved_cfg, hidden_cfg_dir)

                resolved_vault = search_notes.resolve_vault_dir(cwd=workspace)
                self.assertEqual(resolved_vault, workspace / "custom_vault")

                # 3. Setting recorded in .company/AGENTS.md takes precedence over hidden .config
                # First verify that unexpanded template placeholders like {{CONFIG_DIR}} are ignored
                agents_md_file = company_dir / "AGENTS.md"
                agents_md_file.write_text(
                    "- **Config Directory**: `{{CONFIG_DIR}}`\n- **Vault Directory**: `{{VAULT_DIR}}`\n",
                    encoding="utf-8"
                )
                self.assertIsNone(search_notes.extract_setting_from_agents_md(workspace, "Config Directory"))
                self.assertIsNone(search_notes.extract_setting_from_agents_md(workspace, "Vault Directory"))

                # Write valid custom paths in AGENTS.md
                agents_md_file.write_text(
                    "- **Config Directory**: `custom_cfg`\n- **Vault Directory**: `agents_vault`\n",
                    encoding="utf-8"
                )
                self.assertEqual(
                    search_notes.extract_setting_from_agents_md(workspace, "Config Directory"),
                    "custom_cfg"
                )
                self.assertEqual(
                    search_notes.extract_setting_from_agents_md(workspace, "Vault Directory"),
                    "agents_vault"
                )
                self.assertEqual(
                    search_notes.resolve_config_dir(cwd=workspace),
                    workspace / "custom_cfg"
                )
                # When AGENTS.md specifies Vault Directory, resolve_vault_dir should pick it up
                self.assertEqual(
                    search_notes.resolve_vault_dir(cwd=workspace),
                    workspace / "agents_vault"
                )

                # 4. Explicit arguments take highest precedence
                explicit_cfg = search_notes.resolve_config_dir(
                    explicit_config_dir="explicit_cfg", cwd=workspace
                )
                self.assertEqual(explicit_cfg, workspace / "explicit_cfg")

                explicit_vault = search_notes.resolve_vault_dir(
                    explicit_vault_dir="explicit_vault", cwd=workspace
                )
                self.assertEqual(explicit_vault, workspace / "explicit_vault")


if __name__ == "__main__":
    unittest.main()
