# ORM N+1 Pattern Library

For each ORM: the exact code shape that produces an N+1, and the exact eager-load/batch fix. The signature is always the same, a collection query, then a per-row access of a **lazy** relation. The cure is always the same idea, load the relation up front. Only the syntax changes.

## Django ORM (Python)
```python
# N+1: one query for orders, then one per order for .customer
orders = Order.objects.filter(status="open")
for o in orders:
    print(o.customer.name)          # lazy FK fetch per row
```
```python
# Fix: select_related for to-one (JOIN), prefetch_related for to-many (2nd query + join in Python)
orders = Order.objects.filter(status="open").select_related("customer")
orders = Author.objects.prefetch_related("books")   # to-many
```
Watch: DRF serializers with `SerializerMethodField` or nested serializers that walk relations, add the `select_related`/`prefetch_related` on the viewset's `get_queryset`. Use `Prefetch(...)` to filter/order the prefetched set.

## SQLAlchemy (Python)
```python
# N+1: default lazy='select' relationship touched in a loop
orders = session.query(Order).all()
for o in orders:
    print(o.customer.name)
```
```python
# Fix: eager-load via options
from sqlalchemy.orm import joinedload, selectinload
orders = session.query(Order).options(joinedload(Order.customer)).all()      # to-one, JOIN
authors = session.query(Author).options(selectinload(Author.books)).all()    # to-many, IN(...) batch
```
`joinedload` = single JOIN (best for to-one); `selectinload` = a second `WHERE id IN (...)` query (best for to-many, avoids row multiplication). Set `lazy="raise"` on relationships in hot code to make accidental lazy loads throw.

## Rails ActiveRecord (Ruby)
```ruby
# N+1: no includes; .customer lazily loaded per row (also common in views / as_json)
Order.where(status: "open").each { |o| puts o.customer.name }
```
```ruby
# Fix: includes (preload or eager_load chosen automatically), or explicit
Order.where(status: "open").includes(:customer).each { |o| puts o.customer.name }
Order.includes(:line_items).preload(:customer)   # preload = separate query; eager_load = LEFT JOIN
```
Enable the Bullet gem in dev, or `Rails.application.config.active_record.strict_loading_by_default = true` to raise on lazy loads.

## Sequelize (Node/TypeScript)
```js
// N+1: findAll then read o.Customer per row
const orders = await Order.findAll({ where: { status: "open" } });
for (const o of orders) console.log((await o.getCustomer()).name);
```
```js
// Fix: include the association in the query
const orders = await Order.findAll({
  where: { status: "open" },
  include: [{ model: Customer }],
});
```

## Prisma (Node/TypeScript)
```js
// N+1: findMany, then a separate query per order for the relation
const orders = await prisma.order.findMany();
for (const o of orders) {
  const c = await prisma.customer.findUnique({ where: { id: o.customerId } });
}
```
```js
// Fix: include (or select) the relation in the single query
const orders = await prisma.order.findMany({ include: { customer: true } });
```

## TypeORM (Node/TypeScript)
```ts
// N+1: lazy relation (Promise<> relation or no relations:) accessed per row
const orders = await repo.find();
for (const o of orders) console.log((await o.customer).name);
```
```ts
// Fix: relations option, or an explicit join in QueryBuilder
const orders = await repo.find({ relations: { customer: true } });
const orders2 = await repo.createQueryBuilder("o")
  .leftJoinAndSelect("o.customer", "c").getMany();
```

## Hibernate / JPA (Java)
```java
// N+1: @OneToMany(fetch = LAZY) accessed per row after the initial query
List<Order> orders = em.createQuery("select o from Order o", Order.class).getResultList();
for (Order o : orders) o.getCustomer().getName();   // one SELECT per order
```
```java
// Fix: JOIN FETCH, or an @EntityGraph, or batch fetching
em.createQuery("select o from Order o join fetch o.customer", Order.class);
// @EntityGraph(attributePaths = {"customer"}) on a Spring Data repo method
// @BatchSize(size = 100) on the collection to turn N queries into N/100
```
Never use `FetchType.EAGER` blanket-on entities (it fires on every query); prefer per-query `JOIN FETCH`/entity graphs.

## GORM (Go)
```go
// N+1: Find, then Association load per row
var orders []Order
db.Find(&orders)
for _, o := range orders {
    db.Model(&o).Association("Customer").Find(&o.Customer)
}
```
```go
// Fix: Preload
var orders []Order
db.Preload("Customer").Find(&orders)
db.Preload("LineItems").Find(&orders)   // to-many, batched IN(...)
```

## Entity Framework (C#)
```csharp
// N+1: lazy-loading proxies, or accessing a navigation not Included
var orders = context.Orders.Where(o => o.Status == "open").ToList();
foreach (var o in orders)
    Console.WriteLine(o.Customer.Name);   // lazy load per row (if proxies on) or null
```
```csharp
// Fix: Include (eager), or a projection that selects only what you need
var orders = context.Orders.Where(o => o.Status == "open")
    .Include(o => o.Customer).ToList();
var slim = context.Orders.Select(o => new { o.Id, CustomerName = o.Customer.Name }).ToList();
```
Disable lazy-loading proxies in hot paths so a missing `Include` fails loudly instead of silently firing N queries.

## Cross-ORM detection heuristics (for static scanning)
- A collection query (`.all()`, `findMany`, `findAll`, `.where`, `Find`, `.ToList()`) whose result is iterated, **and** inside the loop a relation/navigation property is read, **and** the query has no eager-load clause → suspected N+1.
- Serializers / `as_json` / `to_representation` / GraphQL field resolvers walking relations are hidden loops, scan them too.
- A query already carrying `select_related`/`prefetch_related`/`joinedload`/`selectinload`/`includes`/`preload`/`eager_load`/`include`/`relations`/`Include`/`Preload`/`JOIN FETCH`/`@EntityGraph` for that relation is **not** an N+1.
- To-one relations → JOIN-style eager load; to-many relations → batched `IN(...)`-style eager load to avoid row multiplication.
