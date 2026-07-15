# Pagination & Rate-Limit Headers

Two collection-endpoint concerns clients depend on: **pagination** (traverse a large set safely) and **rate limiting** (advertise limits so clients back off). Both are boundary concerns, get them right once, in the handler and a shared helper.

## Cursor (keyset) pagination, the default for large/live data
Order by a **stable, unique** key and page by "everything after the last row I saw," not by offset.

```
GET /orders?limit=50&cursor=eyJjcmVhdGVkX2F0IjoiMjAyNi0wNy0wMVQxMDoyMiIsImlkIjo4NDIxfQ
```
```json
{
  "data": [ /* up to 50 orders */ ],
  "page": { "next": "eyJjcmVhdGVk...", "hasMore": true, "limit": 50 }
}
```

**SQL (keyset)**: order by a unique tuple and compare against the cursor's values:
```sql
SELECT * FROM orders
WHERE (created_at, id) < ($cursor_created_at, $cursor_id)   -- strictly after the last seen row (DESC)
ORDER BY created_at DESC, id DESC
LIMIT $limit + 1;   -- fetch one extra to compute hasMore, then drop it
```
- The tie-breaker (`id`) makes the sort **total**: without it, rows sharing a `created_at` can be skipped or repeated across pages.
- `LIMIT n+1`: if you get `n+1` rows, `hasMore=true` and the next cursor is the nth row's key; return only `n`.

**Cursor encoding**: the cursor is **opaque** to clients, base64url of the sort-key values (`{"created_at":"...","id":8421}`), optionally signed/HMAC'd so clients can't forge or probe it. Never expose the raw offset or a guessable sequence; never let the client pick the sort inside the cursor.

**Why cursors beat offset**: stable under concurrent inserts/deletes (no duplicated or skipped rows when page 2 loads after a new row landed), and O(1) via the index instead of `OFFSET n` scanning and discarding n rows.

## Offset/limit pagination, fine for small, static, jump-to-page
```
GET /orders?limit=50&offset=100
```
```json
{ "data": [ ... ], "page": { "limit": 50, "offset": 100, "total": 4213 } }
```
Acceptable when the dataset is small and mostly static and the UI needs "jump to page 7" or a total count. Weaknesses: **drift** (insert/delete shifts every subsequent page, causing duplicates or gaps) and **cost** (`OFFSET 100000` still scans and throws away 100k rows). Computing `total` on every page (`COUNT(*)`) can dominate the query, omit it or cache it for large tables.

## Pagination rules (both styles)
- **Bound `limit`**: a default (e.g. 20) and a hard max (e.g. 100). Clamp, don't error, on over-max, or `400` if you prefer strictness; document which.
- **Deterministic order**: always `ORDER BY` a unique key (or a tuple ending in one). "No explicit order" means the DB may return rows in any order, breaking both styles.
- **Consistent envelope**: same `data` + `page` shape on every list endpoint.
- **Don't leak internals** in cursors: encode/sign them; treat a malformed cursor as `400`.
- **Empty/last page**: return `data: []` with `hasMore: false` / `next: null`, not a `404`.

## Rate-limit headers (IETF `RateLimit` fields)
Advertise the limit so well-behaved clients throttle themselves. The modern, standardized headers:

```
RateLimit: limit=100, remaining=12, reset=30
RateLimit-Policy: 100;w=60
```
- `RateLimit` describes the **current** window: `limit` (quota), `remaining` (calls left), `reset` (seconds until the window resets).
- `RateLimit-Policy` describes the **policy**: `100;w=60` = 100 requests per 60-second window. Multiple policies are comma-separated.

**On limit exceeded**: return `429 Too Many Requests` (not `403`) with `Retry-After`:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit: limit=100, remaining=0, reset=30
Content-Type: application/problem+json

{ "type": "https://api.example.com/problems/rate-limited", "title": "Too Many Requests",
  "status": 429, "detail": "Rate limit exceeded. Retry in 30s.", "retryAfter": 30 }
```
`Retry-After` may be a delay in **seconds** or an **HTTP-date**; seconds is simpler for clients.

## Legacy `X-RateLimit-*` mapping
Many existing APIs use the de-facto `X-RateLimit-*` headers. Map them to the standard fields (emit both during a migration window):
| Legacy | Standard |
|---|---|
| `X-RateLimit-Limit: 100` | `RateLimit-Policy: 100;w=60` (+ `limit=100` in `RateLimit`) |
| `X-RateLimit-Remaining: 12` | `remaining=12` in `RateLimit` |
| `X-RateLimit-Reset: 1720000000` (epoch) | `reset=<seconds-from-now>` in `RateLimit` (note: standard uses a delta, not an absolute epoch) |

Watch the `reset` semantics: legacy `X-RateLimit-Reset` is often an absolute Unix timestamp, while the standard `reset` is **seconds remaining**. Converting one to the other without adjusting is a common bug.

## Server-side algorithm note (for review)
- Prefer a **token-bucket** or **sliding-window-counter** limiter over a fixed window (a fixed window lets a client burst 2× at the boundary).
- Key the limit by principal (API key / user / IP as appropriate); document the scope.
- Compute `remaining`/`reset` from the limiter's real state, do not hard-code header values that don't reflect the actual counter, or clients will mistrust them.
