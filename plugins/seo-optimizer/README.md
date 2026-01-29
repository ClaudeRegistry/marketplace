# SEO Optimizer

Comprehensive SEO optimization plugin for Claude Code. Audit, optimize, and review website content for improved search engine performance.

## Purpose

The SEO Optimizer plugin helps developers and content creators implement SEO best practices directly from the command line. It provides tools for auditing existing SEO implementation, optimizing content for search, and applying precision micro-edits that improve discoverability without altering the original voice or style.

## Installation

```bash
# Install from the Claude Registry marketplace
claude mcp add clauderegistry -- npx -y clauderegistry

# Or install just this plugin
claude mcp add seo-optimizer -- npx -y clauderegistry/seo-optimizer
```

## Usage

### Commands

#### `/seo-audit` - SEO Compliance Audit

Perform a comprehensive SEO audit on HTML files or web applications.

```bash
# Audit a specific file
/seo-audit src/index.html

# Audit an entire directory
/seo-audit ./public

# Audit a Next.js app
/seo-audit app/layout.tsx
```

**What it checks:**
- Essential meta tags (title, description, viewport)
- Open Graph tags for social sharing
- Twitter Card tags
- Heading hierarchy (H1-H6 structure)
- Image alt text
- robots.txt and sitemap.xml
- Canonical URLs
- Structured data (Schema.org)

#### `/seo-optimize` - Content Optimization

Apply minimal, high-precision SEO edits to improve organic search performance.

```bash
# Optimize a content file
/seo-optimize content/blog/my-article.md

# Optimize an HTML page
/seo-optimize pages/about.html
```

**What it does:**
- Enhances keyword placement naturally
- Optimizes headings for search intent
- Improves meta-friendly structure
- Adds internal linking opportunities
- Preserves original voice and tone

#### `/seo-reviewer` - Micro-Edit Review

Apply minimal SEO micro-edits as part of a content review pipeline. Stricter than optimize, with a 5% character change limit.

```bash
# Review and apply micro-edits
/seo-reviewer content/landing-page.md
```

**Constraints:**
- Maximum 5% character change
- No alteration of voice or narrative
- YMYL content protection (health/finance/legal)
- No fabrication of facts or data

### Skill

#### SEO Expert

Activate the SEO Expert skill for interactive consultation on SEO topics.

**Expertise areas:**
- Technical SEO (crawlability, Core Web Vitals, structured data)
- On-page SEO (meta tags, headings, content optimization)
- Platform-specific SEO (Next.js, React, Vue, WordPress)
- Content strategy and search intent

**Example interactions:**
- "How do I implement structured data for my blog?"
- "What's wrong with my meta tag setup?"
- "Help me optimize this page for Core Web Vitals"
- "Review my robots.txt configuration"

## Typical Workflow

### 1. Audit Existing SEO

Start by auditing your current SEO implementation:

```bash
/seo-audit ./src
```

This generates a comprehensive report with:
- Overall SEO score
- Critical issues to fix immediately
- Warnings to review
- Passed checks
- Prioritized recommendations

### 2. Fix Critical Issues

Use the SEO Expert skill to understand and fix critical issues:

```
User: The audit found my site is missing structured data. How do I add it?
SEO Expert: [Provides framework-specific implementation guidance]
```

### 3. Optimize Content

Run the optimizer on content pages:

```bash
/seo-optimize content/services.md
```

Review the changes and apply them to your files.

### 4. Final Review

Before publishing, run the micro-editor for final polish:

```bash
/seo-reviewer content/services.md
```

This applies conservative, high-precision edits that won't alter your voice.

## Plugin Structure

```
seo-optimizer/
├── .claude-plugin/
│   └── plugin.json         # Plugin metadata
├── commands/
│   ├── seo-audit.md        # SEO compliance audit
│   ├── seo-optimize.md     # Content optimization
│   └── seo-reviewer.md     # Micro-edit review
├── skills/
│   └── seo-expert.md       # Interactive SEO consultant
└── README.md               # This file
```

## SEO Checklist

Use this checklist alongside the plugin:

### Essential Meta Tags
- [ ] Title tag (50-60 characters)
- [ ] Meta description (70-160 characters, optimal: 120-155)
- [ ] Viewport meta tag
- [ ] Canonical URL

### Social Tags
- [ ] Open Graph title, description, image, URL
- [ ] Twitter Card tags

### Structure
- [ ] Single H1 per page
- [ ] Proper H2-H6 hierarchy
- [ ] Alt text on all images
- [ ] Semantic HTML

### Technical Files
- [ ] robots.txt
- [ ] sitemap.xml
- [ ] Structured data (JSON-LD)

## Requirements

- Claude Code CLI
- Access to HTML/content files to audit and optimize

## Framework Support

The plugin works with:
- Static HTML/CSS sites
- React (Create React App, Next.js)
- Vue (Nuxt.js)
- Angular (Universal)
- Svelte (SvelteKit)
- Static site generators (Gatsby, Eleventy, Hugo, Astro)
- WordPress themes
- Any HTML-based content

## Managing the Plugin

### View installed plugins
```bash
claude plugins list
```

### Disable temporarily
```bash
claude plugins disable seo-optimizer
```

### Re-enable
```bash
claude plugins enable seo-optimizer
```

### Uninstall
```bash
claude mcp remove seo-optimizer
```

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](../../CONTRIBUTING.md) guide in the main marketplace repository.

## License

MIT License - see [LICENSE](../../LICENSE) for details.
