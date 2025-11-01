# Claude Registry Marketplace

Official Claude Code plugin marketplace. Discover and install community-created plugins for security analysis, code quality, architecture assessment, and developer productivity tools.

## Installation

First, add this marketplace to Claude Code:

```bash
/plugin marketplace add clauderegistry/marketplace
```

Then install plugins:

```bash
/plugin install documate
```

Or use the interactive browser:

```bash
/plugin
```

## Available Plugins

### Clauditor
Comprehensive code auditing and assessment plugin with security vulnerability scanning, architecture analysis, performance profiling, and automated remediation planning.

**Features:**
- Security vulnerability assessment
- Architecture analysis and dependency mapping
- Performance profiling and optimization recommendations
- Automated remediation planning
- Comprehensive reporting

**Install:**
```bash
/plugin install clauditor
```

## Plugin Structure

```
marketplace/
├── marketplace.json           # Marketplace manifest
├── plugins/                   # Approved plugins
│   └── clauditor/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── commands/
│       ├── hooks/
│       └── README.md
└── README.md                  # This file
```

## Contributing

Want to submit your plugin? Check out our [Contributing Guide](CONTRIBUTING.md).

Visit [clauderegistry.com](https://clauderegistry.com) to browse all available plugins.

## About

Claude Registry provides high-quality, curated plugins for enhanced Claude Code workflows.

**Links:**
- Website: [clauderegistry.com](https://clauderegistry.com)
- Repository: [github.com/clauderegistry/marketplace](https://github.com/clauderegistry/marketplace)
- Submit a Plugin: [Contributing Guide](CONTRIBUTING.md)
