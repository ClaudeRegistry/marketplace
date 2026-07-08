---
description: Analyze a schema migration for locking/backfill hazards and rewrite it as safe zero-downtime steps
argument-hint: [migration-file]
model: inherit
---

Analyze the migration in `$ARGUMENTS` (or the migration files in the current diff if no path is given) for operations that take blocking table locks, rewrite the hazardous steps into a safe expand-contract sequence, and produce a paired rollback. This is a **static** analysis — no database connection is used. Load the `safe-migrations` skill for the lock catalog and expand-contract recipes.

## Process

### Step 1: Detect dialect and framework
Read the target file. Determine the **dialect** (Postgres vs MySQL/InnoDB — infer from types like `serial`/`jsonb`/`text` vs `AUTO_INCREMENT`/`ENGINE=InnoDB`, or from config). Determine the **framework** by file path and syntax:

| Framework | Signal |
|---|---|
| Raw SQL | `.sql`, `V1__*.sql`, `*.up.sql`/`*.down.sql` |
| Alembic | `alembic/versions/`, `def upgrade()/downgrade()`, `op.` |
| Django | `migrations/`, `class Migration`, `operations = [...]` |
| Rails/ActiveRecord | `db/migrate/`, `class ... < ActiveRecord::Migration`, `change`/`up`/`down` |
| Prisma | `prisma/migrations/`, `migration.sql` |
| Flyway | `V<n>__*.sql`, `U<n>__*.sql` |
| Liquibase | `changelog`, `<changeSet>` XML/YAML |
| Knex / TypeORM / Sequelize / golang-migrate | `exports.up`, `queryRunner.`, `queryInterface.`, `*.up.sql` |

### Step 2: Classify every DDL operation by lock
For each operation, look it up in the `safe-migrations` skill references (`postgres-locks.md`, `mysql-locks.md`). Flag the hazardous ones:

| Hazard | Lock taken | Why it hurts |
|---|---|---|
| `ADD COLUMN ... NOT NULL DEFAULT <volatile>` | `ACCESS EXCLUSIVE` + full rewrite | Blocks all reads/writes while every row is rewritten |
| `ALTER COLUMN ... TYPE` | `ACCESS EXCLUSIVE` + rewrite | Full-table rewrite under exclusive lock |
| `ADD CONSTRAINT NOT NULL` / `CHECK` (validated) | `ACCESS EXCLUSIVE` + full scan | Blocks writes during validation |
| `CREATE INDEX` (non-`CONCURRENTLY`) | `SHARE` (blocks writes) | Writes queued for the whole build |
| `ADD FOREIGN KEY` (validated) | `SHARE ROW EXCLUSIVE` on both tables | Blocks writes, scans child table |
| Column rename / drop in one deploy | `ACCESS EXCLUSIVE` + breaks running app code | Old deploy still references old name |

### Step 3: Produce the safe rewrite
For each hazard, apply the matching expand-contract recipe from `references/expand-contract-patterns.md`:
- **Add NOT NULL column** → add nullable column, backfill in batches, add `CHECK (col IS NOT NULL) NOT VALID`, `VALIDATE CONSTRAINT`, then optionally `SET NOT NULL`.
- **Index** → `CREATE INDEX CONCURRENTLY` (Postgres) / `ALGORITHM=INPLACE, LOCK=NONE` or gh-ost (MySQL).
- **Type change / rename** → multi-deploy: add new column, dual-write, backfill, switch reads, drop old.
- **Foreign key** → `ADD ... NOT VALID` then `VALIDATE CONSTRAINT` in a later statement.
Include `SET lock_timeout` / `statement_timeout` guards where relevant.

### Step 4: Dispatch the migration-rewriter agent
Launch the **migration-rewriter** agent to write the rewritten UP migration and a correct paired DOWN/rollback in the file's native framework syntax, splitting into an ordered multi-deploy sequence when a single migration cannot be made safe.

### Step 5: Report
Emit exactly these sections:
- `## Hazard Summary` — the operation → lock → impact table.
- `## Safe Migration (UP)` — the rewritten migration, with a one-line comment per step naming the lock it avoids.
- `## Rollback (DOWN)` — the reversible counterpart.
- `## Deploy Notes` — if multi-deploy, the exact order and what must ship between steps.

## Important Notes
- Base every finding on the real DDL in the file — cite the line number of each hazardous statement.
- Never fabricate lock behavior; ground each claim in the skill's lock catalog for the detected dialect.
- Backfills must be batched with a bound (e.g. `LIMIT`/`WHERE id BETWEEN`) — never a single unbounded `UPDATE`.
- A migration without a working DOWN is not safe; always produce a rollback even if it is a documented manual step.
