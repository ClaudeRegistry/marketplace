# MySQL EXPLAIN Reference

MySQL gives you three views of a plan: classic tabular `EXPLAIN`, `EXPLAIN ANALYZE` (8.0.18+, a tree with actual timings), and `EXPLAIN FORMAT=JSON` (full detail with cost estimates). Read them differently.

## Classic tabular EXPLAIN — the columns
| Column | Meaning / what to watch |
|---|---|
| `id` | Query block number; larger/nested = subquery or derived table |
| `select_type` | `SIMPLE`, `PRIMARY`, `SUBQUERY`, `DEPENDENT SUBQUERY` (correlated — slow), `DERIVED`, `MATERIALIZED` |
| `table` | The table (or `<derivedN>` / `<subqueryN>`) |
| `type` | **The access method — the most important column** (ladder below) |
| `possible_keys` | Indexes the optimizer considered |
| `key` | The index actually chosen (`NULL` = none → often a full scan) |
| `key_len` | Bytes of the index used — a short `key_len` on a composite means only a prefix is used |
| `ref` | What is compared to the index (a const or a column) |
| `rows` | Estimated rows examined **per join iteration** |
| `filtered` | % of `rows` expected to survive the `WHERE` (low % after a scan = wasted work) |
| `Extra` | Flags (below) — read this carefully |

## The `type` ladder (best → worst)
- `system` / `const` — one row, matched by a unique key against a constant. Ideal.
- `eq_ref` — one row from this table per row of the previous (unique/PK join). Excellent.
- `ref` — non-unique index match; several rows per lookup. Good.
- `range` — index range scan (`BETWEEN`, `>`, `IN`). Fine if the range is selective.
- `index` — full **index** scan (reads the whole index, not the table). Better than `ALL` but still scanning everything.
- `ALL` — full **table** scan. The red flag: no usable index. If `rows` is large and `filtered` is low, add an index on the `WHERE`/`JOIN` column.

Rule of thumb: on a hot query, you want `const`/`eq_ref`/`ref`/`range`. Seeing `ALL` or `index` on a large table with a selective predicate means a missing or unusable index.

## `Extra` flags that matter
| Flag | Meaning | Fix |
|---|---|---|
| `Using index` | Covering index — answered without touching the row (best) | Aim for this |
| `Using where` | Rows filtered after reading — normal, but with `ALL` means a scan | Index the filter |
| `Using filesort` | Sorting without an index (may be in-memory or on-disk) | Composite index matching `ORDER BY` |
| `Using temporary` | Built a temp table (often `GROUP BY`/`DISTINCT`/`UNION`) | Index the grouping columns; rewrite |
| `Using index condition` | Index Condition Pushdown — good, filtering at the index | Fine |
| `Using join buffer (Block Nested Loop / hash join)` | No index on the join key | Index the join column |
| `Range checked for each record` | No good index; re-deciding per row | Add a usable index |

`Using filesort` + `Using temporary` together on a hot query is the classic "sort/group with no supporting index" — the single composite index over the `WHERE` equality columns then the `ORDER BY`/`GROUP BY` columns usually kills both.

## EXPLAIN ANALYZE (8.0.18+)
Prints a tree with actual timings:
```
-> Nested loop inner join  (cost=... rows=...) (actual time=0.05..812 rows=920140 loops=1)
    -> Table scan on orders  (actual time=... rows=1.02M loops=1)
    -> Index lookup on c using PRIMARY (customer_id=orders.customer_id) (actual time=... rows=1 loops=1020000)
```
Read like Postgres: `actual time=first..last`, `rows` per loop, `loops`. A `Table scan` feeding a nested loop, or an inner `Index lookup` with `loops` in the millions, is the target. Compare estimated `rows` to actual to spot bad cardinality estimates (fix with `ANALYZE TABLE`, histograms via `ANALYZE TABLE ... UPDATE HISTOGRAM`).

## FORMAT=JSON
Adds `query_cost`, `read_cost`, `eval_cost`, `used_key_parts`, `attached_condition`, and `rows_examined_per_scan` vs `rows_produced_per_join`. Use it to see exactly which index parts are used (`used_key_parts`) and where a predicate is applied (`attached_condition`) — this reveals a non-sargable predicate that prevents index use.

## Optimizer hints & common causes of a missed index
- Force/steer with hints: `SELECT /*+ INDEX(orders idx_customer) */ ...`, `JOIN_ORDER`, `NO_MERGE`, `SEMIJOIN`. Prefer fixing stats/predicates first; hints are a last resort.
- Index not used because: function on the column (`WHERE DATE(created)=...` → store/generated column + index); leading-wildcard `LIKE '%x'`; implicit charset/collation or type conversion on the column side; low selectivity so the optimizer prefers a scan; a `DEPENDENT SUBQUERY` correlating per row (rewrite as a join).
- `ANALYZE TABLE t;` refreshes cardinality; add column histograms for skewed non-indexed columns the optimizer mis-estimates.
