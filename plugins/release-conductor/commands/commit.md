---
description: Craft a single Conventional Commit message from the currently staged changes
model: inherit
---

Turn the currently staged diff into one well-formed Conventional Commit message, ready to paste into `git commit`. Use this right before committing when you want a clean, conventional message that explains the *why*. Reads only what is staged (`git diff --cached`).

## Process

### Step 1: Confirm something is staged
Run `git diff --cached --stat`. If it is empty, there is nothing to commit — run `git status --short` to show the user what is unstaged/untracked, remind them to `git add`, and STOP. Do not invent a message from unstaged work.

### Step 2: Read the staged diff
- `git diff --cached` — the full staged patch. Read it to understand what actually changed.
- `git status --short` — to note anything left unstaged that arguably belongs in this commit (mention it, but only describe what IS staged).

### Step 3: Classify the change type
Pick the single best type per the **changelog-assembly** skill's `references/conventional-commits.md`:

| Type | When |
|------|------|
| `feat` | A new user-facing capability |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting/whitespace, no logic change |
| `refactor` | Behavior-preserving restructuring |
| `perf` | A performance improvement |
| `test` | Adding/fixing tests only |
| `build` | Build system, deps, packaging |
| `ci` | CI configuration/pipelines |
| `chore` | Maintenance not touching src or tests |
| `revert` | Reverting a prior commit |

If a diff spans multiple types, pick the dominant one and note that splitting into separate commits may be cleaner.

### Step 4: Derive scope, subject, body, footers
- **Scope** (optional): the module/package/area most affected (e.g. `auth`, `parser`, `api`). Derive it from the top-level directory or component in the diff.
- **Subject**: imperative mood, ≤50 characters, no trailing period, lowercase after the colon.
- **Body**: wrap at ~72 columns; explain *why* and any non-obvious *how*. Omit for trivial changes.
- **Footers**: add `BREAKING CHANGE: <description>` (and a `!` after type/scope) if a public contract changed; add `Closes #NN` / `Refs #NN` if the diff or branch name references an issue.

### Step 5: Output the message
Present it in a fenced block exactly as it should be committed:

```
type(scope): imperative subject

Body explaining why the change was made and any context a
future reader needs.

BREAKING CHANGE: describe the incompatibility.
Closes #123
```

Then give the ready-to-run command: `git commit -F -` piped, or a `git commit -m` form.

## Important Notes
- NEVER run `git commit` yourself — output the message and the command only.
- Base the type and subject on the actual staged diff — cite the files that drove the classification.
- Never fabricate an issue number or a `BREAKING CHANGE` that the diff does not support.
- If the staged change mixes unrelated concerns, say so and suggest an unstage/re-stage split rather than forcing one message.
