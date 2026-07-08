# Postgres EXPLAIN Node Reference

## Anatomy of a node line
```
Nested Loop  (cost=0.42..8534.11 rows=1 width=64) (actual time=0.03..912.44 rows=920140 loops=1)
```
- `cost=startup..total` — planner's abstract cost units (not ms). Startup = cost before the first row; total = cost to return all rows.
- `rows` — **estimated** rows this node emits.
- `width` — estimated average row width in bytes.
- `actual time=startup..total` — real milliseconds **per loop**.
- `rows` (in the actual group) — **actual** rows per loop.
- `loops` — how many times this node ran. **Total node time ≈ actual total time × loops.** A "0.5 ms" inner node run 900k times is 450 seconds.

`EXPLAIN (ANALYZE, BUFFERS)` adds a `Buffers:` line: `shared hit=` (found in cache), `read=` (read from disk), `dirtied`/`written`. High `read` relative to `hit` means cold data and heavy I/O.

## Scan nodes
- **Seq Scan** — reads the whole table. Correct for small tables or when returning most rows; a red flag when a selective filter sits on top of a large table. Fix: index the filter column.
- **Index Scan** — walks an index, then fetches each matching row from the heap. Good for high selectivity.
- **Index Only Scan** — answered entirely from the index (all needed columns present + visibility map fresh). Best case; aim for it with covering/`INCLUDE` indexes.
- **Bitmap Index Scan → Bitmap Heap Scan** — builds a bitmap of matching heap pages, then reads them in physical order. Chosen for medium selectivity or combining multiple indexes (`BitmapAnd`/`BitmapOr`). `Recheck Cond` and a high `Heap Blocks: lossy` count mean the bitmap overflowed `work_mem`.

## Join nodes
- **Nested Loop** — for each outer row, probe the inner side. Great when the outer side is tiny and the inner is indexed; catastrophic when the outer row count was under-estimated (see estimate skew) and the inner side is a Seq Scan. Watch `loops` on the inner child.
- **Hash Join** — builds a hash table from the smaller side, probes with the larger. The right choice for joining two large unsorted sets. `Batches: > 1` means the hash spilled to disk (raise `work_mem`).
- **Merge Join** — merges two inputs already sorted on the join key. Efficient when both sides are pre-sorted (e.g. by index) — otherwise it adds Sort nodes.

## Sort / aggregate / other
- **Sort** — `Sort Method: quicksort Memory: 25kB` is fine; `external merge Disk: 90112kB` means it spilled — add an index that provides sorted output for the `ORDER BY`, or raise `work_mem`. `top-N heapsort` (with a `LIMIT`) is efficient.
- **Aggregate / HashAggregate / GroupAggregate** — `HashAggregate` with `Batches: >1` / `Disk:` spilled — raise `work_mem` or reduce group cardinality.
- **Gather / Gather Merge** — parallel workers feeding the leader; `Workers Launched < Workers Planned` means the pool was exhausted.
- **Limit** — cheap if the child stops early (e.g. `top-N heapsort` or an index providing order); expensive if the child must materialize everything first.
- **Materialize / Memoize** — caches inner results for repeated probes; `Memoize` hit-rate tells you whether caching helped.

## Estimate vs actual skew — the #1 diagnosis
When `rows` (estimated) and actual rows differ by orders of magnitude, the planner is flying blind and likely picked the wrong join. Causes and fixes:
- **Stale stats** → `ANALYZE table;` (or check autovacuum). 
- **Correlated columns** the planner assumes independent (`WHERE city='X' AND country='Y'`) → `CREATE STATISTICS ... (dependencies) ON city, country FROM t; ANALYZE t;`
- **Expressions / functions** in predicates the planner cannot estimate → add an expression index or rewrite.
- **Type mismatch** (`bigint` column vs `int` literal, `text` vs `varchar`) can suppress index use → align types.

## Quick red-flag → fix table
| Seen in plan | Fix |
|---|---|
| `Seq Scan` + `Filter:` removing most rows on a big table | Index the filtered column(s) |
| Inner `Nested Loop` child `Seq Scan`, high `loops` | Index inner join key; fix estimate to get a Hash Join |
| `Sort ... external merge Disk` | Index matching `ORDER BY`; raise `work_mem` |
| `Rows Removed by Filter: <huge>` | The index isn't selective enough / predicate not sargable |
| `Heap Blocks: lossy=<huge>` on Bitmap Heap Scan | Bitmap overflowed work_mem; narrow the scan |
| Hash Join `Batches: >1` | Hash spilled; raise `work_mem` or reduce build side |
| Estimated `rows=1`, actual `rows` in the millions | `ANALYZE`; extended statistics; decorrelate |

## Sargability reminders (why an index goes unused)
- `WHERE lower(email) = ?` → needs `CREATE INDEX ON t (lower(email))`.
- `WHERE col + 1 = 5` / `WHERE date_trunc('day', ts) = ?` → wrap the constant side or add an expression index.
- `WHERE col LIKE '%foo'` (leading wildcard) → no b-tree help; consider trigram (`pg_trgm`) GIN index.
- Implicit casts from a type mismatch → make literal/column types match.
