# Breaking vs Non-Breaking Change Rules (oasdiff-style semantics)

Classify a change to the API surface by its effect on **existing clients**. The governing principle is **variance by direction**:

- **Request** data flows client → server. The server's accepted set may only **grow** (contravariant). *Widening = safe; narrowing = breaking.*
- **Response** data flows server → client. The server's guaranteed set may only **grow** (covariant). *Adding = safe; removing/weakening = breaking.*

Apply the direction first; the tables below are that rule made concrete.

## Endpoints & operations

| Change | Verdict | Notes |
|---|---|---|
| Remove an endpoint / method | Breaking | Clients get 404/405 |
| Rename a path (`/orders` → `/purchases`) | Breaking | Rename = remove + add |
| Add a new endpoint / method | Non-breaking | Nobody depends on it yet |
| Change an operation's success status (200 → 204) | Breaking | Clients branch on status |
| Add a `deprecated: true` flag | Non-breaking | Signals intent; behavior unchanged |
| Tighten `security` (add required scope/auth) | Breaking | Previously-authorized calls now 401/403 |
| Loosen `security` (make auth optional) | Non-breaking | Superset of who can call |

## Request parameters & body

| Change | Verdict | Notes |
|---|---|---|
| Add a **required** param or body field | Breaking | Old clients omit it → rejected |
| Add an **optional** param or body field | Non-breaking | Old clients omit it safely |
| Make an optional request field **required** | Breaking | Same effect as adding a required field |
| Make a required request field optional | Non-breaking | Fewer constraints |
| Remove a request field the server read | Non-breaking* | *If it was required, removing the requirement is safe; if clients still send it, ensure it's ignored not rejected |
| Narrow a request type (`string` → `integer`, add `enum`, smaller `maxLength`, new `pattern`, lower `maximum`) | Breaking | Previously-valid payloads now fail validation |
| Widen a request type (`integer` → `number`, larger `maxLength`, remove `pattern`, add enum value **accepted** in input) | Non-breaking | Server accepts a superset |
| Change a param's `in` (query → path) or name | Breaking | Rename |
| Add `additionalProperties: false` (start rejecting unknown fields) | Breaking | Clients sending extras now fail |
| Change a default value for an omitted field | Breaking-ish | Flag: observable behavior change even if schema "compatible" |

## Response body

| Change | Verdict | Notes |
|---|---|---|
| Remove a response field | Breaking | Clients reading it break |
| Rename a response field | Breaking | Remove + add |
| Make a response field **nullable** (or no longer guaranteed present) | Breaking | Clients assumed non-null/present |
| Make a nullable response field always non-null | Non-breaking | Stronger guarantee |
| Add a new response field | Non-breaking | Strict clients that reject unknown fields are the exception, note it |
| Narrow a response type (`number` → `integer`, add stricter format) | Non-breaking for value, but flag | Clients parsing the wider type still work; reverse would break |
| Widen a response type (`integer` → `number`, `enum` → open `string`) | Breaking | Clients with a narrow parser/enum may reject new values |
| Change the media type (`application/json` → `application/xml`) | Breaking | Deserialization breaks |

## Status codes & errors

| Change | Verdict | Notes |
|---|---|---|
| Change a documented status for a case (409 → 422) | Breaking | Error-handling branches keyed on status |
| Add a **new** possible error status (new 429) | Non-breaking* | *New but clients should already handle unknown 4xx/5xx defensively; flag |
| Remove a documented error status | Non-breaking | Fewer outcomes |
| Change the error body shape (fields in the error envelope) | Breaking | Clients parse the error body |

## Enums

| Change | Verdict | Notes |
|---|---|---|
| Add an enum value to a **request** parameter | Non-breaking | Server accepts more inputs |
| Remove an enum value from a **request** parameter | Breaking | Previously-valid input now rejected |
| Add an enum value to a **response** field | Non-breaking, **flag** | Strict clients with a closed enum may not handle the new value |
| Remove an enum value from a **response** field | Non-breaking | Fewer possible values |

## Nullability & required (summary of the variance rule)
- Request: making something **more permissive** (optional, nullable, wider type, more enum values) is safe; **more restrictive** breaks.
- Response: making something **more guaranteed** (non-null, always present, narrower type) is safe; **less guaranteed** breaks.

## GraphQL-specific rules
GraphQL clients request exactly the fields they want, which changes the calculus:
- **Add a field to an object type**: non-breaking (clients only get fields they select).
- **Remove or rename an object field**: breaking (a selecting query errors).
- **Make an output field non-null (`T` → `T!`)**: non-breaking (stronger guarantee).
- **Make an output field nullable (`T!` → `T`)**: breaking (clients assumed non-null).
- **Add a nullable argument or input field**: non-breaking.
- **Add a non-null argument or input field, or make an existing input field non-null/required**: breaking.
- **Remove an argument / input field**: breaking.
- **Add an enum value**: breaking-ish for outputs (exhaustive client switches), flag; safe for inputs.
- **Remove an enum value**: breaking.
- **Change a field's type** (other than nullability widening/narrowing per above): breaking.

## Semver mapping
- Any row marked **Breaking** anywhere in the diff → **major** bump.
- Only **Non-breaking** additions → **minor**.
- Description/summary/example/`deprecated`-flag-only changes → **patch**.
- **Flag** rows are non-breaking by the letter of the rule but change observable behavior for strict clients, report them explicitly even when they do not force a major bump.

## Unclassifiable → default to breaking
Treat as risky and default to breaking until a human confirms: a `$ref` that now points to a different or external document; a reshuffled `oneOf`/`anyOf`/`allOf`; a schema built dynamically at runtime; a change where request/response direction cannot be determined. Never silently downgrade an unclassifiable change to non-breaking.
