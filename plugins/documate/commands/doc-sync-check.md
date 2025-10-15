---
description: Scan codebase to identify outdated documentation, undocumented functions, and documentation drift
model: inherit
---

# Documentation Sync Check Command

You are tasked with performing a comprehensive audit of documentation quality and identifying areas where documentation is missing, outdated, or inconsistent with the code. Follow these steps:

## Step 1: Discover All Code Files

Scan the entire codebase to identify:
- All source code files (exclude test files, node_modules, vendor, build outputs)
- Programming languages used
- Framework-specific files that need documentation
- Configuration files that should be documented

Use the Glob tool to find code files:
- `**/*.js`, `**/*.ts`, `**/*.jsx`, `**/*.tsx` for JavaScript/TypeScript
- `**/*.py` for Python
- `**/*.java` for Java
- `**/*.go` for Go
- `**/*.rs` for Rust
- `**/*.rb` for Ruby
- Etc. based on detected languages

## Step 2: Analyze Documentation Coverage

For each source file, check for:

### Missing Documentation:
- **Undocumented Functions**: Public functions without any doc comments
- **Undocumented Classes**: Classes missing description or purpose
- **Undocumented Parameters**: Functions with undocumented params
- **Missing Return Documentation**: No description of return values
- **Missing Examples**: No usage examples for complex functions
- **Undocumented Exceptions**: Error cases not documented

### Incomplete Documentation:
- **Generic Comments**: Comments like "// TODO" or "// Fix this"
- **Single-line Docs**: Functions with only brief descriptions but no details
- **Missing Type Information**: Parameters without type annotations
- **Placeholder Text**: Documentation containing "TODO", "[DESCRIBE]", etc.
- **Copy-Paste Errors**: Multiple functions with identical documentation

### Outdated Documentation:
- **Parameter Mismatch**: Documented parameters don't match actual function signature
- **Return Type Mismatch**: Documented return type differs from implementation
- **Deprecated Functions**: Functions marked deprecated but still documented as active
- **Version Mismatches**: Documentation references old versions or removed features
- **Broken Links**: References to functions/classes that no longer exist

## Step 3: Check Documentation Standards Compliance

Verify that documentation follows language-specific standards:

### JavaScript/TypeScript (JSDoc):
- [ ] Uses `@param` for all parameters
- [ ] Uses `@returns` for return values
- [ ] Uses `@throws` for exceptions
- [ ] Includes `@example` for non-trivial functions
- [ ] Has brief description before @tags
- [ ] Specifies types: `@param {string} name`

### Python (Docstrings):
- [ ] Has docstring immediately after function/class definition
- [ ] Follows PEP 257 conventions
- [ ] Documents Args, Returns, Raises sections
- [ ] Includes Examples for complex functions
- [ ] Uses proper formatting (Google, NumPy, or Sphinx style)

### Java (Javadoc):
- [ ] Uses `@param` for all parameters
- [ ] Uses `@return` for return values
- [ ] Uses `@throws` for exceptions
- [ ] Includes `@since` version tags
- [ ] Has proper HTML formatting if needed
- [ ] Includes `@see` for related methods

### Go:
- [ ] Has comment immediately before declaration
- [ ] Starts with function/type name
- [ ] Is a complete sentence with proper punctuation
- [ ] Documents all exported identifiers
- [ ] Includes examples in _test.go files

## Step 4: Identify Documentation Drift

Compare documentation with actual implementation:

### Function Signature Changes:
```
Issue: Parameter count mismatch
File: src/utils/helper.js:45
Function: calculateTotal(items, tax, discount)
Documentation says: calculateTotal(items, tax)
Reality: calculateTotal(items, tax, discount, coupon)
Status: 2 undocumented parameters
```

### Type Changes:
```
Issue: Return type mismatch
File: src/services/user.py:120
Function: get_user_by_id()
Documentation says: Returns User object
Reality: Returns Optional[User] (can return None)
Status: Missing None case documentation
```

### Behavioral Changes:
```
Issue: Side effects not documented
File: src/api/orders.ts:89
Function: processOrder()
Documentation says: "Returns order ID"
Reality: Also sends email notification and updates inventory
Status: Side effects undocumented
```

## Step 5: Generate Comprehensive Report

Create a detailed report organized by severity:

### Critical Issues (Must Fix):
- Public APIs with no documentation
- Documentation that contradicts code (parameter mismatches)
- Missing error/exception documentation for functions that throw
- Exported functions/classes without any description

### High Priority Issues (Should Fix):
- Incomplete documentation (missing params, returns, examples)
- Functions with complex logic but no explanation
- Outdated documentation referencing old behavior
- Missing type information in typed languages

### Medium Priority Issues (Nice to Fix):
- Single-line documentation for non-trivial functions
- Missing examples for complex APIs
- No "See Also" references
- Missing performance notes for expensive operations

### Low Priority Issues (Optional):
- Missing version tags
- No author information
- Could benefit from more detailed examples
- Missing related links

## Step 6: Calculate Documentation Metrics

Provide quantitative analysis:

```
📊 Documentation Coverage Report

Overall Statistics:
├─ Total Files Scanned: [X]
├─ Total Functions/Methods: [X]
├─ Total Classes: [X]
└─ Total Public APIs: [X]

Documentation Coverage:
├─ Fully Documented: [X] ([Y]%)
├─ Partially Documented: [X] ([Y]%)
├─ Undocumented: [X] ([Y]%)
└─ Overall Coverage: [Y]%

Documentation Quality:
├─ Complete & Accurate: [X] ([Y]%)
├─ Incomplete: [X] ([Y]%)
├─ Outdated/Drift: [X] ([Y]%)
└─ Quality Score: [Y]/10

Issues by Severity:
├─ Critical: [X]
├─ High: [X]
├─ Medium: [X]
└─ Low: [X]

Language Breakdown:
├─ TypeScript: [X files] - [Y]% coverage
├─ Python: [X files] - [Y]% coverage
└─ [Other]: [X files] - [Y]% coverage
```

## Step 7: Provide Detailed Issue List

For each issue, provide:

```markdown
### [Severity] Issue #[N]: [Brief Description]

**Location:** `[file-path]:[line-number]`
**Type:** [Missing/Outdated/Incomplete]
**Element:** [Function/Class/Method name]

**Problem:**
[Detailed description of the issue]

**Current Documentation:**
```[language]
[Show current doc or "None"]
```

**Actual Code Signature:**
```[language]
[Show actual function/class signature]
```

**Recommendation:**
[Specific actionable fix]

**Impact:** [High/Medium/Low]
- Affects: [public API / internal function / etc.]
- Users: [external developers / team members / etc.]
```

## Step 8: Provide Actionable Recommendations

Prioritize fixes with a roadmap:

```markdown
## Recommended Action Plan

### Phase 1: Critical Fixes (Do First)
1. Document all public APIs in [file1.ext]
   - Functions: func1(), func2(), func3()
   - Estimated time: 2 hours
   - Run: `/doc-generate [file-path]`

2. Fix parameter mismatches in [file2.ext]
   - Update documentation for: method1(), method2()
   - Estimated time: 30 minutes
   - Run: `/doc-update [file-path]`

### Phase 2: High Priority (Do Next)
[Similar format]

### Phase 3: Ongoing Maintenance
- Set up documentation linting in CI/CD
- Require documentation for all new functions
- Run `/doc-sync-check` weekly
- Schedule quarterly documentation reviews
```

## Step 9: Generate File-by-File Breakdown

List files needing attention:

```markdown
## Files Requiring Documentation Updates

### High Priority Files:

**src/api/user-service.ts** - 45% coverage
├─ Undocumented: 8 functions
├─ Outdated: 3 functions
├─ Issues: 11 total
└─ Action: Run `/doc-generate src/api/user-service.ts`

**src/utils/validators.py** - 30% coverage
├─ Undocumented: 12 functions
├─ Incomplete: 5 functions
├─ Issues: 17 total
└─ Action: Run `/doc-generate src/utils/validators.py`

[Continue for all high-priority files]
```

## Step 10: Compare with Best Practices

Evaluate against industry standards:

```markdown
## Documentation Best Practices Compliance

✅ Passed:
- All exported functions have some documentation
- Uses language-standard doc format

⚠️ Needs Improvement:
- Only 60% of functions have examples (target: 80%)
- Parameter types missing in 40% of docs
- No "See Also" references

❌ Missing:
- No architecture documentation
- API reference not maintained
- No developer onboarding guide
```

## Important Guidelines:

- **DO** scan the entire codebase systematically
- **DO** provide specific line numbers and file paths
- **DO** show concrete examples of issues
- **DO** give actionable recommendations
- **DO** calculate accurate coverage metrics
- **DO** prioritize issues by impact
- **DO NOT** suggest fixes without identifying the actual issue
- **DO NOT** report on test files unless specifically asked
- **DO NOT** flag internal/private functions as critical (focus on public APIs first)

## Output Format:

Provide the report in clear, well-organized markdown with:
1. Executive summary with key metrics
2. Severity-based issue lists
3. File-by-file breakdown
4. Actionable recommendations
5. Quick-fix commands for each issue

---

Begin by scanning the codebase and identifying all code files, then systematically analyze documentation quality.
