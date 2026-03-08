---
description: Run a comprehensive code audit by dispatching all analysis agents in parallel
model: inherit
---

Execute a full codebase audit by running all code-auditor analysis agents concurrently.

## Process

### Step 1: Detect Technology Stack

Before dispatching agents, quickly identify:
- Primary language(s) by scanning file extensions
- Framework(s) by checking package manifests (package.json, pom.xml, build.gradle, requirements.txt, go.mod, Cargo.toml, Gemfile, *.csproj, etc.)
- Project structure pattern (monolith, microservices, monorepo)

Report the detected stack to the user before proceeding.

### Step 2: Dispatch Analysis Agents

Launch ALL 5 agents in parallel using the Agent tool. Each agent works independently on its domain:

1. **security-scanner** — Scans for vulnerabilities, hardcoded secrets, injection risks, dependency CVEs
2. **code-quality-analyzer** — Measures code quality, smells, complexity, duplication, standards
3. **architecture-analyzer** — Discovers architecture, maps dependencies, generates diagrams
4. **performance-analyzer** — Identifies bottlenecks, memory leaks, optimization opportunities
5. **test-coverage-analyzer** — Evaluates test coverage, quality, distribution, and gaps

Each agent should be given context about the detected tech stack.

### Step 3: Compile Results

After all agents complete, compile their findings into a unified report:

1. Present each agent's findings under its own section
2. Cross-reference findings (e.g., untested security-critical code, performance issues in complex modules)
3. Identify overlapping concerns across domains

### Step 4: Generate Final Score

Using the assessment-scoring methodology, calculate the weighted composite score:

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Code Quality | X/10 | 25% | X.XX |
| Performance | X/10 | 25% | X.XX |
| Security | X/10 | 20% | X.XX |
| Maintainability | X/10 | 20% | X.XX |
| Testing | X/10 | 10% | X.XX |
| **Total** | — | 100% | **X.XX/10** |

Score interpretation:
- **0-2: Critical** — Immediate intervention required
- **2-4: Poor** — Significant issues affecting development
- **4-6: Fair** — Notable issues but manageable
- **6-8: Good** — Minor issues, well-maintained
- **8-10: Excellent** — Industry best practices

### Step 5: Provide Remediation Roadmap

Based on all findings, create a prioritized roadmap:

**Immediate (Critical/Blocker)**
- Security vulnerabilities
- Memory leaks
- Blocking performance issues

**Short-term (1-4 weeks)**
- Code quality improvements
- Test coverage expansion
- Dependency updates

**Long-term (1-3 months)**
- Architectural improvements
- Comprehensive test coverage
- Technical debt reduction

### Step 6: Offer Report Generation

After presenting results, inform the user they can run `/generate-report` to export the assessment as a professional HTML document with PDF export capability.

## Important Notes

- All analysis must be based on actual code findings — never fabricate metrics
- Report specific file paths, line numbers, and code snippets as evidence
- If the codebase is very large, focus agents on the most critical areas first
- The composite score should reflect the weighted methodology — do not round or adjust subjectively
