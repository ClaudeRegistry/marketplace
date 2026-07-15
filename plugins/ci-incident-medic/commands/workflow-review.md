---
description: Proactively review a GitHub Actions workflow for security and speed
argument-hint: [workflow-file]
model: inherit
---

Review a GitHub Actions workflow for SECURITY and SPEED before it causes an incident or a slow, expensive pipeline. Use this on new or changed workflows, or as a periodic audit. `$ARGUMENTS` is the workflow file to review; if omitted, review every file under `.github/workflows/`.

## Process

### Step 1: Load the workflow(s)
- Read the file named in `$ARGUMENTS`, or glob `.github/workflows/*.yml` and `*.yaml`.
- Note each `job`, its `runs-on`, `permissions`, `concurrency`, `timeout-minutes`, and every `uses:` action reference and `run:` step.

### Step 2: Audit for security
Draw on the **gha-failure-taxonomy** skill's `permissions-and-secrets.md` reference. Check:

| Check | Risk if violated |
|-------|------------------|
| Actions pinned to a commit SHA | `@main`/`@v4` tags are mutable, supply-chain / tag-hijack risk |
| Least-privilege `permissions:` | default is often too broad; write scope enables token abuse |
| `pull_request_target` usage | runs with secrets against untrusted PR code, RCE / secret exfil |
| Secrets not echoed / interpolated into `run:` | secrets printed to logs bypass masking |
| No `run: ${{ ... }}` of untrusted input | script injection via PR title/body/branch name |
| OIDC over long-lived cloud keys | static keys leak and never rotate |

### Step 3: Audit for speed and cost
| Check | Waste if missing |
|-------|------------------|
| Dependency caching (`actions/cache` / `setup-*` cache) | cold installs every run |
| `concurrency` with `cancel-in-progress` | stale runs burn minutes on superseded commits |
| `timeout-minutes` per job | hung jobs run to the 6-hour default cap |
| Parallelizable jobs not serialized by needless `needs:` | wall-clock time inflated |
| `fail-fast` / matrix sized correctly | redundant or over-broad matrix legs |
| Path/branch filters scope the triggers | workflow runs on irrelevant changes |

### Step 4: Report
Produce a **findings table** ordered by severity, then corrected snippets:

| Severity | Finding | Location (`file:line`) | Fix |
|----------|---------|------------------------|-----|

Use severities **Critical / High / Medium / Low**. Critical = secret leak, `pull_request_target` RCE, or `permissions: write-all`. After the table, give a corrected YAML snippet for each Critical/High finding.

## Important Notes
- Cite `file:line` for every finding; quote the exact line you object to.
- Never fabricate findings, if a workflow is already well-configured, say so and report only real gaps.
- Prefer pinning to a full 40-char commit SHA with the human-readable tag in a trailing comment (`uses: actions/checkout@<sha> # v4.2.2`).
- Recommend the narrowest `permissions:` that still lets the job function; start from `contents: read` and add scopes explicitly.
