---
description: Decode the build system and show how to build or test one package fast
argument-hint: [optional: target]
model: inherit
---

Decode this repository's build system so you can build and test without holding the whole dependency graph in your head. Use this when `make`, Bazel, Gradle, or a monorepo task runner is opaque and you just need the right command for one package. `$ARGUMENTS` may name a target, package, or module to focus on (e.g. `//services/api:test`, `web`, `:app:assembleDebug`); with no argument, map the whole build.

## Process

### Step 1: Detect the build system
Identify the driver(s) from their manifests, a repo can have more than one layer (a top-level task runner over a per-language build). Consult the **build-system-decode** skill (`build-systems.md`) for per-tool details.

| Manifest | Build system |
|----------|--------------|
| `Makefile` | Make |
| `BUILD`, `BUILD.bazel`, `WORKSPACE`, `MODULE.bazel` | Bazel |
| `build.gradle(.kts)`, `settings.gradle` | Gradle |
| `pom.xml` | Maven |
| `package.json` `scripts`, lockfile | npm / pnpm / yarn scripts |
| `nx.json`, `project.json` | Nx |
| `turbo.json` | Turborepo |
| `CMakeLists.txt` | CMake |
| `Cargo.toml` (`[workspace]`) | cargo |
| `go.mod`, `go.work` | go build |

### Step 2: Enumerate the targets
List what you can actually run and what each does, do not invent targets. Use the tool's own introspection rather than parsing by eye:
- Make: read `.PHONY` and rule names; `make -qp` / `make help` if present.
- Bazel: `bazel query //...`, `bazel query 'deps(//target)'`.
- Gradle: `./gradlew tasks --all`, `:project:dependencies`.
- Maven: `mvn -q help:describe`, the `<modules>` list.
- npm/pnpm/yarn: the `scripts` block; workspace list.
- Nx/Turbo: `nx graph` / `turbo run build --dry`, `project.json`/`turbo.json` `pipeline`/`tasks`.
- cargo/go: `cargo metadata`, `go list ./...`.

### Step 3: Map the dependency graph
Show which packages/modules depend on which, and where the slow edges are. Identify the difference between building **the world** and building **one package plus only its dependencies**. For monorepos, apply the **build-system-decode** skill's `monorepo-patterns.md` (workspaces, project graph, affected/changed detection).

### Step 4: Report
Produce exactly these sections:

- **Build system**: which tool(s), and the manifest that proves it (`file:line`).
- **Targets**: a table of `Target | What it does | Command`, in plain language.
- **Dependency graph**: the package/module edges (a short Mermaid `graph` when it clarifies), and the critical/slow path.
- **Build/test one package**: the exact command to build or test just `$ARGUMENTS` (or a representative package) without building everything, plus how to scope to only affected/changed projects.

## Important Notes
- Prefer the build tool's own query/graph commands over hand-parsing config; cite the manifest lines you relied on.
- Never fabricate a target, task name, or command output, if a target isn't defined, say so and show how to list what is.
- Call out the one command a newcomer most wants: "build/test just my package." Make it the headline.
- Note any required bootstrap (toolchain fetch, `bazel sync`, `./gradlew --write-verification-metadata`) before the first build will succeed.
