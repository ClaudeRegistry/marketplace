# Build Systems: List Targets, Read the Graph, Build One Package

For each tool: **detect → list targets → dependency graph → build/test ONE package**. The last row is the one a newcomer wants most. Always use the tool's own query commands; never invent a target.

## Make
- **Detect:** `Makefile` / `GNUmakefile`.
- **List targets:** `make help` if a help target exists; otherwise `grep -E '^[a-zA-Z0-9_.-]+:' Makefile` and read `.PHONY:`. `make -qp | awk -F':' '/^[a-zA-Z0-9][^$#\/\t=]*:([^=]|$)/{print $1}'` dumps the database.
- **Graph:** dependencies are the words after `target:`. `make -Bnd <target>` prints the prerequisite tree without running. `remake -x` for step tracing.
- **Build one thing:** `make <target>`. Beware recursive Make (`$(MAKE) -C subdir`), the real work is in sub-Makefiles. Variables can be overridden inline: `make build ENV=test`.

## Bazel
- **Detect:** `MODULE.bazel`/`WORKSPACE` + `BUILD`/`BUILD.bazel` files.
- **List targets:** `bazel query //...` (all), `bazel query //pkg:all` (one package), `bazel query 'kind("cc_binary rule", //...)'` by rule kind.
- **Graph:** `bazel query 'deps(//app:server)'`, reverse deps `bazel query 'rdeps(//..., //lib:core)'`, why-path `bazel query 'somepath(//a, //b)'`. Visualize: `bazel query --output=graph 'deps(//app)' | dot -Tpng`.
- **Build/test one thing:** `bazel build //services/api:server`, `bazel test //services/api:unit_test`. `bazel test //services/api/...` for a subtree. Bazel builds *only* the target's transitive deps, never the world. First run may need `bazel mod deps`/network fetch.

## Gradle
- **Detect:** `settings.gradle(.kts)` (lists subprojects), `build.gradle(.kts)` per module.
- **List targets:** `./gradlew tasks --all`; `./gradlew projects` for the module tree. Always use the wrapper `./gradlew`, not a system `gradle`.
- **Graph:** `./gradlew :app:dependencies` (configuration-scoped), `./gradlew :app:dependencyInsight --dependency <lib>`, module deps via the `project(':x')` entries in each `build.gradle`.
- **Build/test one module:** `./gradlew :service-a:build`, test just it with `./gradlew :service-a:test`. Path is the module path from `settings.gradle` (`:group:module`). `--offline` avoids network; `--console=plain` for clean logs.

## Maven
- **Detect:** `pom.xml`; a parent POM with `<modules>` is a reactor (multi-module) build.
- **List targets:** phases are fixed (`validate→compile→test→package→verify→install`). `mvn help:describe -Dplugin=<p>` documents a plugin's goals; `<modules>` lists submodules.
- **Graph:** `mvn dependency:tree`, reactor order printed at build start; `mvn -pl <module> dependency:tree`.
- **Build/test one module:** `mvn -pl service-a -am test` builds module `service-a` **and** the modules it depends on (`-am` = also-make), skipping the rest. `mvn -pl service-a test -o` offline. Add `-DskipTests` to build without testing.

## npm / pnpm / yarn scripts
- **Detect:** `package.json` `scripts`; lockfile selects the manager (`package-lock.json`→npm, `pnpm-lock.yaml`→pnpm, `yarn.lock`→yarn). `packageManager` field pins it.
- **List targets:** the `scripts` object; `npm run` (no arg) lists them.
- **Graph:** in a workspace, `pnpm list -r --depth -1` / `npm query .workspace` lists packages; inter-package deps are the `dependencies` on `workspace:*`/`*` internal versions.
- **Build/test one package:** `pnpm --filter <pkg> build`, `pnpm --filter <pkg>... test` (with deps). npm: `npm run test -w <pkg>`. yarn: `yarn workspace <pkg> test`. See `monorepo-patterns.md` for filters.

## Nx
- **Detect:** `nx.json` + per-project `project.json`/inferred targets.
- **List targets:** `nx show projects`, `nx show project <name>` (its targets), `nx graph` (interactive dep graph).
- **Graph:** `nx graph` (visual), `nx graph --focus=<project>`; the project graph is derived from imports + explicit `implicitDependencies`.
- **Build/test one project:** `nx build <project>`, `nx test <project>`. Only-affected: `nx affected -t build --base=main`. Nx caches target results; a warm cache returns instantly.

## Turborepo
- **Detect:** `turbo.json` (`tasks`/`pipeline`) over a package-manager workspace.
- **List targets:** tasks are defined in `turbo.json`; underlying scripts live in each package's `package.json`.
- **Graph:** `turbo run build --dry=json` shows the task graph and what would run; `--graph` emits a Graphviz file.
- **Build/test one package:** `turbo run build --filter=<pkg>`, include deps with `--filter=<pkg>...`, only-changed `--filter=...[origin/main]`. Turbo caches by input hash.

## CMake
- **Detect:** `CMakeLists.txt`.
- **List targets:** configure first (`cmake -S . -B build`), then `cmake --build build --target help`.
- **Graph:** `cmake --graphviz=graph.dot -S . -B build` emits target dependencies; `add_dependencies`/`target_link_libraries` define edges.
- **Build one target:** `cmake --build build --target <t> -j`. Pick a generator (`-G Ninja`) for speed; a preset (`CMakePresets.json`) may encode the canonical config.

## cargo (Rust)
- **Detect:** `Cargo.toml`; `[workspace]` with `members` = a workspace.
- **List targets/members:** `cargo metadata --format-version 1 | jq '.packages[].name'`; `cargo build --workspace` builds all members.
- **Graph:** `cargo tree` (dependency tree), `cargo tree -i <crate>` (inverse), `-e no-dev` to drop dev-deps.
- **Build/test one crate:** `cargo build -p <crate>`, `cargo test -p <crate>`. `--no-default-features`/`--features` control feature flags that change what compiles.

## go build
- **Detect:** `go.mod`; `go.work` = a multi-module workspace.
- **List packages:** `go list ./...` (all), `go list -m all` (module deps).
- **Graph:** `go mod graph` (module graph), `go list -deps ./cmd/app`, visualize with `go mod graph | dot`.
- **Build/test one package:** `go build ./service/api/...`, `go test ./service/api/...`. `go build ./...` compiles everything; scope with the package path. `-run TestName` narrows tests.

## Cross-cutting tips
- Prefer the **wrapper** (`./gradlew`, `./mvnw`), it pins the tool version.
- The first build often needs a **bootstrap**: toolchain/SDK fetch, `bazel mod deps`, `go mod download`, `./gradlew --write-verification-metadata`. Report it separately from the build command.
- Use **offline flags** (`-o`, `--offline`, `--frozen-lockfile`) to prove the graph is complete and reproducible.
- When two build layers exist, the top-level target usually just shells out to the inner tool, read the recipe to find the real command.
