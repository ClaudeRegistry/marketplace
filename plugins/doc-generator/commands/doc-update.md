---
description: Update existing documentation to match current code implementation, fixing drift and outdated information
argument-hint: [file-path]
model: inherit
---

# Documentation Update Command

You are tasked with updating existing documentation to accurately reflect the current code implementation. Fix documentation drift, update outdated information, and ensure consistency between docs and code.

## Step 1: Identify Target Files

**If the user provided a specific file:**
- Read the specified file
- Analyze existing documentation
- Compare with actual implementation

**If no file specified:**
- Ask user which documentation needs updating, OR
- Run a quick scan to find files with obvious documentation drift
- Suggest files that likely need updates (recently modified code with old doc comments)

## Step 2: Analyze Current Documentation

For each file, examine:

### Existing Documentation:
- Read all existing doc comments (JSDoc, docstrings, Javadoc, etc.)
- Identify documented functions, classes, and parameters
- Note the documentation style and format used
- Check timestamps or "last updated" markers if present

### Current Code Implementation:
- Read the actual function/class implementations
- Extract current parameter lists
- Identify current return types
- Understand current behavior and side effects
- Detect any new functionality added since docs were written

## Step 3: Identify Documentation Drift

Compare documentation against implementation to find:

### Parameter Mismatches:
```
DRIFT DETECTED in getUserById():

Documentation says:
@param {string} id - User ID
@param {boolean} includeDeleted - Include deleted users

Current implementation:
function getUserById(id, options = {}) {
  // options: { includeDeleted, includeInactive, fields }
}

Issues:
- Parameter 2 changed from boolean to options object
- New option 'includeInactive' not documented
- New option 'fields' not documented
```

### Return Type Mismatches:
```
DRIFT DETECTED in fetchUserData():

Documentation says:
@returns {User} User object

Current implementation:
async function fetchUserData(id) {
  // Returns Promise<User | null>
}

Issues:
- Missing async/Promise documentation
- Doesn't document null case (user not found)
```

### Behavioral Changes:
```
DRIFT DETECTED in createOrder():

Documentation says:
"Creates an order and returns the order ID"

Current implementation:
- Now also sends confirmation email
- Updates inventory
- Publishes event to message queue

Issues:
- Side effects not documented
- Async behavior not mentioned
- Event publishing not documented
```

### Missing Documentation:
```
NEW CODE without documentation:

function calculateShippingCost(order, destination) {
  // 50 lines of complex logic
  // No documentation at all
}
```

## Step 4: Update Documentation Systematically

For each documentation issue:

### Fix Parameter Documentation:

**Before:**
```javascript
/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {User} User object
 */
function getUser(id, options) {
  // implementation
}
```

**After:**
```javascript
/**
 * Get user by ID with optional filtering
 *
 * @param {string} id - Unique user identifier
 * @param {Object} [options] - Optional query options
 * @param {boolean} [options.includeDeleted=false] - Include soft-deleted users
 * @param {boolean} [options.includeInactive=false] - Include inactive users
 * @param {string[]} [options.fields] - Specific fields to return
 * @returns {Promise<User|null>} User object or null if not found
 * @throws {ValidationError} If id is invalid
 */
async function getUser(id, options = {}) {
  // implementation
}
```

### Add Missing Documentation:

**Before:**
```python
def process_payment(order_id, payment_method):
    # Complex payment processing logic
    pass
```

**After:**
```python
def process_payment(order_id: str, payment_method: PaymentMethod) -> PaymentResult:
    """Process payment for an order.

    Validates the payment method, charges the customer through the payment
    gateway, and updates the order status. If payment fails, the function
    will retry up to 3 times with exponential backoff.

    Args:
        order_id: Unique identifier for the order
        payment_method: Payment method containing card/account details

    Returns:
        PaymentResult: Object containing transaction_id, status, and amount

    Raises:
        InvalidOrderError: If order_id doesn't exist or order is already paid
        PaymentDeclinedError: If payment is declined by the gateway
        PaymentGatewayError: If payment gateway is unavailable

    Example:
        >>> result = process_payment("ord_123", payment_method)
        >>> print(result.status)
        'success'
        >>> print(result.transaction_id)
        'txn_abc456'

    Note:
        This function is idempotent - calling it multiple times with the
        same order_id will return the existing payment result.
    """
    # Complex payment processing logic
    pass
```

### Update Return Type Documentation:

**Before:**
```typescript
/**
 * Fetch users from database
 * @returns Array of users
 */
async function fetchUsers(): Promise<User[]> {
```

**After:**
```typescript
/**
 * Fetch users from database with pagination
 *
 * @param page - Page number (1-indexed)
 * @param limit - Number of users per page (max 100)
 * @param filters - Optional filters
 * @returns Promise resolving to paginated user data
 * @returns {Object} result
 * @returns {User[]} result.data - Array of user objects
 * @returns {number} result.total - Total number of users
 * @returns {number} result.page - Current page number
 * @returns {number} result.pages - Total number of pages
 * @throws {ValidationError} If page or limit is invalid
 */
async function fetchUsers(
  page: number = 1,
  limit: number = 20,
  filters?: UserFilters
): Promise<PaginatedResponse<User>> {
```

### Document Side Effects:

**Before:**
```java
/**
 * Updates user email address
 * @param userId User ID
 * @param newEmail New email address
 */
public void updateUserEmail(String userId, String newEmail) {
```

**After:**
```java
/**
 * Updates user email address and triggers verification workflow.
 *
 * <p>This method performs the following operations:
 * <ul>
 *   <li>Validates the new email format</li>
 *   <li>Checks if email is already in use</li>
 *   <li>Updates the user record in the database</li>
 *   <li>Sends verification email to the new address</li>
 *   <li>Logs the email change in audit log</li>
 *   <li>Invalidates existing sessions</li>
 *   <li>Publishes UserEmailChanged event</li>
 * </ul>
 *
 * @param userId Unique identifier of the user
 * @param newEmail New email address (must be valid format)
 * @throws UserNotFoundException if user doesn't exist
 * @throws EmailAlreadyExistsException if email is already registered
 * @throws InvalidEmailFormatException if email format is invalid
 *
 * @since 2.0.0
 */
public void updateUserEmail(String userId, String newEmail) {
```

## Step 5: Improve Documentation Quality

While updating, also enhance documentation:

### Add Examples:
```javascript
/**
 * Filter array of users by criteria
 *
 * @param {User[]} users - Array of user objects
 * @param {Object} criteria - Filter criteria
 * @returns {User[]} Filtered users
 *
 * @example
 * // Filter active users
 * const activeUsers = filterUsers(users, { isActive: true });
 *
 * @example
 * // Filter by role and status
 * const admins = filterUsers(users, {
 *   role: 'admin',
 *   isActive: true
 * });
 *
 * @example
 * // Empty criteria returns all users
 * const allUsers = filterUsers(users, {});
 */
```

### Add Performance Notes:
```python
def find_users_by_name(name: str) -> List[User]:
    """Find users by name using full-text search.

    This function performs a case-insensitive search across user first
    and last names using database full-text search capabilities.

    Args:
        name: Search query string (minimum 2 characters)

    Returns:
        List of matching User objects, ordered by relevance

    Performance:
        - Time complexity: O(log n) due to indexed search
        - Returns results in <100ms for databases up to 1M users
        - Uses database connection pool (max 10 concurrent connections)
        - Results are cached for 5 minutes

    Note:
        For searches on very large datasets (>10M users), consider
        using the async version find_users_by_name_async() instead.
    """
```

### Add "See Also" References:
```go
// UpdateUserProfile updates the user's profile information.
//
// This function validates all input fields, updates the database record,
// and clears relevant caches. Profile updates are logged for audit purposes.
//
// Parameters:
//   - userID: The unique identifier of the user
//   - profile: The updated profile data
//
// Returns:
//   - *User: The updated user object
//   - error: Any error that occurred during the update
//
// See Also:
//   - UpdateUserEmail: For updating email specifically (includes verification)
//   - UpdateUserPassword: For updating password (includes security checks)
//   - GetUserProfile: For retrieving current profile data
//
// Example:
//   profile := &UserProfile{Name: "John Doe", Bio: "Developer"}
//   user, err := UpdateUserProfile("user123", profile)
//   if err != nil {
//       log.Fatal(err)
//   }
```

## Step 6: Update Related Documentation

Check and update related documentation:

### README.md:
- Update API examples if function signatures changed
- Update installation steps if dependencies changed
- Update version requirements

### API Documentation:
- Update OpenAPI/Swagger specs
- Update request/response examples
- Update error codes if changed

### Changelog:
- Add entry for breaking changes
- Document new parameters or behavior

### Migration Guides:
- If breaking changes detected, suggest migration guide
- Show before/after examples

## Step 7: Preserve Documentation Style

Maintain consistency:

- Use the same documentation format (JSDoc, Google style, NumPy style, etc.)
- Match the existing tone and verbosity level
- Keep the same parameter order as in existing docs
- Preserve custom sections or tags used in the project

## Step 8: Validate Updated Documentation

Ensure quality:

### Completeness Check:
- [ ] All parameters documented
- [ ] All return values documented
- [ ] All exceptions/errors documented
- [ ] At least one example provided
- [ ] Side effects documented
- [ ] Performance considerations noted (if applicable)

### Accuracy Check:
- [ ] Parameter types match implementation
- [ ] Parameter names match function signature
- [ ] Return type matches actual return
- [ ] Examples are runnable and correct
- [ ] Error conditions are accurate

### Consistency Check:
- [ ] Terminology matches project conventions
- [ ] Format matches project style guide
- [ ] Related functions cross-referenced
- [ ] Version tags updated if applicable

## Step 9: Apply Updates to Files

Using the Edit tool:

1. **Read the target file** to get exact line numbers
2. **Locate documentation blocks** to update
3. **Preserve code indentation** and formatting
4. **Replace old documentation** with updated version
5. **Verify no code logic** was modified

## Step 10: Generate Update Report

Provide summary of changes:

```markdown
✅ Documentation Updated Successfully

Files Updated: [X]
Functions/Classes Updated: [Y]

Changes Made:

## [FileName.ext]

### function1()
**Issues Fixed:**
- ✓ Added missing parameter 'options'
- ✓ Updated return type from User to Promise<User|null>
- ✓ Added error documentation
- ✓ Added usage example

**Before:** 2 lines of documentation
**After:** 15 lines of comprehensive documentation

### function2()
**Issues Fixed:**
- ✓ Fixed parameter name mismatch
- ✓ Documented side effects (email sending)
- ✓ Added performance note

**Before:** 5 lines (outdated)
**After:** 12 lines (accurate)

## [AnotherFile.ext]

### Class Name
**Issues Fixed:**
- ✓ Added missing methods documentation
- ✓ Updated constructor parameters
- ✓ Added class-level description

---

Summary:
├─ Documentation blocks updated: [X]
├─ Parameters added/fixed: [Y]
├─ Examples added: [Z]
├─ Side effects documented: [W]
└─ Lines of documentation: [before] → [after]

Quality Improvements:
✓ All public APIs now documented
✓ All parameters include types and descriptions
✓ All functions have examples
✓ Error conditions clearly documented
✓ Side effects explicitly stated

Next Steps:
1. Review the updated documentation for accuracy
2. Update API documentation if needed (/api-docs)
3. Run /doc-sync-check to verify completeness
4. Commit changes with message: "docs: update function documentation"
```

## Important Guidelines:

- **DO** compare documentation against actual code implementation
- **DO** preserve the existing documentation style and format
- **DO** fix all parameter and return type mismatches
- **DO** document all side effects and async behavior
- **DO** add examples where missing
- **DO** update related documentation (README, API docs)
- **DO NOT** modify the actual code logic
- **DO NOT** change the documentation style unless asked
- **DO NOT** remove useful existing documentation
- **DO** be thorough and systematic

## Error Handling:

- **No existing documentation**: Offer to run `/doc-generate` instead
- **File not found**: Ask user for correct file path
- **No drift detected**: Report that documentation is already up-to-date
- **Ambiguous changes**: Ask user for clarification on intended behavior

---

Begin by reading the target file(s) and comparing documentation with implementation to identify all documentation drift issues.
