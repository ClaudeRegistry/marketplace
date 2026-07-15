---
description: Validate Kubernetes manifests before deploy with a gated PASS/WARN/FAIL checklist
argument-hint: [manifest-file-or-dir]
model: inherit
---

Pre-flight Kubernetes manifests before they reach the cluster, catching the silent failures that pass `kubectl apply` but never become Ready. Use this before every deploy or in a CI gate. `$ARGUMENTS` is a manifest file or a directory to scan; default to the current directory's `*.yaml`/`*.yml` and any `k8s/`, `manifests/`, or `deploy/` folder.

## Process

### Step 1: Collect the manifests
- Read the file or glob the directory in `$ARGUMENTS` for `*.yaml`/`*.yml`.
- Split multi-document files on `---`. For each document, record `kind`, `metadata.name`, and `metadata.namespace`.
- If Helm templates or `values.yaml` are present, note that values may inject the fields you are checking, flag unresolved `{{ ... }}` rather than treating them as literals.

### Step 2: Validate against the checklist
Apply the **k8s-manifest-validation** skill. Run each check and assign a gate result:

| Check | FAIL when | Skill reference |
|-------|-----------|-----------------|
| Type / quoting | port is a quoted string, boolean quoted as `"true"`, env value is an int | `manifest-checklist.md` |
| Resource requests & limits | missing on any container | `probes-and-resources.md` |
| Liveness / readiness / startup probes | readiness missing (WARN if only startup missing) | `probes-and-resources.md` |
| `securityContext` | `runAsNonRoot` unset, no dropped capabilities, writable root fs | `probes-and-resources.md` |
| Image tag | `:latest` or untagged | `manifest-checklist.md` |
| Replicas / PodDisruptionBudget | single replica for a stateless Deployment, no PDB | `manifest-checklist.md` |
| Hardcoded secrets | literal tokens/passwords in env or ConfigMap | `manifest-checklist.md` |
| Namespace | relies on implicit `default` | `manifest-checklist.md` |

### Step 3: Report as a gate
Emit a **gated checklist**: one row per check per workload:

| Check | Resource (`kind/name`) | Result | Detail (`file:line`) |
|-------|------------------------|--------|----------------------|

Use `PASS` / `WARN` / `FAIL`. Then, for every `FAIL` and `WARN`, provide the **corrected YAML** snippet. End with an overall verdict line: `GATE: PASS` only if there are zero FAILs, otherwise `GATE: FAIL`.

## Important Notes
- Cite `file:line` (and the document's `kind/name`) for every result; quote the offending value.
- The classic silent killer is a quoted `containerPort: "8080"` or a probe missing entirely, a Pod can be Running yet never Ready. Call these out explicitly.
- Never fabricate cluster state; you are validating manifests statically, not querying a live cluster.
- Respect Helm/Kustomize indirection: do not flag a value that is clearly templated, flag that it must be verified against the rendered output.
