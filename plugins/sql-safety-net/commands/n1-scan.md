---
description: Scan ORM/data-access code for N+1 query patterns and emit idiomatic eager-loading fixes
argument-hint: [path]
model: inherit
---

Scan the ORM / data-access code at `$ARGUMENTS` (default: the current diff or the app's models/services directories) for N+1 query patterns, and report each with an idiomatic fix. This is a **static** scan of source code, **no database connection or query log required**. It dispatches the **n1-hunter** agent, which reads the `schema-antipatterns` skill's ORM N+1 catalog.

## Process

### Step 1: Detect the ORM
Identify the data-access layer from manifests and imports:

| ORM | Signal |
|---|---|
| Django ORM | `models.py`, `objects.filter`, `.all()`, `settings.py` |
| SQLAlchemy | `sqlalchemy`, `session.query`, `relationship(` |
| Rails ActiveRecord | `app/models/`, `has_many`, `.where` |
| Sequelize | `sequelize`, `Model.findAll`, `hasMany` |
| Prisma | `prisma/schema.prisma`, `prisma.*.findMany` |
| TypeORM | `@Entity`, `getRepository`, `@OneToMany` |
| Hibernate/JPA | `@Entity`, `@OneToMany(fetch=LAZY)`, `EntityManager` |
| GORM (Go) | `gorm.io`, `db.Find`, `Preload` |
| Entity Framework | `DbContext`, `DbSet<`, `.Include(` |

### Step 2: Dispatch the n1-hunter agent
Launch the **n1-hunter** agent with the target path. It looks for the classic shape: a query that returns a collection, followed by a loop (or a serializer/`to_json`/template) that accesses a **lazy-loaded relation** per element, triggering one query per row. It also flags missing `select_related`/`prefetch_related`/`joinedload`/`includes`/`with`/`Include()`/`Preload` on queries whose results are iterated with relation access.

### Step 3: Report
Relay the agent's findings as:
- `## N+1 Findings`: a table: `file:line | ORM | Pattern | Fix`. Each row names the loop and the relation being lazily loaded, and gives the exact eager-load call for that ORM.
- `## Severity Note`: which findings are in hot paths (request handlers, list endpoints, serializers) vs cold paths (one-off scripts).

## Important Notes
- Report only patterns backed by real code, cite the exact file:line of the query and the loop.
- A static scan yields *suspected* N+1s; note where confirmation needs the runtime query count (the fix is still correct).
- Never fabricate line numbers or relations; if the relation's laziness cannot be confirmed from the code, say so.
- Prefer the idiomatic batch/eager fix for the detected ORM over a hand-rolled `IN (...)` unless the ORM lacks one.
