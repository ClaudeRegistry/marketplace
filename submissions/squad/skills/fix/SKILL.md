---
name: fix
description: Bug-fix pipeline, reproduce-first — the tester captures the bug as a failing test BEFORE the developer may touch production code, then verifies the fix and scans for sibling occurrences of the same defect. Accepts an informal report or a screenshot and clarifies interactively in the main session first; when the bug genuinely cannot be reproduced up front, falls back to writing the regression test right after the fix. Use when the user reports a bug, regression, or broken behavior and wants the team to fix it.
---

# Team fix

Bug report: $ARGUMENTS (plus any screenshots pasted in the conversation)

You are the orchestrator. One principle drives this pipeline: **a bug that is not reproduced is a rumor, and a fix without a failing test is a cover-up.** Reproduce-first is the rule — no production code changes until a red test exists — with a single explicit, human-gated exception (step 2).

## Intake (main session, only when the report is informal)

If the bug arrived as a screenshot or a few loose sentences, close the brief HERE, in your own session, before spawning anyone — clarification is a conversation (a subagent relay would be slow and lossy) and subagents never see the conversation's images, so a screenshot's facts must be extracted by you into text first.

- **Ingest.** Extract every fact from the report and screenshots: literal error messages, UI state, visible data, environment hints. Read the project's context (`CLAUDE.md`, `README.md`, overview command if documented).
- **Investigate before asking.** Locate the affected area in the code and form a hypothesis. Never ask the user something the code, the logs, or the screenshot already answer.
- **Clarify in small rounds.** Ask ONLY what still blocks the fix — 2–3 questions per round, each with your best-guess answer attached so the user can confirm or correct — then stop as soon as the brief closes. The brief is closed when it has: expected behavior (the contract), actual behavior, reproduction path, suspected area, and a "fixed when …" acceptance line. Show it compactly for one confirmation — a nod, not a negotiation. If the user prefers to fix later, save the brief to `specs/bugs/<slug>.md` and stop; this skill resumes from that file.

A precise report needs no intake — go straight to the choreography.

## Choreography

0. **Context.** Read `CLAUDE.md` and `README.md` if present; if the project documents a system-overview command (e.g. a `make info` target), run it. Pass the relevant slice to every agent you spawn.
1. **Reproduce — `tester` leads.** Spawn the tester with the report/brief and context. Its mission: reproduce the bug and capture it as the smallest failing automated test (or, when automation is genuinely impossible, a precise manual reproduction procedure — flagged as such). It also diagnoses the affected contract: is this actually a bug (behavior diverges from the contract) or a contract-change request in disguise?
2. **GATE — human confirms.** Present: reproduction evidence, the failing test (path and name), the affected contract, and the tester's diagnosis. Exits:
   - Confirmed bug, reproduced as a red test → continue, reproduce-first.
   - Confirmed bug, but genuinely not reproducible up front (needs live/prod state) → the explicit exception: proceed to the fix and write the regression test AFTER, as a receipt that would have failed before it. The gate must say this out loud; the human owns the call.
   - Intended behavior / feature request in disguise → stop and offer `/squad:define` to spec it (it closes quickly for small scopes) followed by `/squad:build`.
   - Nothing reproduced and no path forward → stop; report what was tried and exactly what information is missing.
3. **Fix — `developer`.** Spawn with the failing-test reference (or the confirmed brief, in the exception), the tester's diagnosis, and a minimal-fix mandate: make the failing test pass WITHOUT weakening it, touching as little as possible. The developer must not modify the test (the tester owns it) — if the test itself seems wrong, it reports that instead of editing it. No opportunistic refactors: improvement ideas go in the report as follow-ups.
4. **Verify — `tester` (∥ `auditor` when sensitive).** Tester re-runs the new test (must be green) plus the smallest regression set around the touched area, sequentially by default; in the exception, this is where the regression test is written and proven. Spawn the auditor in parallel ONLY if the diff touches sensitive territory (auth, data integrity, money, concurrency, security) — otherwise skip it and say so in the report. Route failures back to the developer with evidence; maximum 2 cycles, then escalate to the user.
5. **Sibling scan.** Have the developer (or the auditor, if spawned) scan for the same defect elsewhere: the same helper misused at other call sites, a symmetric flow (create vs update) sharing the broken pattern, copy-pasted logic. Siblings are reported as follow-ups — never fixed silently in this run.
6. **Docs — `documentator`, conditional.** Only if user-visible behavior, contracts, or documented flows changed; otherwise skip and say so in the report.
7. **Delivery report.** Root cause in one paragraph; the failing-test-now-green proof; files changed; regression targets run and results; sibling occurrences found; docs touched; follow-ups.

## Rules

- Reproduce-first is the default and the whole point of the pipeline; the fix-then-test exception (step 2) is taken only at the human gate, only when up-front reproduction is genuinely impossible, and is named as such in the report.
- No production code before the brief is confirmed (informal intake) or the gate is passed.
- Minimal fix only; refactors and sibling fixes ride in follow-ups, not in bug fixes.
- The developer must not weaken or modify the tester's regression test; disagreements are reported, not edited away.
- Test runs are sequential unless the project explicitly documents its suites as parallel-safe.
- Artifacts and reports in English; talk to the user in their own language.
