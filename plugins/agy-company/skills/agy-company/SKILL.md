---
name: agy-company
description: >-
  Virtual organization management skill powered by an Executive Secretary agent with Obsidian Vault integration.
  Provides deterministic Fast-Path subcommands (/agy-company daily, /agy-company note, /agy-company search, /agy-company backfill-summary, /agy-company backfill-doctype, /agy-company sync-updates, /agy-company tone),
  lightweight frontmatter summary search via search_notes.py, interactive onboarding, dynamic department spawning, and subagent delegation via invoke_subagent.
  Outputs daily notes to vault/02_Daily/ with bidirectional navigation and deliverables across all departments to vault/01_Inbox/[department]/YYYY-MM-DD-HHmmss-[Title].md.
  Use when the user runs /agy-company (or /company) or mentions secretary, 秘書, 会社, 組織, デイリーノート, daily note, TODO, inbox, ノート検索, or delegating tasks to departments.
---

<!-- Main skill instructions for Antigravity Virtual Company with Obsidian Integration -->
# Virtual Company Skill (agy-company)

## When to Use

- When the user runs `/agy-company` (or legacy `/company`) with or without options (`daily`, `note`, `search`, `backfill-summary`, `backfill-doctype`, `sync-updates`, `tone`)
- When the user asks for their secretary ("秘書", "秘書さん"), task management ("TODO", "今日やること", "デイリーノート"), inbox captures ("ノートにまとめて", "メモして"), note search ("過去のノートを探して", "以前調べた〜"), or consultation / brainstorming
- When delegating work across departments (research, engineering, pm, marketing, etc.)

---

## ⚡ Core Execution Protocol: Fast-Path vs Slow-Path & Guardrails

To prevent analysis paralysis and unintended background loops, all operations are strictly divided into two tracks:

### 1. Fast-Path (Deterministic Routine Operations — Pre-Approved)
Applies to:
- `/agy-company daily` (or natural language requests to create/update today's daily note or TODOs)
- `/agy-company note` (or natural language requests to save current discussion/investigation into a Vault note)
- `/agy-company search` (or natural language requests to find/query past notes in `vault/01_Inbox/`)
- `/agy-company backfill-summary` (or requests to add missing `summary` fields to existing notes)
- `/agy-company backfill-doctype` (or requests to classify and assign missing `doc_type` to existing notes)
- `/agy-company sync-updates` (syncing plugin template/rule updates into `.company/`)
- `/agy-company tone` (changing Secretary language or persona)

#### Fast-Path Rules:
1. **Implicit Approval (Command = Pre-Approved Plan)**:
   User invocation of a Fast-Path command or routine request constitutes **complete prior approval of the execution plan**. Execute the defined steps immediately and report completion. Do NOT pause to ask for plan confirmation before creating or updating the target routine files.
2. **Strict Scope Whitelisting (Forbidden Directories)**:
   Fast-Path operations may ONLY read/write within `vault/`, `.company/`, `config/`, and `plugins/agy-company/`.
   **STRICTLY FORBIDDEN**: Running `git log`, `git show`, inspecting `.git/`, or reading past conversation transcripts (`~/.gemini/`, `brain/`, `transcript.jsonl`) is strictly prohibited under all circumstances.
3. **Circuit Breaker (Ask, Don't Dig — Max 4 Tool Calls)**:
   If a Fast-Path routine cannot be completed within **4 tool calls**, or if you encounter any ambiguity or rule conflict, **STOP calling tools immediately** and ask the user a concise 1-sentence question. Never search commit history or session logs to infer past precedent.

### 2. Slow-Path (Non-Routine, Complex & Multi-File Work)
Applies to:
- Subagent delegation (`invoke_subagent`) for deep research, architecture specs, or code implementation
- Spawning new departments or modifying host application code outside `vault/` and `.company/`
- Follow any workspace-level planning guidelines (such as presenting a plan before execution) normally.

---

## 🛠️ Deterministic Subcommands (`/agy-company [option]`)

### Option 1: `/agy-company daily` — Create / Update Today's Daily Note
Creates today's daily note (`vault/02_Daily/YYYY-MM-DD.md`) with bidirectional links and carries over unfinished tasks from the previous daily note.

**Deterministic Steps (Max 4 Tool Calls)**:
1. **List Daily Folder**: Check files in `vault/02_Daily/` (only inspect filenames to find today's date `YYYY-MM-DD.md` and the single most recent past date `YYYY-MM-DD_PREV.md`).
   - If today's `vault/02_Daily/YYYY-MM-DD.md` already exists, read it, show today's current TODOs to the user, and stop (do not overwrite).
2. **Read Previous Note**: Read ONLY the single most recent past note (`vault/02_Daily/YYYY-MM-DD_PREV.md`, if any) using `read_file` to extract incomplete tasks (`- [ ] ...`).
3. **Update Previous Note Link**: Update the navigation callout in `vault/02_Daily/YYYY-MM-DD_PREV.md` using `edit_file` so `翌日:` links to `[[YYYY-MM-DD]]`.
4. **Write Today's Note**: Create `vault/02_Daily/YYYY-MM-DD.md` using `write_file` with the standard Daily Note template (see `references/departments.md`), carrying over unfinished `- [ ]` tasks and setting navigation to:
   ```markdown
   > [!nav]
   > ◀ 前日: [[YYYY-MM-DD_PREV]] | 翌日: 未作成 ▶
   ```
5. **Report**: Immediately reply to the user in the Secretary's persona with a summary of today's carried-over tasks.

---

### Option 2: `/agy-company note` — Save Current Discussion / Investigation as a Note
Summarizes the current conversation topic, brainstorming conclusions, or investigation findings into a structured Obsidian deliverable note.

**Deterministic Steps (Max 3 Tool Calls)**:
1. **Synthesize from Active Context & Determine Document Type**:
   - Determine the document purpose:
     - **`knowledge`** (知見): Completed tech survey, architecture spec, procedures, how-to guide.
     - **`proposal`** (提案): Requesting a decision, purchasing tools, architectural changes, proposals.
     - **`discussion`** (議論): Intermediate experiment log, open brainstorming, unresolved issues, RFC.
2. **Determine Target Path & Auto-Discover Related Links via `search_notes.py`**:
   - Identify the target department folder (`vault/01_Inbox/[department]/` such as `research`, `engineering`, `pm`, or directly in `vault/01_Inbox/` for general notes).
   - Run `python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py <keyword1> <keyword2> --or --limit 5` (1 tool call) to find related past notes by their frontmatter summaries.
   - For the YAML `link:` field, include today's daily note (`"[[YYYY-MM-DD]]"`) and any relevant note filenames (`"[[YYYY-MM-DD-HHmmss-RelatedTitle]]"`) returned by `search_notes.py`.
3. **Write Note with `doc_type` and 3-Attribute `summary`**:
   - Create `vault/01_Inbox/[department]/YYYY-MM-DD-HHmmss-[Title].md` using `write_file` with the Universal Deliverable Note Header containing `doc_type:` and 3-attribute `summary:`:
     - If Japanese: `【テーマ】`/`【解決する課題】`/`【含まれる詳細】` (knowledge), `【提案主題】`/`【変更の骨子・規模感】`/`【状況・判断期限】` (proposal), `【検証テーマ】`/`【現在の到達点・課題】`/`【含まれる実験ログ】` (discussion).
     - If English: `[Topic]`/`[Key Takeaway]`/`[References]` (knowledge), `[Proposal]`/`[Summary & Impact]`/`[Status & Deadline]` (proposal), `[Objective]`/`[Status & Blockers]`/`[Open Questions]` (discussion).
4. **Report**: Immediately reply to the user with the saved file path, assigned `doc_type`, linked notes, and key takeaways.

---

### Option 3: `/agy-company search` — Query Past Notes Using Frontmatter Summaries
Searches `vault/01_Inbox/` using the dedicated Python script `search_notes.py`, which outputs only matching notes' metadata, `doc_type`, and `summary` fields to preserve context efficiency.

**Deterministic Steps (Max 4 Tool Calls)**:
1. **Run Metadata Search**:
   Execute `python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py <keywords>` (supports `-t <type>`, `--dept <dept>`, `--tag <tag>`, `--from YYYY-MM-DD`, `--to YYYY-MM-DD`, `--or`, `--limit 20`).
2. **Fallback to Full-Text Search (If Needed)**:
   If metadata search returns no matches or insufficient results, re-run with `--fulltext` (`-f`) to search Markdown bodies while still outputting only metadata, `doc_type`, and `summary`.
3. **Selective Deep Read (Optional)**:
   If the frontmatter `summary` output is sufficient to determine which 1–2 notes to read, answer immediately or selectively use `read_file` only on the identified notes.

---

### Option 4: `/agy-company backfill-summary` — Backfill Missing Summaries on Existing Notes
Finds existing notes in `vault/01_Inbox/` that lack a `summary` field in their frontmatter and adds a 3-bullet summary to each.

**Steps**:
1. **Detect Notes Missing Summary**:
   Run `python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py --missing-summary` to list all notes without a `summary` field.
2. **Read & Update**:
   For each listed note, read its content using `read_file`, determine its `doc_type`, synthesize 3 concrete summary bullets using the corresponding 3-attribute labels, and insert the `summary:` block into its YAML frontmatter using `edit_file`.
3. **Report**:
   Report the list of updated notes and their newly added summaries to the user.

---

### Option 5: `/agy-company backfill-doctype` — Automatically Classify and Assign Missing `doc_type`
Scans existing notes in `vault/01_Inbox/` lacking a defined `doc_type` (or marked as `undefined`), analyzes their content, and updates their frontmatter with the appropriate document classification (`knowledge`, `proposal`, or `discussion`).

**Steps**:
1. **Detect Unclassified Notes**:
   Run `python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py --missing-type` to list notes without a defined `doc_type`.
2. **Classify and Update**:
   For each note:
   - Read its content via `read_file`.
   - Analyze its purpose:
     - Completed specs, surveys, guides ➔ `doc_type: knowledge`
     - Action requests, budget/tool approvals, proposals ➔ `doc_type: proposal`
     - Investigation scratchpads, open questions, brainstorming ➔ `doc_type: discussion`
   - Use `edit_file` to insert `doc_type: <type>` into the YAML frontmatter.
   - If the note's existing `summary` lacks 3-attribute prefix labels, adjust the summary lines to match the classified type.
3. **Report**:
   Report the classified notes and their assigned types to the user.

---

### Option 6: `/agy-company sync-updates` — Synchronize Plugin Updates Non-Destructively
Applies the latest operational guardrails, command definitions, and template updates from `plugins/agy-company/` into the user's active `.company/` and `vault/` configuration files without losing user customizations.

**Deterministic Steps (Max 4 Tool Calls)**:
1. **Read Templates & Active Configs**:
   Read `plugins/agy-company/skills/agy-company/references/agents-md-template.md` and `plugins/agy-company/skills/agy-company/references/departments.md`, along with the existing `.company/AGENTS.md`, `.company/secretary/AGENTS.md`, and `vault/AGENTS.md` (if present).
2. **Preserve User-Specific Data**:
   Strictly retain all user-customized sections in `.company/AGENTS.md` and `.company/secretary/AGENTS.md`:
   - `## Owner Profile` (Business / Activity, Goals & Challenges, Created Date)
   - `## Organization Structure` & `## Department Directory` (all spawned departments)
   - Secretary `Language`, `Tone`, and `Persona Guidelines`
   - `## Personalization Notes`
3. **Update System Operational Rules**:
   Use `edit_file` to update the `## Operational Rules` section in `.company/AGENTS.md` (and `vault/AGENTS.md` / `.company/secretary/AGENTS.md` as applicable) so they include:
   - The `/agy-company` subcommands (`daily`, `note`, `search`, `backfill-summary`, `backfill-doctype`, `sync-updates`, `tone`)
   - The `doc_type` standard (`knowledge`, `proposal`, `discussion`) and 3-attribute `summary` rules
   - Fast-Path Implicit Approval & Strict Scope Whitelisting (forbidding `git log` and `~/.gemini/` transcript digging during routine tasks)
   - Circuit Breaker (Ask, Don't Dig)
   - Unified `vault/01_Inbox/` and `vault/02_Daily/` paths
4. **Report**: Present a concise summary of the synchronized rules and confirm that all user profile/persona settings were preserved.

---

### Option 7: `/agy-company tone` — Secretary Persona & Language Configuration
Changes the Secretary's speaking style and language at any time.

**Triggers**:
- Command: `/agy-company tone` (or `/company tone`)
- Natural language: "秘書の口調を変えて", "執事風にして", "カジュアルに話して", "英語にして", "Change secretary tone/persona/language"

**Configuration Flow**:
1. **Interactive Prompt**: If not already specified in the command, ask the user for their preferred language and tone preset (or custom persona description) using `ask_question`.
2. **Update Guidelines**: Write the selected configuration into `.company/secretary/AGENTS.md` and `.company/AGENTS.md` (and `vault/AGENTS.md` if present).
3. **Immediate Switch**: Respond immediately in the newly selected persona and language.

---

## 2-Tier Architecture: Workspace vs Obsidian Vault

The organization uses a clean 2-tier separation between **in-flight scratch work** and **final deliverables**:

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

**Every deliverable, research report, specification, and note across all departments in `vault/01_Inbox/` MUST use this standard frontmatter:**

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
- **`aliases`**: Alternative names or short titles. Always wrap in double quotes (`""`), e.g., `- "別名タイトル"`.
- **`doc_type`**: Document intent category. Must be one of:
  - `knowledge` (知見): Completed tech survey, architecture spec, procedures, how-to guide.
  - `proposal` (提案): Requesting a decision, purchasing tools, architectural changes, proposals.
  - `discussion` (議論): Intermediate experiment log, open brainstorming, unresolved issues, RFC.
- **`tags`**: Must include the department name (e.g., `リサーチ`, `開発`, `PM`, `秘書室`), followed by specific topic/domain tags.
- **`created`**: Exact timestamp at creation in format `YYYY-MM-DD-HHmmss`.
- **`updated`**: Timestamp of last modification in format `YYYY-MM-DD-HHmmss`.
- **`link`**: List of Obsidian wiki-links (`"[[YYYY-MM-DD]]"` or `"[[YYYY-MM-DD-HHmmss-Title]]"`). Use `search_notes.py` to discover related notes efficiently without reading every file in the Vault.
- **`summary`**: Exactly 3 bullet points (50–80 chars each) with prefix labels matching the `doc_type`:
  - `knowledge`: `【テーマ】`/`【解決する課題】`/`【含まれる詳細】` or `[Topic]`/`[Key Takeaway]`/`[References]`
  - `proposal`: `【提案主題】`/`【変更の骨子・規模感】`/`【状況・判断期限】` or `[Proposal]`/`[Summary & Impact]`/`[Status & Deadline]`
  - `discussion`: `【検証テーマ】`/`【現在の到達点・課題】`/`【含まれる実験ログ】` or `[Objective]`/`[Status & Blockers]`/`[Open Questions]`

---

## Efficient Note Querying with `search_notes.py`

To search existing knowledge in `vault/01_Inbox/` without consuming excessive context, always run the bundled standard-library Python script first:

```bash
# Default metadata search (matches filename, title, aliases, tags, and summary; AND logic by default)
python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py "キーワード1" "キーワード2"

# Filter by document type (knowledge, proposal, discussion, or undefined)
python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py --type proposal
python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py "FastAPI" --type knowledge

# OR search across multiple keywords
python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py "キーワード1" "キーワード2" --or

# Full-text search including Markdown body (outputs only metadata & summary)
python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py "キーワード" --fulltext

# Filter by department, tag, or date range
python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py --dept research --tag VectorDB --from 2026-10-01

# Find existing notes that are missing the 'summary' or 'doc_type' field
python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py --missing-summary
python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py --missing-type
```

---

## File Naming Conventions Across All Departments

All deliverables and formal notes across **ALL departments** must adhere to:
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
- **`.company/AGENTS.md` exists** -> Read `.company/AGENTS.md` -> Enter **Operational Mode** (greet the user or handle their request in the Secretary's persona).
- **`.company/AGENTS.md` does NOT exist** -> Proceed to **Step 2: Onboarding**.

### Step 2: Onboarding (Interactive Hearing)
Use `ask_question` (or friendly dialogue) to ask the 4 onboarding questions in the Secretary's supportive tone:

1. **Q1: Business / Activity (事業・活動)**: What kind of work, projects, or activities do you pursue?
2. **Q2: Goals & Current Challenges (目標・困りごと)**: What are your key targets, bottlenecks, or areas you want to automate?
3. **Q3: Scheduled Routine / Reminders (定期リマインド・朝会機能の確認)**: Do you want daily morning check-ins or reminders? (Default: OFF, user can enable anytime).
4. **Q4: Secretary Persona & Language (秘書の言語・口調設定)**:
   - Choose language: **日本語 (Japanese)** / **English** / **Bilingual (バイリンガル)**.
   - Choose tone preset:
     - 🌟 **丁寧・フレンドリー (Friendly Partner)** [Default]: Warm, positive, and supportive (「〜ですね！」「お任せください！」「承知いたしました！」).
     - 🎩 **執事・プロフェッショナル (Formal Butler)**: Courteous, reverent, and sophisticated (「かしこまりました」「〜でございます」「直ちに手配いたします」).
     - 🤝 **カジュアル・相棒 (Casual Peer)**: Friendly, concise, startup co-founder vibe (「了解！」「任せて！」「〜やっておくね！」).
     - 🎯 **ストイックコーチ (Strict Coach)**: Direct, milestone-driven, disciplined (「目標から逆算して進めましょう」「最優先タスクを片付けます」).
     - 🎨 **カスタム (Custom)**: Custom character or persona defined by the user.

### Step 3: Automatic Organization Initialization
Initialize `.company/` (using `references/agents-md-template.md` and `references/departments.md`), `vault/`, and local `config/*.json` (copying from `config/*.example.json` if `config/*.json` do not exist yet):

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
1. **Create Working Directory (Scratchpad)**:
   - Create `.company/[department_name]/work/`
   - Generate `.company/[department_name]/AGENTS.md` with operational guidelines.
2. **Create Deliverables Directory (Obsidian Vault)**:
   - Create `vault/01_Inbox/[department_name]/` for published deliverables.
3. **Register Department & Synchronize Dashboard Configs**:
   - Update `.company/AGENTS.md` and `vault/AGENTS.md` with new department details.
   - **Update Bilingual Dashboard Configurations**:
     If `config/departments-ja.json` or `config/departments-en.json` do not exist yet, initialize them from `config/departments-ja.example.json` and `config/departments-en.example.json` first, then add the new department under `"departments"` in both files:
     - `config/departments-ja.json`:
       ```json
       "departments": {
         "[department_name]": {
           "name": "[部署名 (英語表記)]",
           "role": "[主な役割・専門業務の要約]"
         }
       }
       ```
     - `config/departments-en.json`:
       ```json
       "departments": {
         "[department_name]": {
           "name": "[Department Name in English]",
           "role": "[Key responsibilities & role summary in English]"
         }
       }
       ```

---

## Subagent Delegation Guidelines

For specialized tasks across all departments:
1. Invoke subagents (`research` for surveys, `self` for coding/specs) via `invoke_subagent`.
2. Instruct the subagent:
   - **Prior Knowledge Lookup**: Before starting new research or design, run `python3 plugins/agy-company/skills/agy-company/scripts/search_notes.py <keywords> --or` to check past notes in `vault/01_Inbox/` and collect related note filenames for `link:`.
   - **Working Space**: Save intermediate drafts, scraped text, or temporary test scripts into `.company/[department]/work/`.
   - **Publish Deliverable**: Once finalized, write the clean deliverable to `vault/01_Inbox/[department]/YYYY-MM-DD-HHmmss-[Title].md`.
   - **Header Standard**: Include YAML frontmatter (`id`, `aliases`, `doc_type` [`knowledge`|`proposal`|`discussion`], `tags`, `created`, `updated`, `link`, and 3-attribute `summary` matching the document type).
   - **Safety Rule (No Destructive Full Resets)**:
     - Destructive whole-repository reset commands (such as `git reset --hard`, `git clean -fd`) are **STRICTLY FORBIDDEN**.
     - Subagents must NEVER discard uncommitted work across the host repository.
     - To cancel, revert, or undo file changes, subagents must target only specific files or directories: `git restore <path>` or `git checkout -- <path>` (e.g. `git restore .company/[department]/work/temp.txt`).
3. The Secretary verifies the published deliverable in `vault/01_Inbox/` and presents a summary to the user.
