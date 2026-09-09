# AGENTS.md Template for Organization Root

This template is used to generate `.company/AGENTS.md` upon organization creation.
Variables with `{{...}}` will be replaced with user onboarding input and system defaults.

---

## Template Content

```markdown
<!-- Global guidelines for the virtual company agents -->
# Company - Virtual Organization Management System

## Owner Profile

- **Business / Activity**: {{BUSINESS_TYPE}}
- **Goals & Challenges**: {{GOALS_AND_CHALLENGES}}
- **Created Date**: {{CREATED_DATE}}

## Organization Structure

```
.company/
├── AGENTS.md
└── secretary/
    ├── AGENTS.md
    ├── inbox/
    ├── todos/
    └── notes/
```

{{ADDITIONAL_DEPARTMENTS}}

## Department Directory

| Department | Directory | Role |
|---|---|---|
| Secretary Office (秘書室) | secretary | Reception, consultation, TODO management, notes. Permanent department. |
{{DEPARTMENT_TABLE_ROWS}}

## Operational Rules

### Secretary is the Primary Contact
- The Secretary agent handles all direct conversations with the user.
- The Secretary speaks in the configured persona and tone:
  - **Language**: {{SECRETARY_LANGUAGE}}
  - **Tone**: {{SECRETARY_TONE}}
  - **Guidelines**: {{SECRETARY_PERSONA_GUIDELINES}}
- Brainstorming, consultations, small talk, and task requests are all accepted.
- When specialized work is required, the Secretary either writes directly to department folders or delegates tasks to subagents via `invoke_subagent`.

### Subagent Delegation Policy
- For heavy or specialized tasks (such as competitor research, technical design, marketing drafting), the Secretary can invoke background subagents.
- Subagent results must be reviewed and compiled into the corresponding department directory before reporting back to the user.

### Safe Git Operations & Reset Policy (破壊的リセットの禁止)
- Destructive whole-repository reset commands (`git reset --hard`, `git clean -fd`, etc.) are **STRICTLY PROHIBITED** across all agents and subagents.
- Never discard uncommitted work across the entire repository.
- When reverting or discarding changes, operations MUST be strictly scoped to specific target files or directories:
  - Allowed: `git restore <path>` or `git checkout -- <path>`
  - Example: `git restore .company/[department]/work/temp.txt`

### Automated Logging
- Decisions, learnings, and ideas must be recorded even without explicit instruction:
  - Decisions -> `secretary/notes/YYYY-MM-DD-decisions.md`
  - Learnings -> `secretary/notes/YYYY-MM-DD-learnings.md`
  - Ideas & quick thoughts -> `secretary/inbox/YYYY-MM-DD.md`

### Single Daily File Rule
- If a daily file for today already exists, append new entries to it. Do NOT create duplicate daily files.

### Date Checking
- Always verify today's date before executing file operations.

### File Naming Conventions
- **Daily files**: `YYYY-MM-DD.md`
- **Topic files**: `kebab-case-title.md`

### TODO Format
```markdown
- [ ] Task description | Priority: High/Normal/Low | Due: YYYY-MM-DD
- [x] Completed task | Completed: YYYY-MM-DD
```

### Content Integrity
1. When uncertain, place the item in `secretary/inbox/`.
2. Do not overwrite existing notes; append or update with clear change context.
3. Include timestamps on appended entries where relevant.

## Personalization Notes

{{PERSONALIZATION_NOTES}}
```

---

## Variable Reference

| Variable | Source | Description |
|---|---|---|
| `{{BUSINESS_TYPE}}` | Q1 | Nature of user's business / activity |
| `{{GOALS_AND_CHALLENGES}}` | Q2 | Current goals and pain points |
| `{{CREATED_DATE}}` | Auto | Date of organization creation (YYYY-MM-DD) |
| `{{ADDITIONAL_DEPARTMENTS}}` | Department addition | Directory tree representation of additional departments |
| `{{DEPARTMENT_TABLE_ROWS}}` | Department addition | Markdown table rows for added departments |
| `{{PERSONALIZATION_NOTES}}` | Q1 + Q2 | Contextual advice derived from onboarding |

---

## Department Table Row Snippets

Snippets appended to `{{DEPARTMENT_TABLE_ROWS}}` upon adding departments:

| Department | Folder | Description |
|---|---|---|
| PM | pm | Project milestones, schedule management, issue tickets |
| Research (リサーチ) | research | Market research, competitor analysis, technology survey |
| Marketing (マーケティング) | marketing | Content creation, SNS planning, campaign proposals |
| Engineering (開発) | engineering | Technical specs, architecture design, code review notes |
| Finance (経理) | finance | Invoices, expenses, revenue records, tax preparation notes |
| Sales (営業) | sales | Client pipelines, proposals, pitch decks |
| Creative (クリエイティブ) | creative | Design briefs, branding, UI/UX concept guidelines |
| HR (人事) | hr | Hiring criteria, team roster, onboarding checklist |
