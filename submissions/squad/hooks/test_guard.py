#!/usr/bin/env python3
"""Behavior contract for hooks/guard.py.

Run: python3 hooks/test_guard.py   (stdlib only, no dependencies)

The guard is the plugin's one piece of executable security policy, so its allowed
and denied sets are pinned here. Widening the guard means adding a DENY case;
loosening it means adding an ALLOW case — never quietly changing what it does.
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guard import evaluate  # noqa: E402


def bash(cmd):
    return evaluate("Bash", {"command": cmd})


def read(path):
    return evaluate("Read", {"file_path": path})


def write(path):
    return evaluate("Write", {"file_path": path})


class Denied(unittest.TestCase):
    """Commands the policy must block (evaluate returns a reason)."""

    def assertDenied(self, reason, msg=""):
        self.assertIsNotNone(reason, msg or "expected DENY, got allow")

    def test_kubectl(self):
        for cmd in [
            "kubectl get pods",
            "sudo kubectl delete ns prod",
            "sudo -u ops kubectl apply -f x.yaml",
            "/usr/local/bin/kubectl get pods",
            "echo x | kubectl apply -f -",
            '"kubectl" get pods',
            "result=$(kubectl get pods)",
        ]:
            self.assertDenied(bash(cmd), cmd)

    def test_git_reset_hard(self):
        for cmd in [
            "git reset --hard",
            "git reset --hard HEAD~3",
            "git -C /tmp/repo reset --hard",
            "git reset -q --hard origin/main",
            "cd repo && git reset --hard",
            "x=$(git reset --hard)",
        ]:
            self.assertDenied(bash(cmd), cmd)

    def test_git_clean_force(self):
        for cmd in ["git clean -f", "git clean -fd", "git clean -fdx", "git clean --force -d"]:
            self.assertDenied(bash(cmd), cmd)

    def test_git_checkout_discard(self):
        for cmd in [
            "git checkout -- .",
            "git checkout -- src/app.py",
            "git checkout .",
            "git checkout -f main",
            "git checkout --force",
        ]:
            self.assertDenied(bash(cmd), cmd)

    def test_git_restore_discard(self):
        for cmd in ["git restore .", "git restore src/app.py", "git restore --worktree x",
                    "git restore --staged --worktree x"]:
            self.assertDenied(bash(cmd), cmd)

    def test_git_stash_destroy(self):
        for cmd in ["git stash clear", "git stash drop", "git stash drop stash@{2}"]:
            self.assertDenied(bash(cmd), cmd)

    def test_git_push_force(self):
        for cmd in ["git push --force", "git push -f", "git push --force origin main",
                    "git push origin main -f"]:
            self.assertDenied(bash(cmd), cmd)

    def test_env_files(self):
        for cmd in ["cat .env", "cat /app/.env", "cat .env.local", "cat .env*",
                    "grep SECRET .env.production", "echo x > .env"]:
            self.assertDenied(bash(cmd), cmd)
        for path in ["/app/.env", ".env", "config/.env.local", "/srv/app/.env.production"]:
            self.assertDenied(read(path), "read " + path)
            self.assertDenied(write(path), "write " + path)


class Allowed(unittest.TestCase):
    """Everyday commands the policy must NOT block (evaluate returns None)."""

    def assertAllowed(self, reason, msg=""):
        self.assertIsNone(reason, msg or f"expected ALLOW, got deny: {reason}")

    def test_safe_git(self):
        for cmd in [
            "git status",
            "git checkout main",
            "git checkout -b feature/x",
            "git checkout HEAD~1",
            "git switch main",
            "git reset --soft HEAD~1",
            "git reset HEAD file.py",
            "git clean -n",
            "git clean --dry-run",
            "git restore --staged file.py",
            "git stash",
            "git stash pop",
            "git stash list",
            "git push origin main",
            "git push --force-with-lease origin main",
            "git push --force-if-includes origin main",
            'git commit -m "reset --hard is dangerous"',
            'git commit -m "run kubectl to check"',
            "git log --oneline",
        ]:
            self.assertAllowed(bash(cmd), cmd)

    def test_safe_env(self):
        for cmd in ["cat .env.example", "cat .env.template", "cat .env.sample", "cat .env.test"]:
            self.assertAllowed(bash(cmd), cmd)
        for path in ["/app/.env.example", ".env.template", "config/.env.sample", "/x/.env.test"]:
            self.assertAllowed(read(path), "read " + path)
            self.assertAllowed(write(path), "write " + path)

    def test_kubectl_in_filename_or_message_is_fine(self):
        # `kubectl` as a substring (filename, log path, prose) is not cluster access.
        for cmd in ["cat /var/log/kubectl.log", "ls kubectl.md",
                    'echo "install kubectl first" >> README.md']:
            self.assertAllowed(bash(cmd), cmd)

    def test_unrelated_tools(self):
        self.assertAllowed(evaluate("Grep", {"pattern": "kubectl"}))
        self.assertAllowed(evaluate("Glob", {"pattern": "**/.env"}))
        self.assertAllowed(bash("ls -la"))
        self.assertAllowed(bash("python3 hooks/guard.py"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
