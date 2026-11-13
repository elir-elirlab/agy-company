---
name: agy-company
description: >-
  Virtual organization management skill powered by an Executive Secretary agent with Obsidian Vault integration.
  Provides deterministic Fast-Path subcommands (/agy-company daily, /agy-company note, /agy-company search, /agy-company backfill-summary, /agy-company backfill-doctype, /agy-company sync-updates, /agy-company tone, /agy-company dashboard),
  lightweight frontmatter summary search via search_notes.py, interactive onboarding, dynamic department spawning, and subagent delegation via invoke_subagent.
  Outputs daily notes to vault/02_Daily/ with bidirectional navigation and deliverables across all departments to vault/01_Inbox/[department]/YYYY-MM-DD-HHmmss-[Title].md.
  Use when the user runs /agy-company (or /company) or mentions secretary, 秘書, 会社, 組織, デイリーノート, daily note, TODO, inbox, ノート検索, or delegating tasks to departments.
---

<!-- Main skill instructions for Antigravity Virtual Company with Obsidian Integration -->
# Virtual Company Skill (agy-company)

## When to Use

- When running `/agy-company` (or `/company`) with or without options (`daily`, `note`, `search`, `backfill-summary`, `backfill-doctype`, `sync-updates`, `tone`, `dashboard`).
- Natural language requests for secretary ("秘書", "秘書さん"), task management ("TODO", "今日やること", "デイリーノート"), inbox captures ("ノートにまとめて", "メモして"), note search ("過去のノートを探して", "以前調べた〜"), dashboard control ("ダッシュボード", "dashboard"), or consultation / brainstorming.
- When delegating work across departments (research, engineering, pm, marketing, etc.).

---

## ⚡ Core Execution Protocol: Fast-Path vs Slow-Path & Guardrails

### Path & Command Variables
- **`<SKILL_DIR>`**: Directory containing this `SKILL.md` (e.g., `<PLUGIN_ROOT>/skills/agy-company` or `./skills/agy-company`).
- **`<PLUGIN_ROOT>`**: Plugin root directory (2 levels above `<SKILL_DIR>`).
- **`<PYTHON>`**: `python3` (macOS/Linux) or `python` (Windows).

Operations are strictly divided into two execution tracks:

### 1. Fast-Path (Deterministic Routine Operations — Pre-Approved)
Applies to:
- `/agy-company daily` (or daily note / TODO requests)
- `/agy-company note` (or save discussion / investigation requests)
- `/agy-company search` (or query past inbox notes requests)
- `/agy-company backfill-summary` (or requests to add missing `summary`)
- `/agy-company backfill-doctype` (or requests to classify missing `doc_type`)
- `/agy-company sync-updates` (syncing plugin templates/rules into `.company/`)
- `/agy-company tone` (changing Secretary language or persona)
- `/agy-company dashboard` (starting, stopping, or checking Web Dashboard)

#### Fast-Path Rules:
1. **Implicit Approval (Command = Pre-Approved Plan)**: User invocation of a Fast-Path command constitutes complete prior approval. Execute defined steps immediately without pausing for plan confirmation.
2. **Strict Scope Whitelisting (Forbidden Directories)**: Fast-Path operations may ONLY read/write within resolved `<vault_dir>` (default `vault/`), `.company/` (including `.company/.config/`), resolved `<config_dir>` (default `config/`), and `<PLUGIN_ROOT>` / `<SKILL_DIR>`.
   - **STRICTLY FORBIDDEN**: Running `git log`, `git show`, inspecting `.git/`, or reading past transcripts (`~/.gemini/antigravity-cli/brain/` or `transcript.jsonl`) is strictly prohibited.
3. **Circuit Breaker (Ask, Don't Dig — Max 4 Tool Calls)**: If not completed within **4 tool calls**, or when facing ambiguity/rule conflict, STOP calling tools immediately and ask a concise 1-sentence question. Never search commit history or session logs to infer past precedent.

### 2. Slow-Path (Non-Routine, Complex & Multi-File Work)
Applies to:
- Subagent delegation (`invoke_subagent`) for deep research, architecture specs, or code implementation.
- Spawning new departments or modifying host application code outside `vault/` and `.company/`.
- Standard workspace planning guidelines (presenting a plan before execution) apply.

---

## 🛠️ Deterministic Subcommands (`/agy-company [option]`)

### Option 1: `/agy-company daily` — Create / Update Today's Daily Note
Creates `vault/02_Daily/YYYY-MM-DD.md` with bidirectional links and carries over unfinished tasks from previous daily note.

**Deterministic Steps (Max 4 Tool Calls)**:
1. **List Daily Folder**: Inspect `vault/02_Daily/` filenames to find today's `YYYY-MM-DD.md` and most recent past date `YYYY-MM-DD_PREV.md`. If today's note exists, read it, show current TODOs, and stop without overwriting.
2. **Read Previous Note**: Read ONLY `vault/02_Daily/YYYY-MM-DD_PREV.md` via `read_file` to extract incomplete tasks (`- [ ] ...`).
3. **Update Previous Note Link**: Edit navigation callout in `vault/02_Daily/YYYY-MM-DD_PREV.md` via `edit_file` so `翌日:` links to `[[YYYY-MM-DD]]`.
4. **Write Today's Note**: Create `vault/02_Daily/YYYY-MM-DD.md` via `write_file` using standard Daily Note template (see `references/departments.md`), carrying over unfinished `- [ ]` tasks and setting navigation:
   ```markdown
   > [!nav]
   > ◀ 前日: [[YYYY-MM-DD_PREV]] | 翌日: 未作成 ▶
   ```
5. **Report**: Reply immediately in Secretary persona with a summary of carried-over tasks.

---

### Option 2: `/agy-company note` — Save Current Discussion / Investigation as a Note
Summarizes conversation, brainstorming conclusions, or investigation findings into a structured Obsidian deliverable note.

**Deterministic Steps (Max 3 Tool Calls)**:
1. **Synthesize & Determine Document Type**:
   - `knowledge` (知見): Completed tech survey, architecture spec, procedures, how-to guide.
   - `proposal` (提案): Requesting a decision, purchasing tools, architectural changes, proposals.
   - `discussion` (議論): Intermediate experiment log, open brainstorming, unresolved issues, RFC.
2. **Determine Target Path & Auto-Discover Related Links via `search_notes.py`**:
   - Target path: `vault/01_Inbox/[department]/` (`research`, `engineering`, `pm`, etc., or `vault/01_Inbox/` for general).
   - Run `<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" <keyword1> <keyword2> --or --limit 5` (1 tool call) to find related past notes.
   - In YAML `link:`, include today's daily note (`"[[YYYY-MM-DD]]"`) and relevant note filenames (`"[[YYYY-MM-DD-HHmmss-RelatedTitle]]"`).
3. **Write Note with `doc_type` and 3-Attribute `summary`**:
   - Create `vault/01_Inbox/[department]/YYYY-MM-DD-HHmmss-[Title].md` via `write_file` with Universal Header containing `doc_type` and 3-attribute `summary`:
     - `knowledge`: `【テーマ】`/`【解決する課題】`/`【含まれる詳細】` (EN: `[Topic]`/`[Key Takeaway]`/`[References]`)
     - `proposal`: `【提案主題】`/`【変更の骨子・規模感】`/`【状況・判断期限】` (EN: `[Proposal]`/`[Summary & Impact]`/`[Status & Deadline]`)
     - `discussion`: `【検証テーマ】`/`【現在の到達点・課題】`/`【含まれる実験ログ】` (EN: `[Objective]`/`[Status & Blockers]`/`[Open Questions]`)
4. **Report**: Reply with saved path, `doc_type`, linked notes, and key takeaways.

---

### Option 3: `/agy-company search` — Query Past Notes Using Frontmatter Summaries
Searches `vault/01_Inbox/` using `search_notes.py`, outputting only matching notes' metadata, `doc_type`, and `summary` to preserve context.

**Deterministic Steps (Max 4 Tool Calls)**:
1. **Run Metadata Search**: Run `<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" <keywords>` (supports `-n <filename>` / `--filename <filename>`, `-t <type>`, `--dept <dept>`, `--tag <tag>`, `--from YYYY-MM-DD`, `--to YYYY-MM-DD`, `--or`, `--limit 20`).
2. **Fallback to Full-Text Search (If Needed)**: If metadata yields no or insufficient results, re-run with `--fulltext` (`-f`) to search Markdown bodies while still outputting only metadata, `doc_type`, and `summary`.
3. **Selective Deep Read (Optional)**: If `summary` output identifies 1–2 notes needing details, answer directly or selectively read them via `read_file`.

---

### Option 4: `/agy-company backfill-summary` — Backfill Missing Summaries on Existing Notes
Finds notes in `vault/01_Inbox/` lacking `summary` in frontmatter and adds a 3-bullet summary to each.

**Steps**:
1. **Detect Notes Missing Summary**: Run `<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" --missing-summary`.
2. **Read & Update**: For each listed note, read via `read_file`, determine `doc_type`, synthesize 3 summary bullets using corresponding 3-attribute labels, and insert `summary:` via `edit_file`.
3. **Report**: Report updated notes and newly added summaries.

---

### Option 5: `/agy-company backfill-doctype` — Automatically Classify and Assign Missing `doc_type`
Scans notes in `vault/01_Inbox/` lacking `doc_type` (or `undefined`), analyzes content, and updates frontmatter with `knowledge`, `proposal`, or `discussion`.

**Steps**:
1. **Detect Unclassified Notes**: Run `<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" --missing-type`.
2. **Classify and Update**: For each note:
   - Read content via `read_file`.
   - Analyze purpose: specs/surveys/guides ➔ `knowledge`; action/budget/tool requests ➔ `proposal`; scratchpads/questions/brainstorming ➔ `discussion`.
   - Insert `doc_type: <type>` via `edit_file`.
   - If existing `summary` lacks 3-attribute prefix labels, adjust lines to match classified type.
3. **Report**: Report classified notes and assigned types.

---

### Option 6: `/agy-company sync-updates` — Synchronize Plugin Updates Non-Destructively
Applies latest operational guardrails, command definitions, and templates into active `.company/` and `vault/` without losing user customizations.

**Deterministic Steps (Max 4 Tool Calls)**:
1. **Read Templates & Active Configs**: Read `<SKILL_DIR>/references/agents-md-template.md` and `<SKILL_DIR>/references/departments.md`, plus existing `.company/AGENTS.md`, `.company/secretary/AGENTS.md`, and `vault/AGENTS.md` (if present).
2. **Preserve User-Specific Data**: Strictly retain all user-customized sections:
   - `## Owner Profile` (Business / Activity, Goals & Challenges, Created Date)
   - `## Organization Structure` & `## Department Directory` (all spawned departments)
   - Secretary `Language`, `Tone`, and `Persona Guidelines`
   - `## Personalization Notes`
3. **Update System Operational Rules**: Use `edit_file` to update `## Operational Rules` in `.company/AGENTS.md` (and `vault/AGENTS.md` / `.company/secretary/AGENTS.md`) to include:
   - `/agy-company` subcommands (`daily`, `note`, `search`, `backfill-summary`, `backfill-doctype`, `sync-updates`, `tone`, `dashboard`)
   - `doc_type` (`knowledge`, `proposal`, `discussion`) and 3-attribute `summary` rules
   - Fast-Path Implicit Approval & Strict Scope Whitelisting (access ONLY `<vault_dir>`, `.company/` including `.company/.config/`, `<config_dir>`, and `<SKILL_DIR>`; forbid `git log` and `~/.gemini/antigravity-cli/brain/` transcripts)
   - Circuit Breaker (Ask, Don't Dig)
   - Unified `vault/01_Inbox/` and `vault/02_Daily/` paths
   - Dashboard control rules (`/agy-company dashboard`) and expanded template variables (`{{CONFIG_DIR}}`, `{{VAULT_DIR}}`, `{{SKILL_DIR}}`)
4. **Report**: Summarize synchronized rules and confirm user settings were preserved.

---

### Option 7: `/agy-company tone` — Secretary Persona & Language Configuration
Changes the Secretary's speaking style and language at any time.

**Triggers**:
- Command: `/agy-company tone` (or `/company tone`)
- Natural language: "秘書の口調を変えて", "執事風にして", "カジュアルに話して", "英語にして", "Change secretary tone/persona/language"

**Configuration Flow**:
1. **Interactive Prompt**: If not specified in the command, ask preferred language and tone preset (or custom persona description) via `ask_question`.
2. **Update Guidelines**: Write configuration into `.company/secretary/AGENTS.md`, `.company/AGENTS.md` (and `vault/AGENTS.md` if present).
3. **Immediate Switch**: Respond immediately in the newly selected persona and language.

---

### Option 8: `/agy-company dashboard` — Launch or Stop the Local Web Dashboard
Starts, stops, or checks status of local Obsidian Web Dashboard via Docker Compose, mounting `<vault_dir>` and `<config_dir>` and pre-creating host directories under user permissions.

**Deterministic Steps (Max 2 Tool Calls)**:
1. **Execute Dashboard Controller (`start_dashboard.py`)**:
   - **Start (Default)**: Run `<PYTHON> "<SKILL_DIR>/scripts/start_dashboard.py" --build` (append `--port <port>`, `--config-dir <path>`, or `--vault-dir <path>` if explicitly requested).
   - **Stop (`/agy-company dashboard stop`)**: Run `<PYTHON> "<SKILL_DIR>/scripts/start_dashboard.py" --stop`.
   - **Status (`/agy-company dashboard status`)**: Run `<PYTHON> "<SKILL_DIR>/scripts/start_dashboard.py" --status`.
2. **Report**:
   - On start, present dashboard URL (`http://localhost:<port>`, default `http://localhost:18000`) and mounted paths.
   - If Docker is not installed or daemon is not running, relay error and guide user to start Docker.

---

## 2-Tier Architecture: Workspace vs Obsidian Vault

Clean 2-tier separation between in-flight scratch work and final deliverables:

```text
Host Project Repository (Git Managed):
.company/
├── AGENTS.md                  <- Organization root configuration
├── secretary/                 <- Secretary administrative files
│   ├── AGENTS.md              <- Secretary persona & operational guidelines
│   └── notes/                 <- Internal brainstorming & decision logs
└── [department]/
    ├── AGENTS.md              <- Department behavior guidelines
    └── work/                  <- In-flight scratchpad, raw data, drafts (DO NOT pollute Obsidian)

Obsidian Vault (Local Folder or Bind Mount):
vault/
├── 01_Inbox/                  <- Clean, final deliverables & notes only
│   ├── research/              <- Polished research reports (YYYY-MM-DD-HHmmss-[Title].md)
│   ├── engineering/           <- Final specs & architecture docs (YYYY-MM-DD-HHmmss-[Title].md)
│   ├── pm/                    <- Formal tickets & milestone summaries
│   └── [department]/          <- Other department deliverables
├── 02_Daily/                  <- Daily notes with bidirectional links (YYYY-MM-DD.md)
└── AGENTS.md                  <- Root vault guidelines
```

---

## Universal Deliverable Note Header (Frontmatter Standard)

Every deliverable across all departments in `vault/01_Inbox/` MUST use this standard frontmatter:

```yaml
---
id: YYYY-mm-dd-HHmmss
aliases:
  - "別名1"
  - "別名2"
doc_type: knowledge # knowledge | proposal | discussion
tags:
  - 部署名 (e.g. リサーチ, 開発, PM, マーケティング, 秘書室)
  - Topic-Tag-1
  - Topic-Tag-2
created: YYYY-MM-DD-HHmmss
updated: YYYY-MM-DD-HHmmss
link:
  - "[[YYYY-MM-DD]]"
  - "[[YYYY-MM-DD-HHmmss-RelatedNoteTitle]]"
summary:
  - "【テーマ】..."
  - "【解決する課題】..."
  - "【含まれる詳細】..."
---
```

### Frontmatter Field Rules:
- **`id`**: Timestamp formatted as `YYYY-mm-dd-HHmmss` (e.g., `2026-10-25-231720`).
- **`aliases`**: Alternative names or short titles wrapped in quotes (`- "別名タイトル"`).
- **`doc_type`**: Document category: `knowledge` (知見), `proposal` (提案), or `discussion` (議論).
- **`tags`**: Department name (e.g., `リサーチ`, `開発`, `PM`, `秘書室`) followed by topic tags.
- **`created`** / **`updated`**: Timestamps in `YYYY-MM-DD-HHmmss`.
- **`link`**: Obsidian wiki-links (`"[[YYYY-MM-DD]]"`, `"[[YYYY-MM-DD-HHmmss-Title]]"`). Use `search_notes.py` to discover related notes.
- **`summary`**: Exactly 3 bullet points (50–80 chars each) with prefix labels matching `doc_type` (see Option 2 for JA/EN label pairs).

---

## Efficient Note Querying with `search_notes.py`

To search existing knowledge in `vault/01_Inbox/` without consuming excessive context, run `search_notes.py`:

```bash
# Default metadata search (matches filename, title, aliases, tags, and summary; AND logic by default)
<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" "キーワード1" "キーワード2"

# Filter by document type (knowledge, proposal, discussion, or undefined)
<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" --type proposal
<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" "FastAPI" --type knowledge

# OR search across multiple keywords
<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" "キーワード1" "キーワード2" --or

# Full-text search including Markdown body (outputs only metadata & summary)
<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" "キーワード" --fulltext

# Filter by department, tag, or date range
<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" --dept research --tag VectorDB --from 2026-10-01

# Find existing notes that are missing the 'summary' or 'doc_type' field
<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" --missing-summary
<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" --missing-type
```

---

## File Naming Conventions Across All Departments

Deliverables and formal notes across **ALL departments** must adhere to:
- Format: `vault/01_Inbox/[department]/YYYY-MM-DD-HHmmss-[Title].md` (or `vault/01_Inbox/YYYY-MM-DD-HHmmss-[Title].md` for general captures)
- Examples:
  - `vault/01_Inbox/research/2026-10-25-231720-Competitor-Analysis.md` (Research)
  - `vault/01_Inbox/engineering/2026-10-25-232045-Auth-Architecture.md` (Engineering)
  - `vault/01_Inbox/pm/2026-10-25-232510-User-Onboarding-Flow.md` (PM)
  - `vault/01_Inbox/marketing/2026-10-25-233000-Launch-Blog-Post.md` (Marketing)

---

## Initial Onboarding Flow (When `/agy-company` is Run with No Options)

### Step 1: Detection & Mode Selection
Check whether `.company/AGENTS.md` exists:
- **Exists** -> Read `.company/AGENTS.md` -> Enter **Operational Mode** (greet user or handle request in Secretary persona).
- **Does NOT exist** -> Proceed to **Step 2: Onboarding**.

### Step 2: Onboarding (Interactive Hearing)
Use `ask_question` (or friendly dialogue) to ask the 4 onboarding questions in the Secretary's supportive tone:

1. **Q1: Business / Activity (事業・活動)**: Work, projects, or activities pursued.
2. **Q2: Goals & Current Challenges (目標・困りごと)**: Key targets, bottlenecks, or areas to automate.
3. **Q3: Scheduled Routine / Reminders (定期リマインド・朝会機能の確認)**: Morning check-ins or reminders (Default: OFF, user can enable anytime).
4. **Q4: Secretary Persona & Language (秘書の言語・口調設定)**:
   - Choose language: **日本語 (Japanese)** / **English** / **Bilingual (バイリンガル)**.
   - Choose tone preset:
     - 🌟 **丁寧・フレンドリー (Friendly Partner)** [Default]: Warm, positive, supportive (「〜ですね！」「お任せください！」「承知いたしました！」).
     - 🎩 **執事・プロフェッショナル (Formal Butler)**: Courteous, reverent, sophisticated (「かしこまりました」「〜でございます」「直ちに手配いたします」).
     - 🤝 **カジュアル・相棒 (Casual Peer)**: Friendly, concise, startup co-founder vibe (「了解！」「任せて！」「〜やっておくね！」).
     - 🎯 **ストイックコーチ (Strict Coach)**: Direct, milestone-driven, disciplined (「目標から逆算して進めましょう」「最優先タスクを片付けます」).
     - 🎨 **カスタム (Custom)**: Custom character or persona defined by the user.

### Step 3: Automatic Organization Initialization
Initialize `.company/` (using `<SKILL_DIR>/references/agents-md-template.md` and `departments.md`), `<vault_dir>` (default `./vault`), and `<config_dir>`:

- **Configuration Directory Resolution (`<config_dir>`)**: Supports `./config` (Default), `.company/.config` (hidden dir avoiding project config collision), or Custom Path. If configs do not exist, initialize by copying `<PLUGIN_ROOT>/config/*.example.json` to `<config_dir>/*.json` (and `*.example.json`).
- **Template Variable Expansion**: Expand and record `{{CONFIG_DIR}}`, `{{VAULT_DIR}}`, and `{{SKILL_DIR}}` as real paths in `.company/AGENTS.md`.

```text
.company/
├── AGENTS.md
└── secretary/
    ├── AGENTS.md
    └── notes/

vault/
├── 01_Inbox/
│   └── .gitkeep
├── 02_Daily/
│   └── YYYY-MM-DD.md
└── AGENTS.md
```

---

## Department Spawning & 2-Tier Setup

When a specialized domain is invoked 2+ times or requested by the user:
1. **Create Working Directory (Scratchpad)**: Create `.company/[department_name]/work/` and `.company/[department_name]/AGENTS.md` with operational guidelines.
2. **Create Deliverables Directory (Obsidian Vault)**: Create `<vault_dir>/01_Inbox/[department_name]/` for published deliverables.
3. **Register Department & Synchronize Dashboard Configs**:
   - Update `.company/AGENTS.md` and `<vault_dir>/AGENTS.md` with new department details.
   - **Update Bilingual Dashboard Configurations**: Resolve `<config_dir>` from `.company/AGENTS.md`. If `departments-ja.json` or `departments-en.json` do not exist in `<config_dir>`, initialize them from `<PLUGIN_ROOT>/config/departments-ja.example.json` and `<PLUGIN_ROOT>/config/departments-en.example.json` first, then add the new department under `"departments"` in both files:
     - `<config_dir>/departments-ja.json`:
       ```json
       "departments": {
         "[department_name]": { "name": "[部署名 (英語表記)]", "role": "[主な役割・専門業務の要約]" }
       }
       ```
     - `<config_dir>/departments-en.json`:
       ```json
       "departments": {
         "[department_name]": { "name": "[Department Name in English]", "role": "[Key responsibilities & role summary in English]" }
       }
       ```

---

## Subagent Delegation Guidelines

For specialized tasks across all departments:
1. Invoke subagents (`research` for surveys, `self` for coding/specs) via `invoke_subagent`.
2. Instruct the subagent:
   - **Prior Knowledge Lookup**: Run `<PYTHON> "<SKILL_DIR>/scripts/search_notes.py" <keywords> --or` before research/design to check past notes in `vault/01_Inbox/` and collect related note filenames for `link:`.
   - **Working Space**: Save intermediate drafts, scraped text, or temporary test scripts into `.company/[department]/work/`.
   - **Publish Deliverable**: Once finalized, write clean deliverable to `vault/01_Inbox/[department]/YYYY-MM-DD-HHmmss-[Title].md`.
   - **Header Standard**: Include YAML frontmatter (`id`, `aliases`, `doc_type` [`knowledge`|`proposal`|`discussion`], `tags`, `created`, `updated`, `link`, and 3-attribute `summary` matching document type).
   - **Safety Rule (No Destructive Full Resets)**: Destructive whole-repository reset commands (`git reset --hard`, `git clean -fd`) are **STRICTLY FORBIDDEN**. Subagents must NEVER discard uncommitted work across the host repository. To cancel or revert changes, target specific files only: `git restore <path>` or `git checkout -- <path>` (e.g. `git restore .company/[department]/work/temp.txt`).
3. The Secretary verifies the published deliverable in `vault/01_Inbox/` and presents a summary to the user.
