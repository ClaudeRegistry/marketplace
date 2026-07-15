# SQL Safety Net

Static, no-database-connection guardrails for schema and query work, it runs on the migration and ORM files you are already editing, catching the mistakes that cause downtime and slow queries before they ship.

## Purpose

Database changes fail in predictable, expensive ways, and the people writing them usually have no DBA to catch the mistake. An `ADD COLUMN ... NOT NULL DEFAULT`, an `ALTER COLUMN TYPE`, or a non-`CONCURRENTLY` index takes a full-table `ACCESS EXCLUSIVE` lock and causes downtime, and developers without a DBA re-derive the safe version every single time. N+1 queries are the "silent performance killer," and nearly every detector on the market is runtime-only. Raw `EXPLAIN` output is expert-only to read.

Unlike DB-connected tools (Postgres MCP servers, query optimizers that need `pg_stat_statements`/`hypopg`), everything here is STATIC and diff-aware, it runs on the migration and ORM files you are already editing, with no database connection required. Point it at a migration, an ORM directory, a pasted plan, or a schema file, and it grounds every finding in real `file:line` evidence.

## Features

- Rewrites unsafe migrations into zero-downtime expand-contract steps for Postgres and MySQL across raw SQL, Alembic, Django, Rails, Prisma, Flyway, Liquibase, Knex, golang-migrate, TypeORM, and Sequelize.
- Hunts ORM N+1 query patterns in your code across nine ORMs, with the idiomatic eager-loading fix for each.
- Interprets pasted `EXPLAIN` / `EXPLAIN (ANALYZE, BUFFERS)` plans (Postgres and MySQL, text and JSON) into plain-language diagnoses.
- Reviews DDL for relational anti-patterns and emits corrected DDL by severity.
- Advises indexes from just a query and table DDL, correct composite column order, covering/partial indexes, and when NOT to add one.
- Always produces a paired rollback and cites the lock avoided at every step.
- No database connection, credentials, or extensions required.

## Installation

```bash
/plugin marketplace add clauderegistry/marketplace
```

```bash
/plugin install sql-safety-net@clauderegistry
```

## Commands

### /migration-safety

```
/migration-safety db/migrate/20260707_add_status_to_orders.rb
```

**What it does:**
- Detects the dialect (Postgres/MySQL) and framework (raw SQL, Alembic, Django, Rails, Prisma, Flyway, Liquibase, Knex, golang-migrate, TypeORM, Sequelize).
- Classifies every DDL operation by the lock it takes and flags the blocking ones.
- Rewrites hazards into safe expand-contract steps (nullable add + batched backfill + `NOT VALID` constraint + `VALIDATE`, `CREATE INDEX CONCURRENTLY`, multi-deploy renames/type changes).
- Dispatches the migration-rewriter agent to write the safe UP and a paired DOWN/rollback.

**Best for:**
- Any migration touching a large or high-traffic table.
- Turning a "quick `ALTER`" into a reviewed, reversible, zero-downtime change.

### /explain-plan

```
/explain-plan "Seq Scan on orders (cost=0.00..18211 rows=1) (actual rows=920140 loops=1) ..."
```

**What it does:**
- Detects the plan format and whether it was actually analyzed.
- Finds the dominant cost node (self time × loops), not just the root.
- Flags seq scans on large tables, estimate-vs-actual skew, nested-loop blowups, external sorts, and missing/unused indexes.
- Recommends concrete indexes or query rewrites in plain language.

**Best for:**
- Making sense of a plan a teammate pasted into a ticket.
- Deciding the exact index a slow query needs.

### /schema-review

```
/schema-review db/schema.sql
```

**What it does:**
- Parses your DDL/schema/migration directory and builds a model of tables, types, keys, constraints, and indexes.
- Flags missing PKs, unindexed foreign keys, wrong types (money as float, zoneless timestamps, cargo-cult `VARCHAR(255)`), nullable-everything, missing constraints, over-indexing, and enum/boolean smells.
- Emits a findings table by severity plus corrected DDL.

**Best for:**
- Reviewing a new schema or a migration PR before it lands.
- Onboarding a codebase whose schema grew without a DBA.

### /index-advisor

```
/index-advisor "SELECT * FROM orders WHERE tenant_id=? AND created_at>? ORDER BY created_at DESC; <table DDL>"
```

**What it does:**
- Classifies each predicate as equality, range, sort, covered, or non-sargable.
- Designs the index with correct composite order (equality before range before sort), covering/`INCLUDE` columns, and partial `WHERE` clauses.
- Warns about redundant indexes the new one makes obsolete, and tells you when NOT to add one.

**Best for:**
- Indexing a slow query without touching production or guessing.
- Cleaning up duplicate/over-lapping indexes.

### /n1-scan

```
/n1-scan app/services
```

**What it does:**
- Detects the ORM and dispatches the n1-hunter agent.
- Finds loops (and serializers/templates) that lazily load a relation per row.
- Reports each suspected N+1 with `file:line` and the idiomatic eager-load/batch fix for that ORM, plus a hot-vs-cold-path severity note.

**Best for:**
- Auditing list endpoints and serializers for the silent performance killer.
- Catching N+1s in a PR before they reach production.

## Agents

### n1-hunter

**Triggers when:** you mention "N+1", "too many queries", "why is this endpoint slow", "eager load", or "lazy loading", or when `/n1-scan` dispatches it.

**What it does:** Statically scans ORM/data-access code across Django, SQLAlchemy, ActiveRecord, Sequelize, Prisma, TypeORM, Hibernate/JPA, GORM, and Entity Framework for the query-then-lazy-relation-in-a-loop signature. It is strictly read-only (`Read`, `Grep`, `Glob`), it diagnoses and prescribes the eager-loading fix, citing `file:line` for both the query and the per-row access, and never edits code.

### migration-rewriter

**Triggers when:** you ask to "make this migration safe", "rewrite this ALTER TABLE", "zero downtime migration", or "split this migration", or when `/migration-safety` dispatches it.

**What it does:** Autonomously rewrites unsafe migrations into safe, reversible, zero-downtime steps for the detected dialect/framework, splitting a dangerous single migration into an ordered multi-deploy sequence when needed and always writing a correct DOWN/rollback. It has `Edit`/`Write` because producing the rewritten migration is its job, and it annotates each step with the lock it avoids.

## Skills

Skills auto-activate from keywords and supply the deep methodology that the commands and agents consume, the commands orchestrate, the skills carry the catalogs.

### safe-migrations

The expand-contract (parallel-change) methodology plus a per-dialect catalog of which DDL operations take blocking locks. Reference files:
- `references/postgres-locks.md`: Postgres DDL → lock level → safe alternative, `NOT VALID`/`VALIDATE`, `CONCURRENTLY`, and `lock_timeout` guidance.
- `references/mysql-locks.md`: InnoDB online-DDL `ALGORITHM`/`LOCK` matrix and when to reach for gh-ost / pt-online-schema-change.
- `references/expand-contract-patterns.md`: step-by-step multi-deploy recipes and batched backfills.

### explain-interpreter

How to read a query plan and turn it into a fix. Reference files:
- `references/postgres-explain-nodes.md`: node types, reading cost/rows/actual/loops/buffers, estimate-vs-actual skew, red flags → fixes.
- `references/mysql-explain.md`: `EXPLAIN`/`ANALYZE`/`FORMAT=JSON` columns, the access-`type` ladder, `Extra` flags, and hints.

### schema-antipatterns

A relational schema design anti-pattern catalog plus a per-ORM N+1 pattern library. Reference files:
- `references/schema-checklist.md`: types, keys, constraints, FK indexing, normalization trade-offs, timestamps, soft-delete, naming.
- `references/orm-n1-patterns.md`: the exact N+1 code shape and eager-loading fix for nine ORMs.

## Hooks

SQL Safety Net ships a **PostToolUse(Write|Edit)** hook that is **advisory and non-blocking**. When you edit a file that looks like a database migration, paths like `migrations/`, `db/migrate/`, `alembic/versions/`, `prisma/migrations/`, Flyway `V1__*.sql`, or `*.up.sql`/`*.down.sql`: it injects a short reminder to run `/migration-safety` before deploying, so you can check for table-locking or blocking operations and get a safe expand-contract rewrite.

The hook only surfaces a suggestion. It is fail-safe: it never blocks the edit, never rejects a tool call, and never fails the session. Disable it any time via the `/hooks` menu or by removing the plugin.

## Typical Workflow

1. You write a migration adding a `NOT NULL` column to `orders`. On save, the advisory hook reminds you to run `/migration-safety`.
2. Run `/migration-safety db/migrate/20260707_add_status.rb`. It flags the `ACCESS EXCLUSIVE` full-table rewrite, and the migration-rewriter agent produces a nullable-add + batched-backfill + validated-constraint sequence with a paired rollback.
3. Before adding an index the rewrite suggests, run `/index-advisor` with the query and DDL to confirm the column order and rule out a redundant index.
4. Run `/schema-review db/schema.sql` to catch neighboring anti-patterns (an unindexed FK, money as float).
5. Run `/n1-scan app/serializers` to make sure the new endpoint that reads `order.customer` is not firing one query per row.
6. When a query is still slow in staging, paste its plan into `/explain-plan` for a plain-language diagnosis and the exact fix.

## Plugin Structure

```
sql-safety-net/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── migration-safety.md
│   ├── explain-plan.md
│   ├── schema-review.md
│   ├── index-advisor.md
│   └── n1-scan.md
├── agents/
│   ├── n1-hunter.md
│   └── migration-rewriter.md
├── skills/
│   ├── safe-migrations/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── postgres-locks.md
│   │       ├── mysql-locks.md
│   │       └── expand-contract-patterns.md
│   ├── explain-interpreter/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── postgres-explain-nodes.md
│   │       └── mysql-explain.md
│   └── schema-antipatterns/
│       ├── SKILL.md
│       └── references/
│           ├── schema-checklist.md
│           └── orm-n1-patterns.md
└── README.md
```

## Requirements

- Claude Code CLI
- No database connection, credentials, or extensions, all analysis is static and diff-aware.

## License

MIT

## Version

1.0.0

Ship schema and query changes with a net under them.
