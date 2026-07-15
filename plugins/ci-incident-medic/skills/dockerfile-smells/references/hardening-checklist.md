# Dockerfile Hardening Checklist

Each item: **what to do → the threat it addresses → how**. Work top to bottom; the highest-impact security wins are first.

## 1. Run as a non-root user
**Threat:** If the process runs as root (UID 0) and an attacker gains code execution, a container escape or a mounted host path grants host-level root. Root is also the default and violates the Kubernetes Restricted Pod Security Standard.

**How:**
```dockerfile
# create a dedicated non-root user in the build/runtime stage
RUN addgroup --system --gid 10001 app \
 && adduser  --system --uid 10001 --ingroup app app
USER 10001            # numeric UID so K8s runAsNonRoot can verify it
```
Use a **numeric** UID in `USER`: Kubernetes `runAsNonRoot` cannot confirm a username resolves to non-zero, but it can verify a numeric non-zero UID. Distroless `:nonroot` images already run as UID 65532.

## 2. Minimal / distroless runtime base
**Threat:** Every shell, package manager, and library in the final image is attack surface and a potential CVE. A full `ubuntu`/`node` base carries hundreds of packages the app never uses.

**How:** Use `gcr.io/distroless/*`, `-slim`, or `alpine` (mind musl for glibc-linked apps). Distroless has no shell, smaller surface, but debug with an ephemeral/`:debug` variant. Never install `curl`, `bash`, or build tools "just in case."

## 3. Pin the base image by digest
**Threat:** `FROM node:20` is a moving tag, tomorrow's pull can be a different image (drift or a compromised tag). Non-reproducible builds also make incident forensics impossible.

**How:**
```dockerfile
FROM node:20.11.1-slim@sha256:<64-hex-digest>
```
Keep the human tag as a comment for readability. Resolve an unknown digest with `docker buildx imagetools inspect node:20.11.1-slim`. Update digests deliberately (e.g. via a bot), not implicitly.

## 4. No secrets in any layer
**Threat:** `ENV API_KEY=...`, `ARG TOKEN` used at build, or a copied `.env`/private key becomes a permanent, extractable layer, `docker history` and a pulled image expose it even after a later `RUN rm`.

**How:**
- Build-time secrets: BuildKit mounts, never persisted.
  ```dockerfile
  RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
  ```
- Runtime secrets: inject via the orchestrator (K8s Secret, env at runtime), never bake into the image.
- Add `.env*`, `*.pem`, `id_rsa`, credentials files to `.dockerignore`.

## 5. Read-only root filesystem (runtime)
**Threat:** A writable root filesystem lets an attacker drop tools, modify binaries, or persist. Most apps only need to write to `/tmp` or a data volume.

**How:** Design the image to run with `--read-only` (Docker) or `securityContext.readOnlyRootFilesystem: true` (K8s), mounting an `emptyDir`/tmpfs for the few writable paths. Avoid writing into the image at runtime.

## 6. Drop capabilities; no setuid/setgid escalation
**Threat:** Linux capabilities and setuid binaries allow privilege escalation inside the container.

**How:**
- Runtime: drop all capabilities and add back only what's needed (`--cap-drop=ALL`, K8s `capabilities.drop: ["ALL"]`), and set `allowPrivilegeEscalation: false` / `no-new-privileges`.
- Image: avoid setuid/setgid binaries in the final stage; you can strip the bits:
  ```dockerfile
  RUN find / -perm /6000 -type f -exec chmod a-s {} \; 2>/dev/null || true
  ```

## 7. HEALTHCHECK where the app supports one
**Threat:** A process can be "running" but wedged (deadlocked, event loop blocked). Without a health signal the orchestrator keeps routing traffic to it.

**How:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD ["/app/healthcheck"]   # exec form; a small binary, not curl if curl isn't present
```
In Kubernetes, prefer liveness/readiness probes over `HEALTHCHECK` (K8s ignores the Dockerfile `HEALTHCHECK`), but keep it for plain Docker/Compose/Swarm.

## 8. Clean package manager caches in the same layer
**Threat:** Package lists and caches persist as layer bloat even if deleted in a later `RUN`.

**How:**
```dockerfile
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```
Alpine: `apk add --no-cache`. Python: `pip install --no-cache-dir`.

## 9. Prefer COPY over ADD
**Threat:** `ADD` auto-extracts archives and can fetch remote URLs unverified, surprising behavior and a supply-chain hole.

**How:** Use `COPY` for local files. For remote artifacts, fetch explicitly and verify a checksum before use.

## 10. Deterministic, minimal final stage
**Threat:** Copying `node_modules`/build dirs indiscriminately drags dev dependencies and caches into the runtime image.

**How:** In the runtime stage copy only the built artifact and production dependencies from the build stage (`COPY --from=build /app/dist /app/dist`). Set an explicit non-shell `ENTRYPOINT` in exec form.

## Verification quick pass
- [ ] `USER` is set to a numeric non-root UID.
- [ ] Runtime base is distroless/slim and pinned by digest.
- [ ] No `ENV`/`ARG`/copied file contains a secret; `docker history` is clean.
- [ ] Package caches cleaned in the same `RUN`.
- [ ] `.dockerignore` excludes VCS, deps, build output, env/secret files.
- [ ] HEALTHCHECK (Docker) or probes (K8s) present.
- [ ] Final stage copies only artifacts + prod deps.
