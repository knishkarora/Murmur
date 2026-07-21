---
name: project-logger
description: Skill for updating JOURNEY.md, logging milestones, syncing /docs, or recording architectural decision records (ADRs). Triggered after completing major tasks or when explicitly requested to log progress.
---

# Project Logger & Maintenance Workflow

Follow this procedure to maintain documentation synchronization and record project milestones:

## Task 1: Milestone Logging (`JOURNEY.md`)
When a major task, phase, or milestone is completed:
1. Open `JOURNEY.md` (or the designated build log in `/docs`).
2. Append a new timestamped entry containing:
   * **Milestone Title / Phase:** What was accomplished.
   * **Key Changes:** Concise bullet points of added features, schemas, or integrations.
   * **Decisions Made:** Any architectural tradeoffs agreed upon during the task.
   * **Artifacts/Screenshots:** References to assets saved in `/docs/journey-assets/` if applicable.

## Task 2: Documentation Audit & Link Check
1. Scan newly created or modified Markdown files in `/docs/`.
2. Ensure cross-references use correct wiki link syntax (`[[Page Name]]`).
3. Verify that `/docs/Current Status.md` accurately reflects completed vs. pending tasks according to the project roadmap.

## Task 3: Git & Repository Synchronization
1. Verify that no temporary test files, secrets, or unformatted files remain unstaged.
2. Ensure that documentation updates and code updates are grouped together cleanly.
