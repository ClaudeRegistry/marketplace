---
description: Given a task, find the exact files and functions to edit plus tests to update
argument-hint: [task description]
model: inherit
---

Answer the hardest question in a large codebase: "where do I even make this change?" Describe the task in `$ARGUMENTS` (e.g. "add a 'remember me' checkbox to login", "rate-limit the export endpoint", "surface the invoice PDF in the account page") and get back a ranked list of the precise edit sites, files, functions, modules, plus the tests to update, each with a one-line rationale.

## Process

### Step 1: Frame the task
- Restate `$ARGUMENTS` as the concrete capability to add or change. Extract the domain nouns (models/entities), verbs (actions), and surfaces (UI screen, API route, CLI command, job) it implies.
- If the task is ambiguous about which surface it touches (UI vs API vs background job), note the assumption you'll search under rather than stalling.

### Step 2: Localize
**Launch the change-locator agent** with the task. It greps for the relevant feature/route/model by the domain vocabulary, follows imports and references across layers, and identifies the specific files and functions where the change belongs plus the tests that cover them. This is a cheap, read-only, parallelizable exploration, it never modifies code.

### Step 3: Report
The output is a ranked list. For each edit site:

| Rank | File:line | Symbol (function/class/module) | Why it's an edit site |
|------|-----------|-------------------------------|-----------------------|

Then:
- **Tests to update**: the specific test files/cases that will need to change or be added, with `file:line`.
- **Risks & edge cases**: shared code paths, feature flags, migrations, or callers that make this change wider than it looks.
- **Suggested order**: the sequence to touch the sites (e.g. model → service → route → UI → tests) so the change stays coherent.

## Important Notes
- Every edit site must be grounded in a real symbol at a real `file:line`: never guess a path that doesn't exist. If the feature genuinely isn't present yet, say where the analogous existing feature lives as the template to copy.
- Rank by confidence: the file that most obviously owns the behavior first, speculative sites last, each labeled with its rationale.
- Include the tests. A change isn't localized until you know which tests assert the current behavior.
- This is localization, not implementation, do not write the change here. Point precisely; let the user (or a follow-up) make the edit.
