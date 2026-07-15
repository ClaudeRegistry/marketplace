# Deduplication Strategies

At-least-once delivery guarantees duplicates. You cannot prevent redelivery, you make the **effect** happen once anyway. This is "exactly-once *effect*" built on "at-least-once *delivery*." The tool is a dedup store consulted before the side effect runs.

## Pick the dedup key first
The dedup key decides what "the same message" means. Choose in this priority:

| Key source | When to use | Caveat |
|---|---|---|
| **Business/natural key** (e.g. `order_id + "charge"`) | Preferred, dedups the *operation*, not the transport | Requires the payload to carry a stable id |
| **Producer idempotency key** (a UUID the producer put in the message) | When there is no natural key | Producer must generate one per logical event, reuse on its own retries |
| **Broker message-id** (SQS `MessageId` retries share `MessageId` only within a receive; Kafka `(topic,partition,offset)`; Pub/Sub `messageId`) | Last resort | A *re-published* message gets a **new** id, this dedups redelivery, not re-publish |

Prefer a business key: it survives re-publishing (the outbox relay sending the same event twice) and reflects the real "did this operation already happen" question. Fall back to a producer idempotency key, then to the broker id.

## Dedup store, Redis `SET NX`
Fast, TTL-native, good for high throughput:
```
SET dedup:charge:{order_id} 1 NX EX 604800
```
- `NX` → returns nil if the key already exists (already processed) → skip the side effect and ack.
- On success (key set), run the effect, then ack.
- `EX` sets the dedup window (here 7 days). Size it to the maximum realistic redelivery gap.
- Caveat: this is check-then-act unless the effect is also idempotent, if the worker crashes **after** `SET NX` but **before** the effect, the key exists yet the work never happened, and the redelivery skips it. Guard against that: either (a) set the key only **after** the effect succeeds (accepting a small double-run window on crash-before-set), or (b) store state (`in_flight`/`done`) and only skip on `done`: the same state machine as the API idempotency-key recipe.

## Dedup store, SQL unique constraint (durable, atomic)
Strongest when the effect writes to the same database, put the dedup row in the **same transaction** as the effect:
```sql
BEGIN;
  INSERT INTO processed_messages (dedup_key, processed_at)
    VALUES ($dedup_key, now())
    ON CONFLICT (dedup_key) DO NOTHING;          -- unique(dedup_key)
  -- if 0 rows inserted -> already processed -> ROLLBACK and ack (skip)
  -- else perform the business write here, in this same tx
COMMIT;   -- dedup marker and effect commit together: true once-only
```
Because the marker and the effect commit atomically, a crash can never leave the effect done without the marker (or the marker set without the effect). This is the gold standard for money movement and data writes. When the effect is an **external** call (payment API, email), you can't share a transaction, pass an idempotency key **through** to that external service so it dedups on its side, and record `done` only after it returns.

## Dedup window / TTL
- The window must exceed the broker's maximum redelivery horizon and your retry budget. SQS can redeliver up to the message retention period (default 4 days, max 14); size accordingly. Kafka can replay from a much older offset on a reset, a business-key dedup handles that, a short TTL may not.
- Too short → a late redelivery re-runs the effect. Too long → the store grows. Sweep expired rows / rely on Redis TTL.

## Broker-native dedup (use, but don't rely on alone)
- **SQS FIFO**: `MessageDeduplicationId` (or content-based) dedups within a **5-minute** window only. Fine for near-duplicate retries; not a substitute for application dedup across longer gaps.
- **Kafka**: the idempotent producer (`enable.idempotence=true`) dedups **producer→broker** retries per partition; it does **not** dedup consumer-side processing. Consumers still need their own idempotency.
- **Pub/Sub exactly-once delivery**: reduces duplicates but the docs still require idempotent handlers for effects.

Treat all broker-native dedup as a helpful reducer of duplicates, never as a guarantee that your handler runs once, always keep the application-level guard.

## Exactly-once-effect checklist
1. Choose a stable dedup key (business key > producer idempotency key > broker id).
2. Before the side effect, atomically claim the key (`INSERT ... ON CONFLICT` / `SET NX`), distinguishing `in_flight` from `done`.
3. Run the effect; for external effects, pass an idempotency key downstream.
4. Mark `done` (ideally in the same transaction as a DB effect).
5. Ack/commit only after the effect + marker are durable.
6. On redelivery, a `done` key short-circuits to ack; an `in_flight` key waits or defers.

## Anti-patterns
- **Dedup on message-id only** when messages can be re-published (outbox relay retry, manual replay), the new id defeats it. Use a business key.
- **Check-then-act without atomicity**: two concurrent redeliveries both see "not processed" and both run. Use `ON CONFLICT`/`SET NX`.
- **Setting the dedup marker before the effect** without an `in_flight`/`done` distinction, a crash in between silently drops the work.
- **No TTL / unbounded store**: the dedup table grows forever.
- **Relying on broker-native dedup alone**: every native mechanism has a narrow window or scope and does not cover consumer-side processing.
