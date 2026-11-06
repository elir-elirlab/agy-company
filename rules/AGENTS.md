<!-- Plugin operational rules for agy-company (Virtual Organization & Obsidian Cockpit) -->
# Antigravity Company Rules (agy-company)

Operational rules and boundaries when `agy-company` is active in a workspace.

## 1. Overview & Triggers
`agy-company` runs a virtual organization led by an Executive Secretary agent with local Obsidian Vault sync.
- **Slash Commands**: `/agy-company [cmd]` (or `/company [cmd]`): `daily`, `note`, `search`, `backfill-summary`, `backfill-doctype`, `sync-updates`, `tone`, `dashboard`.
- **Natural Language**: Requests to the Secretary ("秘書", "秘書さん"), task management ("TODO", "デイリーノート"), notes ("ノートにまとめて"), search ("過去のノートを探して"), dashboard ("ダッシュボード"), or department delegations.

---

## 2. Core Execution Protocol: Fast-Path vs Slow-Path

### 2.1 Fast-Path (Routine Operations — Pre-Approved)
Applies to the 8 deterministic subcommands and routine Secretary queries.
1. **Implicit Approval**: Command execution is pre-approved. Proceed immediately without pausing for plan confirmation.
2. **Strict Scope Whitelisting**: Access is strictly limited to `<vault_dir>` (default `vault/`), `.company/` (including `.company/.config/`), `<config_dir>` (default `config/`), and `<PLUGIN_ROOT>`/`<SKILL_DIR>`.
   - **Strictly Forbidden**: Calling `git log`, `git show`, `.git/`, or reading session transcripts (`~/.gemini/antigravity-cli/brain/` or `transcript.jsonl`) is strictly forbidden.
3. **Circuit Breaker**: If not completed within **4 tool calls**, STOP calling tools and ask a 1-sentence question. Never dig into git history or session logs.

### 2.2 Slow-Path (Complex & Multi-File Tasks)
Applies to `invoke_subagent` (research, engineering), spawning departments, or editing project code outside `.company/` and `vault/`. Standard workspace planning rules apply.

---

## 3. 2-Tier Architecture & File Boundaries
- **`.company/` (Host Repo, Git-tracked)**: Scratchpads (`.company/[department]/work/`), Secretary notes (`.company/secretary/`), and workspace configs (`.company/AGENTS.md`).
- **`vault/` (Obsidian Vault)**: Clean published deliverables (`vault/01_Inbox/[department]/YYYY-MM-DD-HHmmss-[Title].md`) and daily notes (`vault/02_Daily/YYYY-MM-DD.md`). Never place temporary work in `vault/`.

---

## 4. Deliverable Frontmatter Standard
All notes in `vault/01_Inbox/` require YAML frontmatter:
```yaml
---
id: YYYY-MM-DD-HHmmss
aliases: ["Alternate Title"]
doc_type: knowledge # knowledge | proposal | discussion
tags: [Department, Domain]
created: YYYY-MM-DD-HHmmss
updated: YYYY-MM-DD-HHmmss
link: ["[[YYYY-MM-DD]]", "[[YYYY-MM-DD-HHmmss-RelatedNote]]"]
summary:
  - "Prefix 1: Summary line 1"
  - "Prefix 2: Summary line 2"
  - "Prefix 3: Summary line 3"
---
```
### Document Types & 3-Attribute Summary Labels
- **`knowledge`** (知見): `【テーマ】`/`【解決する課題】`/`【含まれる詳細】` (EN: `[Topic]`/`[Key Takeaway]`/`[References]`)
- **`proposal`** (提案): `【提案主題】`/`【変更の骨子・規模感】`/`【状況・判断期限】` (EN: `[Proposal]`/`[Summary & Impact]`/`[Status & Deadline]`)
- **`discussion`** (議論): `【検証テーマ】`/`【現在の到達点・課題】`/`【含まれる実験ログ】` (EN: `[Objective]`/`[Status & Blockers]`/`[Open Questions]`)

---

## 5. Safety Guardrails (No Destructive Git Resets)
- **Destructive Resets Prohibited**: Whole-repository reset commands (`git reset --hard`, `git clean -fd`) are **STRICTLY FORBIDDEN**.
- **Scoped File Reversion**: Always scope file reversions strictly to specific file paths (e.g., `git restore <path>`).
