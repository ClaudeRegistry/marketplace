# Monorepo Patterns: Workspaces, Project Graphs, and Affected Detection

Monorepos share four mechanics regardless of tool: a **workspace** definition of the member packages, a **project graph** of inter-package dependencies, **affected/changed** detection to build only what a diff touches, and a **task pipeline + cache** so unchanged work is skipped. Learn where each lives per toolchain.

## The four mechanics

### 1. Workspace membership (what packages exist)
| Tool | Declared in | List command |
|------|-------------|--------------|
| pnpm | `pnpm-workspace.yaml` (`packages:`) | `pnpm list -r --depth -1` |
| npm | `package.json` `workspaces` | `npm query .workspace` |
| yarn (berry) | `package.json` `workspaces` | `yarn workspaces list` |
| Nx | inferred + `nx.json` | `nx show projects` |
| Turborepo | the underlying PM workspace | `turbo ls` |
| Bazel | every `BUILD` file is a package | `bazel query //...` |
| cargo | `Cargo.toml` `[workspace].members` | `cargo metadata` |
| Go | `go.work` `use (...)` | `go list -m all` |
| Gradle | `settings.gradle` `include(...)` | `./gradlew projects` |
| Maven | parent `pom.xml` `<modules>` | reactor list at build start |

### 2. The project graph (who depends on whom)
Two ways an edge is created:
- **Implicit / derived from imports**: Nx, Turborepo, Bazel (via `deps`), and JS package graphs infer edges from `import`/`require` and from internal `dependencies` pointing at `workspace:*` versions.
- **Explicit**: Gradle `project(':lib')`, Maven `<dependency>` on a sibling module, cargo `path = "../lib"`, Go module `require` + `replace`, Bazel `deps = ["//lib:core"]`, Nx `implicitDependencies`.

Inspect it:
- `nx graph` / `nx graph --focus=<p>`: interactive.
- `turbo run build --dry=json`: resolved task graph.
- `bazel query 'deps(//app)'` and `rdeps(//..., //lib)`: forward and reverse.
- `pnpm why -r <pkg>`: why an internal package is pulled in.
- `cargo tree -i <crate>`: inverse dependency tree.

### 3. Affected / changed detection (build only the diff)
The highest-leverage monorepo feature: given a base commit, build/test only the packages whose sources changed **plus everything downstream that depends on them**.

| Tool | Affected command |
|------|------------------|
| Nx | `nx affected -t build test --base=origin/main --head=HEAD` |
| Turborepo | `turbo run build --filter=...[origin/main]` |
| pnpm | `pnpm --filter '...[origin/main]' build` |
| Bazel | `bazel query 'rdeps(//..., set(<changed targets>))'` (with `--output=package`) driven by changed files |
| Rush | `rush build --to git:origin/main` |
| Lerna | `lerna run build --since origin/main` |

The `...` / `^`/`*` operators mean "and its dependents/dependencies":
- pnpm/Turbo `pkg...` = `pkg` **and everything that depends on it** (downstream).
- pnpm/Turbo `...pkg` = `pkg` **and everything it depends on** (upstream).
- `[origin/main]` = "changed since this ref."

### 4. Task pipeline + cache (skip unchanged work)
- **Nx**: `nx.json` `targetDefaults` + `namedInputs`; caches by hashing inputs. `dependsOn: ["^build"]` means "build deps first."
- **Turborepo**: `turbo.json` `tasks.<name>.dependsOn` (`^build` = upstream builds first), `outputs` (what to cache), `inputs`. Remote cache shares hits across CI/dev.
- **Bazel**: correctness-by-construction, every action is hashed on its declared inputs; the local/remote cache and remote execution follow from hermetic `BUILD` files.
- **Gradle**: the build cache + `--configuration-cache`; up-to-date checks skip tasks whose inputs/outputs are unchanged.
- **Maven**: no native graph cache; `-pl <m> -am`/`-amd` scope the reactor manually (`-amd` = also-make-dependents).

## Reading an unfamiliar monorepo, order of operations
1. **Find the workspace file** (table above) to get the package list. Cite it.
2. **Pick the graph tool** and render the graph focused on the package you care about.
3. **Find the pipeline config** (`turbo.json`/`nx.json`/root `build.gradle`) to see how `build`/`test`/`lint` chain and what runs upstream.
4. **Learn the affected command** for the tool, this is how you (and CI) avoid building the world.
5. **Confirm caching**: a second run should be near-instant on a warm cache; if not, an input is over-broad (e.g. a timestamp or `.git` in `inputs`).

## Common gotchas
- **Phantom / hoisted dependencies**: a package imports something it doesn't declare, resolved only because a sibling hoisted it. `pnpm` with strict `node-linker` surfaces these; Bazel forbids them by design.
- **Over-broad `inputs`** wreck cache hit rates, including `**/*` or generated files means every change busts every cache.
- **Version-mismatch of the tool** across dev/CI: always pin via `packageManager`, the wrapper, or a toolchain file.
- **Two orchestration layers** (e.g. Make → Turbo → tsc): the top-level target is often a thin shim; read the recipe to find the command that actually compiles.
- **Explicit vs implicit edges drift**: an import exists but no graph edge (Nx `implicitDependencies` missing) means affected detection silently skips a dependent, verify the graph matches reality.
