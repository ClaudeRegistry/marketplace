---
description: Get an unfamiliar repo running locally and emit a verified SETUP.md
argument-hint: [optional: path]
model: inherit
---

Get this repository running on your machine, detect what it needs, run the setup, fix what breaks, and write down only the steps that actually worked. Use this on day one of a new codebase, or when a stale README leaves you with a red build. `$ARGUMENTS` may be a subdirectory to bootstrap (a specific service/package in a monorepo); default to the repo root.

## Process

### Step 1: Discover the declared requirements
Read, do not guess. Scan for the signals that tell you the runtime, tooling, and services this repo expects (see the **setup-diagnosis** skill's `setup-signals.md` for the full map):

| Signal | What it declares |
|--------|------------------|
| `package.json` (`engines`, `packageManager`), `.nvmrc` | Node version + package manager |
| `.tool-versions`, `mise.toml`, `asdf` | Multi-runtime pins (Node/Python/Ruby/Go/…) |
| `.python-version`, `pyproject.toml`, `requirements*.txt`, `Pipfile`, `poetry.lock` | Python version + resolver |
| `.ruby-version`, `Gemfile`, `go.mod`, `pom.xml`, `build.gradle`, `Cargo.toml` | Runtime + dependency manifest |
| `Dockerfile`, `docker-compose.yml`, `.devcontainer/` | Containerized runtime + backing services (DB, cache, queue) |
| `.env.example`, `.env.sample`, `config/*.example` | Required environment variables |
| `Makefile`, `justfile`, `Taskfile.yml`, `scripts/` | Project-authored setup/bootstrap targets |
| `README`, `CONTRIBUTING`, `docs/` | The human instructions (verify, they drift) |

### Step 2: Reconcile and plan
- Prefer a project-authored setup target (`make setup`, `just bootstrap`, `./scripts/setup`) over hand-assembling steps, repos usually encode the real path there.
- If manifests disagree with the README (e.g. `.nvmrc` says 18 but the README says 16), trust the machine-readable pin and note the discrepancy.
- List the backing services `docker-compose.yml` provides and whether they must be up before install/migrate/seed.

### Step 3: Execute and diagnose
**Launch the env-doctor agent** to run the setup end-to-end. It installs the correct runtime versions, runs the install/build/migrate/seed steps, and diagnoses failures (wrong runtime version, missing system libraries, missing env vars, native build errors, port conflicts, OS-specific breakage), fixing what it can safely fix. It never invents credentials or secret values, it flags them as required and leaves them blank.

### Step 4: Report
Produce exactly these sections:

- **What this repo needs**: runtime versions, package manager, and backing services, each tied to the file that declared it.
- **What worked / what broke**: the commands run, which failed, the diagnosed cause (`file:line` where relevant), and the fix applied.
- **Verified setup steps**: the exact ordered commands that produced a green build, written to `SETUP.md`.
- **Devcontainer**: offer a `.devcontainer/devcontainer.json` when the stack is container-friendly and none exists.

## Important Notes
- Base every requirement on a real file in the repo, cite the manifest that declares it. Never fabricate a version, command, or tool output.
- Put only **confirmed-working** steps in `SETUP.md`. If a step could not be verified (needs a secret you lack, an external service), mark it explicitly rather than pretending it passed.
- Never write a real secret value. Reference the variable name and leave acquisition to the user.
- Prefer the least-invasive fix (a version manager install, an env var) over mutating system state; explain anything with side effects before doing it.
