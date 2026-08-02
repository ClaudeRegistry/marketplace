# Access-token validation (copy-adaptable)

The rule: **validate every request**, and bind the **audience to this server**. Everything else (signature, issuer, expiry, scope) is table stakes; the audience check is what stops the confused deputy.

## Node (jose)
```ts
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(new URL(process.env.AS_JWKS_URL!)); // cached + rotated
const ISSUER = process.env.AS_ISSUER!;          // e.g. https://login.example.com
const AUDIENCE = process.env.MCP_RESOURCE_URL!; // THIS server's identifier

export async function requireAuth(req, requiredScope: string) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "missing bearer token");

  let payload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,           // ❗ must equal this server; rejects tokens minted for others
      clockTolerance: 60,           // seconds of skew for exp/nbf
    }));
  } catch {
    throw new HttpError(401, "invalid or expired token");
  }

  const scopes = String(payload.scope ?? "").split(" ");
  if (!scopes.includes(requiredScope)) throw new HttpError(403, "insufficient scope");
  return payload; // do NOT reuse this token for downstream calls
}
```

## Python (PyJWT + PyJWKClient)
```python
import jwt
from jwt import PyJWKClient

jwks = PyJWKClient(os.environ["AS_JWKS_URL"])
ISSUER = os.environ["AS_ISSUER"]
AUDIENCE = os.environ["MCP_RESOURCE_URL"]  # this server's identifier

def require_auth(authorization: str, required_scope: str) -> dict:
    if not authorization.startswith("Bearer "):
        raise HttpError(401, "missing bearer token")
    token = authorization[7:]
    key = jwks.get_signing_key_from_jwt(token).key
    try:
        payload = jwt.decode(
            token, key, algorithms=["RS256"],
            issuer=ISSUER, audience=AUDIENCE, leeway=60,  # ❗ audience bound to this server
        )
    except jwt.PyJWTError:
        raise HttpError(401, "invalid or expired token")
    if required_scope not in payload.get("scope", "").split():
        raise HttpError(403, "insufficient scope")
    return payload
```

## Checklist per request
- [ ] Signature verified against the AS JWKS (keys cached, rotation honored).
- [ ] `iss` == trusted authorization server.
- [ ] `aud` == this MCP server's resource identifier. **Not optional.**
- [ ] `exp`/`nbf` valid within a small clock skew.
- [ ] Algorithm pinned (e.g. `RS256`); `alg: none` rejected.
- [ ] Required scope for the specific tool present; else `403`.
- [ ] The validated token is **not** forwarded to any downstream API.

## The confused-deputy test (for `/mcp-audit`)
Ask: "If I mint a token for a *different* audience with the same AS, does this server accept it?" If the code does not compare `aud` to this server's identifier, the answer is yes, that is a critical finding. `jwtVerify(..., { audience })` / `jwt.decode(..., audience=...)` performs the check; a hand-rolled decode that skips it does not.
