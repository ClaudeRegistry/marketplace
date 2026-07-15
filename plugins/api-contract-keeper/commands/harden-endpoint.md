---
description: Add production hardening to an endpoint, validation, RFC 9457 errors, idempotency, pagination, rate-limit headers
argument-hint: [handler-file]
model: inherit
---

Harden the endpoint(s) in `$ARGUMENTS` (a handler/controller/route file, or the file in the current diff) with the boilerplate that teams get subtly wrong: request validation, a consistent error envelope, safe retries, pagination, and rate-limit headers, each idiomatic to the detected stack. Load the `error-envelope` skill (validation + RFC 9457) and the `idempotency-patterns` skill (idempotency, pagination, rate limits). This is an **additive edit**: preserve existing behavior; add the guards around it.

## Process

### Step 1: Detect stack and endpoint shape
Read the file. Identify the framework and the validation library already in use (or the idiomatic one for the stack). Determine each route's method, path, params, and body, and whether the method is **unsafe** (POST/PATCH/PUT/DELETE) and **non-idempotent** by HTTP semantics (POST is the key case).

| Stack | Idiomatic validator | Error hook |
|---|---|---|
| Express/Koa (JS/TS) | Zod, Joi, `express-validator`, JSON Schema (Ajv) | error middleware `(err, req, res, next)` |
| Fastify | JSON Schema (`schema:`), Zod via `fastify-type-provider-zod` | `setErrorHandler` |
| NestJS | `class-validator` DTOs + `ValidationPipe` | exception filter |
| FastAPI | Pydantic models | `exception_handler` / `RequestValidationError` |
| Django REST Framework | serializers (`is_valid(raise_exception=True)`) | custom `exception_handler` |
| Flask | `marshmallow`/`pydantic`, `webargs` | `errorhandler` |
| Spring Boot | Bean Validation (`@Valid`, `@NotNull`) | `@ControllerAdvice` |
| Go (net/http/Gin) | `go-playground/validator`, `binding:` tags | central error writer |
| Rails | strong params + model validations / `dry-validation` | `rescue_from` |

### Step 2: Add request validation
Validate params, query, and body at the boundary, reject unknown fields (`strict`/`.strict()`/`forbid_extra_keys`/`additionalProperties: false`), coerce/parse types, and enforce required vs optional. On failure, do **not** leak the raw validator error; map it into the error envelope (Step 3) with a `422`/`400` and a machine-readable list of field violations. See `error-envelope` `references/validation-patterns.md`.

### Step 3: Add the RFC 9457 error envelope
Return errors as `application/problem+json` with `type`, `title`, `status`, `detail`, `instance`, and useful extension members (e.g. `errors[]` for field violations, `traceId`). Centralize it (one error handler/filter/middleware) rather than hand-writing per route. See `error-envelope` `references/rfc9457.md` for the shape and anti-patterns (never return `200` with an error body; never expose stack traces).

### Step 4: Add idempotency for unsafe methods
For POST/PATCH/DELETE that create or mutate, accept an `Idempotency-Key` header, and store the key → first-response mapping in a durable store with a TTL so a retried request returns the original result instead of double-applying. Handle the in-flight case (concurrent replay → `409`/wait). See `idempotency-patterns` `references/idempotency-recipes.md`.

### Step 5: Add pagination and rate-limit headers
For collection endpoints, add cursor (preferred) or offset pagination with a stable sort key and a bounded `limit`. Emit the standard `RateLimit`/`RateLimit-Policy` headers (and `Retry-After` on `429`). See `idempotency-patterns` `references/pagination-and-rate-limits.md`.

### Step 6: Output
Emit exactly these sections:
- `## Hardened Handler`: the rewritten file (or a focused diff), compiling in the detected stack.
- `## What Was Added`: a bullet per addition (validation, error envelope, idempotency, pagination, rate-limit) explaining what it guards against and any wiring the user must add (middleware registration, a store/Redis dependency, config).
- `## Follow-ups`: anything that needs a decision (dedup TTL length, cursor column choice, rate-limit budget).

## Important Notes
- Base edits on the real handler, cite the `file:line` of what you wrap or change; never invent framework APIs.
- Additive and behavior-preserving: never alter the success-path response shape; only add guards and the error path.
- Idempotency only for unsafe, non-idempotent methods, do not add key handling to `GET`/`HEAD`, which are already idempotent.
- Never return a `2xx` with an error payload, and never place a stack trace or SQL text in a `problem+json` body.
