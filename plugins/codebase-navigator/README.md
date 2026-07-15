# Codebase Navigator

Get an unfamiliar repository running, understood, and ready to change on day one, bootstrap the dev environment, decode the build, find where a change goes, and trace a request end-to-end.

## Purpose

Developers spend 58–70% of their time reading and understanding code, not writing it, and 72% of companies still need more than a month to get a new hire to their first meaningful contribution. The biggest day-one sink is getting a green build, missing dependencies, the wrong runtime version, OS-specific breakage, and silently outdated README steps. Build systems (Bazel, Gradle, Make) force you to hold the dependency graph in your head, and "where do I even make this change?" is the top pain in a large codebase.

Codebase Navigator handles exactly those orientation tasks. It detects what a repo needs and gets it running (writing down only the steps that actually worked), decodes the build system so you can build and test one package without building the world, localizes a task to the precise files and tests to edit, and traces a user action through the real call graph with a source-linked diagram. Every finding is grounded in real `file:line` evidence, never fabricated.

## Features

- Bootstrap an unfamiliar repo to a green build by detecting its runtime/tooling/services, running the setup, and diagnosing failures, then emit a verified `SETUP.md`.
- Decode any of Make, Bazel, Gradle, Maven, npm/pnpm/yarn, Nx, Turborepo, CMake, cargo, and go, listing real targets, mapping the dependency graph, and giving you the single-package build/test command.
- Localize a task ("add a remember-me checkbox") to a ranked list of edit sites with `file:line` and the tests to update, a cheap, read-only, parallelizable exploration.
- Trace a request or user action end-to-end through routing, middleware, handlers, services, and data access, with a Mermaid sequence diagram of the actual path.
- Two auto-activating skills packed with build-system introspection commands, monorepo affected-detection recipes, setup-signal maps, and a failure-mode catalog.
- An advisory SessionStart hook that orients you the moment you open a repo.

## Installation

```bash
/plugin marketplace add clauderegistry/marketplace
```

```bash
/plugin install codebase-navigator@clauderegistry
```

## Commands

### /dev-env-bootstrap

```bash
/dev-env-bootstrap
/dev-env-bootstrap services/payments
```

**What it does:**
- Detects runtime and tooling requirements from the repo's own manifests (`.nvmrc`, `.tool-versions`, `engines`, `.python-version`, `.ruby-version`, Dockerfile/`docker-compose.yml`, `.env.example`, Makefile/justfile setup targets).
- Dispatches the env-doctor agent to run the setup, bring up backing services, and diagnose failures (wrong runtime version, missing system libs, missing env vars, native build errors, port conflicts, OS breakage), fixing what is safe.
- Writes a verified `SETUP.md` containing only steps that actually worked, and offers a `.devcontainer/devcontainer.json` where useful.

**Best for:**
- Day one on a new codebase, or a clone that won't run because the README drifted.
- Reproducing "works on their machine, not mine" and getting a real green build.

### /build-explain

```bash
/build-explain
/build-explain //services/api:test
```

**What it does:**
- Detects the build system (Make, Bazel, Gradle, Maven, npm/pnpm/yarn, Nx, Turborepo, CMake, cargo, go), including a top-level orchestrator layered over per-language builds.
- Enumerates the real targets using the tool's own introspection, maps the dependency graph, and explains what each build/test step does.
- Gives you the exact command to build or test a single package, plus how to scope to only affected/changed projects, without building the world.

**Best for:**
- An opaque `make`/Bazel/Gradle monorepo where you just need the right command for your package.
- Understanding the dependency graph before you touch a shared library.

### /locate-change

```bash
/locate-change add a 'remember me' checkbox to login
/locate-change rate-limit the public export endpoint
```

**What it does:**
- Dispatches the change-locator agent to turn the task in `$ARGUMENTS` into a search vocabulary, grep the relevant feature/route/model, and follow imports across layers.
- Returns a ranked list of edit sites (files, functions, modules) with `file:line` and a one-line rationale, plus the tests to update.
- Flags the risks, shared callers, feature flags, migrations, that make the change wider than it looks.

**Best for:**
- "Where do I even make this change?" in a large, unfamiliar codebase.
- Scoping a ticket before you start editing, so the change stays coherent.

### /trace-flow

```bash
/trace-flow POST /checkout
/trace-flow user clicks Export
```

**What it does:**
- Dispatches the flow-tracer agent to find the entry point and follow the real call graph: routing → middleware → handler → services → data access → response.
- Notes branches, transactions, retries, and side effects (events published, caches written, emails queued), each cited at `file:line`.
- Emits a source-linked step-by-step trace and a Mermaid `sequenceDiagram` of the actual path.

**Best for:**
- Understanding an unfamiliar flow before you change it, or explaining it to a teammate.
- Finding where a surprising side effect (an email, an event) actually originates.

## Agents

### env-doctor

**Triggers when:** a repository won't run locally and you need it bootstrapped and green ("get this running", "set up the dev environment", "the install is failing", "wrong Node/Python/Ruby/JDK version", "missing env var", "port already in use", day-one onboarding).

**What it does:** Detects the required runtimes/tooling/services from the manifests, runs the setup end-to-end, and diagnoses failures to a named root cause, installing pinned runtime versions via a version manager, mapping a missing header to its OS package, reconciling `.env.example` against the code, freeing port conflicts, and handling OS-specific breakage. Applies the least-invasive safe fix, writes only confirmed-working steps to `SETUP.md`, and never invents credentials or secret values. Has `Bash` and `Edit` because bootstrapping requires running commands and creating config; it never deploys or mutates remote state.

### change-locator

**Triggers when:** someone knows what to change but not where ("where do I add …", "which file handles …", "where is X implemented", "what do I need to touch to …", or a feature/bug task description).

**What it does:** Turns a task into a domain-vocabulary search, greps the feature/route/model, follows imports and call sites across layers, and returns ranked edit sites with `file:line`, the symbol, and a rationale, plus the tests to update and the risks that widen the blast radius. Read-only (`Read`/`Grep`/`Glob` only), a cheap, parallelizable exploration that never modifies code.

### flow-tracer

**Triggers when:** you need to understand what actually happens end-to-end for a request or action ("trace this request", "what happens when a user clicks X", "walk me through the login flow", "how does this endpoint work end-to-end", or a request for a sequence diagram).

**What it does:** Finds the entry point and follows the real chain hop by hop, middleware, handler, services, data access, external calls, response, resolving each call to its definition, noting branches and side effects, and marking boundaries where the path leaves the repo. Produces a numbered `file:line`-cited trace and a Mermaid `sequenceDiagram` whose participants match the trace one-to-one. Read-only (`Read`/`Grep`/`Glob` only); never fabricates a hop it can't find in source.

## Skills

### Build System Decode

A methodology for reading and driving common build systems and monorepos: detect the tool from its manifest, use the tool's own introspection instead of hand-parsing config, and always find the narrowest build/test command. Reference files: `build-systems.md` (per tool, Make, Bazel, Gradle, Maven, npm/pnpm/yarn, Nx, Turborepo, CMake, cargo, go, how to list targets, read the dependency graph, and build/test one package) and `monorepo-patterns.md` (workspaces, project graphs, affected/changed detection, task pipelines and caching, and how tasks are wired across packages).

### Setup Diagnosis

A map of where a repo declares its runtime needs plus a catalog of common setup failures and fixes, turning bootstrapping into detect → run → diagnose → verify. Reference files: `setup-signals.md` (every place a repo declares runtime/version/service/env requirements, and how to reconcile conflicting pins like `.nvmrc` vs `engines` vs a stale README) and `setup-failures.md` (wrong runtime version, missing system libs, missing env vars, native build failures, dependency drift, port conflicts, and OS differences, each with the tell-tale error string and the concrete fix).

## Hooks

Codebase Navigator ships a **SessionStart** hook that is **advisory and non-blocking**. When a fresh session starts inside a git repository, it injects a one-line orientation note suggesting you run `/dev-env-bootstrap` to get the project running, `/build-explain` to decode the build system, or `/locate-change` to find where a change belongs.

It only surfaces a suggestion. It is fail-safe by design, a silent no-op outside a git repository, and it never blocks the session, changes any exit code, or slows startup. Disable it any time via the `/hooks` menu or by removing the plugin.

## Typical Workflow

1. You clone an unfamiliar service and open it. The advisory SessionStart hook notes you're in a git repo and suggests `/dev-env-bootstrap`.
2. You run `/dev-env-bootstrap`. The env-doctor agent detects a Node 20 pin and a Postgres dependency, installs the version via `nvm`, brings up the compose services, fixes a `node-gyp` failure by flagging the missing `libpq-dev`, and writes a verified `SETUP.md`.
3. The repo is a monorepo, so you run `/build-explain web`. It detects Turborepo over pnpm, lists the real targets, shows the project graph, and hands you `turbo run test --filter=web...` to test just your package plus its dependencies.
4. You pick up a ticket and run `/locate-change add a 'remember me' checkbox to login`. The change-locator agent returns the login form component, the auth handler, the session/cookie logic, and the auth tests, ranked, each with `file:line` and a rationale.
5. Before editing, you run `/trace-flow POST /login` to see the real path. The flow-tracer agent produces a source-linked trace and a sequence diagram, confirming exactly where the session is created, so your edit lands in the right seam.

## Plugin Structure

```
codebase-navigator/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── dev-env-bootstrap.md
│   ├── build-explain.md
│   ├── locate-change.md
│   └── trace-flow.md
├── agents/
│   ├── env-doctor.md
│   ├── change-locator.md
│   └── flow-tracer.md
├── skills/
│   ├── build-system-decode/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── build-systems.md
│   │       └── monorepo-patterns.md
│   └── setup-diagnosis/
│       ├── SKILL.md
│       └── references/
│           ├── setup-signals.md
│           └── setup-failures.md
└── README.md
```

## Requirements

- Claude Code CLI
- A repository to orient in. For `/dev-env-bootstrap`, the env-doctor agent benefits from the relevant toolchain being available locally (a version manager such as nvm/pyenv/rbenv/asdf/mise, and `docker`/`docker compose` if the repo declares backing services). The read-only commands (`/build-explain`, `/locate-change`, `/trace-flow`) need only the source.

## License

MIT

## Version

1.0.0

Read less, ship sooner, get from `git clone` to a confident first change on day one.
