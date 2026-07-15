---
description: Interpret a pasted EXPLAIN or EXPLAIN ANALYZE plan and recommend concrete indexes or rewrites
argument-hint: [paste EXPLAIN output]
model: inherit
---

Interpret the query plan pasted in `$ARGUMENTS` and translate it into plain-language diagnosis plus concrete fixes. Works on pasted text, **no database connection required**. Load the `explain-interpreter` skill for node-type semantics and red-flag catalogs.

## Process

### Step 1: Detect format and dialect
Identify whether the plan is:
- **Postgres text** (`Seq Scan on ... (cost=0.00..431.00 rows=1 width=...) (actual time=... rows=... loops=...)`), possibly with `Buffers:` lines from `EXPLAIN (ANALYZE, BUFFERS)`.
- **Postgres JSON** (`"Node Type": "Seq Scan"`, `"Plan Rows"`, `"Actual Rows"`).
- **MySQL** classic tabular `EXPLAIN` (columns `type`, `key`, `rows`, `filtered`, `Extra`), `EXPLAIN ANALYZE` tree, or `FORMAT=JSON`.
Note whether it is an estimate-only `EXPLAIN` or an executed `EXPLAIN ANALYZE` (only the latter has actual rows/time).

### Step 2: Find the dominant cost node
Walk the plan tree. The top `cost`/`actual time` belongs to the root; find the node contributing the most **exclusive** time (self time = node time minus children, remembering to multiply by `loops`). That node, not the root, is what to fix.

### Step 3: Scan for red flags
Check the plan against the catalog in `references/postgres-explain-nodes.md` / `references/mysql-explain.md`:

| Red flag | What it means | Typical fix |
|---|---|---|
| `Seq Scan` / `type: ALL` on a large table with a selective filter | No usable index | Add index on the filter/join column |
| Estimate-vs-actual skew (`rows=1` but `actual rows=900000`) | Stale stats / bad estimate | `ANALYZE`; fix correlated predicates; re-order joins |
| `Nested Loop` with high `loops` on the inner side | Row-by-row lookups blowing up | Index inner join key, or force hash join |
| `Sort` with `Sort Method: external merge Disk` | Sort spilled to disk | Add index matching `ORDER BY`; raise `work_mem` |
| `Using filesort` / `Using temporary` (MySQL) | Sort/dedup without index | Composite index covering `WHERE`+`ORDER BY` |
| High `Buffers: read=` vs `hit=` | Cold cache / too much I/O | Narrow rows scanned; covering index |
| Index present but unused | Non-sargable predicate or type mismatch | Rewrite predicate; match column types |

### Step 4: Recommend fixes
For the dominant node and each red flag, give a concrete recommendation: the exact `CREATE INDEX` (composite column order = equality before range; add `INCLUDE`/covering columns where it removes a heap fetch), or a query rewrite (sargable predicate, avoid `SELECT *`, decorrelate a subquery, add `LIMIT`). Explain in one or two plain sentences what the database is doing and why it is slow.

### Step 5: Report
Emit these sections:
- `## Plan Summary`: dialect, whether analyzed, total time/cost.
- `## Dominant Cost`: the node eating the time, in plain language.
- `## Red Flags`: the table above, filtered to what actually appears.
- `## Recommendations`: ordered by expected impact, each with the exact DDL or rewrite.

## Important Notes
- Distinguish estimate from actual: only an `EXPLAIN ANALYZE`/`EXPLAIN ANALYZE` plan proves a row-estimate error.
- Never invent numbers the plan does not contain; quote the node's real cost/rows/time.
- Multiply inner-node cost by `loops` before judging it, a cheap node run 900k times is the real problem.
- For index suggestions, note the write-side cost and whether an existing index already covers the need.
