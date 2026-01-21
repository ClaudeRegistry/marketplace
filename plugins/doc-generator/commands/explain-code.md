---
description: Add clear, inline explanatory comments to complex code sections to improve readability and understanding
argument-hint: [file-path or function-name]
model: inherit
---

# Code Explanation Command

You are tasked with adding clear, helpful inline comments to complex code to improve readability and understanding. Focus on explaining the "why" behind code decisions, not just the "what".

## Step 1: Identify Target Code

**If the user provided a specific file or function:**
- Read the specified file(s) or function(s)
- Analyze the code complexity

**If no target specified:**
- Ask which code section needs explanation, OR
- Scan for complex code that would benefit from explanation:
  - Functions >30 lines without comments
  - High cyclomatic complexity (many branches)
  - Complex algorithms or data structures
  - Non-obvious business logic
  - Performance-critical sections
  - Regex patterns
  - Bit manipulation or math operations

## Step 2: Analyze Code Complexity

Identify sections that need explanation:

### High Priority (Must Explain):
- **Complex Algorithms**: Sorting, searching, graph traversal, dynamic programming
- **Business Logic**: Domain-specific rules, calculations, workflows
- **Regex Patterns**: Any regular expression
- **Bitwise Operations**: Bit manipulation, flags, masks
- **Performance Optimizations**: Caching, memoization, lazy loading
- **Edge Case Handling**: Special conditions, boundary checks
- **State Management**: Complex state transitions
- **Async/Concurrency**: Promise chains, async/await patterns, race conditions
- **Type Coercion**: Implicit type conversions
- **Magic Numbers**: Unexplained constants

### Medium Priority (Should Explain):
- **Data Transformations**: Map/reduce operations, data reshaping
- **Conditional Logic**: Complex if/else chains
- **Loop Logic**: Non-trivial iterations
- **Error Handling**: Try/catch blocks, error recovery
- **Integration Points**: External API calls, database queries
- **Configuration**: Environment-dependent behavior

### Low Priority (Nice to Explain):
- **Variable Purposes**: What each variable represents
- **Function Flow**: Overall execution path
- **Assumptions**: Prerequisites or invariants

## Step 3: Write Clear, Helpful Comments

Follow these principles:

### Explain the "Why", Not the "What":

**Bad (explains what code does):**
```javascript
// Loop through users
for (let i = 0; i < users.length; i++) {
  // Check if user is active
  if (users[i].isActive) {
    // Add to active users array
    activeUsers.push(users[i]);
  }
}
```

**Good (explains why and adds context):**
```javascript
// Filter for active users only - inactive users should not receive
// notifications per GDPR requirements (ticket #1234)
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) {
    activeUsers.push(users[i]);
  }
}
```

### Explain Complex Algorithms:

**Before:**
```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
```

**After:**
```python
def quicksort(arr):
    """
    Quicksort implementation using the Hoare partition scheme.
    Time complexity: O(n log n) average, O(n²) worst case
    Space complexity: O(log n) due to recursion stack
    """
    # Base case: arrays with 0 or 1 elements are already sorted
    if len(arr) <= 1:
        return arr

    # Choose middle element as pivot to avoid worst-case O(n²) on sorted arrays.
    # Alternative: use median-of-three for better pivot selection.
    pivot = arr[len(arr) // 2]

    # Partition: elements less than pivot go left, greater go right,
    # equal values grouped in middle (3-way partitioning for efficiency with duplicates)
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]  # Handles duplicates efficiently
    right = [x for x in arr if x > pivot]

    # Recursively sort partitions and combine results
    return quicksort(left) + middle + quicksort(right)
```

### Explain Business Logic:

**Before:**
```typescript
function calculateDiscount(price: number, quantity: number): number {
  if (quantity >= 100) {
    return price * 0.85;
  } else if (quantity >= 50) {
    return price * 0.90;
  } else if (quantity >= 10) {
    return price * 0.95;
  }
  return price;
}
```

**After:**
```typescript
/**
 * Calculate volume-based discount pricing
 * Business rules from pricing policy v2.3 (approved Q4 2023)
 */
function calculateDiscount(price: number, quantity: number): number {
  // Enterprise tier: 100+ units get 15% discount
  // Targets large B2B customers, minimum $10K order value
  if (quantity >= 100) {
    return price * 0.85;
  }
  // Business tier: 50-99 units get 10% discount
  // Targets mid-size companies, standard pricing tier
  else if (quantity >= 50) {
    return price * 0.90;
  }
  // Starter tier: 10-49 units get 5% discount
  // Encourages bulk purchases from SMBs
  else if (quantity >= 10) {
    return price * 0.95;
  }

  // Retail pricing: <10 units (no discount)
  return price;
}
```

### Explain Regex Patterns:

**Before:**
```python
pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
```

**After:**
```python
# Email validation regex (RFC 5322 simplified):
# ^[a-zA-Z0-9._%+-]+   - Local part: letters, numbers, and special chars
# @                     - Required @ symbol
# [a-zA-Z0-9.-]+        - Domain name: letters, numbers, hyphens, dots
# \.                    - Required dot before TLD
# [a-zA-Z]{2,}$         - TLD: minimum 2 letters (e.g., .com, .io)
#
# Note: This is a simplified pattern. For production, consider using
# a validation library or the more complete RFC 5322 regex.
pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
```

### Explain Performance Optimizations:

**Before:**
```javascript
const memo = {};
function fibonacci(n) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibonacci(n - 1) + fibonacci(n - 2);
  return memo[n];
}
```

**After:**
```javascript
// Memoization cache: stores previously computed Fibonacci numbers
// Reduces time complexity from O(2^n) to O(n)
// Space complexity: O(n) for the memo cache
const memo = {};

function fibonacci(n) {
  // Return cached result if already computed (memoization)
  // Critical for performance: prevents redundant recursive calls
  if (n in memo) return memo[n];

  // Base cases: fib(0) = 0, fib(1) = 1
  if (n <= 1) return n;

  // Compute and cache the result before returning
  // Store in memo to avoid recomputation in future calls
  memo[n] = fibonacci(n - 1) + fibonacci(n - 2);
  return memo[n];
}
```

### Explain Edge Cases:

**Before:**
```go
func divide(a, b float64) float64 {
    if b == 0 {
        return math.Inf(1)
    }
    return a / b
}
```

**After:**
```go
func divide(a, b float64) float64 {
    // Handle division by zero: return positive infinity instead of panic
    // Matches IEEE 754 floating-point standard behavior
    // Alternative approaches considered:
    // - Return error: rejected (adds complexity for common case)
    // - Return NaN: rejected (infinity is more intuitive for callers)
    // - Panic: rejected (should be exceptional, not common path)
    if b == 0 {
        return math.Inf(1)
    }

    // Standard division for non-zero divisor
    return a / b
}
```

### Explain Magic Numbers:

**Before:**
```java
if (age >= 18 && age < 65) {
    premium = baseRate * 1.2;
}
```

**After:**
```java
// Age-based premium calculation per actuarial tables 2024
final int ADULT_AGE_MIN = 18;        // Legal adult age (US standard)
final int SENIOR_AGE_MIN = 65;       // Senior citizen threshold
final double ADULT_RATE_MULTIPLIER = 1.2;  // 20% premium for working-age adults

// Working-age adults (18-64) pay higher premiums due to:
// - Higher coverage limits
// - More expensive medical procedures in this age group
// - Actuarial risk assessment (see doc/insurance-rates-2024.pdf)
if (age >= ADULT_AGE_MIN && age < SENIOR_AGE_MIN) {
    premium = baseRate * ADULT_RATE_MULTIPLIER;
}
```

## Step 4: Add Different Types of Comments

Use appropriate comment types:

### Block Comments (for complex sections):
```python
"""
Authentication Flow:
1. Validate user credentials against database
2. Check if account is active and not locked
3. Verify MFA token if enabled
4. Generate JWT with user claims
5. Store refresh token in Redis (24h expiration)
6. Log successful login for audit trail

Error handling:
- Invalid credentials: return 401
- Locked account: return 403 with unlock instructions
- MFA failure: return 403 with retry count
- System error: return 500 and alert ops team
"""
def authenticate_user(email, password, mfa_token=None):
    # Implementation
```

### Inline Comments (for specific lines):
```javascript
const normalizedEmail = email.toLowerCase().trim();  // Emails are case-insensitive per RFC 5321
const hashedPassword = await bcrypt.hash(password, 12);  // 12 rounds = 2^12 iterations (OWASP recommendation)
const userId = uuidv4();  // UUIDv4 for globally unique, non-sequential IDs (security best practice)
```

### Section Comments (for logical blocks):
```rust
// ============================================================
// VALIDATION PHASE
// Validate all inputs before making any state changes.
// Fail fast if any validation error is detected.
// ============================================================
if username.is_empty() {
    return Err(ValidationError::EmptyUsername);
}

// ============================================================
// DATABASE TRANSACTION
// All database operations must succeed or rollback entirely.
// Use transaction to maintain data consistency.
// ============================================================
let mut transaction = pool.begin().await?;
// ... database operations

// ============================================================
// POST-PROCESSING
// Send notifications and update caches after successful commit.
// These are non-critical operations that can fail independently.
// ============================================================
notify_user(user_id).await.ok();  // Ignore notification failures
```

### TODO/FIXME Comments (for known issues):
```typescript
// TODO: Implement exponential backoff for retries (ticket #5678)
// Current implementation uses fixed 1s delay, which can overwhelm
// the service during outages. Exponential backoff would be more resilient.
await sleep(1000);

// FIXME: This function has O(n²) complexity and becomes slow for large datasets
// Consider using a hash map for O(n) lookups instead (performance issue #234)
for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
        // ...
    }
}

// HACK: Temporary workaround for upstream API bug (vendor ticket #9012)
// Remove this once the vendor fixes their rate limiting headers
// Expected fix date: Q1 2024
if (response.headers['x-rate-limit'] === undefined) {
    response.headers['x-rate-limit'] = '1000';
}
```

## Step 5: Add Comments at the Right Level

Choose appropriate detail level:

### Function-Level (high-level purpose):
```python
def process_order(order_id):
    """
    Process a pending order through the complete fulfillment workflow.

    This is the main order processing function that orchestrates:
    - Inventory verification and reservation
    - Payment processing and fraud detection
    - Shipping label generation
    - Customer notification
    - Warehouse fulfillment queue

    Designed to be idempotent: safe to retry on failure.
    """
```

### Block-Level (what this section does):
```python
    # Inventory Management
    # Check stock levels and reserve items for this order.
    # If any item is out of stock, entire order is placed on backorder.
    for item in order.items:
        if not inventory.check_availability(item):
            order.status = 'BACKORDERED'
            return
        inventory.reserve(item, order_id)
```

### Line-Level (why this specific line):
```python
    time.sleep(0.1)  # Rate limiting: 10 req/sec to avoid triggering API throttle
```

## Step 6: Apply Comments to Code

Using the Edit tool:

1. **Read the target file** to understand context
2. **Identify complex sections** needing explanation
3. **Write clear comments** following the guidelines above
4. **Insert comments** at appropriate locations
5. **Preserve formatting** and indentation
6. **Do not modify** code logic

## Step 7: Generate Summary Report

```markdown
✅ Code Explanations Added Successfully

Files Updated: [X]
Comments Added: [Y]

Summary by Category:
├─ Algorithm Explanations: [X]
├─ Business Logic Clarifications: [X]
├─ Performance Notes: [X]
├─ Edge Case Documentation: [X]
├─ Regex Explanations: [X]
└─ Magic Number Definitions: [X]

Files Modified:

## [FileName.ext]

### function1() (lines 45-120)
**Comments Added:**
- Algorithm explanation (quicksort implementation)
- Time/space complexity analysis
- Partition strategy rationale

**Before:** 0 comments
**After:** 8 explanatory comments

### function2() (lines 200-250)
**Comments Added:**
- Business logic explanation (discount tiers)
- Magic number definitions
- Policy version reference

**Before:** 2 basic comments
**After:** 10 comprehensive comments

---

Readability Improvements:
✓ Complex algorithms now documented
✓ Business rules clearly explained
✓ Magic numbers replaced with named constants
✓ Edge cases documented
✓ Performance considerations noted

Code Quality:
- Comments explain "why", not "what"
- Links to related documentation added
- Known issues flagged (TODO/FIXME)
- Assumptions and invariants stated

Next Steps:
1. Review comments for accuracy
2. Share with team for feedback
3. Update onboarding docs with key concepts
4. Consider extracting complex sections into separate functions
```

## Important Guidelines:

### DO:
- Explain WHY, not WHAT
- Focus on non-obvious code
- Explain business context and decisions
- Document performance considerations
- Link to external resources (tickets, docs, RFCs)
- Use clear, concise language
- Break down complex regex patterns
- Explain magic numbers
- Document assumptions and invariants

### DO NOT:
- State the obvious ("increment i")
- Repeat what the code clearly shows
- Write novels - keep comments concise
- Add comments to simple, self-explanatory code
- Use jargon without explanation
- Modify the actual code logic
- Over-comment straightforward code

### Comment Frequency:
- **Complex code**: Every few lines
- **Moderate code**: Every 5-10 lines
- **Simple code**: Function-level comment only

---

Begin by identifying complex code sections, then add clear, helpful comments that improve understanding without cluttering the code.
