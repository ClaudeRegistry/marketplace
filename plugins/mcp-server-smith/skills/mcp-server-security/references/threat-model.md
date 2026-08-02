# MCP server threat model

## Per-boundary breakdown
| # | Boundary | Threat | Primary control |
|---|---|---|---|
| 1 | client identity | confused deputy / token passthrough | validate `aud`; own/exchanged downstream token (`mcp-authorization`) |
| 2 | tool args → OS/DB/net | command / SQL / path injection, SSRF | validate + parameterize + allowlist |
| 3 | tool/resource output → model | prompt injection / tool poisoning | untrusted content; scoped destructive tools |
| 4 | volume | DoS / resource exhaustion | caps, timeouts, shared-store rate limits |
| 5 | config → logs/errors | secret & internals disclosure | env secrets; redact; clean errors |
| 6 | transport | open CORS, plaintext, exposed admin | allowlist origins; TLS; bind narrowly |

## Injection: vulnerable vs fixed

### Command
```ts
// ❌ shell built from an argument
exec(`convert ${args.file} out.png`);
// ✅ no shell, arg array, validated path
execFile("convert", [safePath(args.file), "out.png"]);
```

### SQL
```python
# ❌ string-built query
cur.execute(f"SELECT * FROM orders WHERE status = '{args['status']}'")
# ✅ parameterized
cur.execute("SELECT * FROM orders WHERE status = %s", (args["status"],))
```

### Path traversal
```ts
// ✅ confine to a root
const root = "/srv/data";
const p = path.resolve(root, args.name);
if (!p.startsWith(root + path.sep)) throw new Error("path escapes root");
```

### SSRF
```ts
// ✅ allowlist host + scheme, block internal ranges
const u = new URL(args.url);
if (u.protocol !== "https:") throw new Error("https only");
if (!ALLOWED_HOSTS.has(u.hostname) || isPrivateOrMetadata(u.hostname))
  throw new Error("host not allowed");
```
`isPrivateOrMetadata` blocks `localhost`, `127.0.0.0/8`, RFC1918 (`10/8`, `172.16/12`, `192.168/16`), and `169.254.169.254` (cloud metadata).

## Prompt-injection containment checklist
Tool/resource output is untrusted input to the model. You cannot stop the content from *trying* to inject; you limit the blast radius:
- [ ] Destructive tools require scope the injected content's session does not automatically hold.
- [ ] Destructive tools carry `destructiveHint` so the host can gate them on confirmation.
- [ ] Tool descriptions contain no instructions a caller/data can weaponize (no "always run X after").
- [ ] Returned untrusted content is delivered as data, not wrapped as an instruction to the model.
- [ ] Read-only, least-privilege tools preferred; minimize the destructive surface an injection can reach.

## DoS controls (stateless-safe)
- Request body + argument **size caps** (reject early).
- **Timeouts** on every downstream/long call; long work → Tasks extension, not a held socket.
- **Rate limits** keyed by client/token in a **shared store** (so they hold across replicas), never an in-process counter.
- **Pagination** + max page size on every collection-returning tool.

## Audit questions `/mcp-audit` asks
1. Is `aud` validated against this server, and is the incoming token ever forwarded downstream? (critical)
2. Does any tool build a shell/SQL/path/URL from an argument without parameterization/allowlisting? (critical/high)
3. Are destructive tools annotated and scoped, or can an injected instruction reach them freely? (high)
4. Are there size caps, timeouts, and cross-replica rate limits? (medium)
5. Are secrets env-sourced and kept out of logs and results? (high if leaked)
6. Is CORS blanket-`*` on an authenticated server, or is a debug/admin route exposed on the public path? (medium)
Each answer must cite a `file:line`; unresolved-by-static-analysis items are marked, not guessed.
