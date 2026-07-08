# GitHub Actions Failure Catalog

Each entry: **symptom in logs → root cause → fix (YAML)**. Anchor triage on the quoted log string.

## 1. Permissions / GITHUB_TOKEN scope

**Symptom:** `Error: Resource not accessible by integration`, or HTTP `403` when pushing commits, creating a release, commenting on a PR, or pushing to GHCR.

**Root cause:** The automatically-provided `GITHUB_TOKEN` runs with the repository's default permissions. For repos set to read-only default (recommended), any write action (push, release, package, PR comment, deployment) fails until you grant the scope.

**Fix:** Grant least privilege at the workflow or job level.
```yaml
permissions:
  contents: read        # default baseline
  packages: write       # only if pushing to GHCR
  pull-requests: write  # only if commenting on PRs
```
Never use `permissions: write-all`. Scope at job level when only one job needs the write.

## 2. Missing / misnamed secret

**Symptom:** `Error: secret DEPLOY_KEY not found`, an env var that is unexpectedly empty, or a downstream `401 Unauthorized`.

**Root cause:** Secret not defined, wrong name/case, defined at the wrong scope (repo vs environment vs org), or referenced in a job that targets a different `environment`. Secrets are **not** passed to workflows triggered from forks by default.

**Fix:**
```yaml
jobs:
  deploy:
    environment: production   # secret lives on this environment
    steps:
      - run: ./deploy.sh
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```
Confirm the exact name in **Settings → Secrets and variables → Actions**. `secrets` context is case-sensitive.

## 3. Matrix expansion

**Symptom:** The job runs zero times; or one matrix leg fails and all siblings show `Canceling`.

**Root cause:** A typo in a `matrix` key produces an empty product, or `fail-fast: true` (the default) cancels every sibling the instant one leg fails, masking which leg is truly broken.

**Fix:**
```yaml
strategy:
  fail-fast: false          # let every leg finish so you see all failures
  matrix:
    node: [18, 20, 22]
    include:
      - node: 20
        coverage: true
```
For `include`/`exclude`, the keys must match existing axes or add complete new combinations.

## 4. Cache miss

**Symptom:** `Cache not found for input keys: ...`; dependencies reinstall cold every run even though nothing changed.

**Root cause:** The `key` embeds something that changes every run (a timestamp, `github.sha`), or the cache is never saved because the job fails before the post step, or `restore-keys` fallback is missing. Caches are also branch-scoped: a cache saved on a feature branch may not restore on `main`.

**Fix:**
```yaml
- uses: actions/cache@<sha> # v4
  with:
    path: ~/.npm
    key: npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      npm-${{ runner.os }}-
```
Prefer the built-in cache of `setup-node`/`setup-python`/`setup-go` when available.

## 5. Trigger mismatch (workflow never runs)

**Symptom:** No run appears for a push/PR that "should" have triggered it.

**Root cause:** `on:` filters excluded the ref: a `paths:` filter didn't match the changed files, a `branches:` filter excluded the branch, the workflow file wasn't on the **default branch** for scheduled/`workflow_dispatch` runs, or a push of only tags with no `tags:` config.

**Fix:**
```yaml
on:
  push:
    branches: [main, 'release/**']
    paths: ['src/**', '.github/workflows/**']
  pull_request:
    branches: [main]
```
Remember: `paths-ignore` and `paths` are mutually exclusive per event; a merge queue uses `merge_group`.

## 6. Checkout depth

**Symptom:** `fatal: ... shallow`, missing tags, `git describe` / changelog generation fails, or `git diff` against a base that isn't present.

**Root cause:** `actions/checkout` clones with `fetch-depth: 1` by default; history and tags are absent.

**Fix:**
```yaml
- uses: actions/checkout@<sha> # v4
  with:
    fetch-depth: 0     # full history + tags
```

## 7. Concurrency cancellation

**Symptom:** `Canceling since a higher priority waiting request for '<group>' exists`.

**Root cause:** A `concurrency` group with `cancel-in-progress: true` correctly cancels a superseded run — usually intended, but surprising when the group key is too broad and cancels unrelated runs.

**Fix:** Scope the group precisely (per-ref) so only true supersessions cancel.
```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## 8. Runner / tool version drift

**Symptom:** `command not found`, a tool's behavior changes overnight, or `ubuntu-latest` moves to a new image.

**Root cause:** `runs-on: ubuntu-latest` follows GitHub's rolling image; preinstalled tool versions change. Or a `setup-*` action pinned to a floating version.

**Fix:** Pin what matters.
```yaml
runs-on: ubuntu-24.04         # pin the runner image when reproducibility matters
steps:
  - uses: actions/setup-node@<sha> # v4
    with:
      node-version: '20.11.1'   # exact, not '20' or 'lts/*'
```

## 9. OIDC / cloud authentication

**Symptom:** `Not authorized to perform sts:AssumeRoleWithWebIdentity`, or the cloud login step fails with no static credentials present.

**Root cause:** The job requests an OIDC token but lacks `id-token: write`, or the cloud IAM trust policy doesn't match the repo/branch `sub` claim.

**Fix:**
```yaml
permissions:
  id-token: write   # required to mint the OIDC token
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@<sha> # v4
    with:
      role-to-assume: arn:aws:iam::<acct>:role/gha-deploy
      aws-region: us-east-1
```
Then verify the IAM trust policy `token.actions.githubusercontent.com:sub` condition matches `repo:<org>/<repo>:ref:refs/heads/main`.

## 10. Flaky / network

**Symptom:** Intermittent timeouts, `ECONNRESET`, `ETIMEDOUT`, DNS failures; a re-run passes.

**Root cause:** External registry/service instability or rate limiting — not your config.

**Fix:** Add bounded retries and a job timeout so a hung run doesn't burn the 6-hour cap.
```yaml
timeout-minutes: 15
steps:
  - uses: nick-fields/retry@<sha> # v3
    with:
      max_attempts: 3
      timeout_minutes: 10
      command: npm ci
```
Do not paper over a deterministic failure with retries — confirm it is genuinely non-deterministic first.
