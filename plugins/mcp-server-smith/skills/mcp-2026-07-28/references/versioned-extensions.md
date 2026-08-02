# Versioned extensions: MCP Apps and Tasks

The 2026-07-28 spec adds a **versioned extensions** framework so capabilities beyond the core can be introduced and revised without breaking core interoperability. Two extensions ship with it: **MCP Apps** and **Tasks**. Extensions are negotiated at `initialize` alongside core capabilities and carry their own version, a server can support the core spec without any extension, and clients degrade gracefully when an extension is absent.

## When to reach for an extension
| Need | Use | Not |
|---|---|---|
| Surface an interactive UI / rich rendering to the user | **MCP Apps** | stuffing HTML into a tool's text result |
| Work that takes longer than a request (build, crawl, batch job) | **Tasks** | a sticky session / an open socket held for minutes |
| A normal request/response tool call | core `tools` | an extension |

## MCP Apps (interactive UI)
For servers that need to present a UI surface (a form, a chart, an interactive result) rather than plain text/JSON. Declare the extension at initialize and render through its defined surface, so the host controls where and how the UI appears. Keep the underlying data available as a normal tool result too, so a client without the Apps extension still gets a usable answer.

## Tasks (long-running work)
The stateless-friendly way to model work that outlives a single request:
1. A tool/method **starts** the task and returns a **task id** immediately (no open socket held).
2. The client **polls or subscribes** for status/progress using the id.
3. On completion, the result is fetched by id.

Because the id is external and durable, **any replica can start, report, or complete the task**, this is what keeps long-running work compatible with the stateless core. Store task state in a shared store (DB/queue), never in per-process memory.

```
client → tools/call start_export        → { taskId: "exp_123", status: "running" }
client → tasks/get { taskId: "exp_123" } → { status: "running", progress: 0.4 }
client → tasks/get { taskId: "exp_123" } → { status: "completed", result: {...} }
```

Anti-pattern this replaces: opening an SSE stream and pushing progress frames for two minutes over one connection, that reintroduces stateful, sticky sessions and breaks horizontal scale.

## Compliance notes
- Advertise an extension only if implemented, and report its version.
- Do not overload a core method to fake an extension's behavior (e.g. a `tools/call` that blocks for minutes instead of returning a task id).
- Extensions are optional: the server must still be fully usable over the core spec for clients that negotiate none.
