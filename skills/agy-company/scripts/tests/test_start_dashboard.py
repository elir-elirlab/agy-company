#!/usr/bin/env python3
"""
Unit tests for start_dashboard.py.
Tests directory preparation, port resolution hierarchy, and CLI dry-run mode
using Python's built-in unittest module.
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

# Ensure the parent scripts directory is importable
SCRIPT_DIR = Path(__file__).resolve().parent.parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import start_dashboard  # noqa: E402


class TestStartDashboard(unittest.TestCase):
    """Test suite covering start_dashboard functionality."""

    def setUp(self) -> None:
        """Create a temporary directory before each test."""
        self.temp_dir = tempfile.TemporaryDirectory()

    def tearDown(self) -> None:
        """Clean up the temporary directory after each test."""
        self.temp_dir.cleanup()

    def test_prepare_host_directories(self) -> None:
        """
        Verify prepare_host_directories creates required vault subdirectories
        (01_Inbox, 02_Daily) and seeds config files from plugin_root/config.
        """
        vault_dir = Path(self.temp_dir.name) / "vault"
        config_dir = Path(self.temp_dir.name) / "config"
        plugin_root = start_dashboard.get_plugin_root()

        actions = start_dashboard.prepare_host_directories(
            config_dir=config_dir,
            vault_dir=vault_dir,
            plugin_root=plugin_root,
        )

        # 1. Verify vault subdirectories
        self.assertTrue(
            (vault_dir / "01_Inbox").is_dir(),
            "01_Inbox directory was not created",
        )
        self.assertTrue(
            (vault_dir / "02_Daily").is_dir(),
            "02_Daily directory was not created",
        )

        # 2. Verify seeded config files in config_dir
        expected_files = [
            "config.example.json",
            "config.json",
            "departments-ja.example.json",
            "departments-ja.json",
            "departments-en.example.json",
            "departments-en.json",
        ]
        for fname in expected_files:
            target_path = config_dir / fname
            self.assertTrue(
                target_path.is_file(),
                f"Missing expected seeded file: {fname}",
            )

        # 3. Verify logged action descriptions
        self.assertTrue(
            any("Created directory" in action for action in actions),
            "Expected 'Created directory' in actions log",
        )
        self.assertTrue(
            any("Copied template" in action for action in actions),
            "Expected 'Copied template' in actions log",
        )
        self.assertTrue(
            any("Initialized config" in action for action in actions),
            "Expected 'Initialized config' in actions log",
        )

    def test_port_resolution(self) -> None:
        """
        Verify dashboard port resolution follows the defined precedence:
        1. Explicit argument
        2. DASHBOARD_PORT environment variable
        3. dashboard_port in config.json
        4. Default port (18000)
        """
        config_dir = Path(self.temp_dir.name) / "config_port_test"
        config_dir.mkdir(parents=True, exist_ok=True)
        config_file = config_dir / "config.json"

        # 1. Default port (18000) when neither config nor env var is provided
        with patch.dict(os.environ, {}, clear=True):
            port = start_dashboard.resolve_dashboard_port(
                explicit_port=None,
                config_dir=config_dir,
            )
            self.assertEqual(port, 18000)

        # 2. dashboard_port configured in config.json (19000)
        config_file.write_text(
            json.dumps({"dashboard_port": 19000}),
            encoding="utf-8",
        )
        with patch.dict(os.environ, {}, clear=True):
            port = start_dashboard.resolve_dashboard_port(
                explicit_port=None,
                config_dir=config_dir,
            )
            self.assertEqual(port, 19000)

        # 3. DASHBOARD_PORT environment variable (19500) overrides config.json
        with patch.dict(os.environ, {"DASHBOARD_PORT": "19500"}, clear=True):
            port = start_dashboard.resolve_dashboard_port(
                explicit_port=None,
                config_dir=config_dir,
            )
            self.assertEqual(port, 19500)

        # 4. Explicit CLI argument (20000) takes top precedence
        with patch.dict(os.environ, {"DASHBOARD_PORT": "19500"}, clear=True):
            port = start_dashboard.resolve_dashboard_port(
                explicit_port=20000,
                config_dir=config_dir,
            )
            self.assertEqual(port, 20000)

    def test_cli_dry_run(self) -> None:
        """
        Verify CLI dry-run executes cleanly via subprocess and produces
        expected JSON payload with resolved port, URL, paths, and Docker Compose command.
        """
        script_path = SCRIPT_DIR / "start_dashboard.py"
        tmp_cfg = Path(self.temp_dir.name) / "cli_cfg"
        tmp_vault = Path(self.temp_dir.name) / "cli_vault"

        # 1. Test start action with dry-run
        cmd_start = [
            sys.executable,
            str(script_path),
            "--dry-run",
            "--port",
            "18080",
            "--config-dir",
            str(tmp_cfg),
            "--vault-dir",
            str(tmp_vault),
        ]
        result_start = subprocess.run(
            cmd_start,
            capture_output=True,
            text=True,
            check=True,
        )
        data_start = json.loads(result_start.stdout)

        self.assertEqual(data_start.get("action"), "start")
        self.assertEqual(data_start.get("port"), 18080)
        self.assertEqual(data_start.get("url"), "http://localhost:18080")
        self.assertEqual(data_start.get("config_dir"), str(tmp_cfg))
        self.assertEqual(data_start.get("vault_dir"), str(tmp_vault))

        command_start = data_start.get("command", [])
        self.assertIn("docker", command_start)
        self.assertIn("compose", command_start)
        self.assertIn("-f", command_start)
        self.assertIn("up", command_start)
        self.assertIn("-d", command_start)
        self.assertNotIn("--build", command_start)

        # 1b. Test start action with --build and dry-run
        cmd_start_build = [
            sys.executable,
            str(script_path),
            "--dry-run",
            "--build",
            "--config-dir",
            str(tmp_cfg),
            "--vault-dir",
            str(tmp_vault),
        ]
        result_start_build = subprocess.run(
            cmd_start_build,
            capture_output=True,
            text=True,
            check=True,
        )
        data_start_build = json.loads(result_start_build.stdout)
        command_start_build = data_start_build.get("command", [])
        self.assertIn("up", command_start_build)
        self.assertIn("-d", command_start_build)
        self.assertIn("--build", command_start_build)

        # 2. Test stop action with dry-run
        cmd_stop = [
            sys.executable,
            str(script_path),
            "--dry-run",
            "--stop",
            "--config-dir",
            str(tmp_cfg),
            "--vault-dir",
            str(tmp_vault),
        ]
        result_stop = subprocess.run(
            cmd_stop,
            capture_output=True,
            text=True,
            check=True,
        )
        data_stop = json.loads(result_stop.stdout)

        self.assertEqual(data_stop.get("action"), "stop")
        command_stop = data_stop.get("command", [])
        self.assertIn("docker", command_stop)
        self.assertIn("compose", command_stop)
        self.assertIn("down", command_stop)


if __name__ == "__main__":
    unittest.main()
