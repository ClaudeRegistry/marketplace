# Clauditor

A comprehensive codebase assessment plugin for Claude Code that provides security, performance, architecture, and remediation analysis commands.

## Purpose

Clauditor helps developers perform thorough codebase assessments through specialized slash commands. Each command provides detailed analysis and actionable insights for different aspects of your codebase.

## Installation

First, add the Claude Registry marketplace (if you haven't already):

```bash
/plugin marketplace add clauderegistry/marketplace
```

Then install Clauditor:

```bash
/plugin install clauditor
```

Or use the interactive browser:

```bash
/plugin
```

## Usage

Once installed, you can use the following slash commands in any Claude Code session:

### Security Assessment

```
/security-assessment
```

Performs a comprehensive security analysis of your codebase, identifying potential vulnerabilities, insecure patterns, and security best practice violations.

### Performance Assessment

```
/performance-assessment
```

Analyzes your codebase for performance issues, inefficient algorithms, resource usage problems, and optimization opportunities.

### Architecture Assessment

```
/architecture-assessment
```

Evaluates the overall architecture, code organization, design patterns, modularity, and maintainability of your codebase.

### Remediation Plan

```
/remediation
```

Generates a prioritized remediation plan based on assessment results, providing actionable steps to address identified issues.

### Generate HTML Report

```
/generate-report
```

Automatically generates a professional HTML report from all assessment results in the current conversation. The report includes:
- Executive summary with issue counts by severity
- Detailed findings from all assessments
- Remediation recommendations
- Professional styling with severity badges and modern design

Reports are saved to `reports/clauditor-report-[timestamp].html` and can be opened in any browser.

## Command Customization

All commands are defined in the `commands/` directory as markdown files. You can customize the assessment instructions by editing:

- `commands/security-assessment.md`
- `commands/performance-assessment.md`
- `commands/architecture-assessment.md`
- `commands/remediation.md`
- `commands/generate-report.md`

Each command file uses frontmatter for metadata and markdown content for instructions that guide Claude's analysis.

## Typical Workflow

1. Run one or more assessment commands:
   ```
   /security-assessment
   /performance-assessment
   /architecture-assessment
   ```

2. Review the findings in the conversation

3. Generate an HTML report:
   ```
   /generate-report
   ```

4. Open the generated HTML file in your browser to view the formatted report

The `/generate-report` command will automatically collect all assessment results from the conversation and create a comprehensive, professional report.

## Plugin Structure

```
clauditor/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── commands/                     # Slash commands
│   ├── *-assessment.md
│   └── generate-report.md
├── reports/                      # Generated HTML reports (created automatically)
└── README.md                     # This file
```

## Requirements

- Claude Code CLI installed
- Claude Code version compatible with plugins feature

## Managing the Plugin

To disable the plugin temporarily:

```bash
/plugin disable clauditor
```

To enable it again:

```bash
/plugin enable clauditor
```

To uninstall completely:

```bash
/plugin uninstall clauditor
```

## Contributing

Contributions are welcome! Feel free to submit issues, feature requests, or pull requests to improve the assessment commands.

## License

[Specify your license here]


## Version

1.0.0
