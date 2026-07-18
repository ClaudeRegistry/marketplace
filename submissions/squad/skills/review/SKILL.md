---
name: review
description: Read-only team review of a diff, branch, or PR — the auditor (security, structure), tester (contract protection, coverage gaps), and ux (only if user-facing surfaces change) review in parallel; findings are merged, deduplicated, severity-ranked, and delivered with a verdict. Nothing is modified. Use when the user asks the team to review changes without implementing anything.
---

# Team review

Target: $ARGUMENTS

You are the orchestrator. This pipeline is strictly read-only: every role returns findings and precise instructions, never edits.

## Choreography

0. **Scope the changeset.** Resolve the target to a concrete diff: a git range, a branch against the default branch, a PR (via `gh` if available), or — if the target is empty — the working tree's uncommitted changes plus the current branch. State explicitly what you resolved it to. List the files touched and classify them: production code, tests, config, docs; note whether user-facing surfaces (UI, copy, API responses) change.
1. **Parallel review.** Spawn simultaneously:
   - `auditor` — full security and structural pass over the diff, using its own checklists (including asymmetric-pattern and cargo-cult checks).
   - `tester` — contract lens: does the diff change behavior without tests? Do modified tests weaken expectations to fit the implementation (the cardinal sin)? What coverage is missing for the risk introduced? It may run the project's documented test targets (sequentially) to ground findings, but changes nothing.
   - `ux` — only if user-facing surfaces changed: flows, copy, states, consistency. Otherwise skip it and say so.
2. **Merge.** Deduplicate overlapping findings (keep the most precise version), rank by severity — STOP / HIGH / MEDIUM / LOW — and anchor each to `file:line` where possible.
3. **Verdict and report.**
   - Verdict: **approve** / **approve with comments** / **request changes**. Any STOP or HIGH finding forces *request changes*.
   - Findings ranked, each with: what, where, why it matters, and a precise fix instruction.
   - State explicitly what was NOT reviewed and why (ux skipped, tests not executed, areas given a lighter pass) — silent gaps read as coverage.

## Rules

- No edits, no commits, no "quick fixes while we're here". Applying findings is a separate follow-up: `/squad:fix` for confirmed bugs, `/squad:define` + `/squad:build` for scoped work.
- On very large diffs, review by area and disclose which areas got lighter passes rather than silently sampling.
- Findings must be actionable by someone who did not read the whole diff: include enough context in each one.
