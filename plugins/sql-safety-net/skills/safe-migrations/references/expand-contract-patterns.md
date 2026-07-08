# Expand-Contract Recipes (Multi-Deploy)

Each recipe is an ordered sequence of independently deployable, reversible steps. "Deploy" = both a schema migration and the application code that must ship with it. The rule: at no point may old code and new code, running simultaneously, break.

## Recipe 1: Add a required (NOT NULL) column
**Postgres**
```sql
-- Deploy 1, migration A: expand (instant, nullable)
ALTER TABLE orders ADD COLUMN status text;          -- ACCESS EXCLUSIVE, metadata-only, instant

-- Deploy 1, app code: write `status` on every INSERT/UPDATE (dual-write for new rows)

-- Deploy 1, migration B: backfill in batches (see Recipe 5), then:
ALTER TABLE orders ADD CONSTRAINT status_not_null
  CHECK (status IS NOT NULL) NOT VALID;             -- instant, enforces new rows
ALTER TABLE orders VALIDATE CONSTRAINT status_not_null;  -- SHARE UPDATE EXCLUSIVE, no write block

-- Deploy 2, migration C: optional tighten
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;     -- PG12+ skips scan given the valid CHECK
ALTER TABLE orders DROP CONSTRAINT status_not_null;      -- redundant once SET NOT NULL holds
```
**Rollback**: drop the constraint, then drop the column. **Never** ship the column and the `NOT NULL DEFAULT` in one statement.

## Recipe 2: Rename a column
A rename is a breaking API change to the schema. Old code references the old name; you cannot flip both code and schema atomically across a fleet. Expand-contract it:
```
Deploy 1: ADD COLUMN new_name (nullable); backfill; app dual-writes old_name AND new_name.
Deploy 2: app reads new_name, still writes both.
Deploy 3: app stops referencing old_name.
Deploy 4: DROP COLUMN old_name.
```
Optionally keep the two columns in sync with a trigger during the transition instead of app-level dual-write. **Rollback** at any step before Deploy 4 is trivial (revert app code); after the drop, restore from the backfill logic.

## Recipe 3: Change a column type
Same shape as a rename, because an in-place `ALTER COLUMN TYPE` rewrites the table under `ACCESS EXCLUSIVE`.
```
Deploy 1: ADD COLUMN amount_new numeric(12,2) (nullable).
          App dual-writes amount AND amount_new (cast on write).
Deploy 2: Backfill amount_new from amount in batches.
Deploy 3: App reads amount_new; still dual-writes.
Deploy 4: DROP COLUMN amount; rename amount_new -> amount (or keep the new name).
```
For MySQL, if the type change forces `ALGORITHM=COPY`, run the backfill via gh-ost instead. **Rollback**: until Deploy 4, drop `amount_new`.

## Recipe 4: Split a table (extract columns to a new table)
```
Deploy 1: CREATE TABLE addresses (...); app writes to BOTH users.address_* and addresses.
Deploy 2: Backfill addresses from users in batches.
Deploy 3: App reads from addresses; keeps dual-writing.
Deploy 4: Stop writing users.address_*; add FK addresses.user_id -> users (NOT VALID then VALIDATE).
Deploy 5: DROP the old columns from users.
```

## Recipe 5: Batched backfill (the workhorse)
Never `UPDATE orders SET status = 'active';` on a large table — it locks every touched row for one giant transaction and bloats WAL/undo. Batch it:
```sql
-- Postgres: loop in the migration or a script, one bounded, committed batch at a time
UPDATE orders
SET status = 'active'
WHERE status IS NULL
  AND id BETWEEN :lo AND :lo + 5000;   -- bounded window; commit; sleep briefly; advance :lo
```
Principles:
- **Bounded**: each batch touches a fixed, small number of rows (1k–10k), driven by a key range or a `LIMIT`+re-select loop.
- **Idempotent**: re-running a batch is a no-op (`WHERE status IS NULL`), so a crash mid-backfill is safe to resume.
- **Throttled**: sleep between batches; watch replica lag.
- **Committed per batch**: short transactions, so nothing holds a long lock or bloats.

## Framework wrappers for non-transactional operations
`CREATE INDEX CONCURRENTLY` and other operations cannot run inside a transaction. Each framework has an escape hatch:
- **Rails**: `disable_ddl_transaction!` + `add_index :orders, :customer_id, algorithm: :concurrently`.
- **Django**: `atomic = False` on the `Migration` class + `AddIndexConcurrently` (from `django.contrib.postgres.operations`).
- **Alembic**: run with autocommit — `op.execute` after `op.get_bind().execution_options(isolation_level='AUTOCOMMIT')`, or use `op.create_index(..., postgresql_concurrently=True)` with `with op.get_context().autocommit_block():`.
- **Knex / node-pg-migrate**: disable the transaction for the migration (`exports.config = { transaction: false }` / `pgm.noTransaction()`).
- **Flyway**: put the concurrent index in its own script and set `executeInTransaction=false` (or use a `-- flyway:executeInTransaction=false` header where supported).
- **golang-migrate**: concurrent index goes in a migration file with no transaction wrapper; keep the `.up.sql`/`.down.sql` pair minimal.

## Universal rollback rule
Every step ships a DOWN. For additive steps the DOWN is the inverse (drop what you added). For a destructive final `DROP`, the "rollback" is a documented forward-fix (re-add the column and re-run the backfill) since dropped data cannot be un-dropped — state that explicitly rather than pretending it reverses.
