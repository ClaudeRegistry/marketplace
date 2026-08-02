---
description: Scaffold a new MCP server, stateless Streamable HTTP core, 2026-07-28 spec, TS or Python
argument-hint: [server-name] [ts|python] [http|stdio]
model: inherit
---

Scaffold a new Model Context Protocol server from `$ARGUMENTS` (server name, language `ts`|`python`, transport `http`|`stdio`; ask for whatever is missing). Produce a **minimal, correct, 2026-07-28-shaped** server the user can run and extend, not a kitchen-sink template. Load the `mcp-2026-07-28` skill for the transport/lifecycle shape, the `mcp-tool-design` skill for the example tool, and, for a remote `http` server, the `mcp-authorization` and `mcp-server-security` skills.

## Process

### Step 1: Confirm the shape
Decide from the arguments and the surrounding repo:
- **Language + SDK.** TypeScript → `@modelcontextprotocol/sdk` (`McpServer` + `StreamableHTTPServerTransport`). Python → `mcp` / `fastmcp` (`FastMCP` with the streamable-HTTP app). Match the repo's existing toolchain if there is one.
- **Transport.** `stdio` for a local, per-user tool launched by the client; `http` (Streamable HTTP) for a remote, multi-user server. Default to `http` when the name implies a hosted service, `stdio` otherwise.
- **Stateless by default.** Build the HTTP server so each request is self-contained (no reliance on in-process session state that a second replica would not share), per the 2026-07-28 stateless core. See the `mcp-2026-07-28` skill.

### Step 2: Generate the server
Write a small, working tree. For a TypeScript Streamable-HTTP server that is roughly:
- `package.json` (ESM, `@modelcontextprotocol/sdk` + `zod`, a `start` script), `tsconfig.json`, `src/server.ts` (constructs the `McpServer`, registers tools/resources), `src/index.ts` (Express/Node HTTP wiring the `StreamableHTTPServerTransport`, stateless mode, health check), `.gitignore`, `.env.example`, `README.md`.
- Register **one real example tool** with a complete zod `inputSchema`, correct annotations (`readOnlyHint` etc.), and a structured error path, following `mcp-tool-design`. No placeholder `foo`/`bar`.

For Python, the equivalent `pyproject.toml` + `server.py` using `FastMCP` and its streamable-HTTP app.

Also emit a `server.json` (registry manifest) stub and, if `http`, a sample reverse-proxy snippet, so the server is publishable, not just runnable.

### Step 3: Wire authorization and security (remote only)
For an `http` server, do not ship an authless template silently. Add, or clearly stub with `TODO` and inline guidance:
- Access-token validation on every request (audience bound to this server), per `mcp-authorization` / `references/token-validation.md`.
- A `/.well-known/oauth-protected-resource` metadata route.
- Input validation, size caps, and a note on rate limiting from `mcp-server-security`.
State plainly in the README whether the scaffold is authless-for-local-dev or auth-required, so no one deploys an open write-capable server by accident.

### Step 4: Output
Emit exactly:
- `## Files`: each generated file with its full contents.
- `## Run It`: the exact install + start commands, and the `claude mcp add` line to connect it to Claude Code.
- `## Next`: what to implement next (real tools, auth wiring, tests), pointing at `/mcp-audit` to check the result.

## Important Notes
- Prefer the smallest server that actually starts and passes an `initialize` handshake over a broad but non-working template.
- Never scaffold the removed HTTP+SSE transport or a stateful-session design; Streamable HTTP, stateless, is the 2026-07-28 default.
- Never hard-code a secret or token in the generated code; use `.env.example` + `process.env` / `os.environ`.
- Match the host repo's package manager, module system, and lint/format config when scaffolding into an existing project.
