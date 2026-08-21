---
name: feature-builder
description: Skill for implementing new features, writing code, creating API endpoints, or performing refactoring tasks. Triggered whenever a coding task is requested.
---

# Feature Builder Workflow

Follow this step-by-step procedure for every code implementation or refactoring task:

## Phase 1: Context Gathering
1. **Inspect `/docs`:** Locate and read the relevant documentation files under `/docs` that relate to the target feature (e.g., schemas, endpoints, UI systems).
2. **Check Current Status:** Check `/docs/Current Status.md` or equivalent project tracker to confirm prerequisite modules exist.
3. **Verify Dependencies:** Inspect project manifest files (`package.json`, `pnpm-workspace.yaml`, `requirements.txt`, etc.) to confirm available libraries.

## Phase 2: Architectural Alignment & Consultation
1. Compare the requested task against the project's established stack and design patterns found in `/docs`.
2. **Check for Deviations:**
   * If the task can be completed using established stack libraries, proceed to Phase 3.
   * If completing the task requires a new dependency or a structural change not outlined in `/docs`, **STOP** and submit a proposal to the user per the *Consultative Proactivity Rule* in `agent.md`.

## Phase 3: Implementation Execution
1. Implement the feature using minimal custom boilerplate, leveraging chosen project libraries.
2. Ensure strict typing, environment variable validation, and consistent error handling across changed files.
3. Execute local linters, typechecks, or test suites (via MCP tools or terminal) to verify the build.

## Phase 4: Documentation & Hand-off
1. Update affected files inside `/docs/` to reflect any schema modifications, new API routes, or updated parameters, ensuring all new/modified source files are linked via Obsidian wiki links or relative markdown links (never use absolute `file:///` paths).
2. Summarize the changes concisely for the user, highlighting modified files and any required manual testing steps.
