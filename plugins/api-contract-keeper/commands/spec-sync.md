---
description: Detect drift between the API spec (OpenAPI/GraphQL) and handler code, then reconcile both sides
argument-hint: [spec-file]
model: inherit
---

Compare the API specification in `$ARGUMENTS` (or auto-discover it: `openapi.yaml`/`openapi.json`, `swagger.{yaml,json}`, `*.graphql`/`schema.graphql`, or a `buf`/`proto` file) against the **actual handler code**, report every point of drift, and reconcile it. This is a **static** analysis, no server is started and no requests are sent. Load the `openapi-drift` skill for the drift-signal catalog and breaking-change rules.

## Process

### Step 1: Locate the spec and detect the framework
Find the spec, then detect the web framework so you know how to read routes, params, and schemas from code:

| Framework | Signal |
|---|---|
| Express | `express()`, `app.get/post`, `router.<verb>`, `routes/` |
| Fastify | `fastify()`, `fastify.route`, `schema:` route options |
| NestJS | `@Controller`, `@Get/@Post`, `*.controller.ts`, `@ApiProperty` |
| Koa | `koa-router`, `router.<verb>`, `ctx.body` |
| FastAPI | `APIRouter`, `@app.get`, `response_model=`, Pydantic models |
| Django REST Framework | `urls.py`, `ViewSet`, `serializers.py`, `*_views.py` |
| Flask | `@app.route`, `@bp.route`, blueprints |
| Spring Boot | `@RestController`, `@GetMapping`, `@RequestBody`, DTOs |
| Go net/http / Gin | `http.HandleFunc`, `mux.HandleFunc`, `r.GET`, `gin.Context` |
| Rails | `config/routes.rb`, `*_controller.rb`, `respond_to`, strong params |

For GraphQL, compare the SDL (`type`, `input`, `enum`, field args, nullability `!`) against resolver signatures and the code-first schema builders (Nexus, TypeGraphQL, Strawberry, gqlgen, graphql-ruby).

### Step 2: Build both models and diff them
Extract the endpoint surface from **both** sides and align them by path+method (or GraphQL type+field). Compare on these axes and record which side each fact came from:

| Axis | Spec side | Code side |
|---|---|---|
| Route exists | `paths./x.get` | a registered handler for `GET /x` |
| Path/query params | `parameters[]` | route tokens, `req.query`, `@Query`, `request.args` |
| Request body schema | `requestBody.content.schema` | validation schema / DTO / serializer |
| Response schema | `responses.200.content.schema` | returned object / `response_model` / DTO |
| Status codes | declared `responses` keys | `res.status()`, `raise HTTPException`, `render status:` |
| Required vs optional | `required: [...]`, `nullable` | validator `.optional()`, `Optional[...]`, `?` |
| Auth/security | `security`, `securitySchemes` | auth middleware/decorators/guards |

### Step 3: Classify each mismatch
Use `references/drift-signals.md` to name the divergence and decide which side is authoritative, the spec (intended contract) or the code (implemented behavior). Typical classes: **endpoint in code but not spec** (undocumented), **endpoint in spec but not code** (unimplemented/removed), **param/field mismatch**, **type or nullability mismatch**, **status-code mismatch**, **auth mismatch**.

### Step 4: Dispatch the drift-reconciler agent
Launch the **drift-reconciler** agent with the drift list and the user's chosen direction (default: spec is source of truth for public contracts, code is source of truth for accidental-omission-in-spec cases, ask if ambiguous). It maps handler shapes to schema components in the framework's idiom and writes the fix to the authoritative-losing side.

### Step 5: Report
Emit exactly these sections:
- `## Drift Table`: columns: `Endpoint | What differs | Spec says | Code says | Authoritative side`.
- `## Reconciliation Diffs`: the applied edits to spec and/or code, grouped by file, each preceded by the endpoint and the reason.
- `## Unresolved`: anything ambiguous that needs a human decision (e.g. a response field present in code that may be intentionally internal).

## Important Notes
- Base every drift finding on real code, cite the `file:line` of the route/schema on the code side and the JSON/YAML path on the spec side.
- Never fabricate an endpoint, field, or status code; if a schema cannot be resolved statically (dynamic route building, `**kwargs`, `interface{}`), mark it *unresolved* rather than guessing.
- Align by path template, not raw string, `/users/{id}` and `/users/:id` are the same endpoint.
- Reconcile, do not merely report: after classifying, the drift-reconciler must produce a concrete diff for each resolvable drift.
