---
name: Plugin Submission
about: Submit a new plugin to Claude Registry
---

## Plugin Information

**Plugin Name:**
**Version:**
**Author:**
**Repository URL:**

## Description

<!-- Provide a clear and concise description of what your plugin does (2-3 sentences) -->


## Tier

See [CONTRIBUTING.md](https://github.com/ClaudeRegistry/marketplace/blob/main/CONTRIBUTING.md) for what each tier means:

- [ ] **Listed** — plugin stays in my repository; this PR adds a `marketplace.json` entry pointing at it
- [ ] **Verified at commit** — plugin stays in my repository; this PR also pins a commit in `.claude-plugin/external-pins.json`
- [ ] **Verified** — plugin is vendored under `plugins/<name>/` in this PR

## Plugin Details

**Category:**
<!-- Match an existing category in marketplace.json where possible -->

**Components:**
<!-- List what the plugin provides in Claude Code -->
- Commands: `/command-name` — description
- Agents:
- Skills:
- Hooks:

## Checklist

- [ ] The plugin targets **Claude Code**: every command, agent, skill, and tool
      it references actually exists and runs in Claude Code (not another agent
      runtime — plugins built for other frameworks will be declined)
- [ ] Plugin follows the required directory structure (`.claude-plugin/plugin.json`, etc.)
- [ ] `plugin.json` includes all required fields (name, version, description, author, license)
- [ ] All commands are documented with clear descriptions
- [ ] Plugin has been tested end-to-end with Claude Code
- [ ] No secrets, credential harvesting, or undisclosed network calls
- [ ] Hooks (if any) are advisory and fail-safe (see the [verification methodology](https://clauderegistry.com/verification))
- [ ] README.md included with usage instructions
- [ ] Dependencies on external paid services are clearly documented
- [ ] Open source license included (MIT, Apache 2.0, or similar)
- [ ] For Verified tier: `node scripts/verify-plugins.mjs path/to/your-plugin`
      passes locally and the regenerated `verified.json` is committed

## Testing

**How to test:**
<!-- Step-by-step instructions for reviewers to test your plugin in Claude Code -->

1.
2.
3.

**Expected behavior:**


## Additional Notes

<!-- Anything else that would help reviewers -->


---

By submitting this PR, I confirm that:
- I have read and followed the CONTRIBUTING.md guidelines
- This plugin is my original work or I have permission to distribute it
- The plugin is free and open source
- I agree to the Claude Registry terms of distribution
