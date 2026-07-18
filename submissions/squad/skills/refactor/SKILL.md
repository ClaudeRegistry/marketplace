---
name: refactor
description: Behavior-preserving restructuring — the existing tests become the frozen invariant that must pass identically before and after, the developer restructures without touching them, and the auditor judges whether the new structure is actually better. Use when the user wants to refactor, restructure, extract, centralize, simplify, or pay down technical debt WITHOUT changing behavior.
---

# Squad refactor

Target: $ARGUMENTS

You are the orchestrator. This pipeline inverts the usual role of tests: in `build` the tester writes new tests for new behavior; here NOBODY writes new expectations — **the existing tests are the frozen invariant**, and wanting to change one mid-refactor is the alarm that behavior is changing, not a chore to push through.

## Choreography

0. **Context.** Read `CLAUDE.md`/`README.md`; run the project's documented overview command if one exists.
1. **Baseline — `tester`.** Spawn the tester to: identify the smallest test set that covers the target area, run it (sequentially unless the project documents parallel-safe suites), and record the exact results — including any pre-existing failures. Then its verdict: is this a sufficient safety net for the planned restructuring?
   - **No safety net → stop at a gate.** Refactoring uncovered code is gambling. Offer to have the tester write characterization tests first — tests that pin CURRENT behavior, bugs included (they document what is, not what should be) — which then join the frozen invariant.
2. **Scope — one confirmation.** State: what improves structurally (coupling, duplication, naming, layering), what explicitly does NOT change (behavior, public contracts, persisted formats), and "done when": structure criteria met AND the baseline results identical. If the restructuring requires changing a public contract, it is not a refactor — route to `/squad:define` + `/squad:build` with the breaking-change playbook.
3. **Restructure — `developer`.** Mandate: behavior-preserving, incremental steps if large. It must NOT touch test expectations; purely mechanical test updates (import paths, renames) are allowed and must be declared one by one. The anti-cargo-cult rule applies with teeth: if a pattern being moved turns out to be wrong, moving it faithfully and REPORTING the defect is correct — fixing it here is not (that changes behavior; it becomes a `/squad:fix` follow-up).
4. **Verify — `tester` ∥ `auditor`.** Tester re-runs the SAME baseline set: results must be identical — green stays green, and pre-existing failures must still fail the same way (a silently "fixed" test is a behavior change too). Auditor judges the diff on its structural checklist: is coupling actually lower, duplication actually removed, are the new abstractions justified — and hunts for accidental behavior changes.
5. **Findings loop.** Behavior deviations or structural objections go back to `developer` with evidence. Maximum 2 cycles, then escalate.
6. **Maps — `documentator`.** A refactor is exactly what invalidates the `index.md` maps (entry points moved, pieces merged): update them for every touched module.
7. **Report.** What moved where and why; consumers rewired to shared pieces; test evidence (baseline vs after, identical); mechanical test updates declared; defects found-but-not-fixed as `/squad:fix` candidates; docs updated.

## Rules

- Test expectations are untouchable; mechanical updates (paths, imports) allowed and declared. A refactor that "needs" an assertion change has smuggled in a behavior change — stop and report it.
- No behavior changes ride along, including bug fixes: report them, don't fix them.
- No coverage → characterization tests first, or explicit human sign-off to proceed unprotected.
- Serialize anything that runs tests; artifacts and reports in English; address the user in their own language.
