# Setup Signals: Where a Repo Declares What It Needs

A repo tells you its runtime, tooling, services, and config in machine-readable files. Read them; trust them over prose. This catalog lists every signal, what it declares, and how to reconcile conflicts.

## Runtime version pins
| File | Declares | Notes |
|------|----------|-------|
| `.nvmrc` | Node version | one line, e.g. `20.11.1`; consumed by nvm/fnm |
| `.node-version` | Node version | fnm/nodenv; coexists with `.nvmrc` |
| `package.json` `engines.node` | Node (and npm) range | a **constraint** (`>=18 <21`), not an exact pin |
| `package.json` `packageManager` | pnpm/yarn/npm + version | Corepack reads this; authoritative for the PM |
| `.tool-versions` | Multiple runtimes | asdf/mise; `nodejs 20.11.1`, `python 3.12.2`, `ruby 3.3.0` |
| `mise.toml` / `.mise.toml` | Multiple runtimes + tasks | mise successor to asdf config |
| `.python-version` | Python version | pyenv |
| `pyproject.toml` `requires-python` | Python range | constraint; the resolver enforces it |
| `.ruby-version` | Ruby version | rbenv/chruby |
| `Gemfile` `ruby "x"` | Ruby version | Bundler enforces at `bundle install` |
| `go.mod` `go 1.x` | Go language version | minimum toolchain |
| `pom.xml` `<maven.compiler.release>` / `<java.version>` | JDK version | ; Gradle: `sourceCompatibility`/toolchain |
| `.sdkmanrc` | JDK/Gradle/etc. | SDKMAN per-dir versions |
| `rust-toolchain.toml` | Rust toolchain | channel + components |
| `.ruby-gemset`, `.terraform-version`, `.python-version` | tool-specific | one tool each |

## Package/dependency manifests
| Ecosystem | Manifest | Lockfile (install from this) |
|-----------|----------|------------------------------|
| Node | `package.json` | `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` |
| Python | `pyproject.toml` / `requirements*.txt` / `Pipfile` | `poetry.lock` / `pip` pinned txt / `Pipfile.lock` |
| Ruby | `Gemfile` | `Gemfile.lock` |
| Go | `go.mod` | `go.sum` |
| Java (Maven) | `pom.xml` | (versions pinned in POM) |
| Java (Gradle) | `build.gradle(.kts)` | `gradle.lockfile` (if enabled) |
| Rust | `Cargo.toml` | `Cargo.lock` |
| PHP | `composer.json` | `composer.lock` |

Always install from the **lockfile** with a frozen/CI flag (`npm ci`, `pnpm i --frozen-lockfile`, `poetry install`, `bundle install`, `cargo build --locked`) to reproduce the intended tree.

## Containers and services
| File | Declares |
|------|----------|
| `Dockerfile` | The build+runtime image; the base image reveals the OS/runtime |
| `docker-compose.yml` / `compose.yaml` | Backing services (Postgres, Redis, Kafka, MinIO…), ports, env, volumes |
| `.devcontainer/devcontainer.json` | A reproducible dev container + post-create setup |
| `Procfile` | Process types (web/worker), how the app is run |
| `k8s/`, `helm/`, `skaffold.yaml` | Deploy-time services (rarely needed for local dev) |

`docker-compose.yml` is the fastest source of truth for "what must be running before the app boots", read its `services:`, `ports:`, and any `depends_on:`.

## Environment / configuration
| File | Declares |
|------|----------|
| `.env.example` / `.env.sample` / `.env.template` | The env vars the app expects (values are placeholders) |
| `config/*.example`, `settings.example.*` | Framework config templates |
| `direnv` `.envrc` | Auto-loaded shell env |
| The code that reads config | The **actual** required set, reconcile against `.env.example` |

The `.env.example` is a starting point, not gospel: grep the codebase for `process.env.`, `os.environ`, `ENV[`, `System.getenv`, `viper.Get`, etc. to find variables the example forgot. Never fabricate secret values, record the variable name and mark it as user-supplied.

## Project-authored setup (the blessed path)
| File | Look for |
|------|----------|
| `Makefile` | `setup`, `bootstrap`, `install`, `dev`, `up` targets |
| `justfile` | `just setup` / `just dev` |
| `Taskfile.yml` | `task setup` |
| `scripts/` | `setup`, `bootstrap`, `dev.sh`, `install.sh` |
| `package.json` `scripts` | `postinstall`, `prepare`, `dev`, `setup` |
| `CONTRIBUTING.md`, `docs/development.md` | The human-authored steps (verify, they drift) |

If a repo ships a setup target, prefer it, it encodes the maintainers' real path, including ordering and hidden steps.

## Precedence and reconciliation
When signals disagree, resolve in this order:
1. **Exact pins beat ranges.** `.nvmrc`/`.tool-versions` (exact) override `engines` (a range). Pick a version that satisfies both.
2. **Lockfile beats manifest.** Install the locked versions; the manifest range is only the constraint.
3. **Machine-readable beats prose.** A file the tooling reads (`.tool-versions`, `packageManager`) overrides a README sentence. Note the drift so it can be fixed.
4. **The setup target beats hand-assembly.** If `make setup` exists and works, its steps are canonical.
5. **Container beats host assumptions.** If a devcontainer/compose defines the environment, match its versions and services rather than the host's.

Record each resolved requirement as `requirement → version → declared in file:line`, and flag every conflict you reconciled so the maintainer can align the sources.
