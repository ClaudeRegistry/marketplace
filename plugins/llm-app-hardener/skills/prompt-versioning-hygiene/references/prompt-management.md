# Externalizing, Versioning, and Reviewing Prompts

The goal: give every prompt an identity that can be diffed, pinned, rolled back, rendered per environment, and reviewed. Pick the lightest approach that gives you those properties for the codebase's scale.

## 1. Externalize prompts from logic
Move prompt text out of the call site. Three levels, in increasing structure:

**Dedicated files**: one prompt per file, loaded at startup. Simplest and diff-friendly.
```
prompts/
  summarize.system.md        # the instruction text, with {{placeholders}}
  summarize.meta.yaml        # version, owner, model, changelog
  classify_intent.system.md
```
```python
# load once; keep the template text separate from the assembly code
SUMMARIZE = load_prompt("prompts/summarize.system.md")
def summarize(doc: str) -> str:
    return llm(render(SUMMARIZE, doc=doc))     # render = safe interpolation, no logic in the text
```

**A prompt module / registry**: a typed catalog in code, so references are checked and prompts are discoverable.
```python
# prompts/registry.py
PROMPTS = {
    "summarize": Prompt(id="summarize", version="2.3.0", model="claude-opus-4-8",
                        text=Path("prompts/summarize.system.md").read_text()),
}
```

**A prompt-management tool**: a hosted or self-hosted registry (LangSmith, Langfuse, PromptLayer, Humanloop, or a home-grown table) that stores versions, supports non-engineer edits, and exposes an API to fetch a pinned version at runtime. Reach for this when non-engineers edit prompts, you need per-tenant prompts, or you want prompt changes decoupled from deploys.

**Trade-off:** in-repo (files/module) keeps prompts in code review, version control, and CI for free, best default. A hosted registry adds live editing and analytics but moves prompts *out* of your PR review and CI unless you sync them back; if you use one, still snapshot the active version into the repo (or pin a version id) so a prompt change is reviewable and reproducible.

## 2. Version every prompt
Two schemes, often combined:

| Scheme | Shape | Best for |
|---|---|---|
| **Semantic version** | `2.3.0` in the prompt's metadata | Human-meaningful history; communicating intent (major = behavior change) |
| **Content hash** | `sha256(prompt_text)[:8]` computed at load | Guaranteeing an output can be tied to the *exact* bytes that produced it |

Use semver for the human changelog and a content hash for machine-precise traceability. Store both in the prompt's metadata and, critically, **emit them with every request** (see §5).

- **Pin at the call site** for reproducibility, reference `summarize@2.3.0`, not "latest," on critical paths, so a registry edit can't silently change production.
- **Bump deliberately**: a prompt edit that changes behavior is a major bump and a reviewed change; a typo fix is a patch.

## 3. Separate data from logic in the template
Keep instruction *text* apart from *assembly* code. The file holds the words; the code holds the interpolation, the untrusted-input fencing (see the owasp-llm-top10 skill), and the model/params. This keeps prompts reviewable by non-engineers and keeps injection defenses in one place rather than sprinkled through templates.

## 4. Environment-aware rendering
Support dev/staging/prod so you can iterate without touching production behavior:
- Select the prompt version per environment (`prod` pins `2.3.0`; `staging` runs the candidate `2.4.0-rc1`).
- Never let a work-in-progress prompt reach prod by default, an explicit promotion step moves a version forward.
- Keep environment differences to *which version* is active, not *what the text says* per env, divergent per-env text is drift.

## 5. Log the active version with each request
Emit the prompt id + version (and/or content hash) alongside every model call, in structured logs, a trace attribute, or request metadata.
```python
log.info("llm_call", prompt_id="summarize", prompt_version="2.3.0",
         prompt_hash=prompt_hash, model="claude-opus-4-8")
```
This is what makes an incident tractable: when an output is wrong, you can answer "which prompt version produced it?" and correlate a quality dip to the exact change that caused it.

## 6. Review prompt changes like code
- Prompts live in version control (or are snapshotted there) so every change is a diff in a PR.
- Require an approving review on prompt changes, a one-word edit to a system prompt can shift behavior fleet-wide.
- **Isolate prompt changes** in their own PRs (or clearly-labeled commits) so a behavior change is never buried inside an unrelated feature diff.
- Gate the PR on the eval suite (see `prompt-testing.md`), review catches intent, the eval catches regression.
- Record *why* in the metadata changelog: what behavior changed and which eval cases moved.

The through-line: externalize so it's diffable, version so it's pinnable and traceable, render per-environment so it's safe to iterate, and review + test so a change is a deliberate, gated event.
