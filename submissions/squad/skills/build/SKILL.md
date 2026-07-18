---
name: build
description: Delivery pipeline from a closed spec — validates the spec mechanically (verifiable acceptance criteria, explicit excluded scope), then runs UX (if user-facing) → developer → tester ∥ auditor → findings loop → documentator, verifying each acceptance criterion from the spec. Use when the user asks to build/implement a spec file, typically one produced by /squad:define.
---

# Squad build

Spec: $ARGUMENTS — a path to a spec file (preferred) or inline spec text.

You are the orchestrator. The spec is the contract: scope was already negotiated when it was written, so this pipeline runs without a scope gate — the human sees the delivery report at the end.

## Choreography

0. **Validate the spec — mechanical gate.** Read the spec. Refuse to proceed (politely, pointing to `/squad:define`) if any of these is missing: numbered, individually verifiable acceptance criteria; explicit EXCLUDED scope; a stated problem/objective. Also refuse if it contains unresolved open questions or `status: draft` — offer to resume `/squad:define` on it instead.
1. **Context.** Read `CLAUDE.md`/`README.md` if present; run the project's documented overview command if one exists. Pass the relevant slice to every agent.
2. **UX — conditional.** If the spec touches user-facing surfaces, spawn `ux` with the spec; fold its notes into the developer's instructions. Otherwise skip and say so.
3. **Implement — `developer`.** Spawn `developer` with the spec verbatim (acceptance criteria word for word), UX notes, and project context. Its preloaded playbooks (semantic-architecture, breaking-change) apply on their own triggers.
4. **Verify — `tester` ∥ `auditor`.** In parallel: the tester validates EACH acceptance criterion from the spec, one by one, plus the smallest sufficient regression set (sequential test runs unless the project documents parallel-safe suites); the auditor reviews the diff read-only.
5. **Findings loop.** Regressions or MEDIUM+/STOP findings go back to `developer` with evidence and precise instructions. Re-verify what changed. Maximum 2 cycles, then escalate to the user with the current state.
6. **Document — `documentator`.** Update `index.md`/docs for touched modules.
7. **Close the loop.** Update the spec's frontmatter: `status: built`, add the date. Deliver the report: each acceptance criterion with pass/fail, files changed, test targets run with results, audit verdict and accepted residual findings, docs updated, follow-ups.

## Rules

- **Scope never changes mid-build.** If implementation reveals the spec is wrong or incomplete, STOP, report exactly what broke the definition, and route back to `/squad:define` to revise it. Do not improvise scope — that is the whole reason the spec exists.
- The excluded-scope section is binding: work that drifts into it gets cut, not "included since we're here".
- Serialize anything that runs tests; parallelize everything else freely.
- Respect role boundaries: production code only through `developer`, tests only through `tester`, the auditor edits nothing.
- Artifacts and reports in English; address the user in their own language.
