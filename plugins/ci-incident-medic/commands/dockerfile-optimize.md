---
description: Analyze and harden a Dockerfile for size, security, and build speed
argument-hint: [Dockerfile]
model: inherit
---

Analyze a Dockerfile and harden it: smaller image, non-root runtime, faster cache-friendly builds. Use this before an image ships or when builds are slow, huge, or flagged by a scanner. `$ARGUMENTS` is the Dockerfile path; default to `./Dockerfile` if omitted.

## Process

### Step 1: Read the Dockerfile and its context
- Read the target Dockerfile. Detect the base image and language ecosystem (Node, Python, Go, Java/JVM, Rust, etc.) from `FROM` and the copied manifests (`package.json`, `requirements.txt`/`pyproject.toml`, `go.mod`, `pom.xml`/`build.gradle`, `Cargo.toml`).
- Check whether a `.dockerignore` exists alongside it.

### Step 2: Detect smells
Apply the **dockerfile-smells** skill. Flag each present:

| Smell | Cost |
|-------|------|
| Runs as `root` (no `USER`) | container escape blast radius, violates most policies |
| `latest` or unpinned base tag | non-reproducible builds, silent base drift |
| No multi-stage build | build toolchain + source shipped in final image |
| Cache-busting layer order | `COPY . .` before dependency install invalidates cache every edit |
| Secrets baked into layers | tokens/keys recoverable from image history forever |
| `apt-get`/`apk` without cleanup | lists and caches bloat the layer |
| Missing `.dockerignore` | huge build context, secrets/`.git` sent to daemon |
| No `HEALTHCHECK` | orchestrator can't detect a wedged-but-running process |

### Step 3: Apply fixes
- **Launch the dockerfile-hardener agent** to rewrite the Dockerfile in place: multi-stage split, pinned base digest, non-root `USER`, optimal layer ordering, no secrets in layers, minimal packages, and a `HEALTHCHECK` where it makes sense. The agent also emits a matching `.dockerignore`.
- Consult the **dockerfile-smells** `multistage-patterns.md` reference for the ecosystem-specific template.

### Step 4: Report
Produce these sections:

- **Before / After** — the original and hardened Dockerfile side by side (or as a diff).
- **Generated `.dockerignore`** — the file contents.
- **Per-change rationale** — a table of change → reason.
- **Expected wins** — estimated image-size reduction and the concrete security posture change (e.g. "runs as UID 10001, root filesystem read-only, no build toolchain in final layer"). Frame size numbers as estimates unless the user provides a real `docker images` measurement.

## Important Notes
- Base changes on the actual Dockerfile contents — cite line numbers for each smell.
- Never fabricate image sizes or scan results; label size deltas as estimates unless a real measurement is supplied.
- Preserve the application's runtime contract: entrypoint, exposed port, and required runtime files must survive the multi-stage copy.
- Do not pin a digest you cannot verify — instruct the user to resolve the digest with `docker buildx imagetools inspect <image:tag>` if it is unknown.
