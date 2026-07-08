# Postgres DDL Lock Catalog

Every DDL statement acquires a lock on the table. The dangerous ones hold **ACCESS EXCLUSIVE** (blocks *everything*, including `SELECT`) for the duration of a full-table rewrite or scan. The goal of a safe migration is to keep any exclusive lock to a sub-millisecond metadata flip and push the heavy work into non-blocking operations.

## Postgres lock levels (weakest → strongest)
- `ACCESS SHARE` — taken by `SELECT`. Conflicts only with `ACCESS EXCLUSIVE`.
- `ROW SHARE` — `SELECT ... FOR UPDATE`.
- `ROW EXCLUSIVE` — `INSERT`/`UPDATE`/`DELETE`. Normal write traffic.
- `SHARE UPDATE EXCLUSIVE` — `CREATE INDEX CONCURRENTLY`, `VALIDATE CONSTRAINT`, `ANALYZE`. Does **not** block reads or writes.
- `SHARE` — `CREATE INDEX` (non-concurrent). Blocks writes, allows reads.
- `SHARE ROW EXCLUSIVE` — `ADD FOREIGN KEY`, some `ALTER TABLE`. Blocks writes.
- `ACCESS EXCLUSIVE` — `DROP TABLE`, `TRUNCATE`, `ALTER COLUMN TYPE`, `ADD COLUMN` with volatile default (old versions), `SET NOT NULL`, most `ALTER TABLE`. Blocks **everything**.

The danger is not the lock strength alone — it is **strength × duration**. `ACCESS EXCLUSIVE` held for 2 ms (a metadata change) is fine; held for the 40 s it takes to rewrite a 50M-row table, it is an outage. Worse, a queued `ACCESS EXCLUSIVE` request blocks every new `SELECT` behind it, so even a *fast* DDL waiting on one slow transaction stalls the whole table.

## Operation catalog

### ADD COLUMN
| Form | Lock / cost | Safe? |
|---|---|---|
| `ADD COLUMN x int` (nullable, no default) | `ACCESS EXCLUSIVE`, metadata-only, instant | Yes |
| `ADD COLUMN x int DEFAULT 0` (constant default) | Metadata-only since PG 11 (stored in catalog) | Yes on PG 11+ |
| `ADD COLUMN x int NOT NULL DEFAULT now()` (volatile) | Full table rewrite under `ACCESS EXCLUSIVE` | **No** |
| `ADD COLUMN x int NOT NULL DEFAULT 0` on PG ≤ 10 | Full rewrite | **No** on old PG |

Safe pattern for a required column: add nullable → backfill in batches → add `CHECK (x IS NOT NULL) NOT VALID` → `VALIDATE CONSTRAINT` → optionally `SET NOT NULL` (cheap once the validated check exists, PG 12+ can use it to skip the scan).

### NOT NULL
- `ALTER COLUMN x SET NOT NULL` takes `ACCESS EXCLUSIVE` and **full-scans** the table to verify.
- Safe: `ALTER TABLE t ADD CONSTRAINT x_not_null CHECK (x IS NOT NULL) NOT VALID;` (instant, no scan) then `ALTER TABLE t VALIDATE CONSTRAINT x_not_null;` (`SHARE UPDATE EXCLUSIVE`, scans but does not block writes). On PG 12+, a valid matching `CHECK` lets `SET NOT NULL` skip its own scan.

### CREATE INDEX
- `CREATE INDEX` takes `SHARE` — blocks all writes for the whole build.
- Safe: `CREATE INDEX CONCURRENTLY` — `SHARE UPDATE EXCLUSIVE`, does not block reads or writes. Caveats: cannot run inside a transaction block; on failure it leaves an `INVALID` index that must be `DROP INDEX CONCURRENTLY`-ed and rebuilt. Drop with `DROP INDEX CONCURRENTLY` too.

### ALTER COLUMN TYPE
- Rewrites the entire table (and dependent indexes) under `ACCESS EXCLUSIVE`. Some no-op-ish changes (e.g. `varchar(50)`→`varchar(100)`, `varchar`→`text`) are metadata-only; a change that alters on-disk representation (`int`→`bigint`, `numeric` scale) is a full rewrite.
- Safe: multi-deploy — add a new column of the target type, dual-write, backfill in batches, switch reads, drop the old column later. See `expand-contract-patterns.md`.

### ADD FOREIGN KEY
- `ADD CONSTRAINT ... FOREIGN KEY` takes `SHARE ROW EXCLUSIVE` on both tables and scans the child to validate — blocks writes.
- Safe: `ADD CONSTRAINT ... FOREIGN KEY (...) REFERENCES ... NOT VALID;` (fast, still enforced for *new* rows) then `VALIDATE CONSTRAINT` (`SHARE UPDATE EXCLUSIVE`, does not block writes).

### RENAME / DROP COLUMN
- `RENAME COLUMN` is a fast metadata change but **breaks running app code** that still references the old name → treat as a multi-deploy expand-contract (add new, dual-write, migrate reads, drop old).
- `DROP COLUMN` is fast (`ACCESS EXCLUSIVE`, metadata) but irreversible and breaks old deploys — do it only after all code stops referencing the column.

### ADD CHECK / UNIQUE
- `ADD CHECK` — use `NOT VALID` then `VALIDATE`, same as FK.
- Adding a `UNIQUE` constraint builds a unique index under lock. Safe: `CREATE UNIQUE INDEX CONCURRENTLY`, then `ADD CONSTRAINT ... UNIQUE USING INDEX <name>` (brief lock).

## Timeout guards — always set these
```sql
SET lock_timeout = '3s';       -- fail fast instead of queuing behind a long txn and blocking traffic
SET statement_timeout = '30s'; -- cap the migration's own runtime
```
Without `lock_timeout`, a migration waiting for `ACCESS EXCLUSIVE` will itself block every query that arrives after it — turning a 5-second wait into a site-wide stall. Set a short `lock_timeout`, retry with backoff, and run backfills with a longer `statement_timeout` per batch.

## Checklist
- [ ] No `NOT NULL DEFAULT <volatile>` add in one statement.
- [ ] All indexes built with `CONCURRENTLY` (outside a transaction).
- [ ] Constraints added `NOT VALID`, validated separately.
- [ ] Backfills batched and bounded.
- [ ] `lock_timeout` set so the migration fails fast.
- [ ] Renames/type changes/drops split across deploys.
