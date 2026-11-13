#!/usr/bin/env python3
"""
Dashboard launcher and lifecycle controller for agy-company.
Resolves workspace config_dir, vault_dir, and dashboard_port, pre-creates mounted host
directories with user permissions (preventing root-owned directory creation by Docker on Linux),
seeds initial example configs if absent, and runs Docker Compose pointing to the plugin root.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure sibling scripts directory is importable for shared path resolution
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import search_notes  # noqa: E402


def get_plugin_root() -> Path:
    """
    Return the root directory of the agy-company plugin.
    Script is located at <PLUGIN_ROOT>/skills/agy-company/scripts/start_dashboard.py.
    """
    script_path = Path(__file__).resolve()
    return script_path.parents[3]


def load_config_json(config_dir: Path) -> Dict[str, Any]:
    """Read config.json or config.example.json from config_dir if present."""
    for name in ("config.json", "config.example.json"):
        cfg_file = config_dir / name
        if cfg_file.exists() and cfg_file.is_file():
            try:
                data = json.loads(cfg_file.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    return data
            except Exception:
                continue
    return {}


def resolve_dashboard_port(
    explicit_port: Optional[int],
    config_dir: Path,
    default_port: int = 18000
) -> int:
    """
    Resolve host port for the dashboard using precedence:
    1. Explicit --port CLI argument
    2. DASHBOARD_PORT environment variable
    3. 'dashboard_port' in <config_dir>/config.json
    4. Default port (18000)
    """
    if explicit_port is not None:
        return int(explicit_port)

    env_port = os.getenv("DASHBOARD_PORT")
    if env_port and env_port.isdigit():
        return int(env_port)

    cfg = load_config_json(config_dir)
    cfg_port = cfg.get("dashboard_port")
    if isinstance(cfg_port, int) or (isinstance(cfg_port, str) and cfg_port.isdigit()):
        return int(cfg_port)

    return default_port


def prepare_host_directories(
    config_dir: Path,
    vault_dir: Path,
    plugin_root: Path
) -> List[str]:
    """
    Pre-create vault and config directories under the current user's permissions
    prior to Docker volume mounting, and copy *.example.json templates if config_dir is empty.
    Returns a list of created/copied file paths for logging.
    """
    actions: List[str] = []

    # 1. Create Vault subdirectories (01_Inbox and 02_Daily)
    for sub in ("01_Inbox", "02_Daily"):
        target = vault_dir / sub
        if not target.exists():
            target.mkdir(parents=True, exist_ok=True)
            actions.append(f"Created directory: {target}")

    # 2. Create Config directory
    if not config_dir.exists():
        config_dir.mkdir(parents=True, exist_ok=True)
        actions.append(f"Created directory: {config_dir}")

    # 3. Seed *.example.json (and initial *.json if missing) from plugin_root/config
    template_config_dir = plugin_root / "config"
    if template_config_dir.exists() and template_config_dir.is_dir():
        for example_file in sorted(template_config_dir.glob("*.example.json")):
            dest_example = config_dir / example_file.name
            if not dest_example.exists():
                shutil.copy2(example_file, dest_example)
                actions.append(f"Copied template: {dest_example}")

            # Also seed active *.json if neither exists yet
            active_name = example_file.name.replace(".example.json", ".json")
            dest_active = config_dir / active_name
            if not dest_active.exists():
                shutil.copy2(example_file, dest_active)
                actions.append(f"Initialized config: {dest_active}")

    return actions


def build_compose_command(
    plugin_root: Path,
    action: str,
    build: bool = False,
) -> List[str]:
    """Build the docker compose command list targeting the plugin root's docker-compose.yml."""
    compose_file = plugin_root / "docker-compose.yml"
    cmd = ["docker", "compose", "-f", str(compose_file)]
    if action == "stop":
        cmd.extend(["down"])
    elif action == "status":
        cmd.extend(["ps"])
    else:
        cmd.extend(["up", "-d"])
        # Only pass --build when explicitly requested so normal restarts stay fast
        if build:
            cmd.append("--build")
    return cmd


def build_arg_parser() -> argparse.ArgumentParser:
    """Construct the CLI argument parser for start_dashboard.py."""
    parser = argparse.ArgumentParser(
        description="Launch, stop, or inspect the agy-company local Obsidian Web Dashboard via Docker Compose."
    )
    parser.add_argument(
        "--config-dir",
        type=str,
        default=None,
        help="Explicit path to config directory to mount (default: auto-resolved from env, .company/.config, or ./config).",
    )
    parser.add_argument(
        "--vault-dir",
        type=str,
        default=None,
        help="Explicit path to Obsidian Vault directory to mount (default: auto-resolved from config.json or ./vault).",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=None,
        help="Host port to expose the dashboard on (default: DASHBOARD_PORT, config.json dashboard_port, or 18000).",
    )
    parser.add_argument(
        "--build",
        action="store_true",
        help="Rebuild the Docker image before starting the dashboard container (docker compose up -d --build).",
    )
    parser.add_argument(
        "--stop",
        action="store_true",
        help="Stop and remove the running dashboard container (docker compose down).",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Show the status of the dashboard container (docker compose ps).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Output resolved paths, port, environment, and docker compose command as JSON without executing Docker.",
    )
    return parser


def main() -> int:
    """Main entry point for CLI execution."""
    parser = build_arg_parser()
    args = parser.parse_args()

    plugin_root = get_plugin_root()
    config_dir = search_notes.resolve_config_dir(explicit_config_dir=args.config_dir)
    vault_dir = search_notes.resolve_vault_dir(
        explicit_vault_dir=args.vault_dir,
        explicit_config_dir=args.config_dir,
    )
    port = resolve_dashboard_port(explicit_port=args.port, config_dir=config_dir)

    if args.stop:
        action = "stop"
    elif args.status:
        action = "status"
    else:
        action = "start"

    cmd = build_compose_command(plugin_root, action, build=args.build)
    compose_env = {
        "OBSIDIAN_VAULT_PATH": str(vault_dir),
        "CONFIG_PATH": str(config_dir),
        "DASHBOARD_PORT": str(port),
    }

    if args.dry_run:
        payload = {
            "action": action,
            "plugin_root": str(plugin_root),
            "config_dir": str(config_dir),
            "vault_dir": str(vault_dir),
            "port": port,
            "url": f"http://localhost:{port}",
            "command": cmd,
            "env": compose_env,
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    # Ensure Docker CLI is installed before attempting container operations
    if not shutil.which("docker"):
        print(
            "Error: 'docker' command not found. Please install Docker Desktop or Docker Engine (with Docker Compose) to run the dashboard.",
            file=sys.stderr,
        )
        return 1

    # When starting the dashboard, pre-create host directories with user permissions
    if action == "start":
        created_actions = prepare_host_directories(
            config_dir=config_dir,
            vault_dir=vault_dir,
            plugin_root=plugin_root,
        )
        for item in created_actions:
            print(f"[init] {item}")

    env = os.environ.copy()
    env.update(compose_env)

    result = subprocess.run(cmd, env=env, check=False)
    if result.returncode != 0:
        print(
            "Error: Failed to execute 'docker compose'. Please verify that the Docker daemon is running.",
            file=sys.stderr,
        )
        return result.returncode

    if action == "start":
        print(f"Dashboard started successfully at: http://localhost:{port}")
        print(f"  Mounted Vault : {vault_dir}")
        print(f"  Mounted Config: {config_dir}")
    elif action == "stop":
        print("Dashboard stopped successfully.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
