<!-- Developer and Agent Guidelines for agy-company -->
# Developer & Agent Guidelines for agy-company

This document outlines architectural principles, development rules, safety guardrails, and verification workflows for AI coding agents and human contributors working on the `agy-company` codebase.

---

## 1. Project Overview

**agy-company** is a virtual organization management system and local Obsidian Vault sync cockpit built for Google DeepMind's **Antigravity CLI (AGY)**.
- **Executive Secretary**: Central concierge handling user requests, daily planning, and task delegation.
- **Autonomous Subagents**: Dynamic background agents (`invoke_subagent`) executing specialized departmental deliverables (e.g., research, engineering, PM).
- **Obsidian Cockpit**: A fast, zero-API-cost local Web dashboard (FastAPI + React + Tailwind CSS) providing real-time visibility into organization charts, daily tasks, and deliverables.

---

## 2. Repository Architecture & Layout

```text
agy-company/
├── AGENTS.md                           # This guide for AI agents and developers
├── README.md / README_EN.md            # User-facing documentation (JA / EN)
├── config/                             # Configuration templates (*.example.json)
│   ├── config.example.json             # Common system configuration template
│   ├── departments-ja.example.json     # Japanese department & role definitions
│   └── departments-en.example.json     # English department & role definitions
├── docker-compose.yml                  # Standard container composition
├── plugin.json                         # Antigravity plugin manifest
├── skills/
│   └── agy-company/                    # Skill definition & scripts
│       ├── SKILL.md                    # Workflow instructions and operating guidelines
│       ├── references/                 # Department & AGENTS.md templates
│       └── scripts/                    # Automation scripts
│           ├── search_notes.py         # Fast note search utility
│           ├── start_dashboard.py      # Local dashboard runner script
│           └── tests/                  # Plugin script unit tests
├── dashboard/                          # Web dashboard source code
│   ├── Dockerfile                      # Multi-stage container build (Node.js + Python)
│   ├── backend/                        # FastAPI application (Python 3.11+)
│   │   ├── main.py                     # API routes, WebSocket, static mount
│   │   ├── parser.py                   # Obsidian Markdown & Frontmatter parser
│   │   └── tests/                      # Backend unit tests (pytest)
│   └── frontend/                       # React 18 + Vite + Tailwind CSS + Lucide
│       ├── src/                        # Components, types, and i18n
│       └── src/tests/                  # Frontend unit tests (Vitest)
└── vault/                              # Obsidian Vault mount point (Git-ignored)
```

---

## 3. Development Rules & Safety Guardrails

### 3.1 OSS Hygiene & Privacy Protection (機微情報の排除)
- **Strictly No Secrets**: Never commit, log, or hardcode personal directory paths, credentials, API tokens, internal URLs, or private user notes.
- **Public OSS Scope**: All committed code, examples, and tests must use generic placeholders (`user@example.com`, `/app/vault`, etc.).
- **User Data Isolation**: User operational files located in `.company/` and `vault/` are strictly excluded by `.gitignore`.

### 3.2 Safe Git Operations (破壊的操作の厳禁)
- **Destructive Resets Prohibited**: Repository-wide destructive operations (`git reset --hard`, `git clean -fd`, etc.) are **STRICTLY FORBIDDEN**.
- **Scoped File Reversion**: If changes must be reverted, always scope the operation strictly to individual target files (e.g., `git restore <path>`).

### 3.3 Code Comments & Documentation Integrity
- **English Code Comments**: Write all source code comments in clear, concise English so developers of any background can understand the implementation.
- **Preserve Documentation**: Comments exist to facilitate code understanding and verification. Modifying or clarifying comments is encouraged; removing comments solely to shorten line count is prohibited.

### 3.4 Plan Before Execution & Command Transparency
- **Plan Agreement**: Before making non-trivial modifications, creating new files, or executing major commands, always outline the purpose, procedure, and impact scope for the user.
- **Command Explanation**: Before executing terminal commands, explain what the command does, why it is necessary, and any side effects.

---

## 4. Verification & Testing Standards

Always verify changes thoroughly across both backend and frontend environments before completing tasks.

### 4.1 Frontend Verification (React + TypeScript)
```bash
# 1. Static type check
cd dashboard/frontend && npx tsc --noEmit

# 2. Unit tests (Vitest)
cd dashboard/frontend && npx vitest run

# 3. Production build verification
cd dashboard/frontend && npm run build
```

### 4.2 Backend Verification (Python + FastAPI)
```bash
# Run backend unit tests via isolated virtualenv or system pytest
./dashboard/backend/.venv/bin/pytest dashboard/backend/tests
# Or:
pytest dashboard/backend/tests

# Run plugin scripts unit tests (search_notes.py & start_dashboard.py)
python3 -m unittest discover -s skills/agy-company/scripts/tests -v
```

### 4.3 Container Verification (Docker)
```bash
# Verify container build and startup
docker compose up -d --build

# Shutdown container
docker compose down
```

---

## 5. UI & Localization (i18n) Guidelines

- **Bilingual Interface**: The dashboard supports both Japanese (`ja`) and English (`en`).
- **Dynamic Localization**:
  - UI labels are managed in `dashboard/frontend/src/i18n/translations.ts`.
  - Department and secretary titles dynamically resolve from `config/departments-{lang}.json` (falling back to `departments-{lang}.example.json`).
  - Button pills and badges must be resilient to arbitrary custom department names, applying text truncation (`truncate`) and tooltips (`title`) to maintain layout stability.
