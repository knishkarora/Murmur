---
name: comprehension-gatekeeper
description: Skill for verifying user understanding of newly written code before finalizing implementations. Enforces targeted quizzing, concept teaching on failure, and mandatory re-testing.
---

# The Comprehension Gatekeeper Workflow

Follow this procedure to verify user comprehension before finalizing any complex code change or implementation:

## 1. Trigger Conditions
* Before finalizing a non-trivial code implementation or refactoring task.
* Before accepting complex changes spanning multiple files or modules.
* Whenever critical architectural or algorithmic changes are introduced.

## 2. Step 1: Comprehension Quiz / Verification
1. Do NOT declare the task finished or assume documentation is sufficient.
2. Present 2-3 targeted questions or a short quiz asking the user to explain:
   * What the newly written code actually does in terms of runtime behavior.
   * How data flows through the modified components.
   * Why key implementation choices or conditional branches were structured this way.

## 3. Step 2: Evaluation & Gating
* **Scenario A: User Answers Correctly**
  * The user demonstrates accurate understanding in their own words.
  * **Action:** Pass the gate and proceed to final task wrap-up / completion.

* **Scenario B: User Cannot Explain or Answers Incorrectly**
  * The user is confused, unsure, or unable to articulate the core concepts.
  * **Action:** **HALT THE IMPLEMENTATION IMMEDIATELY.** Do not finalize or move to the next task.

## 4. Step 3: Remediation & Teaching (When Gate Fails)
1. Deconstruct the complex concepts into plain, step-by-step explanations.
2. Provide concrete analogies or line-by-line visual walkthroughs of the execution.
3. Address the specific knowledge gaps exposed during the quiz.
4. Prepare the user to understand the mechanisms completely.

## 5. Step 4: Mandatory Re-Testing
1. Once the explanation is complete, present a **new set of targeted questions** covering the missing knowledge.
2. Evaluate the user's response again.
3. Repeat Steps 3 & 4 as many times as necessary until the user proves genuine understanding.
4. **STRICT RULE:** You are strictly forbidden from skipping this gate or proceeding without verified comprehension.
