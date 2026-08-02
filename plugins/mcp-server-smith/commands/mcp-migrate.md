---
description: Migrate an MCP server to the 2026-07-28 stateless core, transport, lifecycle, and auth
argument-hint: [server-dir-or-entry-file]
model: inherit
---

Migrate the MCP server at `$ARGUMENTS` (directory or entry file; current repo if omitted) to the **MCP 2026-07-28** specification: from the removed HTTP+SSE transport and stateful sessions to the **stateless Streamable HTTP core**, with lifecycle, capabilities, and authorization brought up to spec. Load the `mcp-2026-07-28` skill (transport + lifecycle + versioned extensions) and, for remote servers, `mcp-authorization`, then dispatch the `mcp-migrator` agent to apply the edits. Run `/mcp-audit` first if you have not already, and reuse its findings.

## Process

### Step 1: Establish the starting point
Detect the SDK/language and the current transport and protocol version (see `/mcp-audit` Step 1). Classify the server:
- **HTTP+SSE (dual-endpoint)** → the removed transport; the core migration target.
- **Stateful Streamable HTTP** (relies on a persisted `Mcp-Session-Id` / in-process session map) → migrate to stateless where the tools allow.
- **stdio** → transport is fine; only lifecycle/version/capability and (n/a) auth items apply.

### Step 2: Migrate the transport
Replace the SSE dual-endpoint (`GET /sse` + `POST /messages`) with a single Streamable HTTP endpoint. Bump the SDK to a version that speaks `2026-07-28`. Preserve every registered tool, resource, and prompt and their handlers, this is a **transport swap, not a rewrite**. See `references/transport-and-lifecycle.md` for the before/after per SDK.

### Step 3: Make it stateless where possible
Move per-session in-process state to either (a) the request itself (self-contained requests) or (b) an external store keyed by a stable id, so any replica can serve any request. Where a tool genuinely needs continuity (a long-running job), model it with the **Tasks versioned extension** rather than a sticky session. Call out honestly any state that cannot be made stateless and why.

### Step 4: Fix lifecycle, capabilities, and auth
- Update the `initialize` result to report the new `protocolVersion` and only the capabilities actually implemented.
- For remote servers, align authorization to OAuth 2.1 / OIDC: validate the access token's audience against this server, add the Protected Resource Metadata document, and remove any token passthrough to downstream APIs (`mcp-authorization`, `references/oauth-oidc-patterns.md`).

### Step 5: Output
Emit exactly:
- `## Migration Plan`: current transport/version → target, per-item, one line each.
- `## Applied Diffs`: grouped by file, before/after, with `file:line`.
- `## Manual Follow-ups`: SDK version bump to run, env/secret or reverse-proxy changes, state that could not be made stateless, and anything needing a human decision.
- `## Verify`: the commands to reinstall, start, and re-run `/mcp-audit` to confirm the server now reports `2026-07-28`.

## Important Notes
- Behavior-preserving: keep every tool's name, input schema, and result shape identical unless the spec forces a change; migrate the plumbing around them.
- Never silently drop a capability or tool to make the server "stateless"; if statelessness is impossible for a feature, keep it and document the tradeoff.
- Do not invent an SDK API; if the pinned SDK version cannot speak `2026-07-28`, the fix is the version bump, state it rather than faking a method.
- Never introduce a token passthrough while migrating auth; a downstream call needs its own token minted for that audience.
