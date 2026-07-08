# MySQL / InnoDB Online DDL

MySQL's story is different from Postgres. Since 5.6, InnoDB supports **online DDL** for many operations via the `ALGORITHM` and `LOCK` clauses. The question is not "does it take an exclusive lock" but "which algorithm does this operation support, and does it permit concurrent DML."

## The three algorithms
- `ALGORITHM=INSTANT` (8.0.12+) — metadata-only, no table copy, no rebuild. Fastest. Supports adding a column (in most positions), adding/dropping a virtual column, renaming a column, changing a default.
- `ALGORITHM=INPLACE` — rebuilds the table *in place* without a full external copy; usually allows concurrent DML (`LOCK=NONE`). Used for adding a secondary index, adding a nullable column (pre-8.0.12), etc.
- `ALGORITHM=COPY` — copies the whole table to a new one. **Blocks DML** (`LOCK=SHARED` at best, often exclusive). This is the dangerous one — it is MySQL's equivalent of a Postgres full rewrite.

## The LOCK clause
- `LOCK=NONE` — reads and writes allowed throughout. Demand this.
- `LOCK=SHARED` — reads allowed, writes blocked.
- `LOCK=EXCLUSIVE` — nothing allowed.

**Always specify both explicitly** and let the server reject an unsafe combination rather than silently falling back to a copy:
```sql
ALTER TABLE orders ADD INDEX idx_customer (customer_id), ALGORITHM=INPLACE, LOCK=NONE;
```
If MySQL cannot satisfy `LOCK=NONE`, the statement errors instead of quietly locking the table — that error is your early warning to use gh-ost.

## Operation support matrix (InnoDB, MySQL 8.0)
| Operation | Best algorithm | Concurrent DML? |
|---|---|---|
| Add column (last position) | `INSTANT` | Yes |
| Add column (middle) | `INPLACE`/`COPY` | Depends; may rebuild |
| Add nullable column | `INSTANT`/`INPLACE` | Yes |
| Add secondary index | `INPLACE` | Yes (`LOCK=NONE`) |
| Drop index | `INPLACE` | Yes |
| Rename column | `INSTANT` | Yes |
| Change column type | `COPY` (usually) | **No** — use gh-ost |
| Change column to `NOT NULL` | `INPLACE` (with `STRICT` caveats) | Sometimes |
| Add/drop primary key | `COPY` (rebuild) | **No** — use gh-ost |
| Add foreign key | `INPLACE` (with `foreign_key_checks=0`) | Yes, but validates |
| Change character set | `COPY` | **No** |

## When to reach for gh-ost / pt-online-schema-change
Use an external online-schema-change tool when the operation forces `ALGORITHM=COPY` on a large, write-heavy table (type changes, PK changes, charset changes) — a copy under `LOCK=SHARED` still blocks writes for the whole rebuild.

- **gh-ost** (GitHub) — triggerless; reads the binlog to keep a shadow table in sync, then does an atomic cut-over. Lower production impact, pausable/throttleable, no triggers on the original table.
- **pt-online-schema-change** (Percona Toolkit) — trigger-based; creates a shadow table and installs triggers to mirror writes, copies in chunks, then swaps. Battle-tested but triggers add write overhead and interact badly with existing triggers.

Both let you apply what would be a blocking `COPY` as a throttled background copy with a millisecond-scale cut-over lock.

## Key differences from Postgres
- Postgres uses `CREATE INDEX CONCURRENTLY`; MySQL uses `ALGORITHM=INPLACE, LOCK=NONE` for the same effect.
- Postgres has `NOT VALID` + `VALIDATE` for constraints; MySQL has no direct equivalent — foreign-key validation happens inline (mitigate with `foreign_key_checks=0` and a separate consistency check).
- Postgres DDL is transactional (you can wrap most DDL in a transaction and roll back); **MySQL DDL is not transactional** — each statement auto-commits, so a failed multi-statement migration cannot be rolled back atomically. Write migrations so each statement is independently safe and reversible.
- MySQL's `INSTANT` add-column is often faster and safer than the Postgres equivalent; its type changes are usually worse (forced copy).

## Checklist
- [ ] Every `ALTER` states `ALGORITHM=` and `LOCK=NONE`.
- [ ] Operations that force `COPY` on a big table go through gh-ost / pt-osc.
- [ ] Remember DDL is non-transactional — no atomic multi-statement rollback.
- [ ] Throttle and monitor replica lag during a long copy.
