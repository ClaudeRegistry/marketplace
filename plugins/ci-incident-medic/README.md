# CI & Incident Medic

Fast, checklist-driven triage and hardening for the parts of the delivery pipeline that break most: failing GitHub Actions runs, bloated and root-running Dockerfiles, silently-broken Kubernetes manifests, and the hours lost stitching together a postmortem.

## Purpose

SRE toil rose to ~30% of engineering time in 2025, and ~70% of SREs report on-call burnout — over 2,000 alerts per week with only ~3% actionable. Most of that pain is patternizable: CI failures are usually config (permissions, secrets, matrix expansion, cache keys, trigger mismatches); Dockerfiles bloat images and run as root; Kubernetes manifests fail silently (string-vs-int ports, missing resource limits/probes/securityContext); and postmortems eat hours of pure timeline-stitching.

CI & Incident Medic turns each of these into a fast, checklist-driven fix. It classifies a red pipeline against a known failure taxonomy and hands you the exact YAML, hardens a Dockerfile into a small non-root multi-stage image, pre-flights manifests with a PASS/WARN/FAIL gate before they reach the cluster, and drafts a blameless postmortem from raw evidence — every finding grounded in real `file:line` evidence, never fabricated.

## Features

- Triage failing GitHub Actions runs by mapping the log signal to one root-cause class, with the corrected YAML.
- Proactively review workflows for security (unpinned actions, over-broad `permissions`, `pull_request_target`, secret leaks) and speed (caching, concurrency, timeouts).
- Harden Dockerfiles: multi-stage builds, non-root user, pinned base digests, cache-friendly layer ordering, a generated `.dockerignore`.
- Pre-flight Kubernetes manifests for the silent failures that pass `kubectl apply` but never become Ready.
- Draft blameless postmortems with a UTC timeline, systemic contributing factors, and owner-assigned action items.
- Four auto-activating skills packed with catalogs, checklists, and copy-pasteable templates.
- An advisory PostToolUse hook that nudges you toward triage when a CI/build/test/deploy command fails in the shell.

## Installation

```bash
/plugin marketplace add clauderegistry/marketplace
```

```bash
/plugin install ci-incident-medic@clauderegistry
```

## Commands

### /gha-triage

```bash
/gha-triage .github/workflows/ci.yml
/gha-triage "Error: Resource not accessible by integration"
```

**What it does:**
- Reads the referenced workflow YAML and any pasted failure logs.
- Classifies the failure with the gha-failure-taxonomy skill (permissions, secrets, matrix, caching, triggers, checkout depth, concurrency, runner drift, OIDC, flaky).
- Pinpoints the offending step by `file:line` and quotes the log line that proves it.
- Dispatches the ci-failure-triager agent for multi-workflow repos.
- Outputs root cause, evidence, and the corrected YAML snippet.

**Best for:**
- A workflow that just went red and you want the fix, not a re-run lottery.
- "The workflow didn't even run" trigger-filter mysteries.

### /workflow-review

```bash
/workflow-review .github/workflows/release.yml
```

**What it does:**
- Audits a workflow for security (unpinned actions, over-broad permissions, `pull_request_target` misuse, secret leakage, script injection).
- Audits for speed and cost (missing caching, no concurrency cancellation, no `timeout-minutes`, needless serialization).
- Produces a findings table by severity plus corrected snippets.

**Best for:**
- Reviewing new or changed workflows before they merge.
- A periodic supply-chain and cost audit of your CI.

### /dockerfile-optimize

```bash
/dockerfile-optimize ./Dockerfile
```

**What it does:**
- Detects smells with the dockerfile-smells skill (root user, unpinned base, single stage, cache-busting order, baked secrets, uncleaned package caches, missing `.dockerignore`/`HEALTHCHECK`).
- Dispatches the dockerfile-hardener agent to apply fixes.
- Outputs a before/after Dockerfile, a generated `.dockerignore`, per-change rationale, and expected size/security wins.

**Best for:**
- Shrinking a slow, oversized image and getting it off root.
- Fixing a Dockerfile a security scanner just flagged.

### /k8s-preflight

```bash
/k8s-preflight k8s/
/k8s-preflight deployment.yaml
```

**What it does:**
- Validates manifests against the k8s-manifest-validation skill: type/quoting errors, missing resources, missing probes, missing `securityContext`, `:latest` images, single-replica/no-PDB, hardcoded secrets, implicit namespace.
- Emits a gated checklist (PASS / WARN / FAIL per check) with corrected YAML.
- Ends with an overall `GATE: PASS`/`GATE: FAIL` verdict.

**Best for:**
- A pre-deploy gate that catches "applied cleanly but never Ready."
- Catching a quoted `containerPort: "8080"` before it reaches the cluster.

### /postmortem

```bash
/postmortem incident-notes.md
/postmortem "SEV2 checkout outage 14:02-14:41, alert times + Slack thread pasted below..."
```

**What it does:**
- Dispatches the postmortem-writer agent to assemble a blameless postmortem from your evidence.
- Stitches a UTC timeline, identifies systemic contributing factors, and writes owner-assigned action items.
- Writes the finished document to `postmortems/YYYY-MM-DD-<slug>.md`.

**Best for:**
- Turning scattered alert/log/chat evidence into a shareable writeup fast.
- Keeping the analysis blameless and action-oriented.

## Agents

### ci-failure-triager

**Triggers when:** a CI pipeline is failing and you need the root cause and exact fix — across GitHub Actions, GitLab CI, or CircleCI ("CI is red", "pipeline broken", "why did the build fail", a pasted CI log).

**What it does:** Locates the workflow/pipeline files, correlates the failing step to the config across multiple and reusable workflows, classifies the failure via the taxonomy, and proposes the exact fix. May run a safe local reproduction of the failing lint/test/build command to confirm the cause. Read-only (no Write/Edit) — it diagnoses, it doesn't rewrite your repo.

### postmortem-writer

**Triggers when:** an incident is resolved and you need a blameless postmortem assembled from evidence ("write a postmortem", "incident review", "RCA", "SEV1 writeup").

**What it does:** Normalizes timestamps to a single UTC timeline, identifies multiple systemic contributing factors (never a single scapegoat), writes actionable owner-assigned follow-ups with due dates, and writes the document to `postmortems/YYYY-MM-DD-<slug>.md`. Rewrites any blameful phrasing around the missing guardrail.

### dockerfile-hardener

**Triggers when:** a Dockerfile should be smaller, safer, and faster ("harden my Dockerfile", "reduce image size", "container runs as root", "add multi-stage build").

**What it does:** Rewrites the Dockerfile in place — multi-stage split, non-root numeric `USER`, pinned base digest, cache-optimal layer order, no secrets in layers, minimal packages, and a `HEALTHCHECK` where appropriate — and emits a matching `.dockerignore`. Explains each change and the win it produces.

## Skills

### GitHub Actions Failure Taxonomy

A taxonomy of GitHub Actions failure classes with log signals, root causes, and exact YAML fixes; splits "failed" from "never ran" first, then classifies. Reference files: `failure-catalog.md` (symptom → cause → fix for every class) and `permissions-and-secrets.md` (the `GITHUB_TOKEN` model, least-privilege `permissions:`, OIDC vs static secrets, masking/leaks).

### Dockerfile Smells and Hardening

A catalog of Dockerfile anti-patterns and the hardening principles that fix them, plus a layer-ordering rule. Reference files: `hardening-checklist.md` (non-root, distroless, digest pinning, no baked secrets, read-only rootfs, dropped capabilities, HEALTHCHECK) and `multistage-patterns.md` (copy-pasteable build/runtime templates for Node, Python, Go, Java/JVM, Rust, plus cache-mount patterns).

### Kubernetes Manifest Validation

The silent failure modes of K8s manifests plus a PASS/WARN/FAIL validation checklist and type-quoting rules. Reference files: `manifest-checklist.md` (per-kind mistakes for Deployment, Service, Ingress, ConfigMap, Secret, HPA) and `probes-and-resources.md` (liveness/readiness/startup semantics, requests/limits and QoS classes, securityContext hardening).

### Incident Response and Blameless Postmortems

A blameless postmortem methodology, a SEV1-SEV4 severity model, and reliability-metric definitions. Reference files: `postmortem-template.md` (full template + a worked example) and `severity-levels.md` (severity definitions, escalation paths, on-call norms, MTTD/MTTR/MTBF).

## Hooks

CI & Incident Medic ships a **PostToolUse(Bash)** hook that is **advisory and non-blocking**. When a CI/build/test/deploy command run in the shell appears to fail — for example `npm test`, `pytest`, `go test`, `docker build`, `kubectl apply`, `terraform plan`, or `gh run` — the hook injects a short note suggesting you run `/gha-triage` or reach for the ci-failure-triager agent.

It only surfaces a suggestion. It never blocks the command, never changes its exit code, and never fails the session; it is fail-safe by design. Disable it any time via the `/hooks` menu or by removing the plugin.

## Typical Workflow

1. A push turns your GitHub Actions run red. The advisory hook notices the failed `gh run`/build command and suggests triage.
2. You run `/gha-triage .github/workflows/ci.yml` with the pasted error. It classifies the failure (e.g. missing `permissions: packages: write`) and hands you the corrected YAML.
3. Before the fix merges, you run `/workflow-review` on the same file and pin the unpinned actions and tighten `permissions:` while you're there.
4. The change also touches the container image, so you run `/dockerfile-optimize ./Dockerfile`; the dockerfile-hardener agent returns a multi-stage, non-root image and a `.dockerignore`.
5. You run `/k8s-preflight k8s/` before deploy; the gate flags a quoted port and a missing readiness probe as FAIL, and you paste in the corrected YAML until it reads `GATE: PASS`.
6. Later, an incident happens. Once mitigated, you run `/postmortem` with your alert times and chat log; the postmortem-writer agent produces a blameless writeup in `postmortems/` with owner-assigned action items.

## Plugin Structure

```
ci-incident-medic/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── gha-triage.md
│   ├── workflow-review.md
│   ├── dockerfile-optimize.md
│   ├── k8s-preflight.md
│   └── postmortem.md
├── agents/
│   ├── ci-failure-triager.md
│   ├── postmortem-writer.md
│   └── dockerfile-hardener.md
├── skills/
│   ├── gha-failure-taxonomy/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── failure-catalog.md
│   │       └── permissions-and-secrets.md
│   ├── dockerfile-smells/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── hardening-checklist.md
│   │       └── multistage-patterns.md
│   ├── k8s-manifest-validation/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── manifest-checklist.md
│   │       └── probes-and-resources.md
│   └── incident-response/
│       ├── SKILL.md
│       └── references/
│           ├── postmortem-template.md
│           └── severity-levels.md
└── README.md
```

## Requirements

- Claude Code CLI
- A repository with the relevant artifacts to analyze (GitHub Actions/GitLab CI/CircleCI config, Dockerfiles, Kubernetes manifests, or incident notes). Optional: `git`, `docker`, and `kubectl` available locally if you want the agents to run safe local reproductions.

## License

MIT

## Version

1.0.0

Grounded in real evidence, blameless by default — get from red pipeline to shipped fix, fast.
