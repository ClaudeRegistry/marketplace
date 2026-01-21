# DocuMate

Intelligent documentation automation plugin for Claude Code that generates, maintains, and syncs code documentation across your entire codebase.

## Purpose

DocuMate solves the #1 developer pain point: documentation. Research shows that 60% of developers cite poor documentation as a major productivity barrier, and documentation consumes 11% of work hours. DocuMate automates documentation tasks, keeps docs in sync with code, and ensures your codebase is always well-documented.

## Features

- **Smart Documentation Generation**: Auto-generate comprehensive docs for functions, classes, and modules in any language
- **Documentation Drift Detection**: Identify outdated docs that no longer match code implementation
- **OpenAPI/Swagger Generation**: Create professional API documentation from REST endpoints
- **README Automation**: Generate complete, professional README files
- **Architecture Diagrams**: Visualize system architecture using Mermaid diagrams
- **Inline Code Explanations**: Add clear comments to complex code sections
- **Multi-Language Support**: Works with JavaScript, TypeScript, Python, Java, Go, Rust, and more

## Installation

First, add the Claude Registry marketplace (if you haven't already):

```bash
/plugin marketplace add clauderegistry/marketplace
```

Then install DocuMate:

```bash
/plugin install documate
```

Or use the interactive browser:

```bash
/plugin
```

## Commands

Once installed, you can use the following slash commands in any Claude Code session:

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

### /doc-sync-check

Scan codebase to identify missing, incomplete, or outdated documentation.

```
/doc-sync-check
```

**What it does:**
- Scans all source files in the project
- Identifies undocumented functions and classes
- Detects documentation drift (docs that don't match code)
- Calculates documentation coverage metrics
- Provides actionable recommendations with priority levels

**Best for:**
- Auditing documentation quality
- Finding documentation gaps
- Identifying outdated docs after refactoring
- Tracking documentation coverage over time

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

### /doc-update

Update existing documentation to match current code implementation.

```
/doc-update src/services/user-service.ts
```

**What it does:**
- Compares documentation with actual code
- Fixes parameter and return type mismatches
- Updates documentation for changed behavior
- Adds missing information (new parameters, side effects)
- Preserves existing documentation style

**Best for:**
- Fixing documentation drift after refactoring
- Updating docs after code changes
- Maintaining documentation accuracy
- Syncing docs with implementation

### /explain-code

Add clear, inline explanatory comments to complex code.

```
/explain-code src/algorithms/quicksort.js
```

**What it does:**
- Identifies complex code sections needing explanation
- Adds comments explaining "why" not just "what"
- Documents algorithms, business logic, and edge cases
- Explains regex patterns and magic numbers
- Adds performance notes and trade-off discussions

**Best for:**
- Complex algorithms
- Business logic with domain rules
- Performance-critical code
- Code review preparation
- Knowledge transfer

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

1. **Audit documentation quality**:
   ```
   /doc-sync-check
   ```

2. **Fix high-priority gaps**:
   ```
   /doc-generate src/high-priority-file.ts
   ```

3. **Update outdated documentation**:
   ```
   /doc-update src/changed-file.ts
   ```

4. **Add explanations to complex code**:
   ```
   /explain-code src/complex-algorithm.py
   ```

### Regular Maintenance:

Run weekly or after major changes:

```
/doc-sync-check
```

This identifies documentation drift and provides a prioritized list of updates needed.

## Language Support

DocuMate works with all major programming languages:

- **JavaScript/TypeScript**: JSDoc format
- **Python**: Google/NumPy/Sphinx docstring styles
- **Java**: Javadoc format
- **Go**: Go doc comments
- **Rust**: Rustdoc format
- **Ruby**: RDoc/YARD format
- **PHP**: PHPDoc format
- **C#**: XML documentation comments
- **And more**: Adapts to language conventions

## Documentation Standards

DocuMate follows industry best practices:

- **Language-specific formats**: Uses standard doc comment formats for each language
- **Complete information**: Documents all parameters, return values, and exceptions
- **Practical examples**: Includes working code examples
- **Context and rationale**: Explains "why" not just "what"
- **Maintainability**: Keeps documentation in sync with code

## Plugin Structure

```
documate/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── commands/                     # Slash commands
│   ├── doc-generate.md          # Generate documentation
│   ├── doc-sync-check.md        # Audit documentation quality
│   ├── api-docs.md              # Generate API documentation
│   ├── readme-generate.md       # Generate README files
│   ├── architecture-diagram.md  # Generate architecture diagrams
│   ├── doc-update.md            # Update existing documentation
│   └── explain-code.md          # Add inline code explanations
└── README.md                    # This file
```

## Requirements

- Claude Code CLI installed
- Claude Code version compatible with plugins feature
- Git repository (recommended for best results)

## Best Practices

### When to Use Each Command:

- **Starting a new project**: `/readme-generate` → `/doc-generate`
- **Code without docs**: `/doc-generate`
- **After refactoring**: `/doc-update` → `/doc-sync-check`
- **Complex new code**: `/explain-code`
- **Building APIs**: `/api-docs`
- **System design**: `/architecture-diagram`
- **Regular maintenance**: `/doc-sync-check` weekly

### Documentation Tips:

1. **Document as you code**: Use `/doc-generate` on new functions immediately
2. **Keep docs in sync**: Run `/doc-sync-check` regularly
3. **Focus on public APIs**: Prioritize documentation for exported functions
4. **Use examples**: Always include usage examples for non-trivial code
5. **Explain the why**: Document business logic and design decisions
6. **Update README**: Keep README.md current with `/readme-generate`

## Managing the Plugin

To disable the plugin temporarily:

```bash
/plugin disable documate
```

To enable it again:

```bash
/plugin enable documate
```

To uninstall completely:

```bash
/plugin uninstall documate
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
Then check if DocuMate appears in your installed plugins list.

### Documentation not generated:
Check that the file path is correct and the file is readable.

### Language not supported:
DocuMate adapts to most languages. If you encounter issues, the plugin will use generic documentation format.

### Documentation style mismatch:
DocuMate detects and matches the existing documentation style in your project.

## Contributing

Contributions are welcome! To improve DocuMate:

1. Fork the repository
2. Create a feature branch
3. Make your changes to command files in `commands/`
4. Test with various codebases
5. Submit a pull request

### Command Development:

Commands are markdown files with:
- **Frontmatter**: Metadata (description, arguments)
- **Instructions**: Detailed prompt for Claude Code to execute

See existing commands for examples.

## License

MIT

## Version

1.0.0

## Acknowledgments

Built for developers who value clear, comprehensive documentation but hate writing it manually. Inspired by the common pain point that 60% of developers cite poor documentation as a major productivity barrier.

---

**Stop writing documentation manually. Let DocuMate automate it.**

Made with ❤️ for the Claude Code community
