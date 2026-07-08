---
description: Triage a failing GitHub Actions run and produce the exact corrected YAML
argument-hint: [workflow-file or pasted logs]
model: inherit
---

Triage a failing GitHub Actions run and return the root cause with an exact YAML fix. Use this the moment a workflow goes red and you want to stop guessing. `$ARGUMENTS` may be a path to a workflow file (e.g. `.github/workflows/ci.yml`), a job/step name, or a block of pasted failure logs — often both.

## Process

### Step 1: Gather the evidence
- If `$ARGUMENTS` names a workflow file, read it. Otherwise glob `.github/workflows/*.yml` and `.github/workflows/*.yaml` and read every workflow.
- Capture any pasted log excerpt from `$ARGUMENTS`. Note the exact error line, the failing job name, the step `name`/`uses`/`run`, and the runner label (`runs-on`).
- Look for the annotation GitHub prints: `Error: Process completed with exit code N`, `Resource not accessible by integration`, `The secret ... was not found`, `no matching workflow run`, etc. These strings are the fastest classifiers.

### Step 2: Classify the failure
Apply the **gha-failure-taxonomy** skill. Map the symptom to exactly one primary class:

| Class | Tell-tale signal in logs |
|-------|--------------------------|
| Permissions / `GITHUB_TOKEN` scope | `Resource not accessible by integration`, 403 on push/PR/packages |
| Missing / misnamed secret | `secret ... not found`, empty env var, auth failure with no token |
| Matrix expansion | job runs 0 times, `matrix` key typo, fail-fast cancels siblings |
| Cache miss | `Cache not found for input keys`, cold installs every run |
| Trigger mismatch | workflow "didn't run" — `on:` paths/branches filter excludes the ref |
| Checkout depth | `fatal: ... shallow`, missing tags, `git describe` fails |
| Concurrency cancellation | `Canceling since a higher priority ... exists` |
| Runner / tool drift | `command not found`, version mismatch, `latest` runner image change |
| OIDC / cloud auth | `Not authorized to perform sts:AssumeRoleWithWebIdentity`, missing `id-token: write` |
| Flaky / network | timeouts, ECONNRESET, passes on re-run |

### Step 3: Pinpoint and confirm
- Cite the offending step by `file:line`. Quote the exact log line that proves it.
- For multi-workflow repos, or when the failing step spans reusable/called workflows, **launch the ci-failure-triager agent** to correlate across files and, where safe, reproduce the failing lint/test/build command locally.

### Step 4: Report
Produce exactly these sections:

- **Root cause** — one sentence naming the taxonomy class.
- **Evidence** — `file:line` references and the quoted log excerpt.
- **Fix (corrected YAML)** — a minimal diff or replacement snippet the user can paste. Show only the changed keys with enough surrounding context to place them.
- **Why this works / prevents recurrence** — one or two bullets.

## Important Notes
- Base every finding on the real workflow file and the real log text — cite `file:line` and quote the log line as evidence.
- Never fabricate log output, run IDs, or error strings. If the pasted logs are insufficient to classify, say what additional excerpt you need.
- Distinguish "the workflow failed" from "the workflow never ran" — the second is almost always a `on:` trigger/paths/branches filter, not a step error.
- Recommend least-privilege `permissions:` when broadening scope, never a blanket `permissions: write-all`.
