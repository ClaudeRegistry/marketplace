# Transport and lifecycle (2026-07-28)

## Streamable HTTP, stateless (TypeScript)
The 2026-07-28 default for a remote server: a single endpoint, one transport per request, no session map.

```ts
// src/index.ts
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./server.js"; // returns a configured McpServer

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  // New transport + server per request => no cross-request server state.
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined }); // stateless
  res.on("close", () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.listen(process.env.PORT ?? 8787);
```

Key points:
- `sessionIdGenerator: undefined` runs the transport **stateless**, no `Mcp-Session-Id` correlation, so any replica serves any request.
- Constructing the server per request keeps zero mutable state between calls. If construction is expensive, cache only **immutable** config, never per-client state.
- Only the `POST /mcp` path is needed; there is no second SSE channel.

## Streamable HTTP (Python, FastMCP)
```python
# server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server", stateless_http=True)  # stateless streamable HTTP

@mcp.tool()
def ping() -> str:
    return "pong"

app = mcp.streamable_http_app()  # mount under an ASGI server (uvicorn)
```

## Migrating off HTTP+SSE
The removed transport looks like this (do not ship it for anything new):
```ts
// OLD, removed in 2026-07-28
app.get("/sse", (req, res) => { /* open SSE channel, store transport by session */ });
app.post("/messages", (req, res) => { /* look up the session's transport, dispatch */ });
```
Migration checklist:
1. Delete the `GET /sse` and `POST /messages` handlers and the session-keyed transport map.
2. Add the single `POST /mcp` Streamable HTTP handler above.
3. Bump `@modelcontextprotocol/sdk` (or `mcp`/`fastmcp`) to a version that speaks `2026-07-28`.
4. Preserve every `tool`/`resource`/`prompt` registration and handler body unchanged.
5. Update any client config / reverse proxy from the two old paths to the one new path.
6. Re-run `/mcp-audit` and confirm the `initialize` result reports `protocolVersion: "2026-07-28"`.

## The initialize handshake
Client → server:
```json
{ "method": "initialize",
  "params": { "protocolVersion": "2026-07-28",
    "capabilities": { "roots": {}, "sampling": {} },
    "clientInfo": { "name": "claude-code", "version": "2.1.x" } } }
```
Server → client (report only what you implement):
```json
{ "result": { "protocolVersion": "2026-07-28",
    "capabilities": { "tools": { "listChanged": true }, "resources": {}, "logging": {} },
    "serverInfo": { "name": "my-server", "version": "1.0.0" } } }
```
- If you cannot honor `listChanged` notifications, do not advertise them.
- Negotiate down gracefully: if the client offers an older `protocolVersion` you support, answer with that version; if you cannot, return an error, do not pretend.

## Statelessness pitfalls to flag
- A module-level `const sessions = new Map()` read across requests.
- Caching a user's auth/context on the transport and reusing it for the next request.
- Progress or streaming that assumes the same socket stays open for minutes, use Tasks (see `versioned-extensions.md`).
- Rate-limit or nonce counters kept in memory (shard-inconsistent), move to a shared store.
