# Release Conductor

The release-chore co-pilot for Claude Code: it owns everything clustered around the diff — commit messages, PR descriptions, version bumps, changelogs, merge conflicts, rebase planning, and git-history archaeology.

## Purpose

AI made code generation roughly 30% faster, but human review and release capacity stayed flat — the "review gap." The chores clustered around shipping are fragmented and high-frequency: writing PR descriptions, deciding major/minor/patch (humans get binary-compatibility right only about 60% of the time), assembling changelogs from non-conventional history, resolving merge conflicts (10-20% of developer time), and doing blame/bisect archaeology. Diff-review tools explicitly disown these tasks. Release Conductor owns exactly them — turning the messy, manual work between "code is written" and "code is shipped" into a guided, evidence-based workflow.

## Features

- One-command ship prep: state detection, change summary, Conventional Commit drafts, semver recommendation, and a full PR description — all presented for approval, nothing executed.
- Conventional Commit authoring from staged changes, with correct type/scope/subject/body/footers.
- Release notes and changelog assembly that works even on non-conventional history by inferring change types from diffs.
- Behavioral (not just syntactic) breaking-change detection and a MAJOR/MINOR/PATCH recommendation with a confidence level and an evidence table.
- Intent-aware merge-conflict resolution that preserves both sides rather than blindly picking one.
- Safe interactive-rebase planning with an exact todo list and an explicit risk assessment — plan only, never executed.
- Git archaeology: pickaxe, blame, and bisect to answer why code exists, when it broke, and what introduced a behavior.
- Two reusable skills (changelog assembly, breaking-change detection) that the commands and agents share.

## Installation

```bash
/plugin marketplace add clauderegistry/marketplace
```

```bash
/plugin install release-conductor@clauderegistry
```

## Commands

### /ship

```
/ship main
```

**What it does:**
- Detects VCS state (branch, upstream, ahead/behind, staged vs unstaged counts) and auto-detects the base branch when no argument is given.
- Summarizes the branch's change from the diff against the merge base.
- Drafts one or more Conventional Commit messages grouped by logical change.
- Dispatches the semver-advisor agent for a MAJOR/MINOR/PATCH recommendation.
- Drafts a PR description with Summary / Motivation / Changes / Testing / Breaking Changes / Screenshots and prints the exact commands to run.

**Best for:**
- The moment you finish a branch and want everything needed to open a PR.
- Teams standardizing commit and PR quality without a bot in CI.

### /commit

```
/commit
```

**What it does:**
- Reads the staged diff (`git diff --cached`) and classifies the change type (feat/fix/docs/style/refactor/perf/test/build/ci/chore).
- Derives scope, an imperative subject <=50 chars, a body explaining the why, and footers (`BREAKING CHANGE:`, `Closes #NN`).
- Outputs a ready-to-paste message and the commit command; stops with `git status` if nothing is staged.

**Best for:**
- Writing a single clean Conventional Commit right before committing.
- Getting the "why" into history instead of a terse one-liner.

### /release-notes

```
/release-notes v1.3.0..HEAD
```

**What it does:**
- Resolves the range (defaults to since the last tag via `git describe --tags --abbrev=0`).
- Classifies each commit into Keep a Changelog categories, inferring types from diffs when history isn't conventional.
- Calls out breaking changes at the top, links `#NN` references, and suggests the next version number.

**Best for:**
- Cutting a release from imperfect history.
- Maintaining a human-readable `CHANGELOG.md`.

### /resolve-conflicts

```
/resolve-conflicts
```

**What it does:**
- Lists unmerged paths and orients OURS vs THEIRS (including the rebase inversion).
- Reconstructs each side's intent with `git log`/`git blame`/`git show` on both sides.
- Proposes a semantically merged resolution, applies it via Edit on approval, and sends you to the tests before continuing.

**Best for:**
- Conflicts where both sides made real, valuable changes.
- Avoiding the silent loss of one branch's work.

### /rebase-plan

```
/rebase-plan main
```

**What it does:**
- Inventories `base..HEAD` commits and flags which are already pushed.
- Recommends a pick/reword/squash/fixup/drop todo for a clean, reviewable history.
- Outputs the exact `git rebase -i` todo content, a per-line rationale, and a risk assessment (force-push implications, merge commits, shared commits). Plan only.

**Best for:**
- Tidying a messy branch before review.
- Understanding the risk of a history rewrite before running it.

## Agents

### semver-advisor

**Triggers when:** you need a version bump decision, ask whether a change is breaking, or mention semver / major-minor-patch / backward compatibility; also dispatched by `/ship`.

**What it does:** Classifies a diff or commit range as MAJOR/MINOR/PATCH by reasoning about behavioral breaking changes (removed/renamed exports, changed signatures, changed defaults, stricter validation, changed output shapes/error types, removed config/env vars, DB/enum changes) across JS/TS, Python, Go, Java, C#, Rust, CLI, HTTP, and GraphQL. Returns a recommendation, a confidence level, an evidence table (change → classification → file:line), and a pre-1.0.0 note. Read-only (`Read`, `Grep`, `Glob`, `Bash`).

### conflict-resolver

**Triggers when:** a merge or rebase produces conflicts, or you mention conflict markers / unmerged paths; also dispatched by `/resolve-conflicts` for multi-file conflicts.

**What it does:** Resolves conflicts by understanding both sides' intent via `git log`/`git blame` on OURS and THEIRS, then proposes semantically correct merges (keep both non-overlapping changes; reconcile overlapping logic; surface true contradictions). Reports per file what each side did, the merged resolution, and residual risks to verify with tests. Can apply approved edits (`Read`, `Grep`, `Glob`, `Edit`, `Bash`).

### git-historian

**Triggers when:** you ask why code exists, when something broke, what introduced a behavior, or mention blame / bisect / pickaxe / regression.

**What it does:** Performs git archaeology with `git log -S`/`-G` (pickaxe), `git blame` for line provenance, and `git bisect` driven against a supplied repro to localize regressions, plus commit-message/PR mining for rationale. Returns a narrative timeline with SHAs, dates, and reasoning, and the exact offending commit for regressions. Read-only (`Read`, `Grep`, `Glob`, `Bash`).

## Skills

### changelog-assembly

Methodology to turn raw git history into human-readable changelogs: Keep a Changelog categories, inferring types from diffs for non-conventional history, de-duplication and folding, audience-appropriate phrasing, PR/issue linking, and the Unreleased section. Reference files: `references/conventional-commits.md` (the full Conventional Commits 1.0.0 taxonomy and semver mapping) and `references/keep-a-changelog.md` (the six categories, dated version headers, compare links, good vs bad entries).

### breaking-change-detection

Methodology to reason about semver-relevant changes: a MAJOR/MINOR/PATCH decision matrix, public-surface detection, and behavioral vs syntactic breaks. Reference files: `references/breaking-change-catalog.md` (per-language and per-interface break signals for JS/TS, Python, Go, Java, Rust, HTTP/REST, GraphQL, database schema, and CLI) and `references/semver-rules.md` (SemVer 2.0.0 summary, pre-1.0.0 rules, deprecation policy, and communicating breaks).

## Hooks

Release Conductor ships a single **SessionStart** hook that is **advisory and non-blocking**. When a session starts inside a git repository, it injects a one-line summary of the current branch, ahead/behind versus upstream, staged/unstaged file counts, and the last tag, and suggests running `/ship` or `/release-notes`. It only surfaces this suggestion as context — it never blocks a tool call, never modifies the repository, and never fails the session. Outside a git repository it is a silent no-op (fail-safe). Disable it any time via the `/hooks` menu or by removing the plugin.

## Typical Workflow

1. Start a session in your repo — the SessionStart hook shows your branch, ahead/behind, and last tag, and suggests `/ship`.
2. Finish your feature branch, then run `/ship main`.
3. Review the change summary, the drafted Conventional Commit message(s), and the semver-advisor's bump recommendation with its evidence table.
4. Copy the PR description (Summary / Motivation / Changes / Testing / Breaking Changes / Screenshots) and run the printed commit and push commands yourself.
5. If merging main first surfaces conflicts, run `/resolve-conflicts` to reconcile both sides, then run your tests.
6. Before opening the PR, optionally run `/rebase-plan main` to tidy the branch history, and `/release-notes` to draft the changelog entry.
7. Later, when a regression appears, ask the git-historian to bisect it to the exact offending commit.

## Plugin Structure

```
release-conductor/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── ship.md
│   ├── commit.md
│   ├── release-notes.md
│   ├── resolve-conflicts.md
│   └── rebase-plan.md
├── agents/
│   ├── semver-advisor.md
│   ├── conflict-resolver.md
│   └── git-historian.md
├── skills/
│   ├── changelog-assembly/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── conventional-commits.md
│   │       └── keep-a-changelog.md
│   └── breaking-change-detection/
│       ├── SKILL.md
│       └── references/
│           ├── breaking-change-catalog.md
│           └── semver-rules.md
└── README.md
```

## Requirements

- Claude Code CLI
- Git (the commands and agents operate on a git repository)

## License

MIT

## Version

1.0.0

Release Conductor handles the chores between "code is written" and "code is shipped" — so you can spend your review capacity on the code that matters.
