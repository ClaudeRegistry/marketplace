# Per-Kind Manifest Checklist

For each kind: the common mistakes, **how they fail silently** (apply succeeds, behavior is wrong), and the fix.

## Deployment

| Mistake | Silent failure | Fix |
|---------|----------------|-----|
| No resource `requests`/`limits` | BestEffort QoS; evicted first under pressure; can OOM the node | set both per container |
| No readiness probe | Service sends traffic before app is ready → 502/connection refused | add `readinessProbe` |
| No liveness probe | wedged (deadlocked) Pod runs forever, never restarts | add `livenessProbe` |
| `:latest` image | rollout pulls a moving tag; two replicas can differ | pin `image: app:1.4.2` (or digest) |
| `imagePullPolicy: Always` with mutable tag | surprise version changes on restart | pin tag + `IfNotPresent` |
| Single replica | any node drain/rollout = downtime | `replicas: >= 2` + PDB |
| Labels/selector mismatch | Deployment manages 0 Pods; nothing runs | `selector.matchLabels` == `template.metadata.labels` |
| No `securityContext` | runs as root; may be rejected by PSA later | `runAsNonRoot: true`, drop caps |
| No `strategy`/`maxUnavailable` tuning | rollout can take down too many Pods at once | set RollingUpdate `maxUnavailable`/`maxSurge` |

Example correct skeleton:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: api, namespace: payments }
spec:
  replicas: 3
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      securityContext: { runAsNonRoot: true, seccompProfile: { type: RuntimeDefault } }
      containers:
        - name: api
          image: registry.example.com/api:1.4.2
          ports: [{ containerPort: 8080 }]          # int, unquoted
          resources:
            requests: { cpu: "250m", memory: "256Mi" }
            limits:   { cpu: "500m", memory: "256Mi" }
          readinessProbe: { httpGet: { path: /ready, port: 8080 }, initialDelaySeconds: 5 }
          livenessProbe:  { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 10 }
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: ["ALL"] }
```

## Service

| Mistake | Silent failure | Fix |
|---------|----------------|-----|
| `selector` doesn't match Pod labels | Service has 0 endpoints; connections hang/refuse | align selector with Pod labels |
| `targetPort` ≠ container port | traffic to a port nothing listens on | match `targetPort` to `containerPort` |
| Quoted port (`port: "80"`) | schema may accept but type is wrong | integers, unquoted |
| `type: LoadBalancer` in a cluster without a provider | stuck `<pending>` external IP forever | use ClusterIP + Ingress, or a real LB |
| Missing `targetPort` (named) but container port unnamed | resolution fails silently | name the port on both sides |

Check endpoints: a healthy Service should populate an EndpointSlice; zero endpoints = selector/label mismatch.

## Ingress

| Mistake | Silent failure | Fix |
|---------|----------------|-----|
| Missing `ingressClassName` | no controller claims it; no routing | set `ingressClassName` |
| `pathType` omitted/wrong | path matches nothing or too much | set `Prefix`/`Exact` explicitly |
| Backend Service/port doesn't exist | 503 from the ingress | verify `service.name`/`service.port` |
| TLS secret in wrong namespace | cert not found; serves default cert | put the TLS Secret in the Ingress namespace |
| Host mismatch with DNS | routes never hit | align `host` with actual DNS |

## ConfigMap

| Mistake | Silent failure | Fix |
|---------|----------------|-----|
| Secrets stored in a ConfigMap | secret exposed (ConfigMaps aren't encrypted/secret) | move to a Secret |
| Numeric/bool values unquoted | YAML coerces `on`/`1.20`/`true` | quote all values |
| Updated ConfigMap not picked up | env-var mounts don't hot-reload; Pod keeps old value | roll the Deployment or use a checksum annotation |
| Referenced key missing | container fails to start (if `optional: false`) or silently empty | verify keys exist |

## Secret

| Mistake | Silent failure | Fix |
|---------|----------------|-----|
| Base64 mistaken for encryption | anyone with read access decodes it | use RBAC, encryption-at-rest, external secret store |
| Hardcoded literal in manifest committed to git | secret leaked in history | reference an externally-managed Secret |
| `stringData` vs `data` confusion | double-encoded or garbled value | `stringData` for plain text; `data` for base64 |
| Wrong `type` (e.g. not `kubernetes.io/dockerconfigjson`) | image pull auth silently fails | set the correct Secret `type` |

## HorizontalPodAutoscaler

| Mistake | Silent failure | Fix |
|---------|----------------|-----|
| Target Deployment has no CPU/mem `requests` | HPA can't compute utilization; never scales | set resource requests on the target |
| `scaleTargetRef` name/kind wrong | HPA manages nothing | match ref to the workload |
| min == max | autoscaling is a no-op | set a real range |
| No metrics-server / metrics API | HPA shows `<unknown>` targets | ensure metrics pipeline exists |

## Cross-cutting

- **Namespace**: set `metadata.namespace` explicitly; relying on `default` risks wrong-place deploys and RBAC/quota surprises.
- **Helm/Kustomize**: unresolved `{{ ... }}` or overlay patches mean the literal you see isn't the applied value — validate against the *rendered* output (`helm template` / `kustomize build`), and flag templated fields rather than treating them as literals.
- **API version drift**: removed/renamed `apiVersion` (e.g. old `extensions/v1beta1`) applies on old clusters, fails on new — pin to the current stable group/version.
