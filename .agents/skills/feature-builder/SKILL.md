---
name: feature-builder
description: Skill for implementing new features, writing code, creating API endpoints, refactoring, mapping execution flows (flow.md), and enforcing comprehension gatekeeping. Triggered whenever a coding task is requested.
---

# Feature Builder Workflow

Follow this step-by-step procedure for every code implementation or refactoring task:

## Phase 1: Context Gathering
1. **Inspect `/docs`:** Locate and read the relevant documentation files under `/docs` that relate to the target feature (e.g., schemas, endpoints, UI systems).
2. **Check Current Status:** Check `/docs/Current Status.md` or equivalent project tracker to confirm prerequisite modules exist.
3. **Verify Dependencies:** Inspect project manifest files (`package.json`, `pnpm-workspace.yaml`, `requirements.txt`, etc.) to confirm available libraries.

## Phase 2: Architectural Alignment & Decision Logging
1. Compare the requested task against the project's established stack and design patterns found in `/docs`.
2. **Check for Deviations & Consultative Proactivity:**
   * If the task can be completed using established stack libraries, proceed to execution planning.
   * If completing the task requires a new dependency or a structural change not outlined in `/docs`, **STOP** and submit a proposal to the user per the *Consultative Proactivity Rule* in `AGENT.md`.
3. **Decision Logging (`decision.md` Trigger):**
   * If making a meaningful architectural, library, or pattern choice, log the exact reasoning in `decision.md` following the `project-logger` protocol before or alongside code changes.

## Phase 3: Implementation & Execution Flow Mapping
1. **Execution Flow Mapping (`flow.md` Trigger):**
   * **Trigger:** Whenever modifying logic that crosses boundaries between files, functions, or modules.
   * **Behavior:** Maintain/update a `flow.md` file documenting how execution actually travels through the system.
   * **Required Content:**
     * **Entry Point:** Map the initial trigger (API route handler, event listener, main function, CLI command).
     * **Execution Sequence:** Document the exact call hierarchy (`File A -> Function B -> Module C`).
     * **Modified Scope:** Explicitly highlight which specific step or node in the execution flow is modified in the current session.
     * **Cross-Boundary Analysis:** Identify data transformations and boundary gaps between files where bugs can hide.
2. **Code Execution:**
   * Implement the feature using minimal custom boilerplate, leveraging chosen project libraries.
   * Ensure strict typing, environment variable validation, and consistent error handling across changed files.
   * Execute local linters, typechecks, or test suites to verify the build.

## Phase 4: Verification, Hand-off & The Comprehension Gatekeeper
1. **Documentation Update:** Update affected files inside `/docs/` to reflect schema modifications, new API routes, or updated parameters (use Obsidian wiki links or relative markdown links).
2. **The Comprehension Gatekeeper (Mandatory Verification Gate):**
   * **Trigger:** Before finalizing any complex code change or significant implementation.
   * **Behavior:** Invoke the `comprehension-gatekeeper` skill to verify user understanding of the newly written code before accepting or declaring completion.
   * **Rule:** Do NOT skip this step or proceed based solely on existing documentation.
