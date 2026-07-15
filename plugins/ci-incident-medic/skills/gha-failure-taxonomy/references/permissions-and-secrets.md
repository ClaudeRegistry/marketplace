# GITHUB_TOKEN Permissions, Secrets, and OIDC

Deep reference for the auth model behind most "permission denied" and "secret not found" failures.

## The GITHUB_TOKEN

Every workflow run gets an automatically-generated `GITHUB_TOKEN` (accessible as `secrets.GITHUB_TOKEN` and `github.token`). It:
- is scoped to the **single repository** running the workflow,
- **expires** when the job finishes,
- has permissions determined by (a) the repo/org default and (b) any `permissions:` block in the workflow.

### Default permissions
Repos can default to **permissive** (read/write most scopes) or **restricted** (`contents: read`). The security-recommended default is restricted. Under restricted defaults, any write operation fails with `Resource not accessible by integration` until you grant the scope explicitly.

### Available permission scopes
`actions`, `attestations`, `checks`, `contents`, `deployments`, `discussions`, `id-token`, `issues`, `models`, `packages`, `pages`, `pull-requests`, `repository-projects`, `security-events`, `statuses`. Each is `read`, `write`, or `none`.

### Least-privilege pattern
Set a read-only baseline at the top, then widen per job:
```yaml
permissions:
  contents: read          # workflow-wide floor

jobs:
  release:
    permissions:
      contents: write       # create tags/releases
      packages: write       # push image to GHCR
    steps: [...]
```
Rules of thumb:
- Start from `contents: read`; add scopes one at a time as steps demand them.
- Grant write at the **job** level, not workflow level, so most jobs stay read-only.
- `permissions: {}` drops all scopes (useful for pure-compute jobs).
- Never `permissions: write-all`: it hands a leaked token full repo write.

## Secrets

### Where secrets live
- **Repository secrets**: available to all workflows in the repo.
- **Environment secrets**: only exposed when a job declares that `environment:`; can be gated by protection rules and required reviewers.
- **Organization secrets**: shared, optionally restricted to selected repos.

Precedence when names collide: environment > repository > organization.

### Why a secret is "not found" or empty
1. **Wrong scope**: the secret is an *environment* secret but the job didn't declare `environment:`.
2. **Fork PRs**: secrets are **not** passed to workflows triggered by `pull_request` from a fork. This is deliberate: it stops untrusted code exfiltrating them.
3. **Case / name mismatch**: the `secrets` context is case-sensitive.
4. **Composite/reusable workflow**: secrets must be passed explicitly with `secrets:` or `secrets: inherit`:
```yaml
jobs:
  call:
    uses: ./.github/workflows/deploy.yml
    secrets: inherit    # or map individually
```

### How secrets get masked, and leaked
- Actions auto-masks the **exact string** of any registered secret in logs (prints `***`).
- Masking fails when the secret is **transformed**: base64-encoded, JSON-embedded, split across lines, or URL-encoded, the transformed form is not registered, so it prints in clear.
- `set -x` / `bash -x` echoes commands and can surface secrets in argv.
- Passing a secret as a **command-line argument** can expose it via process listings or error output.
- Mitigations: pass secrets via `env:` (not inline in `run:` strings), avoid logging derived values, and register any derived secret with `::add-mask::` before use.

### pull_request_target, the dangerous one
`pull_request_target` runs in the context of the **base** repo *with secrets and write token*, but can be tricked into checking out untrusted PR head code. If such a workflow checks out and executes PR code, a fork can exfiltrate secrets or push to the repo (RCE). Rule: never `checkout` + build/run untrusted PR code under `pull_request_target`; keep it to label/triage tasks that don't run PR code.

## OIDC vs long-lived secrets

**Long-lived cloud keys** (static `AWS_ACCESS_KEY_ID`, service-account JSON) stored as secrets are the highest-value leak target: they don't expire and are easy to copy.

**OIDC** lets the workflow mint a short-lived token that the cloud exchanges for temporary credentials, no static secret stored.

```yaml
permissions:
  id-token: write   # REQUIRED to request the OIDC JWT
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@<sha> # v4
    with:
      role-to-assume: arn:aws:iam::<acct>:role/gha-deploy
      aws-region: us-east-1
```
Cloud-side trust policy must constrain the subject:
```
"token.actions.githubusercontent.com:sub": "repo:<org>/<repo>:ref:refs/heads/main"
```
Common OIDC failures:
- Missing `id-token: write` → no token minted.
- Trust policy `sub` doesn't match the branch/environment/tag → `AssumeRoleWithWebIdentity` denied.
- Wildcard `sub` (`repo:org/repo:*`) → over-broad; any branch/PR can assume the role.

## Environment protection rules
Environments add gates around secrets and deploys:
- **Required reviewers**: a human must approve before the job runs.
- **Wait timer**: enforced delay before deploy.
- **Deployment branch policy**: only listed branches/tags may deploy to the environment.
Use these to keep production secrets behind approval, so even a compromised workflow on a feature branch cannot reach them.

## Quick audit checklist
- [ ] Workflow has an explicit `permissions:` floor of `contents: read`.
- [ ] Write scopes are granted per-job, minimally, not `write-all`.
- [ ] No `pull_request_target` that checks out and runs PR code.
- [ ] Cloud auth uses OIDC, not static keys; `id-token: write` present; trust `sub` pinned to a branch/environment.
- [ ] Production secrets live on a protected `environment` with required reviewers.
- [ ] No secret is echoed, base64'd into logs, or passed as a bare CLI arg.
