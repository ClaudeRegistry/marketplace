# API Contract Keeper

Keeps your API and its spec in sync, it detects and fixes OpenAPI/GraphQL drift between the spec and the handler code, hardens endpoints with the boilerplate teams get wrong, guards against breaking changes, and audits background jobs for at-least-once reliability, all statically from the files you are already editing.

## Purpose

Spec-vs-code drift is the #1 AI-accelerated API pain, and Optic, the popular OSS drift tool, was archived in January 2026, leaving a gap. Code changes faster than the spec, so the OpenAPI/GraphQL contract quietly stops describing what the API actually does: an undocumented query param here, a response field the schema never declared there, a status code nobody wrote down. Per-endpoint request validation (Zod/Pydantic), RFC 9457 error envelopes, and idempotency plumbing are high-volume boilerplate that teams get subtly wrong, one route returns `{ "error": "bad" }`, the next a `200` with `{ "success": false }`, a third leaks a stack trace. And at-least-once job queues silently skip the dedup store and dead-letter queue by default, so workers double-charge, double-send, or lose messages the first time a retry or a crash happens in production.

API Contract Keeper reconciles the contract continuously, in the editor, and fixes **both** sides of the drift, updating the spec to match implemented behavior or the code to match the intended contract. Everything is static and diff-aware: no server is started, no requests are sent, no broker is connected. Point it at a spec, a handler, a git range, or a worker, and every finding is grounded in real `file:line` evidence.

## Features

- Detects spec-vs-code drift between OpenAPI/Swagger or GraphQL SDL and the handler code across Express, Fastify, NestJS, Koa, FastAPI, Django REST Framework, Flask, Spring Boot, Go net/http/Gin, and Rails, then reconciles both sides.
- Hardens endpoints with request validation (Zod, Pydantic, class-validator, Joi, JSON Schema, Go validator, Rails strong params), an RFC 9457 `application/problem+json` error envelope, idempotency-key handling, pagination, and rate-limit headers, each idiomatic to the detected stack.
- Classifies API-surface changes as breaking or non-breaking with oasdiff-style, direction-aware semantics and recommends a semver bump.
- Audits background-job and message-consumer code (BullMQ, Celery, Sidekiq, RabbitMQ, AWS SQS, Google Pub/Sub, Kafka) for at-least-once reliability gaps: missing dedup/idempotency, no DLQ, no backoff+jitter, ack-before-work, and the missing transactional outbox.
- Grounds every finding in real `file:line` evidence and never fabricates an endpoint, field, status code, or lock behavior.
- Fully static and diff-aware, no running server, no live traffic, no broker connection, no credentials.

## Installation

```bash
/plugin marketplace add clauderegistry/marketplace
```

```bash
/plugin install api-contract-keeper@clauderegistry
```

## Commands

### /spec-sync

```
/spec-sync openapi.yaml
```

**What it does:**
- Detects the web framework (Express, Fastify, NestJS, Koa, FastAPI, DRF, Flask, Spring Boot, Go net/http/Gin, Rails) and the spec dialect (OpenAPI/Swagger or GraphQL SDL).
- Builds a model of the endpoint surface from both the spec and the code, then aligns them by path template + method and diffs routes, params, request/response schemas, status codes, and auth.
- Classifies each mismatch and decides which side is authoritative.
- Dispatches the drift-reconciler agent to write the fix to the losing side and emits a drift table plus the applied diffs.

**Best for:**
- Catching an OpenAPI/GraphQL spec that has quietly fallen behind the code.
- Reconciling the contract before publishing docs or generating a client SDK.

### /harden-endpoint

```
/harden-endpoint src/routes/orders.ts
```

**What it does:**
- Detects the stack and the endpoint shape, then adds request validation at the boundary (rejecting unknown fields and aggregating all violations).
- Adds a centralized RFC 9457 `application/problem+json` error envelope with `type`/`title`/`status`/`detail`/`instance` and a machine-readable `errors[]`.
- Adds idempotency-key handling for unsafe methods (POST/PATCH/DELETE), cursor/offset pagination, and standard `RateLimit`/`Retry-After` headers.
- Outputs the hardened handler with each addition explained and any required wiring called out.

**Best for:**
- Turning a happy-path handler into a production-ready endpoint.
- Making a mutating endpoint safe to retry without double-applying.

### /version-guard

```
/version-guard v1.4.0..HEAD
```

**What it does:**
- Resolves two versions of the API surface from a git range (or a single spec vs its last commit) for OpenAPI or GraphQL.
- Classifies every change as breaking or non-breaking using direction-aware, oasdiff-style rules (request schemas are contravariant, response schemas covariant).
- Recommends a semver bump and calls out any change it could not classify, defaulting it to breaking.
- Emits a change table with a per-change verdict, rationale, and migration notes for breaking changes.

**Best for:**
- Gatekeeping a PR that touches the public API surface.
- Deciding whether a release is a patch, minor, or major before you tag it.

## Agents

### drift-reconciler

**Triggers when:** you mention "spec drift", "the docs don't match the code", "update the OpenAPI spec", "reconcile the schema", "the API returns fields not in the spec", or when `/spec-sync` dispatches it.

**What it does:** Reconciles an OpenAPI/Swagger or GraphQL spec with the handler code and fixes **both** sides, updating the spec to match implemented behavior or the code to match the intended contract, per the chosen direction. It understands each framework's route/validation/serializer idioms, so it maps handler shapes to schema components accurately, and it has `Edit` because producing the reconciled files is its job. It cites the code `file:line` and the spec path for every drift and flags any edit that is a breaking change.

### queue-doctor

**Triggers when:** you mention "audit my queue", "are my background jobs reliable", "why do jobs run twice", "we lost a message", "add a dead letter queue", "is this consumer idempotent", "at-least-once", or when a reliability review dispatches it.

**What it does:** Statically audits background-job and message-consumer code across BullMQ, Celery, Sidekiq, RabbitMQ, AWS SQS, Google Pub/Sub, and Kafka for at-least-once reliability gaps: missing idempotency/dedup, no DLQ, no retry backoff+jitter, unhandled visibility-timeout/redelivery, non-atomic "do work then ack", and the missing transactional outbox. It is strictly read-only (`Read`, `Grep`, `Glob`), it reports each finding with `file:line`, the failure it causes, and the concrete fix, and never edits code.

## Skills

Skills auto-activate from keywords and carry the deep methodology and catalogs that the commands and agents consume, the commands orchestrate, the skills supply the rules.

### openapi-drift

How to detect spec-vs-code drift and classify breaking changes. Reference files:
- `references/drift-signals.md`: per-framework: where routes, params, and request/response schemas live in Express, Fastify, NestJS, Koa, FastAPI, DRF, Flask, Spring Boot, Go net/http/Gin, and Rails, plus GraphQL SDL vs resolvers, and how to read each into a code model.
- `references/breaking-change-rules.md`: the full breaking vs non-breaking classification for requests, responses, params, status codes, enums, and nullability, with oasdiff-style semantics and GraphQL-specific rules.

### error-envelope

Consistent error responses and request validation. Reference files:
- `references/rfc9457.md`: Problem Details for HTTP APIs (`type`/`title`/`status`/`detail`/`instance` + extension members) with canonical examples, multi-error patterns, and the anti-patterns to reject.
- `references/validation-patterns.md`: idiomatic request validation per stack (Zod, Pydantic, class-validator, Joi, JSON Schema/Ajv, Go validator, Rails strong params), each mapping its native error into the RFC 9457 `errors` array.

### idempotency-patterns

Safe retries, idempotency, pagination, and rate limiting. Reference files:
- `references/idempotency-recipes.md`: idempotency-key store schemas (SQL unique constraint, Redis `SET NX`), the atomic claim, dedup windows/TTLs, safe-retry semantics per HTTP method, and where to store keys.
- `references/pagination-and-rate-limits.md`: cursor vs offset pagination, opaque cursor encoding, stable ordering, and the standard `RateLimit`/`RateLimit-Policy`/`Retry-After` headers with the legacy `X-RateLimit-*` mapping.

### job-reliability

Reliable background jobs and message consumers. Reference files:
- `references/queue-patterns.md`: per broker (BullMQ, Celery, Sidekiq, RabbitMQ, SQS, Pub/Sub, Kafka): ack model, retries/backoff, DLQ mechanism, visibility handling, the idempotent-consumer shape, and the transactional outbox.
- `references/dedup-strategies.md`: dedup stores, message-id vs idempotency-key vs business-key dedup, dedup windows, and exactly-once-effect patterns on top of at-least-once delivery.

## Hooks

API Contract Keeper ships a **PostToolUse(Write|Edit)** hook that is **advisory and non-blocking**. When you edit a file that looks like an API handler or route, paths like `routes/`, `controllers/`, `handlers/`, or `api/`, or names like `*.controller.*`, `*.routes.*`, or `*_views.py`: it injects a short reminder to run `/spec-sync` to check for spec drift, so the OpenAPI/GraphQL contract does not silently fall behind the code you just changed.

The hook only surfaces a suggestion. It is fail-safe: it never blocks the edit, never rejects a tool call, and never fails the session. Disable it any time via the `/hooks` menu or by removing the plugin.

## Typical Workflow

1. You add a `status` query filter to `GET /orders` in your controller. On save, the advisory hook reminds you to run `/spec-sync`.
2. Run `/spec-sync openapi.yaml`. It aligns the spec and the code, flags the undocumented `status` param and a response field the schema is missing, and the drift-reconciler agent adds both to the spec with `file:line` evidence.
3. Run `/harden-endpoint src/controllers/orders.ts` to add request validation, an RFC 9457 error envelope, cursor pagination, and rate-limit headers, and an `Idempotency-Key` guard on the neighboring `POST /orders`.
4. Before opening the PR, run `/version-guard v1.4.0..HEAD` to confirm the changes are backward-compatible and get the recommended semver bump; the one narrowed request type it flags as breaking is fixed before merge.
5. Because the new endpoint enqueues a fulfillment job, run the queue-doctor agent over the worker to confirm it acks after the work, has a DLQ, and dedups on the order id so a retry cannot ship twice.

## Plugin Structure

```
api-contract-keeper/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── spec-sync.md
│   ├── harden-endpoint.md
│   └── version-guard.md
├── agents/
│   ├── drift-reconciler.md
│   └── queue-doctor.md
├── skills/
│   ├── openapi-drift/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── drift-signals.md
│   │       └── breaking-change-rules.md
│   ├── error-envelope/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── rfc9457.md
│   │       └── validation-patterns.md
│   ├── idempotency-patterns/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── idempotency-recipes.md
│   │       └── pagination-and-rate-limits.md
│   └── job-reliability/
│       ├── SKILL.md
│       └── references/
│           ├── queue-patterns.md
│           └── dedup-strategies.md
└── README.md
```

## Requirements

- Claude Code CLI
- No running server, live traffic, broker connection, or credentials, all analysis is static and diff-aware.

## License

MIT

## Version

1.0.0

Keep the contract honest, on both sides.
