#!/usr/bin/env python3
"""claude-squad security guard (PreToolUse hook).

Mechanical enforcement of the plugin's security policy:

  - no kubectl / direct cluster access
  - no reading or writing .env files (except .env.example/.sample/.template/.test)
  - no git commands that throw away uncommitted or shared work
    (reset --hard, clean -f, checkout -- ., restore ., stash clear/drop, push --force)

Threat model: this is a guardrail for a *cooperative* agent, not a sandbox against
an adversary. It matches command invocations — including inside `$(…)`/backticks and
behind `sudo` — and covers the same-intent siblings of each banned command, but it
does not try to defeat deliberate obfuscation (base64, indirection, a helper script).
The prose conduct rules in every agent and the project's own permission `deny` rules
are the outer layers. Behavior is pinned by hooks/test_guard.py.

Exit code 2 blocks the tool call; stderr is fed back to the model.
Everything else exits 0 (allow). Stdlib only.
"""
import json
import re
import shlex
import sys

# --------------------------------------------------------------------------- #
# .env protection
# --------------------------------------------------------------------------- #

# Companion / non-secret variants that are safe to touch.
ENV_ALLOW = re.compile(r"\.env\.(example|sample|template|test)$", re.IGNORECASE)
# basename is ".env", optionally followed by ".something" (e.g. .env.local).
ENV_RE = re.compile(r"(^|[\\/])\.env(\.[\w.-]+)?$", re.IGNORECASE)


def is_protected_env(path: str) -> bool:
    if not path:
        return False
    # Normalize trailing shell globs so `.env*` and `.env.*` are treated as `.env`.
    candidate = path.rstrip("*?").rstrip(".")
    if not candidate:
        return False
    return bool(ENV_RE.search(candidate)) and not ENV_ALLOW.search(candidate)


# --------------------------------------------------------------------------- #
# Shell segmentation & git parsing
# --------------------------------------------------------------------------- #

# Split a command line into the fragments that actually run: pipes, lists,
# redirections, and — crucially — command substitutions, so a banned command
# hidden in `$(…)` or backticks is still found.
_SEG_RE = re.compile(r"\$\(|\)|`|&&|\|\||[;\n|&<>]")

# Leading tokens that wrap the real command word.
_WRAPPERS = {"sudo", "doas", "env", "command", "nice", "time", "nohup", "xargs",
             "then", "do", "else", "exec"}

# git global options that consume the following token as their value.
_GIT_VALUE_OPTS = {"-C", "-c", "--git-dir", "--work-tree", "--namespace",
                   "--exec-path", "--super-prefix"}


def _segments(cmd: str):
    return [s for s in _SEG_RE.sub("\x00", cmd).split("\x00") if s.strip()]


def _tokens(segment: str):
    try:
        return shlex.split(segment)
    except ValueError:
        return segment.split()


def _git_args(tokens):
    """If this segment's command word is git, return the args after it; else None."""
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if re.match(r"^[A-Za-z_]\w*=", t) or t in _WRAPPERS:  # VAR=val / sudo / env …
            i += 1
            continue
        break
    if i < len(tokens) and tokens[i].rsplit("/", 1)[-1] == "git":
        return tokens[i + 1:]
    return None


def _git_subcommand(args):
    """Skip global options (including those that take a value) and return
    (subcommand, remaining_args)."""
    i = 0
    while i < len(args):
        a = args[i]
        if not a.startswith("-"):
            return a, args[i + 1:]
        if a in _GIT_VALUE_OPTS:
            i += 2
        else:
            i += 1
    return None, []


def _has_short_flag(args, letter: str) -> bool:
    """True if a clustered short flag contains `letter` (e.g. -f in -fd/-xf)."""
    pat = re.compile(r"-[A-Za-z]*" + re.escape(letter) + r"[A-Za-z]*$")
    return any(pat.match(a) for a in args)


def _destructive_git(args):
    sub, rest = _git_subcommand(args)
    if sub is None:
        return None

    if sub == "reset" and "--hard" in rest:
        return "`git reset --hard` discards uncommitted work and is forbidden."

    if sub == "clean":
        forced = "--force" in rest or _has_short_flag(rest, "f")
        dry = "--dry-run" in rest or _has_short_flag(rest, "n")
        if forced and not dry:
            return "`git clean -f` deletes untracked files and is forbidden."

    if sub == "checkout":
        if "--" in rest or "--force" in rest or _has_short_flag(rest, "f") or "." in rest:
            return "`git checkout` that discards working-tree changes is forbidden."

    if sub == "restore":
        worktree = "--worktree" in rest or _has_short_flag(rest, "W")
        staged = "--staged" in rest or _has_short_flag(rest, "S")
        # Default restore rewrites the worktree; only a staged-only restore is safe.
        if worktree or not staged:
            return "`git restore` that discards working-tree changes is forbidden."

    if sub == "stash" and rest[:1] and rest[0] in ("clear", "drop"):
        return "`git stash clear/drop` destroys stashed work and is forbidden."

    if sub == "push":
        forced = "--force" in rest or _has_short_flag(rest, "f")
        lease = any(a.startswith("--force-with-lease") or a.startswith("--force-if-includes")
                    for a in rest)
        if forced and not lease:
            return ("`git push --force` rewrites shared history and is forbidden — "
                    "use --force-with-lease if you truly must.")

    return None


# --------------------------------------------------------------------------- #
# kubectl — any segment where `kubectl` appears as a standalone token. Catches
# `$(kubectl …)`, `sudo … kubectl`, quoted and full-path forms; ignores it when
# it is buried inside a quoted string or a filename (e.g. `cat kubectl.log`).
# --------------------------------------------------------------------------- #

def _has_kubectl(cmd: str) -> bool:
    for seg in _segments(cmd):
        for tok in _tokens(seg):
            if tok.rsplit("/", 1)[-1] == "kubectl":
                return True
    return False


# --------------------------------------------------------------------------- #
# Per-tool checks
# --------------------------------------------------------------------------- #

def check_bash(cmd: str):
    if _has_kubectl(cmd):
        return "kubectl / direct cluster access is forbidden."
    for seg in _segments(cmd):
        args = _git_args(_tokens(seg))
        if args is not None:
            reason = _destructive_git(args)
            if reason:
                return reason
    for match in re.finditer(r"[^\s'\"();|&<>]*\.env[^\s'\"();|&<>]*", cmd):
        token = match.group(0)
        if is_protected_env(token):
            return (f"the command references {token} — .env files are managed "
                    "by the human, never by agents.")
    return None


def check_file(tool_input):
    path = (tool_input.get("file_path")
            or tool_input.get("notebook_path")
            or tool_input.get("path")
            or "")
    if is_protected_env(path):
        return (f"access to {path} is forbidden — .env files are managed "
                "by the human, never by agents.")
    return None


def evaluate(tool_name: str, tool_input):
    """Return a deny reason (str) or None (allow). Pure — no I/O; the unit of test."""
    tool_input = tool_input or {}
    if tool_name == "Bash":
        return check_bash(tool_input.get("command", "") or "")
    if tool_name in ("Read", "Edit", "Write", "MultiEdit", "NotebookEdit"):
        return check_file(tool_input)
    return None


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)  # unparseable input: never break the session over the guard

    reason = evaluate(data.get("tool_name", "") or "", data.get("tool_input") or {})
    if reason:
        print(f"Blocked by claude-squad security policy: {reason}", file=sys.stderr)
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    main()
