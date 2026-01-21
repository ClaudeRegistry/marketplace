---
description: Identify untested code paths and missing test coverage across the codebase
model: inherit
---

# Test Gap Analysis Command

You are tasked with performing a comprehensive analysis of the codebase to identify gaps in test coverage. This analysis will help prioritize testing efforts and ensure critical code is properly tested.

## Step 1: Discover the Codebase Structure

Perform a thorough scan of the project:

### Identify Source Code
- Find all source code directories (src/, lib/, app/, etc.)
- Identify the programming language(s)
- Map the directory structure
- List all code files that should have tests

### Identify Test Code
- Find all test directories (tests/, test/, __tests__/, spec/)
- Identify test files by naming conventions:
  - `*.test.js`, `*.spec.ts`, `*_test.py`, `*_test.go`, `Test*.java`
- Map test files to their corresponding source files

### Identify Testing Framework
- Detect from `package.json`, `requirements.txt`, `pom.xml`, `go.mod`
- Look for: Jest, Pytest, JUnit, Go testing, RSpec, Mocha, etc.

## Step 2: Analyze Source Files for Testable Units

For each source file, identify:

### Functions and Methods
- Public functions
- Exported functions
- Class methods (public and protected)
- Utility functions
- API endpoints/route handlers

### Classes
- Public classes
- Service classes
- Repository/DAO classes
- Controller classes
- Utility classes

### Modules
- Module exports
- Public APIs
- Entry points

## Step 3: Map Tests to Source Code

Create a mapping between source and tests:

### For Each Source File:
1. **Find corresponding test file**
   - Check naming conventions (file.ts → file.test.ts)
   - Check test directories mirroring source structure
   - Search for imports of the source file in test files

2. **Analyze test coverage**
   - Which functions/methods have tests?
   - How many tests per function?
   - Are edge cases tested?
   - Are error conditions tested?

3. **Calculate coverage metrics**
   - Percentage of functions with at least one test
   - Percentage of lines covered (if coverage data available)
   - Number of test cases per function

## Step 4: Identify Coverage Gaps

Categorize gaps by priority:

### Critical Gaps (Highest Priority)
- **No tests at all**: Files with 0% test coverage
- **Business logic untested**: Core business rules without tests
- **Security-critical code**: Authentication, authorization, payment processing
- **Data manipulation**: Database operations, data transformations
- **API endpoints**: Public APIs without integration tests
- **Error handling**: Try-catch blocks without error tests

### High Priority Gaps
- **Partial coverage (<50%)**: Files with some tests but many gaps
- **Complex functions**: High cyclomatic complexity without adequate tests
- **Recent changes**: Recently modified files without updated tests
- **Bug-prone areas**: Files with history of bugs
- **Public APIs**: Exported functions with missing tests

### Medium Priority Gaps
- **Moderate coverage (50-80%)**: Files with good but incomplete coverage
- **Edge cases**: Functions tested but missing boundary conditions
- **Error paths**: Success cases tested but not error scenarios
- **Utility functions**: Helper functions with limited tests

### Low Priority Gaps
- **High coverage (>80%)**: Files mostly covered, minor gaps
- **Private methods**: Internal implementation details
- **Simple getters/setters**: Trivial functions
- **Configuration files**: Setup and config code

## Step 5: Analyze Test Quality

For existing tests, assess quality:

### Test Completeness
- Are happy paths tested?
- Are edge cases tested?
- Are error conditions tested?
- Are boundary values tested?

### Test Independence
- Do tests depend on execution order?
- Are mocks properly reset between tests?
- Is state cleaned up after tests?

### Assertion Quality
- Are assertions specific and meaningful?
- Are there enough assertions?
- Are error messages clear?

## Step 6: Calculate Coverage Metrics

Generate comprehensive metrics:

### Overall Metrics
```
Overall Test Coverage: [X]%
Total Source Files: [count]
Files with Tests: [count] ([X]%)
Files without Tests: [count] ([X]%)

Function Coverage:
Total Functions: [count]
Functions with Tests: [count] ([X]%)
Functions without Tests: [count] ([X]%)

Test Files: [count]
Total Test Cases: [count]
Avg Tests per Source File: [X]
```

### Per-Module Metrics
```
Module: src/auth
Coverage: [X]%
Files: [count] total, [count] untested
Functions: [count] total, [count] untested
Priority: HIGH (security-critical)

Module: src/utils
Coverage: [X]%
Files: [count] total, [count] untested
Functions: [count] total, [count] untested
Priority: MEDIUM
```

### Per-File Metrics
```
File: src/payment/processor.ts
Coverage: 0%
Functions: 15 total, 0 tested
Priority: CRITICAL
Risk: HIGH (payment processing)
Complexity: HIGH
```

## Step 7: Generate Prioritized Recommendations

Create actionable recommendations:

### Format:
```
🔴 CRITICAL PRIORITY - Must Address Immediately

1. src/payment/processor.ts (0% coverage)
   Risk: Payment processing logic completely untested
   Impact: High - financial transactions
   Effort: ~4 hours
   Recommendation: Generate comprehensive unit tests with /generate-unit-tests
   Functions needing tests:
   - processPayment() - payment processing
   - refundTransaction() - refund logic
   - validateCard() - card validation
   - calculateFees() - fee calculations

2. src/auth/session-manager.ts (0% coverage)
   Risk: Authentication logic untested
   Impact: High - security implications
   Effort: ~2 hours
   Recommendation: Generate unit tests focusing on edge cases
   Functions needing tests:
   - createSession() - session creation
   - validateSession() - session validation
   - revokeSession() - session termination

🟠 HIGH PRIORITY - Address Soon

3. src/user/profile-service.ts (25% coverage)
   Risk: Partial coverage of user data operations
   Impact: Medium - user data integrity
   Effort: ~3 hours
   Functions needing tests:
   - updateProfile() - untested
   - deleteAccount() - untested
   - exportUserData() - untested (GDPR requirement)

4. src/api/orders-controller.ts (33% coverage)
   Risk: API endpoints partially tested
   Impact: Medium - order management
   Effort: ~2 hours
   Recommendation: Add E2E tests with /generate-e2e-tests
   Endpoints needing tests:
   - POST /orders - create order
   - DELETE /orders/:id - cancel order

🟡 MEDIUM PRIORITY - Plan to Address

5. src/cart/calculator.ts (60% coverage)
   Risk: Edge cases not tested
   Impact: Low-Medium - cart calculations
   Effort: ~1 hour
   Recommendation: Add edge case tests for boundary conditions
   Missing tests:
   - Empty cart scenarios
   - Maximum quantity handling
   - Discount edge cases

🟢 LOW PRIORITY - Optional Improvements

6. src/utils/formatters.ts (85% coverage)
   Risk: Minor gaps in utility functions
   Impact: Low - formatting utilities
   Effort: ~30 minutes
   Recommendation: Add tests for remaining edge cases
```

## Step 8: Identify Testing Anti-patterns

Look for problematic patterns:

### Common Issues:
- **No test isolation**: Tests modifying shared state
- **Missing mocks**: Tests hitting real databases/APIs
- **Hardcoded values**: Tests relying on specific data
- **Flaky tests**: Tests that pass/fail inconsistently
- **Skipped tests**: Tests marked as `.skip()` or `@Ignore`
- **Long tests**: Tests doing too much (>50 lines)
- **No assertions**: Tests without expect/assert statements
- **Commented tests**: Test code commented out

## Step 9: Generate Coverage Improvement Plan

Create a structured plan:

```
📊 Test Coverage Improvement Plan

Current State:
- Overall Coverage: [X]%
- Critical Gaps: [count] files
- High Priority Gaps: [count] files
- Medium Priority Gaps: [count] files

Target State:
- Goal: 80% overall coverage
- Timeline: [X] weeks
- Estimated Effort: [X] hours

Week 1: Address Critical Gaps
✓ Test payment processing (4h)
✓ Test authentication (2h)
✓ Test authorization (2h)
Total: 8 hours

Week 2: Address High Priority Gaps
✓ Test user operations (3h)
✓ Test API endpoints (2h)
✓ Add E2E tests for checkout (3h)
Total: 8 hours

Week 3: Address Medium Priority Gaps
✓ Test calculation logic (1h)
✓ Test data transformations (2h)
✓ Add integration tests (3h)
Total: 6 hours

Expected Final Coverage: 82%
```

## Step 10: Generate Detailed Report

Create a comprehensive report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TEST COVERAGE GAP ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: [timestamp]
Project: [project-name]
Language: [detected-languages]
Testing Framework: [detected-frameworks]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 COVERAGE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Coverage: [X]%

File Coverage:
├─ Total Files: [count]
├─ Files with Tests: [count] ([X]%)
├─ Files without Tests: [count] ([X]%)
└─ Test Files: [count]

Function Coverage:
├─ Total Functions: [count]
├─ Functions with Tests: [count] ([X]%)
└─ Functions without Tests: [count] ([X]%)

Test Statistics:
├─ Total Test Cases: [count]
├─ Test Suites: [count]
└─ Avg Tests per File: [X]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CRITICAL GAPS (Immediate Action Required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Detailed list of critical gaps with recommendations]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 HIGH PRIORITY GAPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Detailed list of high priority gaps]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 MEDIUM PRIORITY GAPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Detailed list of medium priority gaps]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 COVERAGE BY MODULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/payment/       0% ████████████████░░░░
src/auth/         20% ████████████████░░░░
src/user/         45% ███████████░░░░░░░░░
src/api/          60% ████████░░░░░░░░░░░░
src/utils/        85% ███░░░░░░░░░░░░░░░░░

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RECOMMENDED ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Immediate (This Week):
1. /generate-unit-tests src/payment/processor.ts
2. /generate-unit-tests src/auth/session-manager.ts
3. /generate-e2e-tests checkout flow

Short Term (Next 2 Weeks):
4. /generate-unit-tests src/user/profile-service.ts
5. /generate-e2e-tests user registration
6. /improve-test-quality tests/api/

Long Term (Next Month):
7. Increase coverage to 80% overall
8. Add integration tests for database operations
9. Set up coverage reporting in CI/CD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 COVERAGE IMPROVEMENT FORECAST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current:     [X]% ████████░░░░░░░░░░░░
After Week 1: [Y]% ████████████░░░░░░░░
After Week 2: [Z]% ████████████████░░░░
Target:       80% ████████████████████

Estimated Effort: [X] hours
Estimated Timeline: [Y] weeks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Important Guidelines

### DO:
- Analyze the entire codebase systematically
- Prioritize by risk and business impact
- Provide specific, actionable recommendations
- Include effort estimates
- Consider both quantity and quality of tests
- Identify testing anti-patterns
- Create a realistic improvement plan

### DON'T:
- Don't just report numbers without context
- Don't recommend testing trivial code
- Don't ignore test quality issues
- Don't prioritize coverage percentage over meaningful tests
- Don't forget to consider E2E and integration tests
- Don't overlook recently changed files

## Error Handling

If you encounter issues:

- **Large codebase**: Break analysis into modules
- **No tests exist**: Start with critical paths
- **Multiple languages**: Analyze each separately
- **Complex project**: Focus on high-risk areas first

---

Begin by systematically scanning the codebase and generating a comprehensive test coverage gap analysis.
