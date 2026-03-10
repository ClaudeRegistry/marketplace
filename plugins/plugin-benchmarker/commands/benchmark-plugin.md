---
description: Benchmark a plugin by validating structure, reviewing skill quality, then comparing with-skill vs without-skill performance with per-file KEEP/TRIM/DELETE recommendations
argument-hint: [plugin-path]
---

Benchmark a Claude Code plugin by first validating its structural health, then auditing and benchmarking each skill for real-world value.

**Dependencies:** This command leverages:
- Anthropic's `plugin-dev` plugin for structural validation (`plugin-dev:plugin-validator`) and skill quality review (`plugin-dev:skill-reviewer`)
- Anthropic's `skill-creator` plugin for grading methodology and benchmark aggregation

## Process

### Phase 1: Plugin Validation

#### Step 1: Locate and Validate Plugin

Accept the plugin path from the user argument. If no argument provided, ask the user for the plugin path.

**Auto-detection:** Try these locations in order:
1. Exact path provided (e.g., `./plugins/code-auditor/`)
2. Marketplace plugin (e.g., `code-auditor` → search `./plugins/*/`)
3. Installed plugin (e.g., search `~/.claude/plugins/cache/*/`)

Validate that the path contains a `.claude-plugin/plugin.json` file. If not found, report the error and stop.

Report to the user:
- Plugin name (from plugin.json)
- Plugin path
- Component counts (commands, agents, skills, hooks)
- List of skills found (these will be benchmarked)

#### Step 2: Run Plugin Validator

Dispatch the **plugin-dev:plugin-validator** agent using the Agent tool. Provide it the plugin path and instruct it to perform comprehensive validation:
- Manifest validation (JSON syntax, required fields, naming conventions)
- Directory structure validation
- Command validation (frontmatter, content)
- Agent validation (frontmatter, examples, system prompts)
- Skill validation (SKILL.md, references, structure)
- Hook validation (if present)
- Security checks (hardcoded credentials, insecure URLs)

Present the validation report to the user.

**If critical issues are found:** Recommend fixing them before proceeding with benchmarks. Ask the user whether to continue or stop to fix issues first.

#### Step 3: Run Skill Reviewer

For EACH skill found in the plugin, dispatch the **plugin-dev:skill-reviewer** agent using the Agent tool. Launch all skill reviews in parallel (one agent per skill in a single message).

Each skill reviewer should evaluate:
- Description quality and trigger phrases
- Progressive disclosure implementation
- Content quality and word count
- Writing style adherence
- Supporting files quality (references/, examples/, scripts/)
- Best practices adherence

Present all skill review results to the user.

**This is an APPROVAL GATE.** The user sees the full plugin health picture (validation + skill reviews) before investing in expensive benchmark runs. Wait for user confirmation to proceed.

### Phase 2: Skill Benchmarking

For each skill in the plugin, execute Steps 4-8. If the plugin has multiple skills, process them sequentially (each skill needs its own test cases and assertions).

#### Step 4: Audit Skill Files

Dispatch the **skill-file-auditor** agent using the Agent tool. Provide it the skill path and instruct it to:
- Read SKILL.md and ALL files in references/, assets/, examples/, scripts/
- Classify each file as: native knowledge, discovery heuristic, domain-specific, or template/boilerplate
- Provide section-level detail for mixed files
- Return the classification table with confidence and rationale

**Present the audit results to the user and ask for confirmation before proceeding.**

This is an APPROVAL GATE. Wait for user confirmation. The user may adjust classifications.

#### Step 5: Design Test Cases

Based on the skill's purpose (from SKILL.md) and the audit results, design **3 test cases**:

Each test case must be:
- A **realistic user prompt** that exercises the skill's core functionality
- Specific enough to produce verifiable output
- Diverse across the skill's capabilities (don't test the same thing 3 times)

Format:
```
Test Case 1: [descriptive name]
Prompt: "[The exact prompt to send to Claude]"
Target: [What aspect of the skill this tests]

Test Case 2: [descriptive name]
Prompt: "[The exact prompt to send to Claude]"
Target: [What aspect of the skill this tests]

Test Case 3: [descriptive name]
Prompt: "[The exact prompt to send to Claude]"
Target: [What aspect of the skill this tests]
```

**Present test cases to the user and ask for approval.**

This is an APPROVAL GATE. Wait for user confirmation. The user may modify prompts.

#### Step 6: Define Assertions

For each test case, define **2-4 objectively verifiable assertions**. Each assertion must be:

- **Objectively gradable** — A reviewer can determine PASS/FAIL without subjective judgment
- **Structurally verifiable** — Checks for specific elements, formats, or data points
- **Discriminating** — Designed to differentiate skilled vs unskilled performance (avoid assertions that any Claude response would pass)

Good assertion types:
- **Structural completeness**: "Output includes a table with columns X, Y, Z"
- **Grounding in real data**: "References specific file paths from the codebase"
- **Correct methodology**: "Uses weighted scoring formula rather than simple average"
- **Appropriate output type**: "Produces Mermaid diagram, not ASCII art"

Bad assertion types (avoid):
- "Output is helpful" (subjective)
- "Response is well-formatted" (vague)
- "Mentions the topic" (too easy, non-discriminating)

Format:
```
Test Case 1: [name]
Assertions:
1. [Assertion text]
2. [Assertion text]
3. [Assertion text]

Test Case 2: [name]
Assertions:
1. [Assertion text]
2. [Assertion text]

Test Case 3: [name]
Assertions:
1. [Assertion text]
2. [Assertion text]
3. [Assertion text]
4. [Assertion text]
```

**Present assertions to the user and ask for approval.**

This is an APPROVAL GATE. Wait for user confirmation. The user may adjust assertions.

#### Step 7: Run Parallel Benchmarks

For each test case, spawn **two agents simultaneously** using the Agent tool:

1. **With-skill agent**: Give it the full skill context (read SKILL.md and all references before executing the prompt)
2. **Without-skill agent (baseline)**: Give it ONLY the test prompt with NO skill context — this tests Claude's native knowledge

**CRITICAL: Launch ALL agents in a SINGLE message.** For 3 test cases, that means 6 agent calls in one message (3 with-skill + 3 without-skill).

Each agent prompt should:
- For with-skill: "First read [skill path]/SKILL.md and all files in [skill path]/references/. Then complete this task: [test prompt]"
- For without-skill: "Complete this task using only your built-in knowledge. Do NOT read any skill files. Task: [test prompt]"

Save timing data from the agent completion notifications (duration, tokens used).

Wait for all agents to complete before proceeding.

#### Step 8: Grade Results

For each test case, grade both the with-skill and without-skill outputs against the defined assertions.

Use the skill-creator's grading methodology:
- Read each agent's output carefully
- For each assertion, determine PASS or FAIL with specific evidence
- A PASS requires evidence in the output AND genuine substantive completion (not just surface compliance)
- Extract and verify any factual claims

Compile grading results:

```
Test Case 1: [name]
| Assertion | With Skill | Without Skill |
|-----------|-----------|---------------|
| [assertion 1] | PASS (evidence: ...) | FAIL (reason: ...) |
| [assertion 2] | PASS (evidence: ...) | PASS (evidence: ...) |
| [assertion 3] | PASS (evidence: ...) | FAIL (reason: ...) |

Discriminating: 2/3 | Non-discriminating: 1/3
```

### Phase 3: Report & Recommendations

#### Step 9: Compile Benchmark Report

Aggregate all results into the final benchmark report:

```markdown
# Plugin Benchmark Report: [plugin-name]

## Overview
- **Plugin path**: [path]
- **Plugin version**: [version]
- **Skills benchmarked**: [count]
- **Total test cases**: [count]
- **Total assertions**: [count]
- **Date**: [timestamp]

## Phase 1: Plugin Health

### Structural Validation
[Summary from plugin-dev:plugin-validator — critical issues, warnings, pass/fail]

### Skill Quality Reviews
[Summary per skill from plugin-dev:skill-reviewer — rating, key issues, positive findings]

## Phase 2: Benchmark Results

### [Skill Name 1]

#### Audit Summary
[Classification table from Step 4]

#### Comparison Table
| Metric | With Skill | Without Skill | Delta |
|--------|-----------|---------------|-------|
| Pass rate | X% | Y% | +Z% |
| Avg tokens | X | Y | +Z |
| Avg duration | Xs | Ys | +Zs |
| Avg tool calls | X | Y | +Z |

#### Per-Test-Case Grading
[Grading tables from Step 8 for each test case]

#### Analysis
- **Skill-only wins**: [List assertions that ONLY passed with skill]
- **Non-discriminating**: [List assertions that passed in both]
- **Overhead cost**: +X tokens, +Ys per invocation for +Z% pass rate improvement

[Repeat for each skill]

## Phase 3: Recommendations
[Full output from recommendation-engine per skill]

## Methodology
- Plugin validation performed by plugin-dev:plugin-validator agent
- Skill quality reviewed by plugin-dev:skill-reviewer agent
- File audit performed by skill-file-auditor agent
- Benchmarks run as parallel agents (with-skill vs without-skill baseline)
- Grading performed using skill-creator grading methodology
- Recommendations generated by recommendation-engine agent
- The without-skill baseline is the truth test: if it produces equivalent quality, skill content is overhead
```

#### Step 10: Generate Recommendations

Dispatch the **recommendation-engine** agent using the Agent tool. Provide it:
- The audit classification table from Step 4
- The benchmark comparison data from Step 9
- The per-assertion grading from Step 8

The recommendation-engine will produce per-file KEEP/TRIM/DELETE recommendations with section-level annotations.

#### Step 11: Present Final Report

Append the recommendation-engine's output to the benchmark report under the Phase 3 section. Present the complete report to the user.

## Important Notes

- **Validate before benchmarking.** Phase 1 catches structural issues before spending tokens on benchmark runs. Fix critical issues first.
- **Never fabricate benchmark data.** All metrics must come from actual agent runs.
- **The baseline is sacred.** The without-skill run uses ONLY Claude's native knowledge. Never leak skill content into the baseline.
- **Approval gates are mandatory.** Do NOT skip approval gates at Steps 3, 4, 5, and 6. The user must confirm before expensive operations.
- **All agents in one message.** Step 7 MUST launch all benchmark agents in a single message for true parallel execution.
- **Timing data matters.** Record duration and token counts from agent completion notifications for overhead analysis.
- **Multiple skills are sequential.** If a plugin has multiple skills, benchmark each one sequentially (each needs its own test cases, assertions, and approval gates).
