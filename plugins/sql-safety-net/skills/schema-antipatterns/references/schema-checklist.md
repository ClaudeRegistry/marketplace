# Schema Review Checklist

A line-by-line checklist for reviewing DDL statically. Each item names what to grep for and the corrected form.

## Primary keys
- [ ] **Every table has a PK.** Missing PK → no stable identity, breaks logical replication and many ORMs. Add a surrogate `bigint GENERATED ALWAYS AS IDENTITY` (PG) / `BIGINT AUTO_INCREMENT` (MySQL), or `uuid`.
- [ ] **PK type is efficient.** Random UUIDv4 as clustered PK (MySQL InnoDB) causes page splits/fragmentation, prefer a monotonic key (`bigint`, UUIDv7, or ULID) for the clustering key. Never store a UUID as `varchar(36)`; use `uuid`/`BINARY(16)`.
- [ ] **Natural keys** (email, SKU) as the sole PK, acceptable only if truly immutable; otherwise add a surrogate and put a `UNIQUE` on the natural key.

## Foreign keys
- [ ] **Index every FK column.** Postgres and MySQL do **not** auto-create an index on the referencing column (MySQL InnoDB does auto-add one for the FK; Postgres does not). An unindexed FK makes parent deletes and joins scan the child table. `CREATE INDEX ON child (parent_id);`
- [ ] **Declare FK constraints** where a relationship clearly exists (a `*_id` column pointing at another table). Add `ON DELETE {CASCADE|SET NULL|RESTRICT}` explicitly, never leave the action implicit.
- [ ] **Composite FKs** must be indexed on the same leading columns.

## Data types
- [ ] **Money → `numeric`/`DECIMAL`**, never `float`/`double` (binary floating point cannot represent `0.10` exactly).
- [ ] **Timestamps → `timestamptz`** (PG) or store UTC and document it (MySQL `DATETIME` is zoneless; `TIMESTAMP` converts via session zone). Avoid bare `timestamp`/`DATETIME` for instants that cross zones.
- [ ] **Strings → `text`** in Postgres (no perf penalty; `varchar(n)` only when a real length rule exists). Flag cargo-cult `VARCHAR(255)`: it encodes no business rule.
- [ ] **Booleans → native `boolean`** (PG) / `TINYINT(1)` with a `CHECK (col IN (0,1))` (MySQL). Never `int`/`char(1)` "Y/N".
- [ ] **Enums** → native `ENUM`/domain, a `CHECK (status IN (...))`, or a lookup table with an FK, never a free-form `varchar`.
- [ ] **JSON** only for genuinely schemaless data; do not use it to dodge modeling relational columns you then query/filter on.

## Constraints (make the database enforce invariants)
- [ ] **`NOT NULL`** on every column that is logically required. Nullable-everything pushes NULL-handling into every query and hides bugs.
- [ ] **`UNIQUE`** on natural keys and any "there can be only one" rule (one primary email per user, etc.).
- [ ] **`CHECK`** for value ranges/formats (`amount >= 0`, `status IN (...)`, `end_at > start_at`).
- [ ] **`DEFAULT`** where a sensible default exists (`created_at DEFAULT now()`), but not to paper over a missing `NOT NULL` on business data.

## Indexing
- [ ] **No duplicate/redundant indexes.** An index on `(a)` is redundant if `(a, b)` exists (the composite serves the prefix). Flag and drop the narrower one unless it is a unique constraint.
- [ ] **No index on a low-selectivity column alone** (a boolean split ~50/50), the planner will ignore it. Use a partial index (`WHERE active`) if the query always filters on the rare value.
- [ ] **Composite index column order** = equality columns first, then one range, then sort columns.
- [ ] **Don't over-index write-heavy tables**: every index is paid on every insert/update/delete.

## Normalization vs denormalization
- Default to **3NF**: no repeating groups, no partial/transitive dependencies, one fact in one place. Repeated columns (`phone1`, `phone2`, `phone3`) or comma-lists in a column are red flags, extract a child table.
- **Denormalize deliberately**, not accidentally: a cached count or a duplicated hot column is fine *if* there is a documented reason and a plan to keep it consistent (trigger, app logic). Flag duplication that has no such reason and risks update anomalies.

## Timestamps, audit, soft-delete
- [ ] Prefer `created_at`/`updated_at` (`timestamptz`, default `now()`), maintained by DB or app consistently.
- [ ] **Soft delete** (`deleted_at`) breaks `UNIQUE` constraints: `UNIQUE(email)` blocks a user from re-registering after deletion. Use a **partial unique index**: `CREATE UNIQUE INDEX ON users (email) WHERE deleted_at IS NULL;`
- [ ] Every query on a soft-deleted table must filter `deleted_at IS NULL`: a partial index on that predicate keeps it fast.

## Naming conventions (consistency, low severity)
- [ ] One convention: `snake_case`, singular vs plural table names, pick one and hold it.
- [ ] FK columns named `<referenced_table_singular>_id`.
- [ ] Index names encode table + columns + kind (`idx_orders_customer_id`, `uq_users_email`).
- [ ] Booleans read as predicates (`is_active`, `has_paid`), not `active_flag`.

## Output when reviewing
For each flagged item, cite the file:line of the DDL, name the anti-pattern, state why it matters in one sentence, and give the corrected `CREATE`/`ALTER`. Never invent columns not present in the source. For a live table, recommend applying the fix via a safe migration rather than an ad-hoc `ALTER`.
