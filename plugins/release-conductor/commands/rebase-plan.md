---
description: Plan a safe interactive rebase of the current branch onto a base, todo list plus risks, never executed
argument-hint: [base-branch]
model: inherit
---

Analyze the commits on the current branch and produce a concrete `git rebase -i` plan that yields a clean, reviewable history, with a plain-English rationale for every pick/reword/squash/fixup/drop and an explicit risk assessment. This command PLANS ONLY; it never runs the rebase. `$ARGUMENTS` optionally names the base branch.

## Process

### Step 1: Resolve the base and the commit range
- Base = `$ARGUMENTS` if given, else the auto-detected default (`origin/HEAD`, then `main`/`master`/`develop`).
- Range = `git merge-base HEAD <base>`..HEAD. Everything below operates on commits in this range only.

### Step 2: Inventory the commits
- `git log --oneline --stat <merge-base>..HEAD`: commits, messages, and files touched.
- `git log --format='%H %ci %an %s' <merge-base>..HEAD`: dates and authors.
- Note merge commits (`git log --merges <merge-base>..HEAD`), interactive rebase will linearize them; flag this.

### Step 3: Assess what has already been shared
- `git rev-parse --abbrev-ref --symbolic-full-name @{upstream}` and `git log --oneline @{upstream}..HEAD`: which commits are already pushed.
- Any commit at or below the upstream tip has likely been seen by others. Rewriting it requires a force-push and can disrupt collaborators. Mark these clearly.

### Step 4: Propose the rebase todo
Classify each commit and build the todo list:

| Action | Use when |
|--------|----------|
| `pick` | The commit is good as-is |
| `reword` | Good change, weak/incorrect message |
| `squash` | Merge into the previous commit, combine messages |
| `fixup` | Merge into the previous commit, discard this message (typo/wip follow-ups) |
| `drop` | Debug prints, reverted experiments, accidental commits |
| `edit` | The commit needs to be split or amended mid-rebase |

Group `fixup`s directly under the commit they belong to. Aim for a history where each surviving commit is one logical, buildable, reviewable change.

### Step 5: Output the plan
Provide two things:

1. The exact `git rebase -i` todo content, in order, that the user pastes into the editor:
```
pick a1b2c3d feat(api): add pagination
fixup e4f5g6h wip
reword h7i8j9k fix typo
drop k0l1m2n debug logging
```
2. A numbered rationale, one line per changed action explaining *why*.

### Step 6: Risk assessment
List concrete risks before the user runs anything:
- Commits being rewritten that are already pushed (force-push required, `git push --force-with-lease`, never bare `--force`).
- Merge commits that will be flattened.
- Commits others may have branched from.
- Recommend a safety branch first: `git branch backup/<branch>-pre-rebase`.

## Important Notes
- NEVER run `git rebase`, `git push`, or any history-rewriting command, output the plan only.
- Recommend `--force-with-lease` over `--force` whenever a push follows.
- Base every classification on the real commit contents, cite SHAs and the files/lines that justify a squash or drop.
- Never propose dropping a commit whose change is not clearly reproduced elsewhere; when unsure, keep it and say why.
