# Queue Patterns (per broker)

For each broker: the ack/commit model, how retries and backoff are configured, the dead-letter mechanism, visibility/redelivery handling, and the idiomatic idempotent-consumer shape. The invariants are constant everywhere, **ack after work, cap retries into a DLQ, backoff with jitter, dedup the side effect**: only the API changes.

## BullMQ / Bull (Node, Redis-backed)
- **Ack model**: a job is "completed" when the processor function returns; it moves to `failed` if it throws. Redis-backed → **exactly-once is impossible**; dedup must be explicit.
- **Retries + backoff**:
```js
await queue.add("charge", data, {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },  // 1s, 2s, 4s... add jitter via a custom strategy
  removeOnComplete: 1000, removeOnFail: false,
});
```
- **DLQ**: BullMQ has no built-in DLQ, a job that exhausts `attempts` stays in the `failed` set. Implement a DLQ by listening for the `failed` event (once `attemptsMade >= attempts`) and moving the payload to a dedicated `dead-letter` queue for inspection/replay.
- **Idempotent consumer**: use a deterministic `jobId` (`add(name, data, { jobId })`) to dedup **enqueue**, and a dedup store keyed by a business id to dedup **effects** on retry. The processor must tolerate running twice.
- **Read for**: missing `attempts`/`backoff`, no `failed`-event DLQ handling, a processor that charges/emails without an idempotency guard.

## Celery (Python)
- **Ack model**: default is **early ack** (`acks_late=False`), the task is acked when received, so a worker crash **loses** it. For anything important set `acks_late=True` and `task_reject_on_worker_lost=True`.
```python
@app.task(bind=True, acks_late=True, max_retries=5,
          retry_backoff=True, retry_backoff_max=600, retry_jitter=True)
def charge(self, order_id):
    try:
        do_charge(order_id)          # must be idempotent
    except TransientError as exc:
        raise self.retry(exc=exc)
```
- **Retries + backoff**: `retry_backoff=True` (exponential) + `retry_jitter=True`; `max_retries` caps it.
- **DLQ**: Celery has no native DLQ; route exhausted tasks via a broker dead-letter exchange (RabbitMQ `x-dead-letter-exchange`) or handle `on_failure`/`max_retries` exceeded by writing the payload to a `dead_letter` table/queue.
- **Read for**: `acks_late` not set on side-effecting tasks, no `max_retries`, no backoff, non-idempotent task bodies, `ignore_result` masking failures.

## Sidekiq (Ruby)
- **Ack model**: pulls from Redis; a job is at-least-once and **retries are on by default** (up to 25 times with built-in exponential backoff). A crash mid-job redelivers → the job **can run twice**.
```ruby
class ChargeJob
  include Sidekiq::Job
  sidekiq_options retry: 5
  def perform(order_id)
    return if AlreadyCharged.exists?(order_id)   # idempotency guard
    do_charge(order_id)
  end
  sidekiq_retries_exhausted do |job, ex|
    DeadLetter.record(job["args"], ex)           # DLQ on exhaustion
  end
end
```
- **DLQ**: the built-in **dead set** holds jobs that exhaust retries; add a `sidekiq_retries_exhausted` block to route them somewhere actionable.
- **Read for**: no `sidekiq_retries_exhausted`/dead-set handling, `perform` with un-guarded side effects, `retry: false` on jobs that should retry (or huge retry counts that hammer a dependency).

## RabbitMQ consumers (amqplib / pika / kombu)
- **Ack model**: **manual ack after work**: `channel.ack(msg)` once processing succeeds; never use `noAck: true`/`no_ack=True` for side-effecting work (it acks on delivery and loses on crash).
```js
channel.prefetch(10);                       // QoS: bound un-acked messages
channel.consume("orders", async (msg) => {
  try { await handle(msg); channel.ack(msg); }
  catch (e) { channel.nack(msg, false, false); }  // requeue=false → to the DLX
});
```
- **DLQ**: declare the queue with `x-dead-letter-exchange` (and optionally `x-dead-letter-routing-key`); `nack(requeue=false)` or a per-message TTL routes poison messages to the DLX. Add a retry queue with a TTL for delayed redelivery (backoff).
- **Visibility**: no timeout model, un-acked messages return to the queue when the channel/connection drops; set `prefetch` so one consumer doesn't grab everything.
- **Read for**: `noAck`/`no_ack`, ack **before** processing, no DLX, unbounded prefetch, immediate `requeue=true` loops on poison messages (infinite redelivery).

## AWS SQS
- **Ack model**: receiving a message makes it invisible for the **visibility timeout**; you must **`DeleteMessage` after success**. Not deleting → it reappears after the timeout (redelivery). Deleting before the work finishes → loss on crash.
```
1. ReceiveMessage
2. do work (idempotent)
3. DeleteMessage        <-- the ack; only on success
```
- **Visibility timeout**: set it ≥ your processing time, or call `ChangeMessageVisibility` to **heartbeat/extend** for long jobs; otherwise the message is redelivered and processed concurrently.
- **DLQ**: attach a **redrive policy**: `maxReceiveCount` moves a message to the DLQ after N failed receives. Set an alarm on DLQ depth.
- **FIFO**: exactly-once *delivery* within the dedup window requires `MessageDeduplicationId` (or content-based dedup) and `MessageGroupId` for ordering.
- **Read for**: delete before work, visibility timeout < processing time, no redrive policy/DLQ, standard-queue code assuming ordering or no duplicates.

## Google Pub/Sub
- **Ack model**: `ack()` after processing; the **ack deadline** is Pub/Sub's visibility timeout, extend it for long work (the client libraries auto-extend up to a max). Not acking → redelivery.
- **DLQ**: configure a **dead-letter topic** with `maxDeliveryAttempts` on the subscription; exhausted messages go there. Requires the service account to have publish rights on the dead-letter topic.
- **Delivery**: at-least-once by default (exactly-once delivery is an opt-in subscription feature, still requires idempotent handlers for effects). Dedup on `messageId` or a business attribute.
- **Read for**: `ack()` before work, no dead-letter topic/`maxDeliveryAttempts`, long handlers without deadline extension, assuming no duplicates.

## Kafka consumers (kafkajs / confluent / sarama / Spring Kafka)
- **Ack model**: progress is an **offset commit**. **Auto-commit before processing** (`enable.auto.commit=true` with the default) can commit offsets for messages you haven't finished → loss on crash. Commit **after** processing (manual commit) for at-least-once.
```js
await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    await handle(message);                          // idempotent, keyed by (topic,partition,offset) or a business key
    await consumer.commitOffsets([{ topic, partition, offset: (Number(message.offset)+1).toString() }]);
  },
});
```
- **DLQ**: no built-in DLQ, publish poison records to an **error topic** after bounded in-handler retries (or use a framework like Spring Kafka's `DeadLetterPublishingRecoverer` / `SeekToCurrentErrorHandler` with a `maxAttempts`).
- **Rebalance safety**: keep processing time under `max.poll.interval.ms`, or the consumer is considered dead and its partitions rebalance → duplicate processing and stalls. Long work → smaller `max.poll.records` or pause/resume.
- **Read for**: auto-commit with slow processing, commit before work, no error-topic/DLQ, processing time > `max.poll.interval.ms`.

## Transactional outbox (broker-agnostic)
Any handler that writes to the DB **and** publishes to a broker is a dual write. Make the publish reliable:
```sql
-- In the SAME transaction as the business change:
BEGIN;
  INSERT INTO orders (...) VALUES (...);
  INSERT INTO outbox (id, topic, payload, created_at, published_at)
    VALUES (gen_random_uuid(), 'OrderCreated', $json, now(), NULL);
COMMIT;
-- A separate relay (poll `WHERE published_at IS NULL`, or CDC via Debezium/logical decoding)
-- publishes each row to the broker, then sets published_at. At-least-once → consumers still dedup.
```
This converts a lose-the-event dual write into a never-lose-the-event outbox. It does **not** give exactly-once, the relay may publish a row twice on its own retry, so downstream consumers must still be idempotent.

## Universal audit rule
For every consumer, locate the side effect and the ack/commit and confirm the order is `work → ack`, that retries are bounded and back off with jitter, that exhausted messages reach a DLQ, that the visibility/ack deadline exceeds processing time, and that the effect is idempotent. Any missing item is a finding, cite the `file:line` of the side effect and the ack.
