# Scoring Rubrics — Detailed Category Breakdown

## 1. Code Quality (Weight: 25%)

### Negative Factors
| Issue | Deduction | Criteria |
|-------|-----------|----------|
| Massive files (>500 lines) | -1 to -3 | Count of oversized files relative to total |
| High cyclomatic complexity | -1 to -2 | Methods with >10 branches |
| Deep nesting (>4 levels) | -1 | Prevalence across codebase |
| Poor error handling | -1 | Missing/inconsistent error patterns |
| Mixed code styles | -1 | Inconsistent naming, formatting, imports |
| Code duplication >5% | -1 to -2 | Based on duplication percentage |
| Dead code presence | -1 | Unused variables, functions, imports |
| Magic numbers | -0.5 | Hardcoded values without constants |

### Positive Factors
| Practice | Bonus | Criteria |
|----------|-------|----------|
| Type safety (TypeScript, type hints, generics) | +1 | Consistent usage across codebase |
| Linting/formatting tools configured | +1 | ESLint, Prettier, Black, Rubocop, etc. |
| Consistent naming conventions | +0.5 | Across all files and modules |
| Small, focused functions | +0.5 | Majority of methods <50 lines |

### Score Anchor Points
- **10/10**: No files >300 lines, average complexity <5, zero duplication, full type safety, strict linting
- **7/10**: Few large files, complexity under control, <3% duplication, good standards
- **5/10**: Some large files, moderate complexity, ~5% duplication, inconsistent standards
- **3/10**: Many large files, high complexity, >10% duplication, poor standards
- **1/10**: Monolithic files, extreme complexity, massive duplication, no standards

---

## 2. Performance (Weight: 25%)

### Negative Factors
| Issue | Deduction | Criteria |
|-------|-----------|----------|
| No lazy loading / code splitting | -2 | No dynamic imports or route-based splitting |
| Inefficient algorithms (O(n²)+) | -2 | Nested loops on data sets |
| Blocking synchronous operations | -1 to -2 | Sync I/O in async contexts |
| Poor async handling | -1 | Callback hell, unhandled promises |
| No caching strategy | -1 | Repeated expensive computations or fetches |
| Large unoptimized dependencies | -1 | Dependencies that could be tree-shaken or replaced |
| N+1 query patterns | -1 to -2 | Database queries in loops |
| Missing pagination | -1 | Unbounded result sets |

### Positive Factors
| Practice | Bonus | Criteria |
|----------|-------|----------|
| Optimization patterns implemented | +1 | Memoization, debouncing, virtualization |
| Code splitting / lazy loading | +1 | Route-based or component-based splitting |
| Efficient caching | +0.5 | Appropriate cache layers |
| Connection pooling | +0.5 | Database/HTTP connection reuse |

### Score Anchor Points
- **10/10**: Optimized algorithms, full code splitting, efficient caching, no blocking operations
- **7/10**: Good performance patterns, minor optimization gaps
- **5/10**: Some performance issues, partial optimization
- **3/10**: Significant bottlenecks, no optimization strategy
- **1/10**: Blocking operations everywhere, O(n²) common, no caching

---

## 3. Security (Weight: 20%)

### Negative Factors
| Issue | Deduction | Criteria |
|-------|-----------|----------|
| Injection vulnerabilities (SQL, Command, etc.) | -2 to -3 | Any confirmed injection vector |
| Hardcoded secrets | -2 | API keys, passwords, tokens in source |
| XSS vulnerabilities | -1 per type | Reflected, Stored, DOM-based |
| Authentication weaknesses | -2 | Weak password handling, missing MFA support |
| Outdated dependencies with known CVEs | -1 to -2 | Based on severity of CVEs |
| Missing input validation | -1 | User input used without sanitization |
| CSRF/SSRF vulnerabilities | -1 | Missing tokens or URL validation |
| Sensitive data in logs | -1 | Passwords, tokens, PII logged |
| Weak cryptography | -1 | MD5, SHA1, DES, ECB mode for security |

### Positive Factors
| Practice | Bonus | Criteria |
|----------|-------|----------|
| Security framework properly configured | +1 | Auth middleware, CORS, CSP headers |
| Input validation framework | +0.5 | Consistent validation at boundaries |
| Secret management (env vars, vault) | +0.5 | No hardcoded secrets |
| Dependency security scanning in CI | +0.5 | Automated vulnerability checks |

### Score Anchor Points
- **10/10**: No vulnerabilities, all secrets in vault, full input validation, up-to-date deps
- **7/10**: Minor issues only, good security hygiene
- **5/10**: Some medium-severity issues, partial security controls
- **3/10**: High-severity vulnerabilities, hardcoded secrets, poor validation
- **1/10**: Critical vulnerabilities, no security controls, exposed secrets everywhere

---

## 4. Maintainability (Weight: 20%)

### Negative Factors
| Issue | Deduction | Criteria |
|-------|-----------|----------|
| Monolithic architecture (when inappropriate) | -2 to -4 | Single massive module, no separation |
| Memory leak patterns | -2 | Resource management issues |
| Missing documentation | -1 to -2 | No README, no API docs, no comments on complex logic |
| High technical debt ratio | -1 to -2 | Based on debt-to-code ratio |
| Tight coupling between modules | -1 | Direct cross-module dependencies |
| No dependency injection | -1 | Hard-wired dependencies |
| Circular dependencies | -1 to -2 | Based on count and severity |

### Positive Factors
| Practice | Bonus | Criteria |
|----------|-------|----------|
| Clean architecture / good separation | +1 | Clear layers, loose coupling |
| Comprehensive documentation | +0.5 | README, API docs, architecture docs |
| Dependency injection | +0.5 | Proper IoC container or pattern |
| Consistent project structure | +0.5 | Predictable file organization |

### Score Anchor Points
- **10/10**: Clean architecture, full documentation, no circular deps, low tech debt
- **7/10**: Good structure, reasonable documentation, manageable tech debt
- **5/10**: Some structural issues, partial documentation
- **3/10**: Poor organization, minimal documentation, high tech debt
- **1/10**: Spaghetti code, no documentation, unmaintainable

---

## 5. Testing (Weight: 10%)

### Scoring by Coverage
| Coverage | Base Score |
|----------|-----------|
| 90%+ | 9-10 |
| 70-89% | 7-8 |
| 50-69% | 5-6 |
| 30-49% | 3-4 |
| 10-29% | 1-2 |
| <10% | 0-1 |

### Adjustments
| Factor | Adjustment |
|--------|-----------|
| Only trivial tests (no real assertions) | -1 to -3 |
| No integration tests | -1 |
| No E2E tests for critical flows | -1 |
| Good test quality with meaningful assertions | +1 |
| Test CI integration | +0.5 |
| Snapshot-only testing (no behavioral tests) | -1 |

### Score Anchor Points
- **10/10**: >90% coverage, balanced test types, meaningful assertions, CI integration
- **7/10**: >70% coverage, good unit tests, some integration tests
- **5/10**: ~50% coverage, basic tests, missing critical path coverage
- **3/10**: <30% coverage, tests exist but are shallow
- **1/10**: Minimal or no tests, what exists is trivial
