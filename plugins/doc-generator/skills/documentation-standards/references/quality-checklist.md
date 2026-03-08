# Documentation Quality Checklist

Systematic audit procedures for evaluating documentation completeness, accuracy, consistency, and writing quality.

---

## 1. Completeness Check

Verify that every documented element includes all required sections.

### Function/Method Documentation

| Check | What to Verify | Severity if Missing |
|-------|---------------|---------------------|
| Brief summary | One-sentence description starting with a verb | Critical |
| All parameters documented | Every parameter in the function signature has a corresponding doc tag | Critical |
| Parameter types specified | Type annotation present for each parameter (in typed languages) | High |
| Parameter constraints noted | Valid ranges, null behavior, format requirements described | Medium |
| Default values documented | Optional parameters list their default values | Medium |
| Return value documented | Return type and meaning described, including edge cases | Critical |
| Null/empty return cases | Document when the function returns null, None, nil, or empty | High |
| Exceptions documented | Every exception the function can throw is listed with its trigger condition | Critical |
| Side effects documented | I/O operations, state mutations, event emissions, cache updates listed | High |
| At least one example | Realistic, runnable usage example showing common case | High |
| Edge case examples | Examples demonstrating boundary conditions or special inputs | Medium |
| Cross-references | Links to related functions, classes, or external documentation | Low |
| Version tags | `@since` or equivalent indicating when the API was introduced | Low |
| Deprecation notice | If deprecated: marked with `@deprecated` and replacement documented | Critical |

### Class/Type Documentation

| Check | What to Verify | Severity if Missing |
|-------|---------------|---------------------|
| Class purpose | What this class represents or encapsulates | Critical |
| All public methods documented | Every public method has full documentation | Critical |
| All public properties documented | Every public field or property has a description | High |
| Constructor documented | Constructor parameters and initialization behavior described | High |
| Inheritance noted | Parent classes, interfaces, or traits mentioned | Medium |
| Thread safety stated | Whether the class is safe for concurrent access | Medium |
| Usage example | How to instantiate and use the class | High |
| Design pattern identified | If implementing a known pattern (Singleton, Factory, etc.) | Low |

### Module/File Documentation

| Check | What to Verify | Severity if Missing |
|-------|---------------|---------------------|
| Module purpose | What this module is responsible for | High |
| Public API surface | Which exports are intended for external use | High |
| Dependencies noted | Key external dependencies and why they are needed | Medium |
| Configuration requirements | Environment variables, config files, or setup steps | Medium |

---

## 2. Accuracy Check

Verify that documentation matches the actual implementation.

### Signature Accuracy

| Check | How to Verify |
|-------|--------------|
| Parameter count matches | Count `@param` tags and compare to function signature parameter count |
| Parameter names match | Each `@param` name corresponds exactly to a parameter name in the signature |
| Parameter order matches | Doc tags list parameters in the same order as the signature |
| Parameter types match | Documented types match type annotations or actual usage in the function body |
| Return type matches | Documented return type matches the type annotation or inferred return type |
| Optional/required status matches | Parameters marked optional in docs are actually optional in the signature |
| Default values match | Documented defaults match the actual default values in the signature |

### Behavioral Accuracy

| Check | How to Verify |
|-------|--------------|
| Described behavior matches implementation | Read the function body and confirm the documentation accurately describes what it does |
| Exception conditions are accurate | Verify each documented `@throws` condition actually triggers that exception in the code |
| Side effects are current | Confirm all listed side effects still occur and no new ones have been added |
| Examples produce stated output | Mentally or actually execute the example and verify the stated result |
| Performance claims are valid | Verify stated time complexity or performance characteristics match the algorithm |

### Common Accuracy Failures

These are the most frequently encountered documentation-to-code mismatches:

```
ACCURACY FAILURE: Parameter added without doc update
  Signature: function search(query, filters, options)
  Docs: @param {string} query - Search query
  Missing: filters and options parameters

ACCURACY FAILURE: Return type changed
  Docs: @returns {User} The user object
  Actual: Returns Promise<User | null>
  Issues: Missing async wrapper, missing null case

ACCURACY FAILURE: Exception removed but still documented
  Docs: @throws {AuthError} When token is expired
  Actual: Function now returns null instead of throwing
  Issue: Stale @throws tag misleads callers

ACCURACY FAILURE: Side effect added without doc update
  Docs: "Save the record to the database"
  Actual: Also publishes a Kafka event and invalidates cache
  Issue: Two undocumented side effects
```

---

## 3. Consistency Check

Verify that documentation follows uniform conventions within and across files.

### Terminology Consistency

| Check | What to Verify |
|-------|--------------|
| Same concept, same term | A single concept is referred to by exactly one term throughout (e.g., "user ID" everywhere, not "userId" in one place and "user identifier" in another) |
| Parameter names match code | Documentation parameter names are identical to function signature names (not abbreviations or synonyms) |
| Consistent capitalization | Type names, class names, and constants use the same capitalization in docs as in code |

### Format Consistency

| Check | What to Verify |
|-------|--------------|
| Same doc format across file | All functions in a file use the same documentation format (all JSDoc, all Google-style, etc.) |
| Consistent tag ordering | Tags appear in the same order in every function (e.g., always `@param` then `@returns` then `@throws`) |
| Consistent punctuation | Descriptions consistently end with periods (or consistently do not) |
| Consistent tense | All summaries use present tense ("Return the user") or all use imperative ("Returns the user") -- not a mix |
| Consistent detail level | Similar functions have similar documentation depth (avoid documenting one getter thoroughly and leaving an adjacent getter bare) |

### Cross-Reference Consistency

| Check | What to Verify |
|-------|--------------|
| References point to existing targets | Every `@see`, `See Also`, or linked function name still exists in the codebase |
| Bidirectional references | If function A references function B, function B should reference function A |
| No broken internal links | Module paths, file references, and class names in documentation are valid |

### Recommended Tag Order by Language

**JSDoc:**
1. `@param` (all parameters in signature order)
2. `@returns`
3. `@throws`
4. `@example`
5. `@see`
6. `@since`
7. `@deprecated`

**Python Google-style:**
1. `Args:`
2. `Returns:`
3. `Raises:`
4. `Example:`
5. `Note:`
6. `See Also:`

**Javadoc:**
1. `@param` (all parameters in signature order)
2. `@return`
3. `@throws`
4. `@see`
5. `@since`
6. `@author`
7. `@deprecated`

---

## 4. Documentation Drift Detection

Systematic patterns for identifying when documentation has fallen out of sync with code.

### Automated Detection Patterns

Apply these checks programmatically when scanning a codebase:

| Pattern | Detection Logic | Severity |
|---------|----------------|----------|
| Parameter count mismatch | Count function parameters vs. count of `@param` tags | Critical |
| Undocumented parameters | Parameters in signature not found in any doc tag | Critical |
| Orphaned doc tags | `@param` tags referencing names not in the signature | High |
| Return documentation on void | `@returns` present on a function that returns nothing | Medium |
| Missing return documentation | Non-void function with no `@returns` tag | High |
| Stale type references | Documented types that no longer exist in the codebase | High |
| TODO/placeholder text | Doc contains "TODO", "FIXME", "TBD", "[DESCRIBE]", "XXX" | Medium |
| Copy-paste documentation | Multiple functions with identical doc blocks | High |
| Empty doc blocks | Doc comment present but contains no meaningful content | Medium |

### Manual Drift Review Procedure

When performing a documentation audit, follow this sequence:

1. **Identify recently changed files** -- use `git log --since="30 days ago" --name-only` to find files modified in the last month
2. **Compare doc timestamps to code changes** -- if a function's code was modified more recently than its documentation, flag for review
3. **Read function body vs. doc description** -- for each flagged function, read the implementation and compare against the documented behavior
4. **Check integration points** -- when a function's callers or callees change, its documentation may need updating even if the function itself did not change
5. **Verify examples** -- run or mentally trace each example against the current function signature and behavior

### Drift Risk Indicators

These code change patterns indicate high probability of documentation drift:

| Code Change | Why Drift Is Likely |
|-------------|-------------------|
| New parameter added to function | Developer added the parameter but forgot to add `@param` |
| Return type changed | Especially `T` to `Optional<T>` or sync to async |
| Function extracted or renamed | Old references in other docs now point to nonexistent functions |
| Error handling refactored | Exceptions thrown may have changed |
| Dependency upgraded | API behavior may have subtly changed |
| Feature flag added or removed | Documented behavior may now be conditional |

---

## 5. Writing Quality Criteria

Evaluate the quality of documentation prose independent of format compliance.

### Clarity

| Criterion | Pass | Fail |
|-----------|------|------|
| First sentence conveys purpose | "Validate the JWT token and extract user claims" | "This function is used for tokens" |
| No unnecessary jargon | Plain language with domain terms defined | Acronyms and abbreviations without explanation |
| Unambiguous descriptions | "Return null if the user does not exist" | "Return the result" |
| Active voice | "Send a notification to the user" | "A notification is sent by the system" |

### Specificity

| Criterion | Pass | Fail |
|-----------|------|------|
| Concrete parameter descriptions | "Maximum number of results to return (1-100)" | "The limit" |
| Specific error conditions | "Throw `RangeError` if `offset` exceeds array length" | "May throw errors" |
| Measurable behavior | "Retry up to 3 times with 500ms backoff" | "Retries on failure" |
| Exact return descriptions | "Return a `Map<String, List<Order>>` keyed by customer ID" | "Return the orders" |

### Example Quality

| Criterion | Pass | Fail |
|-----------|------|------|
| Uses realistic data | `getUser("usr_a1b2c3")` | `getUser("foo")` |
| Shows expected output | `// Returns: { name: "Alice", role: "admin" }` | No output shown |
| Includes error case | Shows what happens with invalid input | Only shows the happy path |
| Self-contained | Example includes all necessary setup | Relies on unexplained variables |
| Progressive complexity | Simple case first, advanced case second | Single complex example only |

### Descriptions to Avoid

These patterns indicate low-quality documentation that should be rewritten:

| Anti-Pattern | Example | Problem |
|-------------|---------|---------|
| Restating the name | "getName returns the name" | Adds no information |
| Vague verb | "Handles the data" | Does not describe what "handling" means |
| Missing subject | "For the user" | Incomplete sentence fragment |
| Tautological | "A list of items in the list" | Circular definition |
| Over-qualified | "This particular method function is used to..." | Verbose without substance |
| Implementation detail as purpose | "Calls the database and maps rows" | Describes how, not why |

---

## 6. Audit Summary Template

Use this template when generating a documentation quality report:

```
Documentation Quality Audit
============================

Scope: [files/modules scanned]
Date: [audit date]

Coverage Metrics:
  Total public APIs: [count]
  Fully documented:  [count] ([percent]%)
  Partially documented: [count] ([percent]%)
  Undocumented: [count] ([percent]%)

Quality Metrics:
  Accurate (matches code): [count] ([percent]%)
  Drifted (outdated): [count] ([percent]%)
  Incomplete: [count] ([percent]%)

Issues by Severity:
  Critical: [count]
  High: [count]
  Medium: [count]
  Low: [count]

Top Issues:
  1. [description] -- [file:line] -- [severity]
  2. [description] -- [file:line] -- [severity]
  3. [description] -- [file:line] -- [severity]

Recommended Actions:
  Phase 1 (Critical): [list of actions]
  Phase 2 (High): [list of actions]
  Phase 3 (Medium/Low): [list of actions]
```
