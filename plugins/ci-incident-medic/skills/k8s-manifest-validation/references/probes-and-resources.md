# Probes, Resources, and securityContext

Deep reference for the three areas that cause the most silent Kubernetes failures.

## Probes: liveness vs readiness vs startup

| Probe | Question it answers | On failure | Traffic impact |
|-------|---------------------|-----------|----------------|
| **readiness** | "Can this Pod serve requests *right now*?" | remove Pod from Service endpoints | stops traffic; Pod keeps running |
| **liveness** | "Is this Pod wedged and needs a restart?" | kill & restart the container | none directly; restart |
| **startup** | "Has this slow app finished booting yet?" | kill if it never starts in the budget | gates the other two until it passes |

### The classic mistakes
1. **No readiness probe** → the Service routes traffic to a Pod the instant it's `Running`, before the app can accept connections → early 502s on every deploy.
2. **No liveness probe** → a deadlocked/event-loop-blocked process stays `Running` forever; nothing restarts it.
3. **Liveness too aggressive** (short `initialDelaySeconds`/`timeoutSeconds`) → a healthy-but-slow app gets killed repeatedly → CrashLoopBackOff that looks like an app bug but is a probe-tuning bug.
4. **Slow start with only a liveness probe** → liveness kills the app mid-boot before it's ready. Fix with a **startup probe** that gives a generous budget, after which liveness takes over at a tight interval.
5. **Liveness == readiness == the same heavy endpoint** → a dependency blip fails liveness and restarts a Pod that only needed to be pulled from rotation. Keep liveness cheap and local; put dependency checks in readiness.

### Tuning fields
```yaml
startupProbe:      # generous: covers worst-case boot time
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 30
  periodSeconds: 5           # up to 150s to start
readinessProbe:    # frequent, reflects dependencies
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
  timeoutSeconds: 2
  failureThreshold: 3
livenessProbe:     # cheap, local, forgiving enough to avoid flapping
  httpGet: { path: /healthz, port: 8080 }
  initialDelaySeconds: 0     # 0 is fine once a startupProbe exists
  periodSeconds: 10
  timeoutSeconds: 2
  failureThreshold: 3
```
Guidance: `liveness` should test only the process itself (not the database). `readiness` may check dependencies. Sum of `failureThreshold * periodSeconds` is how long before action, size it above normal jitter.

## Resources and QoS classes

Kubernetes assigns a **QoS class** from requests/limits; it drives eviction order under node pressure.

| QoS class | Condition | Eviction priority |
|-----------|-----------|-------------------|
| **Guaranteed** | every container has requests == limits for both CPU and memory | evicted **last** |
| **Burstable** | at least one request set, but not Guaranteed | evicted **middle** |
| **BestEffort** | no requests or limits anywhere | evicted **first** |

### Rules that prevent silent failures
- **Always set memory requests AND limits.** Memory is non-compressible: exceeding the limit → **OOMKilled** (exit 137). A missing limit lets one Pod consume the node and evict neighbors.
- **Set CPU requests; be careful with CPU limits.** CPU is compressible, over-limit is *throttled*, not killed. Aggressive CPU limits cause latency spikes (CFS throttling) even when the node has spare CPU. Many teams set CPU requests but omit CPU limits deliberately.
- **For latency-critical workloads, target Guaranteed** (requests == limits) so they're evicted last and get predictable scheduling.
- **Right-size from real usage**, not guesses, over-requesting wastes cluster capacity; under-requesting causes evictions and noisy-neighbor issues.

```yaml
resources:
  requests: { cpu: "250m", memory: "512Mi" }
  limits:   { memory: "512Mi" }     # memory limit == request (Guaranteed-ish); CPU limit optional
```

### OOMKill signals
`kubectl describe pod` shows `Last State: Terminated, Reason: OOMKilled, Exit Code: 137`. That's a memory limit set too low (or a leak), not a scheduling bug.

## securityContext hardening

Pod- and container-level fields that harden the runtime. Missing these means running as root and, on clusters enforcing Pod Security Standards (Restricted), later admission rejection.

```yaml
spec:
  securityContext:                 # Pod-level
    runAsNonRoot: true
    runAsUser: 10001               # numeric non-zero
    fsGroup: 10001
    seccompProfile: { type: RuntimeDefault }
  containers:
    - name: app
      securityContext:             # container-level (wins on conflict)
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        runAsNonRoot: true
        capabilities: { drop: ["ALL"] }
```

| Field | Threat it blocks |
|-------|------------------|
| `runAsNonRoot: true` + numeric `runAsUser` | container running as root / escape to host root |
| `allowPrivilegeEscalation: false` | setuid/`sudo`-style escalation inside the container |
| `readOnlyRootFilesystem: true` | attacker writing tools/persisting to the container fs |
| `capabilities.drop: ["ALL"]` | using Linux caps (e.g. NET_RAW) for lateral movement |
| `seccompProfile: RuntimeDefault` | dangerous syscalls |
| `privileged: false` (never `true`) | full host access |

For `readOnlyRootFilesystem: true`, mount an `emptyDir` at the few writable paths (`/tmp`, cache dirs). Pod Security Admission "Restricted" requires most of the above, validating them pre-flight avoids a rejected apply on a hardened cluster.
