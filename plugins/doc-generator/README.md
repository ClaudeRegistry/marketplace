# Doc Generator

Intelligent documentation automation plugin for Claude Code with commands for generating docs, agents for autonomous documentation review, and skills for documentation standards knowledge.

## Purpose

Doc Generator solves the #1 developer pain point: documentation. Research shows that 60% of developers cite poor documentation as a major productivity barrier, and documentation consumes 11% of work hours. Doc Generator automates documentation tasks, keeps docs in sync with code, and ensures your codebase is always well-documented.

## Features

- **Smart Documentation Generation**: Auto-generate comprehensive docs for functions, classes, and modules in any language
- **Autonomous Documentation Review**: The doc-reviewer agent detects drift and fixes outdated docs automatically
- **OpenAPI/Swagger Generation**: Create professional API documentation from REST endpoints
- **README Automation**: Generate complete, professional README files
- **Architecture Diagrams**: Visualize system architecture using Mermaid diagrams
- **Inline Code Explanations**: The code-explainer agent adds clear comments to complex code sections
- **Auto-Activating Knowledge**: Documentation standards and Mermaid diagram skills activate whenever relevant
- **Multi-Language Support**: Works with JavaScript, TypeScript, Python, Java, Go, Rust, and more

## Installation

First, add the Claude Registry marketplace (if you haven't already):

```bash
/plugin marketplace add clauderegistry/marketplace
```

Then install Doc Generator:

```bash
/plugin install doc-generator
```

Or use the interactive browser:

```bash
/plugin
```

## Commands

Slash commands for explicit documentation generation tasks:

### /doc-generate

Generate comprehensive documentation for code files, functions, or classes.

```
/doc-generate src/utils/helpers.ts
```

**What it does:**
- Analyzes function signatures and implementations
- Generates language-appropriate doc comments (JSDoc, docstrings, Javadoc, etc.)
- Documents parameters, return values, exceptions, and side effects
- Adds practical usage examples
- Inserts documentation directly into code files

**Best for:**
- New code without documentation
- Functions/classes needing comprehensive docs
- Adding examples to existing documentation

### /api-docs

Generate OpenAPI/Swagger documentation from REST APIs.

```
/api-docs
```

**What it does:**
- Discovers API endpoints from code (Express, FastAPI, Spring Boot, etc.)
- Generates OpenAPI 3.0 specification
- Documents request/response schemas with examples
- Creates API usage guides with code examples
- Supports REST, GraphQL, and gRPC APIs

**Best for:**
- Creating API documentation for frontend teams
- Publishing API specs for external developers
- Maintaining API contracts
- Generating client SDKs

### /readme-generate

Create comprehensive, professional README.md files.

```
/readme-generate
```

**What it does:**
- Analyzes project structure and dependencies
- Extracts information from package.json, pyproject.toml, etc.
- Generates complete README with all standard sections
- Includes installation instructions, usage examples, and contribution guidelines
- Adds badges, emojis, and professional formatting

**Best for:**
- New projects needing documentation
- Open source projects
- Improving project discoverability
- Onboarding new developers

### /architecture-diagram

Generate visual architecture diagrams using Mermaid.

```
/architecture-diagram
```

**What it does:**
- Analyzes codebase structure and dependencies
- Creates system architecture diagrams
- Generates data flow and sequence diagrams
- Produces database ER diagrams
- Shows deployment and infrastructure architecture

**Best for:**
- Documenting system design
- Onboarding new team members
- Architecture reviews
- Design documentation

## Agents

Autonomous agents that Claude triggers automatically based on context:

### doc-reviewer

Audits documentation quality and fixes drift autonomously. Combines scanning for issues with updating docs in a single pass.

**Triggers when:**
- A major coding task has been completed and docs may need updating
- You ask about documentation quality ("Are my docs up to date?")
- You want to find and fix documentation issues

**What it does:**
1. **Discovery** — Scans codebase for all source files
2. **Audit** — Checks for missing, incomplete, and outdated documentation
3. **Report** — Presents findings by severity with coverage metrics
4. **Fix** — Updates outdated docs, adds missing docs, fixes parameter mismatches

### code-explainer

Analyzes complex code and adds clear inline comments explaining the "why" behind code decisions.

**Triggers when:**
- You're struggling to understand complex code ("What does this function do?")
- You want code annotated with explanatory comments
- You're onboarding to a new codebase and need to understand flows

**What it does:**
- Identifies complex algorithms, business logic, regex, and magic numbers
- Adds comments explaining reasoning, not just restating code
- Breaks down complex constructs step-by-step
- Provides a summary of what was explained

## Skills

Auto-activating knowledge that enhances all documentation work:

### documentation-standards

Provides language-specific documentation format knowledge (JSDoc, Python docstrings, Javadoc, Go doc, Rustdoc, and more) plus quality standards. Activates automatically whenever documentation work is happening — during commands, agents, or general coding.

### mermaid-diagrams

Provides Mermaid diagram creation knowledge including diagram type selection, syntax patterns, color coding conventions, and best practices. Activates automatically when visual diagrams are needed in any context.

## Typical Workflow

### For New Projects:

1. **Generate README**:
   ```
   /readme-generate
   ```

2. **Document code**:
   ```
   /doc-generate src/
   ```

3. **Create architecture diagrams**:
   ```
   /architecture-diagram
   ```

4. **Generate API docs** (if applicable):
   ```
   /api-docs
   ```

### For Existing Projects:

1. **Audit and fix documentation**: The doc-reviewer agent scans your codebase and fixes issues automatically. Ask:
   ```
   Are my docs up to date?
   ```

2. **Generate docs for new code**:
   ```
   /doc-generate src/new-module.ts
   ```

3. **Understand complex code**: The code-explainer agent activates when you ask:
   ```
   What does this function do? I can't follow the logic.
   ```

### Regular Maintenance:

After major refactors or code changes, the doc-reviewer agent can be triggered by asking about documentation quality. It provides a prioritized list of updates and can fix issues automatically.

## Language Support

Doc Generator works with all major programming languages:

- **JavaScript/TypeScript**: JSDoc format
- **Python**: Google/NumPy/Sphinx docstring styles
- **Java**: Javadoc format
- **Go**: Go doc comments
- **Rust**: Rustdoc format
- **Ruby**: RDoc/YARD format
- **PHP**: PHPDoc format
- **C#**: XML documentation comments
- **And more**: Adapts to language conventions

## Plugin Structure

```
doc-generator/
├── .claude-plugin/
│   └── plugin.json                  # Plugin manifest
├── commands/                        # Slash commands (user-initiated)
│   ├── doc-generate.md              # Generate documentation
│   ├── api-docs.md                  # Generate API documentation
│   ├── readme-generate.md           # Generate README files
│   └── architecture-diagram.md      # Generate architecture diagrams
├── agents/                          # Autonomous agents (context-triggered)
│   ├── doc-reviewer.md              # Audit and fix documentation
│   └── code-explainer.md            # Explain complex code
├── skills/                          # Auto-activating knowledge
│   ├── documentation-standards/     # Language formats & quality standards
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── language-formats.md
│   │       └── quality-checklist.md
│   └── mermaid-diagrams/            # Diagram creation knowledge
│       ├── SKILL.md
│       └── references/
│           └── diagram-patterns.md
└── README.md                        # This file
```

## Requirements

- Claude Code CLI installed
- Claude Code version compatible with plugins feature
- Git repository (recommended for best results)

## Best Practices

### When to Use What:

- **Starting a new project**: `/readme-generate` then `/doc-generate`
- **Code without docs**: `/doc-generate`
- **After refactoring**: Ask for a documentation review (triggers doc-reviewer agent)
- **Complex code**: Ask what the code does (triggers code-explainer agent)
- **Building APIs**: `/api-docs`
- **System design**: `/architecture-diagram`
- **Regular maintenance**: Ask "Are my docs up to date?" periodically

### Documentation Tips:

1. **Document as you code**: Use `/doc-generate` on new functions immediately
2. **Keep docs in sync**: Ask the doc-reviewer agent to check after major changes
3. **Focus on public APIs**: Prioritize documentation for exported functions
4. **Use examples**: Always include usage examples for non-trivial code
5. **Explain the why**: Document business logic and design decisions
6. **Update README**: Keep README.md current with `/readme-generate`

## Managing the Plugin

To disable the plugin temporarily:

```bash
/plugin disable doc-generator
```

To enable it again:

```bash
/plugin enable doc-generator
```

To uninstall completely:

```bash
/plugin uninstall doc-generator
```

## Use Cases

### For Solo Developers:
- Generate professional documentation for open source projects
- Create comprehensive READMEs that attract contributors
- Document complex algorithms for future reference
- Maintain API documentation effortlessly

### For Teams:
- Onboard new developers with architecture diagrams
- Keep documentation in sync across the team
- Enforce documentation standards
- Reduce time spent on documentation reviews

### For Open Source:
- Generate contributor-friendly documentation
- Create professional README files
- Maintain comprehensive API docs
- Attract and retain contributors

### For APIs:
- Generate OpenAPI specs automatically
- Keep API documentation current
- Create client examples in multiple languages
- Document breaking changes clearly

## Troubleshooting

### Command not found:
Ensure the plugin is installed:
```bash
/plugin
```
Then check if Doc Generator appears in your installed plugins list.

### Documentation not generated:
Check that the file path is correct and the file is readable.

### Language not supported:
Doc Generator adapts to most languages. If you encounter issues, the plugin will use generic documentation format.

### Documentation style mismatch:
Doc Generator detects and matches the existing documentation style in your project.

## Contributing

Contributions are welcome! To improve Doc Generator:

1. Fork the repository
2. Create a feature branch
3. Make your changes to files in `commands/`, `agents/`, or `skills/`
4. Test with various codebases
5. Submit a pull request

### Component Development:

- **Commands**: Markdown files in `commands/` with YAML frontmatter
- **Agents**: Markdown files in `agents/` with triggering examples
- **Skills**: Directories in `skills/` with a `SKILL.md` and optional `references/`

See existing components for examples.

## License

MIT

## Version

2.0.0

## Acknowledgments

Built for developers who value clear, comprehensive documentation but hate writing it manually. Inspired by the common pain point that 60% of developers cite poor documentation as a major productivity barrier.

---

**Stop writing documentation manually. Let Doc Generator automate it.**

Made with love for the Claude Code community
