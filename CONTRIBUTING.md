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

### 3. Publish Your Plugin Repository

Your plugin should be hosted in a public Git repository (GitHub, GitLab, Bitbucket, etc.):

```bash
# Create a new repository for your plugin
# Example: https://github.com/yourusername/your-plugin-name

# Push your plugin code to the repository
git init
git add .
git commit -m "Initial plugin release"
git remote add origin https://github.com/yourusername/your-plugin-name.git
git push -u origin main
```

Ensure your repository is publicly accessible so users can install your plugin.

### 4. Fork and Clone the Marketplace

```bash
# Fork the marketplace repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/marketplace.git
cd marketplace
```

### 5. Add Your Plugin to marketplace.json

Edit `.claude-plugin/marketplace.json` to add your plugin entry:

```bash
# Create a new branch
git checkout -b add-your-plugin-name

# Edit the marketplace.json file
```

Add your plugin to the `plugins` array using the Git URL format:

```json
{
  "name": "your-plugin-name",
  "source": {
    "source": "url",
    "url": "https://github.com/yourusername/your-plugin-name.git"
  },
  "description": "Clear, concise description of what your plugin does",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "url": "https://github.com/yourusername"
  },
  "repository": "https://github.com/yourusername/your-plugin-name",
  "license": "MIT",
  "keywords": [
    "category",
    "relevant",
    "tags"
  ],
  "strict": false
}
```

**Important**: The `source` field tells Claude Code where to find your plugin. We use the Git URL format which supports any Git hosting service (GitHub, GitLab, Bitbucket, self-hosted, etc.).

#### Source Field Options

While we recommend the Git URL format shown above, the source field supports multiple formats:

1. **Git URL (Recommended)** - Works with any Git hosting:
```json
"source": {
  "source": "url",
  "url": "https://github.com/yourusername/your-plugin-name.git"
}
```

2. **GitHub (Alternative)** - Shorthand for GitHub repositories:
```json
"source": {
  "source": "github",
  "repo": "yourusername/your-plugin-name"
}
```

3. **Relative Path** - Only for plugins hosted in this repository:
```json
"source": "./plugins/your-plugin-name"
```

For external submissions, always use option 1 (Git URL format).

```bash
# Commit your changes
git add .claude-plugin/marketplace.json
git commit -m "Add [your-plugin-name] plugin to marketplace"

# Push to your fork
git push origin add-your-plugin-name
```

### 6. Create a Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request"
3. Select the "Plugin Submission" template
4. Fill out all sections of the template:
   - Plugin name and description
   - Link to your plugin repository
   - Brief explanation of what it does
   - Testing steps you've completed
5. Submit your PR

### 7. Review Process

After submission:

1. **Automated Checks** - Our GitHub Action will validate your:
   - Plugin repository accessibility
   - Plugin structure and metadata
   - marketplace.json syntax
2. **Manual Review** - We'll review your plugin for:
   - Code quality and security
   - Functionality and usefulness
   - Documentation completeness
   - Compatibility with Claude Code
3. **Feedback** - We may request changes or improvements to either:
   - Your plugin repository
   - Your marketplace.json entry
4. **Approval** - Once approved, we'll:
   - Merge your marketplace.json entry
   - Your plugin will be available for installation via Claude Code
   - Users will install directly from your repository

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

1. Update your plugin code in your repository
2. Increment the version in `plugin.json` following semantic versioning
3. Create a Git tag for the new version (optional but recommended)
4. Update the version in marketplace.json (submit a PR to this repo)
5. Include a clear changelog in your PR description

Users will automatically get updates when they pull from your plugin repository.

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/clauderegistry/marketplace/discussions)
- **Issues?** Report bugs in [Issues](https://github.com/clauderegistry/marketplace/issues)
- **Examples?** Check the marketplace.json to see existing plugins and their repository URLs

## Code of Conduct

Be respectful, constructive, and collaborative. We're building a community together.

---

Thank you for contributing to Claude Registry! 🚀
