# OAuth 2.1 / OIDC patterns for MCP resource servers

## Discovery + challenge flow
```
1. Client calls the MCP server with no / an invalid token.
2. Server → 401 with:
     WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"
3. Client fetches that metadata, finds the authorization server(s).
4. Client runs OAuth 2.1 Authorization Code + PKCE against the AS, requesting an
   audience/resource of the MCP server.
5. Client retries the MCP request with the access token.
6. Server validates (signature, iss, aud == this server, exp, scope) and serves.
```

## Protected Resource Metadata (RFC 9728)
Serve at `/.well-known/oauth-protected-resource`:
```json
{
  "resource": "https://mcp.example.com",
  "authorization_servers": ["https://login.example.com"],
  "scopes_supported": ["mcp:read", "mcp:write"],
  "bearer_methods_supported": ["header"]
}
```
The `resource` value is what tokens must carry as their audience. Clients use `authorization_servers` to find where to authenticate.

## Downstream calls: exchange, do not pass through
When a tool must call a downstream API on the user's behalf:

WRONG (passthrough, confused deputy waiting to happen):
```ts
const incoming = req.headers.authorization;         // token for THIS server
await fetch("https://api.github.com/...", { headers: { Authorization: incoming } }); // ❌ reused
```

RIGHT (the RS holds its own credential, or exchanges the token for the downstream audience):
```ts
// Option A: the server's own machine credential / installation token
const ghToken = await getServerGithubToken();       // minted for GitHub, not the incoming token
// Option B: RFC 8693 token exchange for the downstream audience
const downstream = await exchangeToken({
  subjectToken: incoming, audience: "https://api.github.com", scope: "repo:read",
});
await fetch("https://api.github.com/...", { headers: { Authorization: `Bearer ${downstream}` } });
```

## Per-IdP notes
- **Microsoft Entra ID**: register the MCP server as an API with an Application ID URI; that URI is the `aud`. Validate against `https://login.microsoftonline.com/{tenant}/v2.0` issuer and its JWKS. Use `roles`/`scp` for scope.
- **Okta**: create a custom authorization server; `aud` is the API audience you configure. Validate `iss` = the Okta issuer URL, scopes in `scp`.
- **Auth0**: define an API with an identifier (the `aud`); tokens are RS256, JWKS at `/.well-known/jwks.json`. Scopes/permissions in `scope`/`permissions`.
- **Keycloak**: realm issuer `.../realms/{realm}`; set the client as a bearer-only resource; audience via a mapper. Roles in `realm_access`/`resource_access`.

## Common mistakes an audit flags
- Accepting a token because it is a valid JWT, without checking `aud` (confused deputy).
- Forwarding `req.headers.authorization` to any downstream service (passthrough).
- No `/.well-known/oauth-protected-resource`, clients cannot discover the AS.
- Validating `exp` but not signature (or trusting `alg: none`).
- One coarse scope for all tools instead of per-action least privilege.
- Caching the validated identity on a transport/session and reusing it for the next request (breaks statelessness and can cross users).
