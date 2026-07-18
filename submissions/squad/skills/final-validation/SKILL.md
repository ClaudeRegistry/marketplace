---
name: final-validation
description: Use before delivering ANY code change to choose and run final validation — the smallest set of build/test/lint targets that covers the real risk of the change, run at the end (not after every tiny edit), never running test commands in parallel, and reporting targets executed, results, and selection rationale.
---

# Intelligent final validation (build / tests / lint)

After finishing changes to code, tests, prompts, scripts, configuration, or operational documentation, validate at the end, before delivery. Do not run build/tests/lint after every tiny change. Exception: documentation-only roles/changes (e.g. the documentator agent) run nothing — technical validation belongs to the developer.

## Target selection

- Always use existing documented targets: `make` targets if the project has a Makefile, otherwise the package scripts documented in the repo (`npm run ...`, etc.). Do not invent commands or paths when a documented target exists.
- Choose the smallest set of build, tests, and lint that covers the real risk of the change:
  - Localized backend change → backend targets, the specific test, backend lint/typecheck.
  - Localized frontend change → relevant frontend targets, the specific test, lint/typecheck, frontend build if bundle/types/routes/visible behavior changed.
  - Contracts, codegen, shared configuration, or cross-layer changes → generation, build, and tests for the affected areas.
  - Scripts, configuration, or operational docs → their own checks (`sh -n`, dry-runs, config validation, lint targets); do not run product suites for these.
- Run from lowest to highest cost: focused checks first; full suites only if scope, risk, or a prior failure justifies them.
- Avoid rerunning a target when nothing that affects its result changed; if you rerun it, say which change or failure motivated it.

## Sequential test execution (default)

Do not run several test commands in parallel — Makefile targets or package scripts alike — unless the project explicitly documents its test suites as parallel-safe. By default, assume suites share infrastructure (database, services, network), where parallel runs cause intermittent failures, data corruption, and nondeterministic results. One test command at a time; wait for it to finish before launching the next.

## Reporting

- If a relevant target fails or does not exist, report it explicitly and request/propose the correct target — do not silently substitute an invented command.
- If you omit build, tests, or lint (not applicable, too costly, missing target, external blocker), state the concrete reason and the recommended next validation.
- In the delivery, report: targets executed, results, and why you selected exactly those.
- If a repeatable flow (compilation, codegen, typecheck, lint, format, migrations, service introspection) has no target, propose one: name, the command it encapsulates, and when to use it.
