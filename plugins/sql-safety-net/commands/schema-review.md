---
description: Review DDL/schema for relational anti-patterns and emit corrected DDL by severity
argument-hint: [schema-or-migration-dir]
model: inherit
---

Review the DDL, schema files, or migration directory at `$ARGUMENTS` (default: the repo's schema/migration files) for relational design anti-patterns, and emit corrected DDL. This is a **static** review of the DDL text — no database connection required. Load the `schema-antipatterns` skill for the checklist.

## Process

### Step 1: Locate and parse the schema
Find the DDL source. Common locations: `schema.sql`, `structure.sql`, `db/schema.rb`, `prisma/schema.prisma`, Alembic/Django/Rails migration dirs, `*.sql` under `migrations/`. Detect the dialect (Postgres vs MySQL) from types and syntax. Build a mental model of tables, columns, types, keys, constraints, and indexes.

### Step 2: Check against the anti-pattern catalog
Apply the `schema-antipatterns` skill's `references/schema-checklist.md`. Look for:

| Category | Anti-pattern to flag |
|---|---|
| Keys | Missing primary key; natural key with no surrogate where churny; UUID PK stored as text |
| Foreign keys | FK column with no supporting index; missing FK where a relationship clearly exists |
| Types | Money as `float`/`double`; timestamps as `timestamp` without time zone; cargo-cult `VARCHAR(255)`; enum stored as loose `VARCHAR`; boolean stored as `int`/`char(1)` |
| Constraints | Nullable-everything; missing `NOT NULL` on required columns; missing `UNIQUE`/`CHECK`; no default where one is clearly intended |
| Indexing | Over-indexing; duplicate/redundant indexes (one is a prefix of another); index on a low-selectivity boolean |
| Integrity | No `ON DELETE`/`ON UPDATE` action stated; soft-delete without a partial unique index |

### Step 3: Assign severity
Rank each finding: **Critical** (data-loss or integrity risk, e.g. money as float, missing PK), **High** (correctness/perf, e.g. unindexed FK, missing NOT NULL), **Medium** (maintainability, e.g. VARCHAR(255), duplicate index), **Low** (style/naming).

### Step 4: Report
Emit:
- `## Findings` — a table: `Severity | Table.Column | Anti-pattern | Why it matters | Fix`. Cite the file:line of each flagged DDL statement.
- `## Corrected DDL` — the fixed `CREATE TABLE`/`ALTER TABLE` for the Critical and High findings. If a fix requires a data migration (e.g. changing a live column type), note that it must go through `/migration-safety` rather than a raw `ALTER`.

## Important Notes
- Ground every finding in a real line of DDL — quote the column and file:line.
- Never fabricate columns or constraints that are not in the source.
- Recommend, don't rewrite in place: schema changes on a live table must be applied via a safe migration, not an ad-hoc `ALTER`.
- Respect intentional denormalization; flag it only when there is no evident reason and it risks anomalies.
