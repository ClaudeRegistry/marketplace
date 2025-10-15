---
description: Generate comprehensive, professional README.md files for projects with installation, usage, and contribution guidelines
model: inherit
---

# README Generator

You are tasked with creating a comprehensive, professional README.md file for the project. Analyze the codebase thoroughly and generate documentation that helps developers understand, install, and use the project effectively.

## Step 1: Analyze Project Structure

Examine the codebase to understand:

### Project Identification:
- **Project name** (from package.json, pyproject.toml, Cargo.toml, etc.)
- **Description** (from package metadata or existing README)
- **Primary language and framework**
- **Project type** (library, application, CLI tool, API, etc.)
- **Repository information** (if in git)

### Key Files to Read:
- `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`
- Existing `README.md` (to preserve custom sections)
- License file
- Configuration files
- Entry points (main.js, __main__.py, main.go, etc.)
- Tests directory structure

### Technology Stack:
- Programming languages
- Frameworks and libraries
- Build tools
- Testing frameworks
- CI/CD setup
- Database systems
- Cloud services or deployment targets

## Step 2: Generate Comprehensive README Structure

Create a README following this professional structure:

```markdown
# [Project Name]

[One-sentence tagline describing what this project does]

[![License](https://img.shields.io/badge/license-[LICENSE]-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-[VERSION]-green.svg)](package.json)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

[One paragraph description explaining the project's purpose, what problem it solves, and who it's for]

## ✨ Features

- **[Feature 1]**: Description of key feature
- **[Feature 2]**: Description of another important feature
- **[Feature 3]**: Description of what makes this unique
- **[Feature 4]**: Additional capabilities
- **[Feature 5]**: More selling points

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Examples](#examples)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## 🚀 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- [Requirement 1] (version X.X or higher)
- [Requirement 2] (version Y.Y or higher)
- [Requirement 3]

### Using [Package Manager]

```bash
# For npm/Node.js projects:
npm install [package-name]

# For pip/Python projects:
pip install [package-name]

# For cargo/Rust projects:
cargo install [package-name]

# For go projects:
go get [package-name]
```

### From Source

```bash
# Clone the repository
git clone https://github.com/[username]/[repo-name].git
cd [repo-name]

# Install dependencies
[install command]

# Build the project (if applicable)
[build command]
```

### Docker Installation

```bash
docker pull [image-name]
docker run -d -p [port]:[port] [image-name]
```

## ⚡ Quick Start

Get up and running in 60 seconds:

```[language]
[Minimal example showing the most common use case]
[Should be copy-pasteable and work immediately]
[Include expected output]
```

## 📖 Usage

### Basic Usage

[Explain the most common use case with code examples]

```[language]
[Complete, runnable example]
```

### Advanced Usage

[Show more complex scenarios]

#### [Feature/Use Case 1]

```[language]
[Code example]
```

#### [Feature/Use Case 2]

```[language]
[Code example]
```

### Command Line Interface

[If applicable, document CLI commands]

```bash
# List all available commands
[command] --help

# Common commands
[command] [subcommand] [options]

# Examples
[command] start --port 3000
[command] build --production
```

### API Usage

[If it's a library, show API usage]

```[language]
import { [exports] } from '[package-name]';

// Example 1: [Description]
const result = [function]([args]);

// Example 2: [Description]
const instance = new [Class]([options]);
instance.[method]();
```

## ⚙️ Configuration

### Configuration File

Create a configuration file at `[path/to/config]`:

```[json/yaml/toml]
{
  "[option1]": "[value]",
  "[option2]": "[value]",
  "[option3]": {
    "[nested]": "[value]"
  }
}
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `[VAR_NAME]` | [Description] | `[default]` | Yes/No |
| `[VAR_NAME_2]` | [Description] | `[default]` | Yes/No |
| `[VAR_NAME_3]` | [Description] | `[default]` | Yes/No |

### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `[option1]` | `[type]` | [Description] | `[default]` |
| `[option2]` | `[type]` | [Description] | `[default]` |
| `[option3]` | `[type]` | [Description] | `[default]` |

## 💡 Examples

### Example 1: [Common Use Case]

[Brief description of what this example demonstrates]

```[language]
[Complete, working code example]
```

**Output:**
```
[Expected output or result]
```

### Example 2: [Another Use Case]

[Brief description]

```[language]
[Code example]
```

### Example 3: [Advanced Scenario]

[Description of more complex usage]

```[language]
[Code example with comments explaining key parts]
```

## 🛠️ Development

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/[username]/[repo-name].git
cd [repo-name]

# Install development dependencies
[install command]

# Set up pre-commit hooks (if applicable)
[hook setup command]
```

### Project Structure

```
[repo-name]/
├── [src/]              # Source code
│   ├── [module1]/      # [Description]
│   ├── [module2]/      # [Description]
│   └── [main]          # [Description]
├── [tests/]            # Test files
├── [docs/]             # Documentation
├── [config/]           # Configuration files
├── [scripts/]          # Build and utility scripts
├── package.json        # [Or equivalent]
└── README.md           # This file
```

### Build Commands

```bash
# Development build
[build command]

# Production build
[production build command]

# Watch mode for development
[watch command]

# Clean build artifacts
[clean command]
```

### Code Style

This project follows [Style Guide Name] conventions:

- [Convention 1]
- [Convention 2]
- [Convention 3]

Run linter:
```bash
[lint command]
```

Format code:
```bash
[format command]
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
[test command]

# Run specific test file
[test command] [path/to/test]

# Run tests with coverage
[coverage command]

# Run tests in watch mode
[test watch command]
```

### Test Coverage

Current test coverage: [X]%

```bash
# Generate coverage report
[coverage command]

# View coverage report
[view coverage command]
```

### Writing Tests

[Brief guide on how to write tests for this project]

```[language]
[Example test]
```

## 🚢 Deployment

### Production Build

```bash
# Create production build
[build command]

# The build artifacts will be in [directory]
```

### Docker Deployment

```bash
# Build Docker image
docker build -t [image-name] .

# Run container
docker run -d \
  -p [external-port]:[internal-port] \
  -e [ENV_VAR]=[value] \
  [image-name]
```

### Cloud Deployment

#### Deploy to [Platform 1]

```bash
[deployment commands or steps]
```

#### Deploy to [Platform 2]

```bash
[deployment commands or steps]
```

### Environment Setup

For production deployment, ensure:
1. All environment variables are set
2. Database migrations are run
3. SSL certificates are configured
4. Monitoring is enabled

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write or update tests
5. Ensure all tests pass: `[test command]`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Contribution Guidelines

- Write clear, descriptive commit messages
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure CI/CD checks pass
- Reference any related issues

### Development Workflow

1. Check existing issues or create a new one
2. Discuss your approach before implementing large changes
3. Keep pull requests focused on a single concern
4. Request review from maintainers
5. Address feedback promptly

### Code Review Process

[Describe the code review process]

## 📄 License

This project is licensed under the [LICENSE NAME] License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- [Full Documentation]([docs-url])
- [API Reference]([api-docs-url])
- [Examples]([examples-url])
- [FAQ]([faq-url])

### Community

- [GitHub Issues](https://github.com/[username]/[repo-name]/issues) - Bug reports and feature requests
- [Discussions](https://github.com/[username]/[repo-name]/discussions) - Questions and discussions
- [Stack Overflow](https://stackoverflow.com/questions/tagged/[tag]) - Tagged questions
- [Discord/Slack]([invite-link]) - Community chat

### Getting Help

If you encounter issues:

1. Check the [documentation]([docs-url])
2. Search [existing issues](https://github.com/[username]/[repo-name]/issues)
3. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/[tag])
4. Open a [new issue](https://github.com/[username]/[repo-name]/issues/new)

## 📊 Project Status

- [x] Alpha release
- [x] Beta release
- [ ] Stable release v1.0
- [ ] Feature: [Planned feature]
- [ ] Feature: [Another planned feature]

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] [Feature 1]
- [ ] [Feature 2]
- [ ] [Feature 3]

### Version 2.0 (Future)
- [ ] [Major feature 1]
- [ ] [Major feature 2]
- [ ] [Breaking changes if any]

## 👥 Authors and Acknowledgments

### Core Team
- **[Name]** - *[Role]* - [@username](https://github.com/username)
- **[Name]** - *[Role]* - [@username](https://github.com/username)

### Contributors

Thanks to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START -->
[List of contributors with their contributions]
<!-- ALL-CONTRIBUTORS-LIST:END -->

### Acknowledgments

- [Credit or thanks to inspirations, libraries used, etc.]
- [Recognition of major contributors or supporters]

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/[username]/[repo]?style=social)
![GitHub forks](https://img.shields.io/github/forks/[username]/[repo]?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/[username]/[repo]?style=social)
![GitHub followers](https://img.shields.io/github/followers/[username]?style=social)

---

**[Tagline or motto]**

Made with ❤️ by [Author/Team Name]
```

## Step 3: Customize Based on Project Type

### For Libraries/Packages:
- Emphasize installation and API usage
- Include comprehensive API documentation
- Show integration examples
- Document breaking changes between versions

### For Applications:
- Focus on features and screenshots
- Include deployment instructions
- Show configuration options
- Provide troubleshooting guide

### For CLI Tools:
- Document all commands and flags
- Show usage examples for common tasks
- Include shell completion instructions
- Provide configuration file examples

### For APIs:
- Link to OpenAPI/Swagger documentation
- Show authentication examples
- Document rate limiting
- Provide client library examples

## Step 4: Extract Real Information from Codebase

**DO NOT use placeholder text.** Extract actual information:

### From package.json (Node.js):
- name, version, description
- scripts (start, test, build, etc.)
- dependencies and devDependencies
- repository URL
- license

### From pyproject.toml or setup.py (Python):
- project name and version
- dependencies
- entry points
- classifiers and keywords

### From Cargo.toml (Rust):
- package name, version, description
- dependencies
- repository and documentation URLs

### From source code:
- Main entry points
- Key functions and classes
- Configuration options
- Environment variables used
- Command-line arguments

### From tests:
- Example usage patterns
- Expected behaviors
- Integration examples

## Step 5: Add Visual Enhancements

### Badges:
Generate appropriate shields.io badges:
- Build status
- Test coverage
- Version
- License
- Downloads
- Dependencies status

### Emojis:
Use emojis sparingly for visual hierarchy:
- 🚀 Installation
- ⚡ Quick Start
- 📖 Usage
- ⚙️ Configuration
- 💡 Examples
- 🛠️ Development
- 🧪 Testing
- 🚢 Deployment
- 🤝 Contributing
- 📄 License
- 🆘 Support

### Screenshots/GIFs:
If applicable, suggest where to add:
- Demo screenshots
- Terminal recordings (asciinema)
- Architecture diagrams
- Workflow visualizations

## Step 6: Ensure Completeness

Verify the README includes:

✅ **Essential Sections:**
- [ ] Project name and description
- [ ] Installation instructions
- [ ] Quick start example
- [ ] Basic usage documentation
- [ ] License information

✅ **Important Sections:**
- [ ] Features list
- [ ] Configuration options
- [ ] Examples
- [ ] Contributing guidelines
- [ ] Support/contact information

✅ **Optional but Recommended:**
- [ ] Badges
- [ ] Table of contents
- [ ] API documentation or link
- [ ] Testing instructions
- [ ] Deployment guide
- [ ] Roadmap
- [ ] Changelog or version history
- [ ] Acknowledgments

## Step 7: Save and Report

After generating the README:

1. **Check if README.md exists:**
   - If yes: Ask user if they want to replace or merge with existing content
   - If no: Create new README.md

2. **Save to project root:**
   - Use Write tool to create `README.md`

3. **Provide summary:**

```markdown
✅ README.md Generated Successfully

Sections Included:
├─ Project Overview
├─ Features List
├─ Installation Instructions
├─ Quick Start Guide
├─ Usage Examples
├─ Configuration Options
├─ Development Setup
├─ Testing Guide
├─ Contributing Guidelines
├─ License Information
└─ Support & Contact

File Location: ./README.md
Word Count: [X] words
Reading Time: ~[Y] minutes

Next Steps:
1. Review the generated README for accuracy
2. Add screenshots or GIFs if applicable
3. Update repository settings to include topics
4. Consider adding a CONTRIBUTING.md file
5. Create a CHANGELOG.md to track versions

Pro Tips:
- Keep the README updated as the project evolves
- Use relative links for internal documentation
- Include real examples that users can run
- Add a Code of Conduct for larger projects
```

## Important Guidelines:

- **DO** extract real information from the codebase
- **DO** write clear, concise explanations
- **DO** include working, copy-pasteable examples
- **DO** organize content logically
- **DO** use consistent formatting
- **DO NOT** use placeholder text like "[TODO]" or "[Fill this in]"
- **DO NOT** make up fake features or capabilities
- **DO** be honest about project status and limitations
- **DO** write for your target audience (beginners vs experts)

---

Begin by analyzing the project structure and extracting real information, then generate a comprehensive, professional README.
