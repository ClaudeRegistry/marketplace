# Security Vulnerability Patterns — Language Agnostic

## Injection Patterns

### SQL Injection Indicators
```
# String concatenation in queries
"SELECT * FROM " + table
"WHERE id = " + userId
f"DELETE FROM users WHERE id = {user_id}"
`UPDATE ${table} SET ${column} = ${value}`
"INSERT INTO users VALUES ('" + name + "')"
```

**Safe alternatives:** Parameterized queries, prepared statements, ORM query builders with bind parameters.

### Command Injection Indicators
```
# User input in shell execution
exec(userInput)
system(command + userArg)
subprocess.call(shell=True, cmd=userInput)
child_process.exec(userCommand)
Runtime.exec(userCommand)
os.system(userInput)
```

**Safe alternatives:** Allowlists, parameterized commands, avoiding shell execution.

### Template Injection Indicators
```
# User input in templates
render_template_string(userInput)
new Function(userInput)
eval(userTemplate)
Handlebars.compile(userInput)
```

## Authentication Weaknesses

### Hardcoded Credentials Pattern
```
# Variables/constants containing credentials
password = "admin123"
API_KEY = "sk-1234567890"
token = "hardcoded-jwt-token"
private_key = "-----BEGIN RSA PRIVATE KEY-----"
db_password: "root"
```

**Detection:** Grep for variable names matching: password, secret, key, token, credential, api_key, apikey, auth_token, private_key, access_key — with string literal assignments.

### Weak Session Management
- Session tokens in URLs (GET parameters)
- Missing Secure/HttpOnly flags on auth cookies
- No session timeout configuration
- Session ID not regenerated after authentication
- Predictable session token generation

## Data Exposure Patterns

### Sensitive Data in Logs
```
# Logging credentials or PII
log.info("User login: " + email + " password: " + password)
logger.debug(f"Payment card: {card_number}")
console.log("Token:", authToken)
print(f"SSN: {user.ssn}")
```

### Debug/Development Mode in Production
```
# Debug mode indicators
DEBUG = True
debug: true
app.debug = true
FLASK_ENV = "development"
NODE_ENV !== "production" (when not checking)
```

## Cryptographic Weaknesses

### Weak Algorithms
| Algorithm | Status | Replacement |
|-----------|--------|-------------|
| MD5 | Broken | SHA-256, SHA-3, bcrypt (passwords) |
| SHA1 | Deprecated | SHA-256, SHA-3 |
| DES | Broken | AES-256 |
| 3DES | Deprecated | AES-256 |
| RC4 | Broken | AES-GCM, ChaCha20 |
| ECB mode | Insecure | CBC, GCM, CTR |
| RSA <2048 | Weak | RSA-2048+ or ECDSA |

### Insecure Randomness
```
# Non-cryptographic RNG for security
Math.random()                    # JavaScript
random.random()                  # Python
java.util.Random                 # Java
rand()                          # C/PHP
```

**Safe alternatives:** crypto.randomBytes, secrets module, SecureRandom, os.urandom.

## Web Security Patterns

### XSS Indicators
```
# Direct HTML injection
innerHTML = userInput
dangerouslySetInnerHTML={{__html: userInput}}
v-html="userInput"
document.write(userInput)
$(element).html(userInput)
Response.Write(userInput)  # ASP.NET
```

### CSRF Indicators
- State-changing operations (POST/PUT/DELETE) without CSRF tokens
- CSRF protection explicitly disabled
- Missing SameSite cookie attribute
- Form submissions without anti-forgery tokens

### SSRF Indicators
```
# User-controlled URL fetching
requests.get(userUrl)
fetch(userUrl)
HttpClient.GetAsync(userUrl)
URL.openConnection()  # with user input
curl_exec($ch)       # with user URL
```

## Resource Management

### Resource Leak Patterns
```
# Opened resources without close/cleanup
file = open(path)          # no close() or context manager
conn = db.connect()        # no close() in finally
stream = fs.createReadStream()  # no error/close handling
```

**Safe patterns:** try-with-resources, context managers (with), defer, using statements, finally blocks.

### Unbounded Collection Growth
```
# Static/global collections that grow indefinitely
static cache = []
global_registry = {}
event_listeners.push(handler)  # without removal
```
