# Setup Failure Modes and Fixes

Each entry: **tell-tale error → root cause → fix**. Anchor diagnosis on the exact error string. Prefer the least-invasive, reversible fix (version manager, project-local venv, `.env`) over global system mutation. Never fabricate a secret value.

## 1. Wrong runtime version
**Symptoms:**
- Node: `The engine "node" is incompatible with this module`, `Unexpected token` / `SyntaxError` on `?.`/top-level await, `error: unknown option '--experimental-...'`.
- Python: `SyntaxError` on match/`:=`, `This package requires Python >=3.11`, `distutils` gone (3.12+).
- Ruby: `Your Ruby version is 3.1.0, but your Gemfile specified 3.3.0`.
- JVM: `Unsupported class file major version 65`, `invalid target release: 21`.

**Root cause:** The installed runtime differs from the repo's pin (`.nvmrc`/`.tool-versions`/`engines`/`.ruby-version`/`<java.version>`).

**Fix:** Install and select the pinned version with a version manager, per-project:
```bash
nvm install && nvm use          # reads .nvmrc
fnm use --install-if-missing
pyenv install -s $(cat .python-version) && pyenv local $(cat .python-version)
rbenv install -s && rbenv local $(cat .ruby-version)
asdf install                     # or: mise install   (reads .tool-versions/mise.toml)
sdk env install                  # reads .sdkmanrc
```
Then re-run the install. Do not `sudo`-install a global runtime to satisfy one repo.

## 2. Missing system libraries / native build failure
**Symptoms:** `gyp ERR!`, `node-gyp rebuild` failing; `pg_config executable not found`; `error: linker 'cc' not found`; `fatal error: openssl/ssl.h: No such file`; `Microsoft Visual C++ 14.0 or greater is required`; `nokogiri`/`pg`/`mysql2` gem build failure; `cargo` `linker not found`.

**Root cause:** A dependency compiles native code and needs OS-level toolchain/headers that aren't installed.

**Fix:** Install the platform build prerequisites, then reinstall:
```bash
# Debian/Ubuntu
sudo apt-get install -y build-essential python3 libpq-dev libssl-dev pkg-config
# macOS
xcode-select --install            # + brew install postgresql openssl pkg-config
# Windows
# install "Desktop development with C++" (VS Build Tools); prefer prebuilt/WSL2
```
Map the missing header to its package: `libpq`→`libpq-dev`, `openssl/ssl.h`→`libssl-dev`, `Python.h`→`python3-dev`. Prefer a prebuilt wheel/binary where one exists to skip the compile entirely.

## 3. Missing environment variables
**Symptoms:** App crashes on boot with `KeyError: 'DATABASE_URL'`, `Environment variable X is required`, an undefined/empty config value, or a `401`/connection error against a service whose URL is blank.

**Root cause:** No `.env`, or `.env.example` is missing variables the code actually reads.

**Fix:**
```bash
cp .env.example .env
```
Then reconcile: grep the code for config reads (`process.env.`, `os.environ[`, `ENV[`, `System.getenv`, `viper.Get`) and fill in **non-secret** local defaults (DB URL pointing at the compose service, feature flags). For real secrets (API keys, tokens), list them by name as required and leave them blank, never invent a value. Point the app at local service URLs from `docker-compose.yml` (e.g. `DATABASE_URL=postgres://localhost:5432/app`).

## 4. Backing service not running / not ready
**Symptoms:** `ECONNREFUSED 127.0.0.1:5432`, `Redis connection to localhost:6379 failed`, migrations hang, health check never turns green.

**Root cause:** The app needs a DB/cache/queue that isn't started, or isn't *ready* yet (started ≠ accepting connections).

**Fix:** Bring up the declared services and wait for readiness before migrate/seed:
```bash
docker compose up -d
docker compose ps            # confirm healthy, not just "Up"
# wait for readiness before proceeding:
until docker compose exec -T db pg_isready; do sleep 1; done
```
Use compose `healthcheck`/`depends_on: condition: service_healthy` where present. If ports are taken, see #6.

## 5. Dependency resolution / lockfile drift
**Symptoms:** `npm ERR! ERESOLVE could not resolve` (peer deps); `The lockfile ... is not up to date`; `Bundler could not find compatible versions`; `poetry` `SolverProblemError`; a `yanked` version; `integrity checksum failed`.

**Root cause:** The manifest and lockfile disagree, a transitive constraint is unsatisfiable, or a published version was removed.

**Fix:** Install from the lockfile with a frozen flag to reproduce the intended tree:
```bash
npm ci                       # not `npm install`
pnpm install --frozen-lockfile
yarn install --immutable
bundle install               # honors Gemfile.lock
poetry install               # honors poetry.lock
cargo build --locked
```
If the lockfile is genuinely stale, regenerate it deliberately and report the change, do not silently `npm install` and mutate the tree. For a hard peer conflict, identify the offending pair from the error before touching versions; avoid `--legacy-peer-deps`/`--force` unless you understand what it papers over.

## 6. Port conflict
**Symptoms:** `EADDRINUSE: address already in use :::3000`, `bind: address already in use`, `port is already allocated`.

**Root cause:** Another process (or a stale container) holds the port the app or a compose service wants.

**Fix:** Find and free it, or remap:
```bash
lsof -i :3000                 # macOS/Linux: identify the holder
# Windows: netstat -ano | findstr :3000  then  taskkill /PID <pid> /F
```
Prefer an override (`PORT=3001 npm run dev`) or a compose port remap (`"3001:3000"`) over killing an unknown process. Stop stale containers with `docker compose down`.

## 7. OS-specific differences
**Symptoms:** Works on their machine, not yours: `CRLF`/`LF` diffs, `bash\r: No such file`, `fsevents`/`inotify` errors, case-sensitivity (`import './User'` vs `user.ts`), path-separator bugs, musl-vs-glibc (`Error loading shared library ... not found` on Alpine).

**Root cause:** Host OS differs from where the repo was authored/tested.

**Fix:**
- Line endings: set `git config core.autocrlf` appropriately; ensure the repo has a `.gitattributes` with `* text=auto` and `*.sh text eol=lf`.
- Case-sensitivity: fix the import to match the on-disk filename (macOS/Windows are case-insensitive; Linux/CI are not).
- Native binaries on Alpine/musl: use a glibc base or the musl-targeted package.
- File watchers: increase `fs.inotify.max_user_watches` on Linux if a watcher fails to start.
- When the host is a persistent obstacle, fall back to the **devcontainer/compose** environment so everyone runs the same OS.

## 8. Stale or wrong README steps
**Symptoms:** The documented command doesn't exist, references a removed script, or a version the repo no longer pins.

**Root cause:** Docs drifted from the code; the machine-readable manifests are the current truth.

**Fix:** Follow the manifests and setup targets over the prose (see `setup-signals.md` precedence). Note the drift explicitly so it can be corrected, and put only the **confirmed-working** commands into `SETUP.md`.

## Verification gate (before writing SETUP.md)
A step earns a place in `SETUP.md` only if it actually ran green. Confirm the environment with a smoke check:
- run the fastest test subset, or
- hit the app's health endpoint (`curl -fsS localhost:<port>/health`), or
- run the app's `--version`/`doctor` command.

If a step can't be verified (needs a secret you lack, an unreachable dependency), mark it `[requires: <NAME>, not verified]` rather than presenting it as passing.
