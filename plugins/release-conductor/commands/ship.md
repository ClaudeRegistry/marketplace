---
description: Prepare the current branch to ship — commit messages, semver bump, and a PR description, all for approval
argument-hint: [base-branch]
model: inherit
---

Orchestrate everything needed to open a pull request from the current branch: understand the working state, summarize the change, draft Conventional Commit message(s), recommend a semver bump, and write a complete PR description. Use this as the one-stop "I'm ready to ship" command. `$ARGUMENTS` optionally names the base branch to diff against.

## Process

### Step 1: Detect VCS state
Run these read-only commands and interpret them before writing anything:
- `git rev-parse --is-inside-work-tree` — confirm we are in a repo; if not, stop and say so.
- `git status --porcelain=v1 -b` — current branch, upstream, ahead/behind, staged vs unstaged vs untracked file counts.
- `git branch --show-current` — the feature branch name.

If the working tree is clean AND there are no commits ahead of the base, there is nothing to ship — report that and stop.

### Step 2: Resolve the base branch
If `$ARGUMENTS` is provided, use it. Otherwise auto-detect in this order:
1. `git symbolic-ref refs/remotes/origin/HEAD` (strip to the branch name) — the remote default.
2. First existing of `main`, `master`, `develop` via `git rev-parse --verify`.

Compute the merge base: `git merge-base HEAD <base>`. All analysis diffs against this merge base, not the raw base tip, so unrelated upstream commits do not pollute the summary.

### Step 3: Summarize the change
- `git diff --stat <merge-base>..HEAD` for the shape (files, insertions, deletions).
- `git log --oneline <merge-base>..HEAD` for existing commits on the branch.
- `git diff <merge-base>..HEAD` (read selectively for large diffs) to understand intent.

Write a 2-4 sentence plain-English summary of what the branch does and why.

### Step 4: Draft Conventional Commit message(s)
Group the diff into logical changes (a refactor, a feature, a docs update are separate commits even in one branch). For each group produce a Conventional Commit per the **changelog-assembly** skill's `references/conventional-commits.md`: `type(scope): imperative subject ≤50 chars`, a body explaining the *why*, and footers (`BREAKING CHANGE:`, `Closes #NN`) where warranted. If the branch is genuinely one atomic change, produce a single message.

### Step 5: Recommend a semver bump
Launch the **semver-advisor** agent against the `<merge-base>..HEAD` range. Relay its recommendation (MAJOR / MINOR / PATCH), confidence, and evidence table. Consult the **breaking-change-detection** skill so the summary language matches the classification.

### Step 6: Draft the PR description
Produce a Markdown PR body with EXACTLY these sections:

```
## Summary
## Motivation
## Changes
## Testing
## Breaking Changes
## Screenshots
```

- **Summary** — the Step 3 summary, tightened.
- **Motivation** — the problem this solves.
- **Changes** — bulleted, grouped like the commits.
- **Testing** — what was run / what a reviewer should run. Never claim tests passed unless the diff or history proves it.
- **Breaking Changes** — the semver-advisor's breaking items, or "None."
- **Screenshots** — a `<!-- add screenshots -->` placeholder for UI changes, else "N/A."

### Step 7: Present for approval
Show the commit message(s), the bump recommendation, and the PR body together. Then print the exact commands the user can run, e.g.:

```
git add -A
git commit -m "feat(api): ..."
git push -u origin <branch>
```

## Important Notes
- NEVER run `git commit`, `git push`, or `gh pr create` automatically — output the messages and the exact commands only.
- Base every finding on the real diff — cite file paths and line numbers as evidence for the summary and breaking-change calls.
- Never fabricate test results, metrics, or CI status.
- For very large diffs, read the highest-churn files first and state which files you sampled.
