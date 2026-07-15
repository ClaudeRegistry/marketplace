---
description: Recommend indexes for a slow query given only the query and table DDL, with column-order reasoning
argument-hint: [query + table DDL]
model: inherit
---

Given the slow query and the relevant table DDL in `$ARGUMENTS`, recommend the right index (or advise against one). This is a **static** analysis of the query and DDL text, **no database connection required**. Load the `explain-interpreter` and `schema-antipatterns` skills for sargability and index design rules.

## Process

### Step 1: Parse the query and DDL
Extract from the query: the `WHERE` predicates, `JOIN` keys, `ORDER BY`/`GROUP BY` columns, and the `SELECT` list. From the DDL: existing indexes, primary key, column types, and table cardinality hints if provided. Detect the dialect (Postgres vs MySQL) for the correct `CREATE INDEX` syntax.

### Step 2: Classify each predicate
Label every filtered column:

| Class | Examples | Index role |
|---|---|---|
| Equality | `status = 'x'`, `tenant_id = ?`, `IN (...)` | Leading columns |
| Range | `created_at > ?`, `price BETWEEN`, `<`, `>` | After equality columns |
| Sort | `ORDER BY created_at DESC` | Matches index order to skip a sort |
| Covered | columns only in `SELECT` | `INCLUDE` / covering columns |
| Non-sargable | `WHERE lower(email)=?`, `col + 1 = ?`, leading-`%` `LIKE` | Needs expression index or rewrite |

### Step 3: Design the index
Apply the rules:
- **Column order**: all equality columns first, then one range column, then sort columns (equality-range-sort / "ERS" rule). A composite index can serve a prefix of its columns.
- **Covering**: add `INCLUDE (...)` (Postgres) or trailing key columns (MySQL) to avoid a heap/clustered-index lookup when the query selects few extra columns.
- **Partial**: add `WHERE <condition>` for queries that always filter on a constant (e.g. `WHERE deleted_at IS NULL`, `WHERE status='active'`), smaller, faster, cheaper to maintain.
- **Expression index** for non-sargable predicates, or recommend rewriting the predicate to be sargable.

### Step 4: Check for redundancy and when NOT to index
- If an existing index is a **prefix** of the proposed one, the proposed index makes it redundant, say so and recommend dropping the old one.
- Advise **against** a new index when: the table is write-heavy and the column is rarely filtered; selectivity is low (e.g. a boolean split 50/50); the query runs rarely; or an existing index already covers it.

### Step 5: Report
Emit:
- `## Recommended Index`: the exact `CREATE INDEX` (use `CONCURRENTLY` for Postgres so it does not block writes), with a one-paragraph rationale tying each column position to a predicate.
- `## Trade-offs`: write amplification, storage, and any index this replaces.
- `## When to skip`: if the honest recommendation is "no index," say so and why.

## Important Notes
- Ground column order in the actual predicates of the given query, never a generic single-column guess.
- Never claim an index helps without naming which clause it serves (`WHERE`, `JOIN`, `ORDER BY`).
- Every proposed index costs write throughput and storage; state the trade-off explicitly.
- Recommend applying the index via `/migration-safety` on a live table (a non-`CONCURRENTLY` build blocks writes).
