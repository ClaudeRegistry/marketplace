# OWASP Top 10 — Detection Patterns

## A01:2021 — Broken Access Control

**What to find:**
- Missing authorization checks on endpoints/routes
- Insecure Direct Object References (predictable IDs without ownership checks)
- Path traversal (../ in file operations)
- CORS misconfiguration (wildcard origins)
- Missing function-level access control
- Privilege escalation paths (horizontal and vertical)

**Detection patterns (regex):**
- Endpoints without auth middleware/decorators
- Direct database ID usage from user input without ownership verification
- File operations using user-controlled paths without sanitization
- CORS configuration with `*` origin

## A02:2021 — Cryptographic Failures

**What to find:**
- Sensitive data transmitted in plaintext
- Weak or deprecated algorithms (MD5, SHA1, DES, RC4, ECB mode)
- Hardcoded encryption keys or IVs
- Missing encryption for sensitive data at rest
- Weak key derivation functions
- Insufficient key length (<2048 RSA, <256 AES)

**Detection patterns:**
- Usage of MD5, SHA1 for password hashing
- DES, 3DES, RC4 algorithm references
- ECB mode usage
- Hardcoded strings assigned to variables named *key*, *secret*, *iv*, *salt*
- Non-cryptographic random generators used for security purposes

## A03:2021 — Injection

**What to find:**
- SQL injection (string concatenation in queries)
- Command injection (user input in system calls)
- LDAP injection (unescaped search filters)
- NoSQL injection (unsanitized query objects)
- Template injection (user input in template engines)
- XPath/XML injection (XXE, unvalidated XML parsing)

**Detection patterns:**
- String concatenation/interpolation in SQL queries
- User input passed to shell execution functions
- Unsanitized input in ORM raw/native queries
- XML parsers without external entity disabled

## A04:2021 — Insecure Design

**What to find:**
- Missing rate limiting on sensitive operations
- No account lockout after failed attempts
- Missing CAPTCHA on public forms
- Business logic flaws (price manipulation, quantity overflow)
- Insufficient workflow validation

## A05:2021 — Security Misconfiguration

**What to find:**
- Debug mode enabled in production configs
- Default credentials or sample accounts
- Unnecessary features/services enabled
- Missing security headers (CSP, HSTS, X-Frame-Options)
- Verbose error messages exposing internals
- Directory listing enabled
- Unnecessary HTTP methods enabled

## A06:2021 — Vulnerable and Outdated Components

**What to find:**
- Dependencies with known CVEs
- End-of-life frameworks or libraries
- Missing dependency lock files
- No automated dependency update process
- Vulnerable transitive dependencies

**Detection approach:**
- Parse package manifests (package.json, pom.xml, requirements.txt, go.mod, Gemfile, *.csproj, Cargo.toml)
- Cross-reference versions against known vulnerability databases
- Check for lock file presence and consistency

## A07:2021 — Identification and Authentication Failures

**What to find:**
- Weak password policies (no complexity, short minimum length)
- Missing brute force protection
- Session fixation (session ID not regenerated after login)
- Credentials in URLs
- Plaintext password storage
- Weak password recovery mechanisms

## A08:2021 — Software and Data Integrity Failures

**What to find:**
- Unsafe deserialization of untrusted data
- Missing integrity verification for downloads/updates
- Insecure CI/CD pipeline (unsigned artifacts)
- Auto-update without signature verification

## A09:2021 — Security Logging and Monitoring Failures

**What to find:**
- Insufficient logging of auth events (login, failed attempts, privilege changes)
- Sensitive data in logs (passwords, tokens, PII)
- Missing audit trail for critical operations
- No log integrity protection
- Logs not monitored or alerting configured

## A10:2021 — Server-Side Request Forgery (SSRF)

**What to find:**
- User-controlled URLs passed to HTTP clients without validation
- URL fetching without allowlist/denylist
- DNS rebinding vulnerability potential
- Cloud metadata endpoint access (169.254.169.254)
