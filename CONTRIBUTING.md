# Contributing to Claude Registry

Thank you for your interest in contributing to Claude Registry! We're excited to see what plugins you'll create for the Claude Code community.

## How to Submit a Plugin

### 1. Prepare Your Plugin

Your plugin must follow the Claude Code plugin structure:

```
your-plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Required: Plugin metadata
├── commands/                # Optional: Custom slash commands
│   └── your-command.md
├── agents/                  # Optional: Custom agents
├── hooks/                   # Optional: Event handlers
├── README.md                # Required: Usage documentation
└── LICENSE                  # Required: Open source license
```

#### Required: plugin.json

Your `plugin.json` must include:

```json
{
  "name": "your-plugin-name",
  "version": "1.0.0",
  "description": "Clear, concise description of what your plugin does",
  "author": {
    "name": "Your Name",
    "url": "https://github.com/yourusername"
  },
  "repository": "https://github.com/yourusername/your-plugin-repo",
  "license": "MIT"
}
```

#### Required: README.md

Your README should include:
- Clear description of what the plugin does
- Installation instructions
- Usage examples
- List of all commands/features
- Any dependencies or requirements
- License information

### 2. Test Your Plugin Locally

Before submitting, test your plugin thoroughly:

```bash
# Install Claude Code (if not already installed)
npm install -g @anthropic/claude-code

# Test your plugin locally
cd your-plugin-directory
# Run your commands and verify they work as expected
```

### 3. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/marketplace.git
cd marketplace
```

### 4. Add Your Plugin to Submissions

```bash
# Create the submissions directory if it doesn't exist
mkdir -p submissions

# Copy your plugin to the submissions directory
cp -r /path/to/your-plugin submissions/your-plugin-name

# Create a new branch
git checkout -b plugin/your-plugin-name

# Commit your changes
git add submissions/your-plugin-name
git commit -m "Add [your-plugin-name] plugin"

# Push to your fork
git push origin plugin/your-plugin-name
```

### 5. Create a Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request"
3. Select the "Plugin Submission" template
4. Fill out all sections of the template
5. Submit your PR

### 6. Review Process

After submission:

1. **Automated Checks** - Our GitHub Action will validate your plugin structure
2. **Manual Review** - We'll review your plugin for:
   - Code quality and security
   - Functionality and usefulness
   - Documentation completeness
   - Compatibility with Claude Code
3. **Feedback** - We may request changes or improvements
4. **Approval** - Once approved, we'll move your plugin from `submissions/` to `marketplace/plugins/` and update the marketplace

## Plugin Guidelines

### ✅ Do

- Write clear, helpful documentation
- Test thoroughly before submitting
- Use descriptive command names
- Handle errors gracefully
- Follow security best practices
- Keep dependencies minimal
- Use semantic versioning

### ❌ Don't

- Submit malicious code
- Include credentials or API keys
- Require paid services without clear documentation
- Copy other plugins without permission
- Use offensive or inappropriate content
- Submit untested code

## Quality Standards

We look for plugins that:

- **Solve a real problem** - Provide genuine value to Claude Code users
- **Are well-documented** - Clear README with examples
- **Work reliably** - Tested and functional
- **Are secure** - No vulnerabilities or malicious code
- **Follow conventions** - Use standard Claude Code patterns

## Categories

We organize plugins into categories:
- **Security** - Security scanning, vulnerability analysis
- **Testing** - Test generation, test runners
- **Documentation** - Docs generation, API documentation
- **Code Quality** - Linting, formatting, refactoring
- **Performance** - Profiling, optimization
- **DevOps** - CI/CD, deployment, infrastructure
- **AI/ML** - Machine learning, data science tools
- **Utilities** - General-purpose tools

Choose appropriate tags for your plugin.

## Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards compatible)
- **PATCH** version for bug fixes

## Licensing

All plugins must use an open source license:
- MIT (recommended)
- Apache 2.0
- BSD
- GPL (any version)

## Updates

To update an existing plugin:

1. Update your plugin in the `submissions/` directory
2. Increment the version in `plugin.json`
3. Submit a new PR with clear changelog
4. Reference the original PR in your description

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/clauderegistry/marketplace/discussions)
- **Issues?** Report bugs in [Issues](https://github.com/clauderegistry/marketplace/issues)
- **Examples?** Check existing plugins in the `plugins/` directory

## Code of Conduct

Be respectful, constructive, and collaborative. We're building a community together.

---

Thank you for contributing to Claude Registry! 🚀
