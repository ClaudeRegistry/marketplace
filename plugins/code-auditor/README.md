# Code Auditor Plugin

Comprehensive code auditing and assessment plugin for Claude Code with parallel analysis agents, reusable assessment skills, and professional report generation.

## Installation

```bash
# From the Claude Registry marketplace
/plugin marketplace add code-auditor

# Or install directly
/plugin install https://github.com/ClaudeRegistry/marketplace/tree/main/plugins/code-auditor
```

## Quick Start

Run a full codebase audit:
```
/full-audit
```

This dispatches 5 analysis agents in parallel — security, code quality, architecture, performance, and test coverage — then compiles a unified report with a weighted composite score.

## Commands

| Command | Description |
|---------|-------------|
| `/full-audit` | Run comprehensive audit with all agents in parallel |
| `/generate-report` | Generate professional HTML report from assessment results |

## Agents

Agents run autonomously and can also be triggered automatically from natural conversation.

| Agent | Color | Scope |
|-------|-------|-------|
| `security-scanner` | Red | Vulnerability scanning, injection detection, hardcoded secrets, dependency CVEs, compliance |
| `code-quality-analyzer` | Cyan | Code smells, complexity, duplication, standards violations, codebase metrics |
| `architecture-analyzer` | Blue | Architecture discovery, design patterns, dependency analysis, Mermaid diagrams |
| `performance-analyzer` | Yellow | Bottleneck detection, memory leaks, bundle optimization, caching analysis |
| `test-coverage-analyzer` | Green | Test coverage mapping, quality assessment, gap identification |

## Skills

Skills provide reusable assessment methodology that agents and commands consume.

| Skill | Purpose |
|-------|---------|
| `assessment-scoring` | Weighted scoring methodology (Code Quality 25%, Performance 25%, Security 20%, Maintainability 20%, Testing 10%) |
| `security-methodology` | OWASP Top 10, CWE/CVE classification, compliance frameworks (PCI DSS, GDPR, HIPAA, SOC 2) |
| `architecture-diagramming` | C4 Model methodology, Mermaid diagram patterns, reusable diagram templates |

## Typical Workflow

1. Run `/full-audit` for comprehensive analysis
2. Review findings from each agent
3. Check the weighted composite score (0-10)
4. Follow the prioritized remediation roadmap
5. Run `/generate-report` for a shareable HTML report

## Plugin Structure

```
code-auditor/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── full-audit.md
│   └── generate-report.md
├── agents/
│   ├── security-scanner.md
│   ├── code-quality-analyzer.md
│   ├── architecture-analyzer.md
│   ├── performance-analyzer.md
│   └── test-coverage-analyzer.md
├── skills/
│   ├── assessment-scoring/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── security-methodology/
│   │   ├── SKILL.md
│   │   └── references/
│   └── architecture-diagramming/
│       ├── SKILL.md
│       ├── references/
│       └── assets/diagram-templates/
└── README.md
```

## Tech Agnostic

All agents and skills are language and framework agnostic. They automatically detect the technology stack and apply relevant analysis patterns. Supported ecosystems include JavaScript/TypeScript, Python, Java, Go, Ruby, PHP, C#/.NET, Rust, and more.

## Requirements

- Claude Code CLI

## License

MIT
