---
description: Guide semantic resolution of an in-progress merge or rebase conflict, side by side
model: inherit
---

Walk through an in-progress merge or rebase conflict file by file, reconstruct what each side intended, and propose a resolution that preserves BOTH intents rather than blindly taking one side. With approval, apply the resolution via Edit. Use this whenever `git status` shows "Unmerged paths."

## Process

### Step 1: Confirm a conflict is in progress
Run `git status`. Confirm the repo is mid-merge (`MERGING`) or mid-rebase (`REBASE`), and collect the "Unmerged paths" list. If there is no conflict in progress, say so and stop. Identify which ref is OURS and which is THEIRS:
- Merge: OURS = current branch (`HEAD`), THEIRS = the branch being merged (`MERGE_HEAD`).
- Rebase: OURS = the commit being replayed onto (`HEAD`), THEIRS = your commit being replayed (`REBASE_HEAD`). Note this inversion for the user, during rebase "ours" and "theirs" feel backwards.

### Step 2: Understand the shared history
- `git merge-base HEAD MERGE_HEAD` (or the rebase equivalent), the common ancestor (BASE).
- List conflicted files. If there are multiple conflicted files, dispatch the **conflict-resolver** agent to handle them and synthesize per-file resolutions; otherwise proceed inline.

### Step 3: For each conflicted file, reconstruct intent
Read the file's conflict markers (`<<<<<<< ======= >>>>>>>`). For each hunk:
- Extract BASE via `git show :1:<path>`, OURS via `:2:<path>`, THEIRS via `:3:<path>`.
- Run `git log --oneline -5 <ourref> -- <path>` and `git log --oneline -5 <theirref> -- <path>` to see what each side was doing.
- Use `git blame` on the surrounding lines of each side to learn WHY each change was made.

State plainly: what OURS changed vs BASE, what THEIRS changed vs BASE, and whether they overlap logically or merely textually.

### Step 4: Propose a semantic merge
- **Non-overlapping intents** (both added distinct things): keep both.
- **Overlapping logic** (both edited the same behavior): reconcile into one version that satisfies both goals, do not silently drop either side's fix.
- **True contradiction**: surface it, explain the trade-off, and ask the user to choose. Never guess on a genuine semantic conflict.

Show the proposed resolved hunk before touching the file.

### Step 5: Apply on approval
With explicit approval, use Edit to replace the conflicted region with the resolved content, removing all conflict markers. Re-read to confirm no markers remain (`git diff --check`).

### Step 6: Verify before continuing
Remind the user to:
- `git add <resolved files>`
- Run the test suite / build, a syntactically clean merge can still be semantically wrong.
- Then `git rebase --continue` or complete the merge commit. Provide the exact commands but do NOT run them.

## Important Notes
- Never blindly `--ours`/`--theirs` a whole file to make markers disappear, reconstruct intent first.
- Base every "what this side did" claim on real `git log`/`git blame`/`git show` output, with SHAs cited.
- A conflict-free result is not a correct result, always send the user to the tests before continuing.
- Do not run `git rebase --continue`, `git merge --continue`, or `git commit` automatically.
