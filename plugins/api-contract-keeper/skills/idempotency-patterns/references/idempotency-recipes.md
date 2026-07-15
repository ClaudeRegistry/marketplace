# Idempotency Recipes

Make an unsafe HTTP method safe to retry: a client-supplied `Idempotency-Key` header plus a durable store that maps key → the first response, so a replay returns the original outcome instead of applying the effect twice. This is the pattern Stripe, PayPal, and the IETF `Idempotency-Key` draft all use.

## When to apply
| Method | Idempotent by HTTP? | Needs a key? |
|---|---|---|
| `GET`, `HEAD` | Yes (also safe) | No |
| `PUT` | Yes (full replace) | No, but a key still guards against a racing double-PUT if you want strict once-only |
| `DELETE` | Yes (deleting twice = deleted) | No, but return a consistent status on the second call |
| `PATCH` | **Depends**: `set x=5` is idempotent; `increment x` is not | Yes if it is not naturally idempotent |
| `POST` | **No** | **Yes**: this is the primary case |

Only add key handling where it is needed. Bolting a key onto `GET` adds cost and confusion.

## The store schema (SQL)
```sql
CREATE TABLE idempotency_keys (
  id            bigserial PRIMARY KEY,
  principal_id  text        NOT NULL,        -- scope: the authenticated user/tenant
  endpoint      text        NOT NULL,        -- scope: method + route template
  idem_key      text        NOT NULL,        -- the client's Idempotency-Key header
  request_hash  text        NOT NULL,        -- hash of the request body (+ relevant headers)
  state         text        NOT NULL,        -- 'in_flight' | 'completed'
  response_status int,
  response_body   jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,        -- created_at + TTL
  UNIQUE (principal_id, endpoint, idem_key)  -- the atomic-claim guard
);
```
Scope the key to `(principal, endpoint)` so one client's key can't collide with another's, and so the same key on a different route is independent.

## The atomic claim (this is the crux)
Two concurrent retries must not both execute. Claim the key atomically, then act:

**SQL, insert-or-conflict**
```sql
INSERT INTO idempotency_keys (principal_id, endpoint, idem_key, request_hash, state, expires_at)
VALUES ($1, $2, $3, $4, 'in_flight', now() + interval '24 hours')
ON CONFLICT (principal_id, endpoint, idem_key) DO NOTHING
RETURNING id;
```
- **Row returned** → you won the claim: execute the work, then `UPDATE ... SET state='completed', response_status=?, response_body=?`.
- **No row returned** → a row already exists: `SELECT` it.
  - `state='completed'` **and** `request_hash` matches → return the stored `response_status`/`response_body` verbatim.
  - `state='completed'` but `request_hash` **differs** → same key, different payload → `422 Unprocessable Content` (key reuse).
  - `state='in_flight'` → the original is still running → `409 Conflict` (client should retry after a moment), or block on a short poll/advisory lock.

**Redis, `SET NX`**
```
SET idem:{principal}:{endpoint}:{key} '{"state":"in_flight"}' NX PX 86400000
```
`NX` returns nil if the key already exists (someone else claimed it). On success, run the work and overwrite the value with the stored response; on nil, read the existing value and apply the same completed/in-flight/mismatch logic. Redis gives speed but is not durable across a flush, use SQL (or Redis with AOF/persistence) when the guarantee must survive a restart.

## Persisting and replaying the response
Store enough to reconstruct the **exact** original response: status code and body (and any headers the client keys on, e.g. `Location`). On replay, return them byte-for-byte. Optionally add a header like `Idempotent-Replayed: true` so the client/tests can observe a replay.

## Dedup window / TTL
- Set a TTL that comfortably exceeds the client's total retry budget, **24 hours** is a common default; payment providers often keep keys 24h–7d.
- Expire keys (`expires_at` / Redis `PX`) so the store doesn't grow unbounded. A key that expires before the client stops retrying defeats the purpose, size the window to the retry policy, not the other way around.
- Sweep expired rows with a periodic job (or a partial index on `expires_at`).

## Safe-retry semantics by effect
- **Create (POST)**: the key ensures one resource is created; the replay returns the same `201` + `Location`.
- **Money movement**: the effect (charge/transfer) must be gated by the key **and** by a downstream idempotency token on the payment provider, never rely on the API layer alone; pass an idempotency key through to the provider too.
- **Increment/append (non-idempotent PATCH)**: without a key, a retry double-increments. With a key, the second call is a no-op returning the first result.
- **Delete**: naturally idempotent, deleting an already-deleted resource should return a consistent status (`204` or `404`, chosen and documented), not `500`.

## Where to store keys, decision guide
| Store | Durable | Speed | Use when |
|---|---|---|---|
| Primary SQL DB | Yes | Medium | The mutation already writes to this DB, put the key row in the **same transaction** as the effect for true once-only |
| Redis (AOF/persistent) | Mostly | High | High throughput, TTL native, can tolerate rare loss |
| Redis (cache-only) | No | High | Best-effort dedup only, not for money movement |

The strongest form writes the idempotency row and the business effect in **one transaction**: either both commit or neither does, so a crash can never leave the effect applied without the key recorded (or vice versa). When the effect is an external call (payment API), you cannot share a transaction, record `in_flight`, make the external call idempotent with its own key, then record `completed`.

## Client contract (document these)
- `Idempotency-Key` is a **client-generated** unique value (a UUID v4 per logical operation), the same key for every retry of that operation, a new key for a new operation.
- Reusing a key with a different body → `422`. Reusing it with the same body → the original response.
- Keys are honored for the documented window (e.g. 24h); after that a replay may execute again.

## Anti-patterns
- **Dedup on the body/hash alone** (no explicit key): distinct operations with identical bodies (two legitimate $10 charges) get wrongly merged; always use the client-supplied key.
- **Non-atomic check-then-act** (`SELECT` then `INSERT` in separate statements): two retries both see "missing" and both execute. Use `INSERT ... ON CONFLICT` / `SET NX`.
- **No TTL**: the store grows forever.
- **Storing only "seen"** without the response: you dedup but can't return the original outcome, so the client gets an inconsistent second answer.
- **Keying globally** instead of per-principal: one tenant's key blocks another's.
