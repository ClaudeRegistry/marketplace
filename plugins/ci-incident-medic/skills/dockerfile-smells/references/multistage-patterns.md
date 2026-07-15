# Multi-Stage Build Patterns by Ecosystem

Copy-pasteable templates. Each splits a heavy **build** stage from a minimal **runtime** stage, orders layers for cache reuse (manifests before source), pins/uses a slim or distroless runtime, and runs non-root. Replace `<digest>` with a real digest resolved via `docker buildx imagetools inspect`.

## General shape
```
FROM <build-base> AS build      # compilers, dev deps, source → produce an artifact
...build steps...
FROM <runtime-base> AS runtime  # minimal; copy ONLY the artifact + prod deps
COPY --from=build ...
USER <non-root>
ENTRYPOINT [...]
```
The runtime stage never sees the toolchain, so it stays small and low-surface.

## Node.js
```dockerfile
# ---- build ----
FROM node:20.11.1-slim@sha256:<digest> AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime ----
FROM gcr.io/distroless/nodejs20-debian12@sha256:<digest> AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER 65532                      # distroless nonroot
EXPOSE 3000
CMD ["dist/server.js"]          # distroless nodejs entrypoint is node
```
Notes: cache-mount `~/.npm` for fast reinstalls; `npm ci` needs the lockfile; distroless has no shell, so use exec-form CMD.

## Python
```dockerfile
# ---- build ----
FROM python:3.12-slim@sha256:<digest> AS build
WORKDIR /app
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip pip install --no-cache-dir -r requirements.txt
COPY . .

# ---- runtime ----
FROM python:3.12-slim@sha256:<digest> AS runtime
RUN adduser --system --uid 10001 app
WORKDIR /app
COPY --from=build /venv /venv
COPY --from=build /app /app
ENV PATH="/venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 10001
EXPOSE 8000
ENTRYPOINT ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
```
Notes: build the venv once and copy it; keep glibc (`-slim` not `alpine`) so prebuilt wheels install without recompiling. For distroless Python, ship the venv into `gcr.io/distroless/python3`.

## Go
```dockerfile
# ---- build ----
FROM golang:1.22@sha256:<digest> AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

# ---- runtime ----
FROM gcr.io/distroless/static-debian12:nonroot@sha256:<digest> AS runtime
COPY --from=build /app/server /server
USER 65532
EXPOSE 8080
ENTRYPOINT ["/server"]
```
Notes: `CGO_ENABLED=0` yields a static binary that runs on `scratch`/distroless static; `-ldflags="-s -w"` strips debug info for a smaller binary. Add `ca-certificates` via distroless (already included) if you make TLS calls.

## Java / JVM
```dockerfile
# ---- build ----
FROM eclipse-temurin:21-jdk@sha256:<digest> AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src ./src
RUN ./mvnw -q -B package -DskipTests

# ---- runtime ----
FROM eclipse-temurin:21-jre@sha256:<digest> AS runtime
RUN useradd --system --uid 10001 app
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```
Notes: copy the dependency manifest and run `go-offline`/`dependency:resolve` before the source so the dependency layer caches. For a smaller runtime, build a custom JRE with `jlink`/`jdeps` or use `-jre`/distroless Java. Set `MaxRAMPercentage` so the JVM respects the container memory limit.

## Rust
```dockerfile
# ---- build ----
FROM rust:1.77@sha256:<digest> AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main(){}" > src/main.rs \
 && cargo build --release && rm -rf src        # cache deps
COPY . .
RUN cargo build --release

# ---- runtime ----
FROM gcr.io/distroless/cc-debian12:nonroot@sha256:<digest> AS runtime
COPY --from=build /src/target/release/app /app
USER 65532
EXPOSE 8080
ENTRYPOINT ["/app"]
```
Notes: the dummy-`main.rs` trick builds and caches dependencies before real source is present. Use `distroless/cc` for dynamically-linked (glibc) Rust binaries, or build with the musl target and ship on `scratch` for a fully static binary.

## What to copy into the final stage (rule)
- The built artifact (binary, jar, `dist/`, compiled wheels/venv).
- Production dependencies only (no dev/test deps, no build cache).
- Runtime config the app reads at startup (but never secrets).
- Nothing else, no source tree, no `.git`, no toolchain.

## Cache-mount cheat sheet (BuildKit)
| Ecosystem | Mount target |
|-----------|--------------|
| Node | `/root/.npm` (or `/root/.yarn`, pnpm store) |
| Python | `/root/.cache/pip` |
| Go | `/go/pkg/mod` and `/root/.cache/go-build` |
| Java (Maven) | `/root/.m2` |
| Rust | `/usr/local/cargo/registry` and `target` |

Cache mounts persist across builds without landing in the image, giving fast reinstalls with zero image bloat.
