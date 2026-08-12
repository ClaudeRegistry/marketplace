<!--
Submitting a plugin? Use the dedicated template by appending
?template=plugin_submission.md to this PR's URL, or fill in the
plugin checklist below. Everything else (docs, scripts, CI): describe
the change and delete the plugin section.
-->

## What does this PR do?



## Type of change

- [ ] Plugin submission (new plugin or version bump)
- [ ] Registry metadata fix (marketplace.json, verified.json, pins)
- [ ] Docs / contributing flow
- [ ] Scripts / CI / verification tooling

## Plugin submissions only

Tier requested (see [CONTRIBUTING.md](../CONTRIBUTING.md)):

- [ ] **Listed** — external repo, marketplace.json entry only
- [ ] **Verified at commit** — external repo + pin in `.claude-plugin/external-pins.json`
- [ ] **Verified** — vendored under `plugins/<name>/`

Checklist:

- [ ] The plugin targets **Claude Code**: every command, agent, skill, and tool
      it references actually exists and runs in Claude Code (not another agent
      runtime)
- [ ] `.claude-plugin/plugin.json` has name, version, description, author, license
- [ ] Tested end-to-end in Claude Code
- [ ] README documents installation and usage
- [ ] No secrets anywhere in the plugin
- [ ] For Verified tier: `node scripts/verify-plugins.mjs path/to/plugin` passes
      locally and regenerated `verified.json` is included

> Note: PRs that modify validation scripts or workflows alongside a plugin
> submission will be asked to split — submissions don't get to change the
> checks they pass through.
