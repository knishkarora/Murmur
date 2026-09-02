---
name: project-logger
description: Skill for updating JOURNEY.md, logging milestones, syncing /docs, and recording decision logs (decision.md). Triggered whenever architectural choices occur or major tasks complete.
---

# Project Logger & Decision Recording Workflow

Follow this procedure to maintain documentation synchronization, record project milestones, and log immutable architectural decisions:

## Task 1: Decision Logging (`decision.md`)
**Trigger:** Whenever making a meaningful architectural, library, or pattern choice while modifying code.

**Behavior:** Document the rationale in `decision.md` at the project root (or designated docs location). Code shows *what* changed; `decision.md` strictly documents *why*.

### Required Entry Structure:
For every decision, append an entry with the following format:
```markdown
## [YYYY-MM-DD] Decision: <Concise Title of Decision>

* **Context & Scope:** What feature, module, or task prompted this choice.
* **Choice Made:** The specific library, framework, design pattern, or architecture selected.
* **Rationale (Why over What):**
  * Why this approach was chosen over alternatives.
  * Why a specific library was selected over competing options.
  * Why a specific design pattern (e.g., Factory, Strategy, Adapter) was applied.
* **Tradeoffs Accepted:**
  * Specific trade-offs accepted (e.g., bundle size vs. developer velocity, flexibility vs. complexity).
  * Why these tradeoffs are acceptable for this project.
* **Immutability Status:** Settled & Immutable (prevents re-litigating settled arguments in the future).
```

---

## Task 2: Milestone Logging (`JOURNEY.md`)
When a major task, phase, or milestone is completed:
1. Open `JOURNEY.md` (or the designated build log in `/docs`).
2. Append a new timestamped entry containing:
   * **Milestone Title / Phase:** What was accomplished.
   * **Key Changes:** Concise bullet points of added features, schemas, or integrations.
   * **Decisions Made:** References to entries created in `decision.md`.
   * **Artifacts/Screenshots:** References to assets saved in `/docs/journey-assets/` if applicable.

---

## Task 3: Documentation Audit & Link Check
1. Scan newly created or modified Markdown files in `/docs/`.
2. Ensure cross-references use correct wiki link syntax (`[[Page Name]]`).
3. Verify that `/docs/Current Status.md` accurately reflects completed vs. pending tasks according to the project roadmap.

---

## Task 4: Git & Repository Synchronization
1. Verify that no temporary test files, secrets, or unformatted files remain unstaged.
2. Ensure that decision logs (`decision.md`), documentation updates, and code updates are grouped together cleanly.
