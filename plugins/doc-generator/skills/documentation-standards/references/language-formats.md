# Language Documentation Formats

Detailed templates, before/after examples, and standards checklists for each supported language documentation format.

---

## JavaScript / TypeScript (JSDoc)

### Template

```javascript
/**
 * Brief one-line description starting with a verb.
 *
 * Detailed explanation of purpose, algorithm, business logic,
 * or non-obvious implementation details. Include context about
 * why this approach was chosen over alternatives.
 *
 * @param {Type} paramName - Description of the parameter
 * @param {Type} [optionalParam] - Description of optional parameter
 * @param {Type} [optionalParam=defaultValue] - Description with default
 * @param {Object} options - Description of options object
 * @param {string} options.name - Nested property description
 * @param {number} [options.limit=10] - Optional nested property
 * @returns {ReturnType} Description of what is returned
 * @throws {ErrorType} When this error condition occurs
 *
 * @example
 * // Common usage
 * const result = functionName(arg1, { name: 'test', limit: 5 });
 * console.log(result); // expected output
 *
 * @see {@link RelatedFunction} for related functionality
 * @since 1.0.0
 */
```

### Before/After Example

**Before -- inadequate documentation:**
```javascript
/**
 * Gets users
 */
async function getUsers(filters, page) {
  const query = buildQuery(filters);
  const offset = (page - 1) * PAGE_SIZE;
  const users = await db.users.findMany({ where: query, skip: offset, take: PAGE_SIZE });
  const total = await db.users.count({ where: query });
  return { users, total, page, pages: Math.ceil(total / PAGE_SIZE) };
}
```

**After -- comprehensive documentation:**
```javascript
/**
 * Fetch a paginated list of users matching the given filters.
 *
 * Query the users table with optional filtering by status, role, and
 * creation date. Results are ordered by creation date descending.
 * Uses cursor-free offset pagination suitable for admin dashboards
 * where page-jumping is required.
 *
 * @param {Object} filters - Query filter criteria
 * @param {string} [filters.status] - Filter by account status ("active", "inactive", "suspended")
 * @param {string} [filters.role] - Filter by user role ("admin", "editor", "viewer")
 * @param {Date} [filters.createdAfter] - Return only users created after this date
 * @param {number} [page=1] - Page number (1-indexed)
 * @returns {Promise<PaginatedResult<User>>} Paginated response containing:
 *   - `users` {User[]} -- array of user objects for the requested page
 *   - `total` {number} -- total number of matching users across all pages
 *   - `page` {number} -- current page number
 *   - `pages` {number} -- total number of pages
 * @throws {ValidationError} If page is less than 1 or filters contain invalid values
 * @throws {DatabaseError} If the database connection fails
 *
 * @example
 * // Fetch the first page of active users
 * const result = await getUsers({ status: 'active' }, 1);
 * console.log(result.users.length); // 20
 * console.log(result.total);        // 347
 * console.log(result.pages);        // 18
 *
 * @example
 * // Fetch all users without filters
 * const all = await getUsers({}, 1);
 *
 * @see {@link getUserById} for fetching a single user
 * @since 2.1.0
 */
```

### JSDoc Standards Checklist

- [ ] Every `@param` includes `{Type}` annotation
- [ ] Optional parameters use bracket notation `[param]`
- [ ] Default values shown as `[param=default]`
- [ ] Object parameter properties documented with dot notation (`options.prop`)
- [ ] `@returns` present for non-void functions, including Promise inner type
- [ ] `@throws` present for each exception the function can raise
- [ ] `@example` present with realistic, runnable code
- [ ] Summary line starts with a verb in present tense
- [ ] Async functions document the resolved type, not `Promise` alone

---

## Python (Google-Style Docstring)

### Template

```python
def function_name(param_name: Type, optional_param: Type = default) -> ReturnType:
    """Brief one-line description starting with a verb.

    Detailed explanation of purpose, algorithm, or business logic.
    Describe non-obvious behavior and implementation choices.

    Args:
        param_name: Description of the parameter. Include type if not
            using type annotations. Mention constraints and valid ranges.
        optional_param: Description of optional parameter.
            Defaults to default_value.

    Returns:
        Description of the return value. For complex return types,
        describe the structure:
            - key1: Description of first element
            - key2: Description of second element

    Raises:
        ValueError: When param_name is outside valid range.
        ConnectionError: When the database is unreachable.

    Example:
        >>> result = function_name("input", optional_param=42)
        >>> print(result)
        expected_output

    Note:
        Any important caveats, performance considerations,
        or thread safety warnings.

    See Also:
        related_function: Brief description of relationship.
    """
```

### Before/After Example

**Before -- inadequate documentation:**
```python
def process_order(order_id, notify=True):
    """Process an order."""
    order = Order.objects.get(id=order_id)
    if order.status != "pending":
        raise OrderError("Invalid status")
    inventory.reserve(order.items)
    payment = gateway.charge(order.total, order.payment_method)
    order.status = "confirmed"
    order.transaction_id = payment.id
    order.save()
    if notify:
        send_confirmation_email(order)
    return order
```

**After -- comprehensive documentation:**
```python
def process_order(order_id: str, notify: bool = True) -> Order:
    """Validate, charge, and confirm a pending order.

    Execute the complete order fulfillment workflow: verify the order
    is in pending status, reserve inventory for all line items, charge
    the customer through the payment gateway, and update the order
    record. Optionally send a confirmation email upon success.

    This function is NOT idempotent. Calling it twice on the same order
    raises an OrderError on the second call because the status is no
    longer "pending".

    Args:
        order_id: Unique identifier for the order (UUID format).
            Must reference an existing order in "pending" status.
        notify: Send confirmation email to the customer after
            successful processing. Defaults to True. Set to False
            for bulk imports or test scenarios.

    Returns:
        The updated Order object with status set to "confirmed"
        and transaction_id populated from the payment gateway.

    Raises:
        Order.DoesNotExist: If no order matches the given order_id.
        OrderError: If the order status is not "pending".
        InventoryError: If any line item is out of stock.
        PaymentError: If the payment gateway declines the charge
            or is unreachable.

    Example:
        >>> order = process_order("ord_a1b2c3d4")
        >>> print(order.status)
        'confirmed'
        >>> print(order.transaction_id)
        'txn_x7y8z9'

    Note:
        If payment succeeds but the database update fails, the payment
        is NOT automatically refunded. Manual reconciliation is required.
        See the ops runbook for recovery procedures.

    See Also:
        cancel_order: Reverse a confirmed order and issue a refund.
        bulk_process_orders: Process multiple orders in a single batch.
    """
```

### Python Docstring Standards Checklist

- [ ] Docstring immediately follows `def` or `class` line
- [ ] Summary line fits on one line and starts with a verb
- [ ] Blank line between summary and detailed description
- [ ] `Args:` section lists every parameter with description
- [ ] Each arg description indented with 4 additional spaces for continuation lines
- [ ] `Returns:` section describes the return value and its structure
- [ ] `Raises:` section lists every exception with its trigger condition
- [ ] `Example:` section uses `>>>` doctest format
- [ ] `Note:` section present for important caveats
- [ ] Type annotations present in the function signature (preferred over docstring types)

---

## Java (Javadoc)

### Template

```java
/**
 * Brief one-line description starting with a verb.
 *
 * <p>Detailed explanation of purpose, algorithm, or business logic.
 * Use HTML tags for formatting where needed. Describe thread safety,
 * concurrency considerations, and state management.</p>
 *
 * <p>Additional paragraphs for complex behavior, wrapped in
 * {@code <p>} tags for proper rendering.</p>
 *
 * @param paramName description of the parameter, including valid ranges
 *                  and null behavior
 * @param otherParam description of another parameter
 * @return description of the return value, including null conditions
 * @throws ExceptionType when this specific error condition occurs
 * @throws AnotherException when another error condition occurs
 * @see RelatedClass#relatedMethod(Type)
 * @since 1.0.0
 *
 * <pre>{@code
 * // Example usage
 * ReturnType result = methodName(arg1, arg2);
 * System.out.println(result);
 * }</pre>
 */
```

### Before/After Example

**Before -- inadequate documentation:**
```java
/**
 * Finds user.
 */
public User findUserByEmail(String email) throws UserNotFoundException {
    if (email == null || email.isBlank()) {
        throw new IllegalArgumentException("Email required");
    }
    String normalized = email.toLowerCase().trim();
    return userRepository.findByEmail(normalized)
        .orElseThrow(() -> new UserNotFoundException(normalized));
}
```

**After -- comprehensive documentation:**
```java
/**
 * Look up a user account by email address.
 *
 * <p>Perform a case-insensitive search for a user matching the given
 * email address. The email is normalized to lowercase and trimmed of
 * whitespace before querying. This method hits the database directly
 * and does not use the user cache.</p>
 *
 * <p>For bulk lookups, prefer {@link #findUsersByEmails(List)} which
 * executes a single batch query instead of N individual queries.</p>
 *
 * @param email the email address to search for; must not be null or blank.
 *              Matching is case-insensitive (e.g., "Alice@Example.com"
 *              matches "alice@example.com").
 * @return the User object matching the given email, never null
 * @throws IllegalArgumentException if email is null, empty, or blank
 * @throws UserNotFoundException if no user exists with the given email
 * @see #findUsersByEmails(List)
 * @see #findUserById(UUID)
 * @since 2.3.0
 *
 * <pre>{@code
 * // Look up a user by email
 * User user = userService.findUserByEmail("alice@example.com");
 * System.out.println(user.getId());    // "usr_abc123"
 * System.out.println(user.getName());  // "Alice Johnson"
 *
 * // Handle not found
 * try {
 *     userService.findUserByEmail("unknown@example.com");
 * } catch (UserNotFoundException e) {
 *     log.warn("User not found: {}", e.getEmail());
 * }
 * }</pre>
 */
```

### Javadoc Standards Checklist

- [ ] Summary sentence is a complete sentence ending with a period
- [ ] Multi-paragraph descriptions use `<p>` tags
- [ ] `@param` present for every parameter, describes null behavior
- [ ] `@return` present for non-void methods, describes null conditions
- [ ] `@throws` present for every checked and significant unchecked exception
- [ ] `@see` references use fully qualified form `Class#method(Type)`
- [ ] `@since` version tag present
- [ ] Code examples wrapped in `<pre>{@code ... }</pre>`
- [ ] HTML entities escaped properly in descriptions

---

## Go (Doc Comments)

### Template

```go
// FunctionName brief description starting with the function name.
//
// Detailed explanation of purpose, algorithm, and important behavior.
// Go doc comments are plain text paragraphs separated by blank comment
// lines. The first sentence becomes the synopsis in godoc output.
//
// The ctx parameter controls cancellation and deadlines. If ctx is
// canceled before the operation completes, the function returns
// ctx.Err() immediately.
//
// FunctionName returns ErrNotFound if the requested resource does not
// exist, or ErrPermission if the caller lacks sufficient privileges.
//
// Example usage:
//
//	result, err := FunctionName(ctx, "input-value")
//	if err != nil {
//	    log.Fatal(err)
//	}
//	fmt.Println(result)
func FunctionName(ctx context.Context, param string) (ResultType, error) {
```

### Before/After Example

**Before -- inadequate documentation:**
```go
// GetConfig gets config
func GetConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("reading config: %w", err)
    }
    var cfg Config
    if err := yaml.Unmarshal(data, &cfg); err != nil {
        return nil, fmt.Errorf("parsing config: %w", err)
    }
    if err := cfg.Validate(); err != nil {
        return nil, fmt.Errorf("validating config: %w", err)
    }
    return &cfg, nil
}
```

**After -- comprehensive documentation:**
```go
// GetConfig reads and validates a YAML configuration file from disk.
//
// The file at path is read, parsed as YAML, and validated against the
// Config schema. Environment variable references in the form ${VAR}
// are expanded before parsing. Relative paths in the config are
// resolved relative to the directory containing the config file.
//
// GetConfig returns a wrapped os.ErrNotExist if the file does not
// exist, a yaml.TypeError if the YAML is malformed, or a
// ValidationError if required fields are missing or invalid.
//
// Example usage:
//
//	cfg, err := GetConfig("/etc/myapp/config.yaml")
//	if err != nil {
//	    log.Fatalf("failed to load config: %v", err)
//	}
//	fmt.Printf("listening on %s:%d\n", cfg.Host, cfg.Port)
func GetConfig(path string) (*Config, error) {
```

### Go Doc Standards Checklist

- [ ] Comment starts with the exported name (`FunctionName does...`)
- [ ] First sentence is a complete, self-contained synopsis
- [ ] Comment is placed immediately before the declaration (no blank line)
- [ ] Paragraphs separated by blank `//` lines
- [ ] Example code indented with a tab inside the comment
- [ ] Error conditions described in prose (Go does not use `@throws` tags)
- [ ] All exported types, functions, methods, and constants have comments
- [ ] Package-level comment in `doc.go` or the primary file

---

## Rust (Rustdoc)

### Template

```rust
/// Brief one-line description starting with a verb.
///
/// Detailed explanation of purpose, algorithm, and behavior.
/// Supports full Markdown formatting including links, lists, and code blocks.
///
/// # Arguments
///
/// * `param_name` - Description of the parameter, including valid ranges
/// * `other_param` - Description of another parameter
///
/// # Returns
///
/// Description of the return value and its meaning.
///
/// # Errors
///
/// Returns `ErrorType` if the specific error condition occurs.
///
/// # Panics
///
/// Panics if the invariant is violated (describe when).
///
/// # Examples
///
/// ```
/// use my_crate::function_name;
///
/// let result = function_name("input", 42);
/// assert_eq!(result, expected_value);
/// ```
///
/// # Safety
///
/// (For unsafe functions only) Describe the invariants the caller must uphold.
pub fn function_name(param_name: &str, other_param: u32) -> Result<ReturnType, ErrorType> {
```

### Rust Standards Checklist

- [ ] Uses `///` for item documentation (not `//`)
- [ ] `# Arguments` section lists all parameters
- [ ] `# Returns` section describes the return type
- [ ] `# Errors` section describes each `Err` variant
- [ ] `# Panics` section present if the function can panic
- [ ] `# Safety` section present for all `unsafe` functions
- [ ] `# Examples` section contains compilable code (tested by `cargo test`)
- [ ] Links to related items use `[`TypeName`]` syntax

---

## C# (XML Documentation)

### Template

```csharp
/// <summary>
/// Brief one-line description starting with a verb.
/// </summary>
/// <remarks>
/// Detailed explanation of purpose, algorithm, and behavior.
/// Supports XML formatting for structured content.
/// </remarks>
/// <param name="paramName">Description of the parameter.</param>
/// <param name="otherParam">Description of another parameter.</param>
/// <returns>Description of the return value.</returns>
/// <exception cref="ExceptionType">When this error condition occurs.</exception>
/// <example>
/// <code>
/// var result = MethodName("input", 42);
/// Console.WriteLine(result);
/// </code>
/// </example>
/// <seealso cref="RelatedClass.RelatedMethod"/>
```

### C# Standards Checklist

- [ ] `<summary>` present and concise
- [ ] `<param>` present for every parameter
- [ ] `<returns>` present for non-void methods
- [ ] `<exception>` present for thrown exceptions
- [ ] `<example>` with `<code>` block for non-trivial methods
- [ ] `<remarks>` for extended explanations
- [ ] `<seealso>` for related types and methods

---

## Ruby (YARD)

### Template

```ruby
# Brief one-line description starting with a verb.
#
# Detailed explanation of purpose, algorithm, and behavior.
# YARD supports Markdown formatting in descriptions.
#
# @param name [Type] description of the parameter
# @param options [Hash] description of options hash
# @option options [String] :key description of option key
# @return [Type] description of the return value
# @raise [ErrorType] when this error condition occurs
#
# @example Basic usage
#   result = method_name("input", key: "value")
#   puts result  # => expected_output
#
# @see #related_method
# @since 1.0.0
```

### Ruby Standards Checklist

- [ ] `@param` present for all parameters with `[Type]`
- [ ] `@option` used for hash option parameters
- [ ] `@return` present with `[Type]` annotation
- [ ] `@raise` present for raised exceptions
- [ ] `@example` with descriptive title and runnable code
- [ ] `@see` for related methods

---

## PHP (PHPDoc)

### Template

```php
/**
 * Brief one-line description starting with a verb.
 *
 * Detailed explanation of purpose, algorithm, and behavior.
 *
 * @param Type $paramName Description of the parameter
 * @param Type|null $optionalParam Description of optional parameter
 * @return ReturnType Description of the return value
 * @throws ExceptionType When this error condition occurs
 *
 * @example
 * $result = functionName('input', null);
 * echo $result; // expected output
 *
 * @see RelatedClass::relatedMethod()
 * @since 1.0.0
 */
```

### PHP Standards Checklist

- [ ] `@param` present for all parameters with type before `$name`
- [ ] Nullable types annotated as `Type|null`
- [ ] `@return` present with type annotation
- [ ] `@throws` present for thrown exceptions
- [ ] `@var` used for class property documentation
- [ ] `@example` with realistic usage
