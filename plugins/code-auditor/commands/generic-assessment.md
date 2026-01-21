---
description: Analyze the codebase and provide a comprehensive code assessment report
model: inherit
---

You MUST provide the complete report following every single section below. DO NOT summarize or abbreviate. Output the full detailed analysis for each section exactly as specified:

# Codebase Assessment Report

## Codebase Size Analysis

Analyze and report:

- **Total Lines of Code**: Break down by language (e.g., Java, TypeScript, JavaScript, etc)
- **Total Files**: Count by file type
- **Components**: List total number and categorize by type (pages, shared, features)
- **Services**: Count and identify service files
- **Modules**: Identify all modules and their purposes
- **Average File Size**: Calculate average lines per file and identify outliers

## Technology Stack Analysis

Identify and document:

- **Framework**: Main framework and version
- **Platform**: Target platform (Server, Web, Mobile, Desktop)
- **Backend Technologies**: APIs, databases, authentication methods
- **Dependencies**:
  - Total count of dependencies
  - List of major dependencies with versions
  - Identify outdated or deprecated packages
  - Security vulnerabilities in dependencies

## Architecture & Design Analysis

Evaluate architectural patterns:

- **Design Patterns Used**: Identify patterns (MVC, MVVM, Repository, etc.)
- **SOLID Principles Adherence**: Rate each principle (S.O.L.I.D)
- **Dependency Direction**: Check for circular dependencies
- **Layer Separation**: Evaluate separation of concerns
- **Module Coupling**: Calculate coupling metrics between modules

## Critical Issues Analysis

Identify critical issues with severity levels and calculate the percentage of codebase affected:

### Code Quality Issues:

- **Massive Files**: Files exceeding 500 lines (list top 10 with line counts)
- **Code Standards Violations**:
  - Naming convention violations
  - Mixed import styles
  - Inconsistent formatting
  - Code duplication patterns
- **Complexity Issues**:
  - High cyclomatic complexity (methods with >10 branches)
  - Deep nesting (>4 levels)
  - God classes/services

### Memory Leak Patterns (CRITICAL):

- **Framework-Specific Leaks**:
  - Angular: Unsubscribed observables, HostListener without cleanup
  - React: useEffect without cleanup, event listeners in hooks
  - Vue: Watchers without proper disposal, event bus listeners
- **Closure Leaks**: Identify potential closure memory retention
- **Detached DOM Nodes**: Count references to removed elements
- **Global Variable Pollution**: Track global scope additions

### Security Vulnerabilities:

- **XSS Risks**: innerHTML, dangerouslySetInnerHTML usage
- **SQL Injection**: Dynamic query construction
- **Hardcoded Secrets**: API keys, passwords in code
- **Unsafe Data Handling**: eval(), Function() constructor usage
- **Console Logging**: Sensitive data exposure
- **Authentication Issues**: Weak or missing auth patterns

## Code Smells Analysis

Identify common code smells:

- **Long Methods**: Methods > 50 lines
- **Large Classes**: Classes > 300 lines
- **Long Parameter Lists**: Functions with > 4 parameters
- **Duplicate Code**: Blocks repeated > 3 times
- **Dead Code**: Unused variables, functions, imports
- **Magic Numbers**: Hardcoded values without constants
- **Inappropriate Intimacy**: Classes with excessive coupling

## Performance Issues Analysis

Analyze performance bottlenecks and calculate affected percentage:

- **Bundle Size Issues**:
  - No lazy loading implementation
  - Large dependencies not tree-shaken
  - Duplicate code/libraries
- **Rendering Performance**:
  - Missing optimization strategies (OnPush, memo, etc.)
  - Direct DOM manipulation
  - Inefficient change detection
- **Runtime Performance**:
  - Synchronous heavy operations
  - Blocking UI thread
  - Poor async handling (nested callbacks, promise chains)
  - Inefficient algorithms (O(n²) or worse)
- **Network Performance**:
  - Multiple sequential API calls
  - No caching strategy
  - Large payload transfers

## Test Coverage Analysis

Evaluate testing comprehensively:

- **Test Statistics**:
  - Total number of test files
  - Total number of test cases
  - Lines of test code vs production code ratio
- **Coverage Metrics**:
  - Statement coverage percentage
  - Branch coverage percentage
  - Function coverage percentage
  - Line coverage percentage
- **Test Quality**:
  - Meaningful vs trivial tests ratio
  - Integration vs unit test distribution
  - E2E test presence and coverage
- **Missing Test Areas**: Identify untested critical paths

## Remediation Roadmap

### Immediate Actions

- Fix all Blocker/Critical bugs
- Address security vulnerabilities
- Fix memory leaks

### Short-term

- Reduce duplication below 5%
- Increase coverage to 60%
- Refactor high-complexity methods

### Long-term

- Achieve 80% coverage
- Reduce tech debt to < 5 days
- Implement missing design patterns

## Final Assessment Score

Provide a detailed scoring breakdown following this methodology:

### Scoring Categories (Total: 10 points)

**1. Code Quality (Weight: 25%)**
Evaluate based on:

- File size and structure (-1 to -3 points for massive files)
- Code complexity (-1 to -2 points for high complexity)
- Error handling quality (-1 point for poor patterns)
- Code consistency (-1 point for mixed styles)
- Positive factors (+1 for TypeScript, +1 for linting)

**2. Performance (Weight: 25%)**
Evaluate based on:

- Bundle optimization (-2 points if missing)
- Rendering efficiency (-2 points for poor patterns)
- Async handling (-1 to -2 points)
- Caching strategy (-1 point if missing)
- Positive factors (+1 for optimization techniques)

**3. Security (Weight: 20%)**
Evaluate based on:

- XSS vulnerabilities (-1 point per type found)
- Injection risks (-2 to -3 points)
- Data exposure (-1 point)
- Outdated dependencies (-1 to -2 points)
- Authentication issues (-2 points)

**4. Maintainability (Weight: 20%)**
Evaluate based on:

- Code organization (-2 to -4 points for monolithic code)
- Memory leak patterns (-2 points)
- Documentation (-1 to -2 points if missing)
- Technical debt ratio (-1 to -2 points if high)
- Positive factors (+1 for good architecture)

**5. Testing (Weight: 10%)**
Evaluate based on:

- Coverage percentage (scale 0-10 based on coverage)
- Test quality (-1 to -3 points for trivial tests)
- Test types distribution (-1 point if imbalanced)

### Provide Score Calculation Table:

| Category        | Score | Weight | Calculation | Weighted Score |
| --------------- | ----- | ------ | ----------- | -------------- |
| Code Quality    | X/10  | 25%    | X × 0.25    | X.XX           |
| Performance     | X/10  | 25%    | X × 0.25    | X.XX           |
| Security        | X/10  | 20%    | X × 0.20    | X.XX           |
| Maintainability | X/10  | 20%    | X × 0.20    | X.XX           |
| Testing         | X/10  | 10%    | X × 0.10    | X.XX           |
| **Total**       | -     | 100%   | -           | **X.XX/10**    |

### Score Interpretation:

- **0-2: Critical** - Immediate intervention required
- **2-4: Poor** - Significant issues affecting development
- **4-6: Fair** - Notable issues but manageable
- **6-8: Good** - Minor issues, well-maintained
- **8-10: Excellent** - Industry best practices

### Key Metrics Summary:

Provide specific metrics for each category with reasoning for the score.

### Priority Recommendations:

Based on the score, list the top 5 most critical issues to address immediately, ordered by impact.

---

**Note**: Please be specific with numbers, percentages, and concrete examples from the actual code. Use bullet points for clarity and include code snippets where relevant to illustrate issues. Do not make up rules or fixes, make sure to stick to the code.