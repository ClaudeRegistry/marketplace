---
description: Audit an MCP server for 2026-07-28 spec compliance, tool design, and security, no server started
argument-hint: [server-dir-or-entry-file]
model: inherit
---

Audit the MCP server rooted at `$ARGUMENTS` (a directory, an entry file, or the current repo if omitted) for compliance with the **MCP 2026-07-28** specification, tool-design quality, and security. This is a **static, read-only review**: read the source, never start the server, never send a request, never read secrets. Load the `mcp-2026-07-28` skill (transport + lifecycle + extensions), the `mcp-authorization` skill (OAuth/OIDC), the `mcp-tool-design` skill, and the `mcp-server-security` skill, then dispatch the `spec-compliance-auditor` agent to produce the findings.

## Process

### Step 1: Detect the SDK, transport, and spec era
Glob for the entry point and manifest (`package.json`, `pyproject.toml`, `server.json`, `Dockerfile`). Identify the SDK and language:

| Ecosystem | Import / symbol to look for | Server class |
|---|---|---|
| TypeScript | `@modelcontextprotocol/sdk` | `McpServer` / `Server`, `StreamableHTTPServerTransport`, `StdioServerTransport` |
| Python | `mcp` / `fastmcp` | `FastMCP`, `Server`, `streamable_http_app`, `stdio_server` |
| Go | `mcp-go` / `modelcontextprotocol/go-sdk` | `server.NewMCPServer`, `StreamableHTTP` |

Determine the **transport** (stdio, Streamable HTTP, or the removed HTTP+SSE) and the **declared protocol version** (the `protocolVersion` in the `initialize` result, or the SDK version pinned in the manifest). Flag a server still on HTTP+SSE or advertising a pre-`2026-07-28` version as the primary migration finding.

### Step 2: Score compliance against 2026-07-28
Check, with `file:line` evidence, each axis from `mcp-2026-07-28`:
- **Stateless core.** No per-connection server memory required across requests; each request is self-contained; safe to run on serverless/edge behind multiple instances. Flag reliance on in-process session state that a load balancer would shard incorrectly (see `references/transport-and-lifecycle.md`).
- **Lifecycle.** Correct `initialize` handshake, capability negotiation, and version reporting; no assumption of a long-lived bidirectional channel.
- **Versioned extensions.** If the server ships MCP Apps (interactive UI) or Tasks (long-running work), confirm they are declared under the versioned extensions framework, not bolted onto core methods.
- **Capabilities.** Declared capabilities (`tools`, `resources`, `prompts`, `logging`, `completions`) actually match what the handlers implement.

### Step 3: Review authorization
If the server is remote (HTTP), apply `mcp-authorization`:
- Does it act as an OAuth 2.1 **resource server** and validate the access token on every request (audience/`aud` bound to this server, issuer, expiry, signature)? See `references/token-validation.md`.
- Is there a Protected Resource Metadata document (`/.well-known/oauth-protected-resource`) pointing at the authorization server, per the OIDC alignment in 2026-07-28?
- **Never a passthrough.** The server must not forward the client's token to a downstream API, and must not accept a token minted for a different audience (the confused-deputy / token-passthrough anti-pattern). Flag any place a request-bearing token is reused outbound.

### Step 4: Review tool design
Apply `mcp-tool-design`: few, powerful, well-named tools over many thin ones; complete JSON-Schema `inputSchema` with descriptions and enums; accurate `readOnlyHint`/`destructiveHint`/`idempotentHint` annotations; structured, non-leaky error results (`isError` with a useful message, never a raw stack trace); output kept small and paginated. Flag tools whose description invites the model to do something the schema does not constrain.

### Step 5: Security pass
Apply `mcp-server-security` (`references/threat-model.md`): input validation on every tool argument; no shell/SQL/path injection from arguments (command construction, `child_process`, `eval`, unparameterized queries, path traversal into the filesystem); secrets read from env/secret store, never hard-coded or logged; rate limiting / size caps on remote transports; CORS not blanket-`*` when the server is authenticated; resource and prompt content treated as untrusted (injection) when fed back to the model.

### Step 6: Output
Emit exactly these sections:
- `## Server Profile`: SDK, language, transport, declared protocol version, remote/local, one line.
- `## Compliance Findings`: a table of axis → status (pass / gap / broken) → `file:line` evidence → fix.
- `## Security Findings`: ranked by severity (critical/high/medium/low), each with the concrete failing input and the remediation.
- `## Recommended Next Commands`: e.g. `/mcp-migrate` if pre-`2026-07-28`, or the specific hardening edits to apply.

## Important Notes
- Static only: never run the server, never open a socket, never read a `.env`/credential file's values (you may note that one exists and is git-ignored).
- Ground every finding in a real `file:line`; never invent a handler, capability, or token flow that the code does not contain.
- Distinguish a **spec gap** (works today but not 2026-07-28-shaped) from a **security bug** (exploitable now), the fixes and urgency differ.
- Local stdio servers do not need OAuth; do not flag missing authorization on a stdio-only server.
