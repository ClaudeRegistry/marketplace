---
description: Trace a user action end-to-end through the real call graph with a diagram
argument-hint: [entry point or user action]
model: inherit
---

Trace what actually happens when a user action or request runs, from entry point through routing, middleware, handlers, services, and data access, to the response. Use this to understand an unfamiliar path before you change it, or to explain a flow to a teammate. `$ARGUMENTS` names the action or entry point (e.g. "POST /checkout", "user clicks Export", "the nightly reconciliation job", "GraphQL updateProfile").

## Process

### Step 1: Find the entry point
Identify how the flow starts and where it is registered, do not assume a framework, detect it:
- **HTTP/API**: route tables, decorators/annotations (`@app.route`, `@GetMapping`, `router.post`), OpenAPI specs, framework controllers.
- **GraphQL/RPC**: resolver maps, `.proto` service definitions, schema-to-resolver wiring.
- **Events/jobs**: queue subscribers, cron/scheduler registrations, message handlers.
- **CLI/UI**: command registration, or the client handler that issues the request.

### Step 2: Follow the real call graph
**Launch the flow-tracer agent** with the entry point. It follows the actual chain, middleware and guards → handler → service/domain logic → data access and external calls → response serialization, resolving each hop through imports and call sites, and noting branches, retries, transactions, and side effects (events published, caches written, emails queued). Every hop is cited at `file:line`; it never fabricates a step it cannot find in the source.

### Step 3: Report
Produce exactly these sections:

- **Entry point**: the trigger, its registration `file:line`, and the input shape (route+method, event name, or command).
- **Step-by-step trace**: one numbered step per hop: layer, `file:line`, function signature, what it does, and any branch/side effect. Mark async/queued hops.
- **Data access & external calls**: the reads/writes and third-party calls made along the path, each with `file:line`.
- **Sequence diagram**: a Mermaid `sequenceDiagram` of the *real* path (participants = the actual components you traced, not a generic template).

## Important Notes
- Trace, don't guess. Follow real call sites and imports; every step cites `file:line`. If the chain forks on a condition, show both branches or state which one you followed and why.
- Never invent a step, a service, or a diagram participant that isn't in the code. If the path leaves the repo (an external API, another service), mark it as a boundary and name the client that crosses it.
- Show the failure/error path where it materially differs from the happy path, that is often where the real behavior lives.
- Keep the diagram faithful to the trace: the participants and arrows must correspond one-to-one with the numbered steps above them.
