# Plugin Benchmarker

Benchmark Claude Code plugins by validating structure, reviewing skill quality, and comparing with-skill vs without-skill performance — then producing actionable per-file KEEP/TRIM/DELETE recommendations.

## Why Plugin Benchmarker?

Anthropic provides excellent tools for plugin development: `plugin-dev` for structural validation and skill quality review, and `skill-creator` for creating and testing skills. But none of them answer the harder question: **is each file in your plugin's skills actually earning its token cost?**

Every skill file loaded into context consumes tokens on every invocation. A skill with 3,000 tokens of references might only need 800 tokens of genuinely non-obvious content. The rest? Claude already knows it.

Plugin Benchmarker combines all three tools into a single pipeline and adds a distinct value layer:

- **Structural validation** via `plugin-dev:plugin-validator` — catch manifest, naming, and security issues before benchmarking
- **Skill quality review** via `plugin-dev:skill-reviewer` — verify descriptions, progressive disclosure, and best practices
- **Audit/classification** of every skill file — is it native knowledge (Claude already knows), a discovery heuristic (non-obvious, high value), domain-specific knowledge (essential), or template/boilerplate?
- **With-skill vs without-skill benchmarking** — the without-skill baseline is the truth test. If Claude produces equivalent output without the skill, those references are pure overhead.
- **Per-file KEEP/TRIM/DELETE recommendations** with section-level annotations — not just "this file is redundant" but "lines 46-80 are native knowledge, lines 81-120 are essential."

## Dependencies

**Requires both:**
- [plugin-dev](https://github.com/anthropics/claude-code-plugins) (Anthropic official) — for plugin-validator and skill-reviewer agents
- [skill-creator](https://github.com/anthropics/claude-code-plugins) (Anthropic official) — for grading methodology and benchmark aggregation

Install them first:

```bash
/install-plugin plugin-dev@anthropic
/install-plugin skill-creator@anthropic
```

## Installation

First, add the Claude Registry marketplace (if you haven't already):

```bash
/plugin marketplace add clauderegistry/marketplace
```

Then install Plugin Benchmarker:

```bash
/plugin install plugin-benchmarker@clauderegistry
```

## Commands

### /benchmark-plugin

Run a complete benchmark cycle on a plugin: validate structure, review skill quality, audit files, run parallel comparisons, grade results, and produce recommendations.

```
/benchmark-plugin ./plugins/code-auditor/
```

**Three-phase process:**

#### Phase 1: Plugin Health (pre-benchmark validation)

1. **Structural validation** — Dispatches `plugin-dev:plugin-validator` to check manifest, directory structure, component frontmatter, naming conventions, and security. Critical issues flagged before spending tokens on benchmarks.
2. **Skill quality review** — Dispatches `plugin-dev:skill-reviewer` for each skill in the plugin (in parallel). Reviews description quality, trigger phrases, progressive disclosure, writing style, and best practices.
3. **Approval gate** — You see the full plugin health picture and decide whether to proceed or fix issues first.

#### Phase 2: Skill Benchmarking (per skill)

4. **Audit** — Reads SKILL.md and all references/assets/examples. Classifies each file as native knowledge, discovery heuristic, domain-specific, or template/boilerplate. Approval gate.
5. **Design test cases** — Creates 3 realistic prompts exercising the skill's core functionality. Approval gate.
6. **Define assertions** — 2-4 objectively verifiable checks per test case. Approval gate.
7. **Run parallel benchmarks** — For each test case, spawns two agents simultaneously: one WITH the skill loaded, one WITHOUT (baseline). All 6 agents launch in a single message.
8. **Grade** — Evaluates both configurations against assertions. Identifies discriminating assertions (skill-only wins) vs non-discriminating (both pass).

#### Phase 3: Report & Recommendations

9. **Compile report** — Plugin health summary, comparison table with pass rates/token overhead/duration, and per-test-case assertion grading.
10. **Recommend** — Per-file KEEP/TRIM/DELETE with section-level annotations and estimated token savings.

**Input formats:**
```
/benchmark-plugin ./plugins/code-auditor/                              # Direct path
/benchmark-plugin code-auditor                                          # Marketplace auto-detect
/benchmark-plugin ~/.claude/plugins/cache/some-plugin/                 # Installed plugin
```

## Agents

Autonomous agents that can also be triggered independently:

### skill-file-auditor

Reads every file in a skill directory and classifies each one by the type of value it provides.

**Triggers when:**
- You ask "What does this skill actually add?"
- You want to understand if skill content is redundant
- You're questioning whether skill files are worth the token cost

**Classification categories:**

| Category | What it means | Value signal |
|---|---|---|
| Native knowledge | Claude already knows this from training | Low — potential overhead |
| Discovery heuristic | Non-obvious "where to look" guidance | High — hard to derive from first principles |
| Domain-specific | Specialized knowledge Claude lacks | Essential — genuine capability extension |
| Template/boilerplate | Pre-built output structures | Conditional — only valuable if complex |

**Output:** File-level classification table with confidence ratings, section-level detail for mixed files, and overall value profile.

### recommendation-engine

Combines audit classifications with benchmark results to produce actionable per-file recommendations.

**Triggers when:**
- You have benchmark results and want to know what to keep/cut
- You want to reduce skill token overhead
- You ask which parts of a skill made a difference

**Decision logic:** Cross-references each file's classification with whether its corresponding assertions only passed with the skill (discriminating) or passed in both configurations (non-discriminating). Files whose content maps to non-discriminating assertions are candidates for removal.

**Output:** Per-file KEEP/TRIM/DELETE with section-level trim instructions, estimated token savings, and efficiency analysis.

## Typical Workflow

### Benchmarking a Plugin You Built:

```
/benchmark-plugin ./plugins/my-plugin/
```

1. **Phase 1** — Review structural validation and skill quality. Fix any critical issues.
2. **Phase 2** — For each skill: review audit, approve test cases, approve assertions, wait for benchmarks.
3. **Phase 3** — Review the report. Act on KEEP/TRIM/DELETE recommendations.

### Benchmarking a Marketplace Plugin:

```
/benchmark-plugin code-auditor
```

Same workflow, but helps you decide whether a marketplace plugin's skills are worth the context overhead for your use case.

### Quick Audit Without Full Benchmark:

Just trigger the skill-file-auditor agent directly:

```
Audit the files in ./plugins/code-auditor/skills/security-methodology/
```

This gives you the classification table without running benchmarks — useful for a quick sanity check.

## Key Principles

- **Validate before benchmarking.** Structural issues and skill quality problems should be fixed before spending tokens on benchmark runs.
- **The without-skill baseline is the truth test.** If Claude produces equivalent output without the skill, those references are overhead.
- **Discovery heuristics add real value.** Non-obvious "where to look" knowledge is hard to derive from first principles. These files earn their token cost.
- **Syntax references and well-known frameworks are usually redundant.** Claude already knows popular frameworks, standard patterns, and well-documented APIs.
- **Templates are rarely used.** Claude generates output from scratch based on instructions rather than filling in templates.
- **Token cost compounds.** A skill's files are loaded on every invocation. A 2,000-token reference file that doesn't improve output quality costs 2,000 tokens every single time.

## Understanding the Report

### Phase 1: Plugin Health

The validation and skill reviews catch issues early:
- **Critical issues** from plugin-validator should be fixed before benchmarking
- **Skill quality ratings** from skill-reviewer inform whether poor benchmark results are due to skill content or skill structure

### Phase 2: Comparison Table

```
| Metric | With Skill | Without Skill | Delta |
|--------|-----------|---------------|-------|
| Pass rate | 83% | 50% | +33% |
```

A +33% pass rate delta with +1,700 token overhead means the skill is earning its cost. A +5% delta with +3,000 token overhead means most of the skill is dead weight.

### Discriminating vs Non-Discriminating Assertions

- **Discriminating**: Only passes WITH the skill. This is the skill's genuine contribution.
- **Non-discriminating**: Passes in BOTH configurations. The corresponding skill content is redundant.

### KEEP/TRIM/DELETE

- **KEEP**: Provides non-obvious value backed by benchmark evidence. Don't touch it.
- **TRIM**: Contains useful content buried in redundant material. The recommendation includes specific line ranges to cut vs. keep.
- **DELETE**: Claude already knows this. Removing it saves tokens with zero quality loss.

## Plugin Structure

```
plugin-benchmarker/
├── .claude-plugin/
│   └── plugin.json                    # Plugin manifest
├── commands/
│   └── benchmark-plugin.md           # Full benchmark workflow
├── agents/
│   ├── skill-file-auditor.md         # Classify skill files by value
│   └── recommendation-engine.md      # KEEP/TRIM/DELETE recommendations
└── README.md                          # This file
```

## Requirements

- Claude Code CLI installed
- Claude Code version compatible with plugins feature
- [plugin-dev](https://github.com/anthropics/claude-code-plugins) plugin installed (Anthropic official)
- [skill-creator](https://github.com/anthropics/claude-code-plugins) plugin installed (Anthropic official)

## Troubleshooting

### Dependencies not found:
Ensure both `plugin-dev` and `skill-creator` are installed. Plugin Benchmarker depends on both.

### Plugin path not found:
Verify the path contains a `.claude-plugin/plugin.json` file. Use the full path or a plugin name that matches a marketplace plugin.

### No skills found in plugin:
The plugin must contain at least one skill (in a `skills/` directory with a `SKILL.md` file) to benchmark. Commands-only plugins have no skills to benchmark — use `plugin-dev:plugin-validator` directly instead.

### Benchmark agents timing out:
Complex skills with large test prompts may take longer. Consider simplifying test case prompts.

### All assertions non-discriminating:
Your assertions may be too easy. Redesign them to test what the skill uniquely provides, not what Claude already knows.

## Contributing

Contributions are welcome! To improve Plugin Benchmarker:

1. Fork the repository
2. Create a feature branch
3. Make your changes to files in `commands/` or `agents/`
4. Test with various plugins
5. Submit a pull request

## License

MIT

## Version

1.0.0

---

**Stop guessing if your plugins add value. Benchmark them.**

Made with love for the Claude Code community
