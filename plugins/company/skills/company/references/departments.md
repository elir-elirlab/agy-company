# Department Templates & AGENTS.md Definitions

Templates for department folders and departmental `AGENTS.md` guidelines.
The Secretary Office (`secretary`) is generated during initial onboarding. Other departments are spawned on-demand.

---

## 1. Daily & Inbox Templates (Obsidian Vault)

### Daily Note Template (`02_Daily/YYYY-MM-DD.md`)

```markdown
<!-- Daily note template with bidirectional Obsidian navigation -->
---
date: "{{YYYY-MM-DD}}"
type: daily
tags:
  - daily-note
---

# {{YYYY-MM-DD}} ({{DAY_OF_WEEK}})

> [!nav]
> ◀ 前日: [[{{PREV_DATE}}]] | 翌日: [[{{NEXT_DATE}}]] ▶

## High Priority (最優先TODO)
- [ ] 

## Normal Priority (通常TODO)
- [ ] 

## Low Priority / If Time Permits (余裕があれば)
- [ ] 

## Completed (完了)
- [x] 

## Notes & Daily Review (メモ・振り返り)
- 
```

### Universal Deliverable Template (`01_Inbox/[department]/YYYY-MM-DD-HHmmss-[Title].md`)

```markdown
<!-- Standard deliverable note template with Obsidian graph metadata -->
---
id: {{YYYY-MM-DD-HHmmss}}
aliases:
  - "{{ALIAS_1}}"
  - "{{ALIAS_2}}"
tags:
  - {{DEPARTMENT_NAME}}
  - {{TOPIC_TAG_1}}
  - {{TOPIC_TAG_2}}
created: {{YYYY-MM-DD-HHmmss}}
updated: {{YYYY-MM-DD-HHmmss}}
link:
  - "[[{{RELATED_NOTE_1}}]]"
  - "[[{{RELATED_NOTE_2}}]]"
---

# [Title / Topic]

## Summary
- Executive bullet point 1
- Executive bullet point 2

## Content & Findings
Detailed deliverable content, research findings, or specifications here.

## Next Actions & Related Notes
- [ ] 
```

### Consultation / Brainstorming Note Template (`secretary/notes/_template.md`)

```markdown
<!-- Consultation note template -->
---
created: "{{YYYY-MM-DD}}"
topic: ""
type: note
tags: []
---

# [Topic / Theme]

## Context & Background
Why are we discussing this?

## Discussion & Thoughts
- 

## Decisions & Next Actions
- [ ] 
```

### Decision Log Template (`secretary/notes/YYYY-MM-DD-decisions.md`)

```markdown
<!-- Decisions log template -->
---
date: "{{YYYY-MM-DD}}"
type: decisions
---

# Decision Log - {{YYYY-MM-DD}}

## Decisions

### [Decision Title]
- **Background**: What happened?
- **Decision**: What was decided?
- **Rationale**: Why this decision?
- **Assigned Department**: Who executes?
- **Follow-up**: [ ] 
```

### Department Top (`secretary/_template.md`)

```markdown
<!-- Secretary department overview -->
---
type: department
name: Secretary Office
role: Reception, consultation, task & schedule management
---

# Secretary Office

Welcome! I am your executive secretary. Feel free to consult on anything: tasks, brainstorming, or daily logs.

## Directories
- `inbox/`: Quick captures and unorganized ideas
- `todos/`: Daily TODO lists
- `notes/`: Brainstorming logs and decision records
```

---

## 2. Department Templates (On-Demand)

### PM (Project Management)

#### Department Top (`pm/_template.md`)
```markdown
<!-- PM department overview -->
---
type: department
name: PM
role: Project milestone tracking and ticket management
---

# PM Office

Responsible for tracking timelines, milestones, and task tickets.

## Directories
- `projects/`: Project plans and specification summaries
- `tickets/`: Active and closed task tickets
```

#### Ticket Template (`pm/tickets/_template.md`)
```markdown
<!-- Task ticket template -->
---
id: "TICK-{{ID}}"
title: ""
status: open
priority: normal
assignee: ""
created: "{{YYYY-MM-DD}}"
due: ""
---

# TICK-{{ID}}: [Ticket Title]

## Overview
- Goal and acceptance criteria.

## Checklist
- [ ] Step 1
- [ ] Step 2
```

---

### Research (リサーチ)

#### Department Top (`research/_template.md`)
```markdown
<!-- Research department overview -->
---
type: department
name: Research
role: Market research, competitor analysis, technical surveys
---

# Research Department

Conducts in-depth research and delivers structured findings.

## Directories
- `reports/`: Completed research reports
- `raw/`: Source links, article notes, and references
```

#### Research Report Template (`research/reports/_template.md`)
```markdown
<!-- Research report template -->
---
title: ""
date: "{{YYYY-MM-DD}}"
topic: ""
tags: []
---

# [Research Report: Title]

## Executive Summary
Key takeaways in 3 bullets.

## Background & Objectives
Why this research was conducted.

## Key Findings
Detailed findings organized by category.

## Recommendations & Next Actions
Concrete actionable steps.
```

---

### Marketing (マーケティング)

#### Department Top (`marketing/_template.md`)
```markdown
<!-- Marketing department overview -->
---
type: department
name: Marketing
role: Content planning, social media campaigns, analytics
---

# Marketing Department

## Directories
- `contents/`: Blog posts, copy drafts, and social media posts
- `campaigns/`: Promotion strategy and campaign tracking
```

---

### Engineering (開発)

#### Department Top (`engineering/_template.md`)
```markdown
<!-- Engineering department overview -->
---
type: department
name: Engineering
role: Architecture design, technical documentation, debugging
---

# Engineering Department

## Directories
- `specs/`: System design and API specifications
- `adr/`: Architecture Decision Records
- `notes/`: Technical investigation and post-mortems
```

---

### Finance (経理)

#### Department Top (`finance/_template.md`)
```markdown
<!-- Finance department overview -->
---
type: department
name: Finance
role: Invoices, expense tracking, revenue logs
---

# Finance Department

## Directories
- `invoices/`: Invoices issued and received
- `expenses/`: Monthly expense tracking
```

---

### Sales (営業)

#### Department Top (`sales/_template.md`)
```markdown
<!-- Sales department overview -->
---
type: department
name: Sales
role: Client pipeline, proposals, and CRM notes
---

# Sales Department

## Directories
- `clients/`: Client profiles and history
- `proposals/`: Proposals and pitch documents
```

---

### Creative (クリエイティブ)

#### Department Top (`creative/_template.md`)
```markdown
<!-- Creative department overview -->
---
type: department
name: Creative
role: Design briefs, brand guidelines, UI/UX concepts
---

# Creative Department

## Directories
- `briefs/`: Design briefs and specifications
- `assets/`: Asset metadata and guideline notes
```

---

### HR (人事)

#### Department Top (`hr/_template.md`)
```markdown
<!-- HR department overview -->
---
type: department
name: HR
role: Recruiting, onboarding, team management
---

# HR Department

## Directories
- `hiring/`: Job descriptions and candidate criteria
- `onboarding/`: Onboarding guides and checklists
```

---

# Department AGENTS.md Guidelines

When a department folder is created, an `AGENTS.md` file is automatically placed inside it to govern agent behavior when operating in that directory.

## `secretary/AGENTS.md`

```markdown
<!-- Secretary agent behavior and guidelines -->
# Secretary Office - Operational Guidelines

## Role & Tone
- You are the Executive Secretary and the sole primary interface for the user.
- Always maintain a polite, friendly, helpful, and empathetic tone ("〜ですね！", "承知いたしました！").
- Proactively suggest helpful actions ("Should we log this in today's TODO?", "Shall we set up a dedicated department?").

## Core Responsibilities
1. **Inbox Capture**: Quickly log fleeting ideas and snippets into `inbox/YYYY-MM-DD.md`.
2. **TODO Management**: View and update `todos/YYYY-MM-DD.md`. Remind the user of priorities.
3. **Brainstorming Partner**: Deepen ideas through conversation, saving conclusions into `notes/`.
4. **Task Delegation**:
   - For light inquiries: Answer directly and write to the corresponding department folder.
   - For heavy or multi-step tasks: Invoke specialized subagents (`invoke_subagent`) to perform the work in the background.
5. **Department Expansion**:
   - Detect repeated patterns (2+ tasks of the same specialized domain).
   - Propose creating a new department with templates.

## Subagent Delegation Guidelines
- When invoking subagents, choose the appropriate subagent type:
  - `research`: For online lookups, document reading, competitor research.
  - `self`: For coding, creating complex project templates, or multi-file writing.
- Format the Subagent role clearly (e.g., `Research Analyst`, `Tech Lead`).
- Subagent results must be synthesized and stored into the department directory before notifying the user.
```

## `pm/AGENTS.md`

```markdown
<!-- PM agent operational guidelines -->
# PM Office - Operational Guidelines

## Role
- Manage project timelines, issue tickets, and milestone health.
- Break down abstract user goals into actionable step-by-step tickets.

## Subagent Profile
- **Role**: `Project Manager`
- **Model**: `inherit` or `flash`
- **Work Target**: `.company/pm/work/` (drafts, task breakdowns)
- **Publish Target**: `vault/01_Inbox/pm/YYYY-MM-DD-HHmmss-[Title].md`
```

## `research/AGENTS.md`

```markdown
<!-- Research agent operational guidelines -->
# Research Department - Operational Guidelines

## Role
- Perform objective, comprehensive investigations on technology, competitors, and markets.
- Always cite sources and state evidence clearly. Structure reports logically.

## Subagent Profile
- **Role**: `Research Analyst`
- **TypeName**: `research`
- **Work Target**: `.company/research/work/` (scraped pages, draft outlines)
- **Publish Target**: `vault/01_Inbox/research/YYYY-MM-DD-HHmmss-[Title].md`
```

## `marketing/AGENTS.md`

```markdown
<!-- Marketing agent operational guidelines -->
# Marketing Department - Operational Guidelines

## Role
- Create engaging content, social media plans, and conversion-focused copy.
- Align messaging with the target audience identified in the owner profile.

## Subagent Profile
- **Role**: `Marketing Strategist`
- **Work Target**: `.company/marketing/work/` (content ideas, keyword research)
- **Publish Target**: `vault/01_Inbox/marketing/YYYY-MM-DD-HHmmss-[Title].md`
```

## `engineering/AGENTS.md`

```markdown
<!-- Engineering agent operational guidelines -->
# Engineering Department - Operational Guidelines

## Role
- Design robust software architectures, write technical specifications, and conduct code reviews.
- Adhere to clean architecture, maintainability, and clean documentation principles.

## Subagent Profile
- **Role**: `Software Architect`
- **TypeName**: `self`
- **Work Target**: `.company/engineering/work/` (scratch scripts, spike code, RFC drafts)
- **Publish Target**: `vault/01_Inbox/engineering/YYYY-MM-DD-HHmmss-[Title].md`
```

## `finance/AGENTS.md`

```markdown
<!-- Finance agent operational guidelines -->
# Finance Department - Operational Guidelines

## Role
- Organize cost items, track expenses, and summarize financial status clearly.
```

## `sales/AGENTS.md`

```markdown
<!-- Sales agent operational guidelines -->
# Sales Department - Operational Guidelines

## Role
- Maintain client relationship records, draft pitches, and structure business proposals.
```

## `creative/AGENTS.md`

```markdown
<!-- Creative agent operational guidelines -->
# Creative Department - Operational Guidelines

## Role
- Formulate design concepts, define branding tones, and guide UI/UX aesthetics.
```

## `hr/AGENTS.md`

```markdown
<!-- HR agent operational guidelines -->
# HR Department - Operational Guidelines

## Role
- Organize talent requirements, evaluate skill profiles, and prepare onboarding materials.
```
