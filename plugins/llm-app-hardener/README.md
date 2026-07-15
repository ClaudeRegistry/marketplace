# LLM App Hardener

A repo-native toolchain that hardens LLM apps where they actually live, in your prompts, schemas, and call sites, by scaffolding evals, red-teaming for prompt injection, fixing structured-output reliability, and auditing token cost.

## Purpose

Teams building LLM apps change a prompt, eyeball a few outputs, and ship, with no way to prove a change improved things versus regressed them. Prompt injection is OWASP LLM01 (the #1 risk) yet adversarial testing gets skipped. Plain JSON Mode fails to produce valid JSON 5–10% of the time; native structured outputs drop that below 0.1%. And 60–85% cost cuts are routinely on the table but require tedious manual auditing.

LLM App Hardener does this work directly on your prompts, schemas, and call sites, code-first, in the repo, and integrates with the OSS eval frameworks (promptfoo, DeepEval) and validation libraries (Zod, Pydantic) instead of competing with them. It detects your stack first, Anthropic SDK, OpenAI SDK, LangChain, LlamaIndex, Vercel AI SDK, Pydantic AI, then applies the patterns that fit it, grounding every finding in real `file:line` evidence and never fabricating results.

## Features

- Scaffolds a runnable eval suite (assertions, LLM-as-judge, golden dataset, CI gate) so a prompt change is proven, not eyeballed, riding promptfoo or DeepEval where present.
- Red-teams prompt construction and tool-calling for the OWASP LLM Top 10, especially LLM01 prompt injection, indirect/RAG-poisoning, tool abuse, and data-exfiltration paths, with concrete attack strings.
- Hardens structured output: switches fragile `JSON.parse`/regex extraction to provider-native schema-constrained output plus a validate-and-retry-with-error-feedback loop.
- Audits LLM call sites for token and cost waste, quantifies the savings, and applies the safe wins (prompt caching, context trimming, tier routing, `max_tokens`, batching).
- Tunes RAG pipelines for retrieval quality and cost, chunking, embeddings, top-k, reranking, context assembly, and grounding.
- Treats prompts as versioned, reviewable, testable code, with a change workflow that gates on the eval suite.
- Tech-agnostic: detects the SDK and framework before applying any pattern; integrates with the tools you already use rather than replacing them.

## Installation

```bash
/plugin marketplace add clauderegistry/marketplace
```

```bash
/plugin install llm-app-hardener@clauderegistry
```

## Commands

### /eval-scaffold

```
/eval-scaffold prompts/support_reply.txt
```

**What it does:**
- Detects the LLM SDK (Anthropic, OpenAI, LangChain, LlamaIndex, Vercel AI SDK, Pydantic AI), the test runner, and any eval framework already present.
- Generates assertion-based tests (exact/contains/regex/JSON-schema), LLM-as-judge rubric tests with pass thresholds, a versioned golden-dataset stub, and a GitHub Actions job that fails a PR on quality regression.
- Rides promptfoo or DeepEval where present; falls back to plain Vitest/pytest plus a judge helper when neither is.
- Outputs the eval files, the exact run commands, and the concrete behaviors now pinned.

**Best for:**
- Escaping vibes-based development before a prompt or model change ships.
- Putting a regression gate under an app that currently has none.

### /structured-output-doctor

```
/structured-output-doctor src/agents
```

**What it does:**
- Finds LLM calls whose output is parsed as JSON and locates the fragile shapes (`JSON.parse`, regex extraction, prompt-only JSON, bare JSON mode).
- Switches each to the strongest mechanism the provider supports, native schema-constrained output or a strict tool schema, and adds schema validation (Zod/Pydantic) with a validate-and-retry-with-error-feedback loop.
- Outputs each hardened call site with before/after, the mechanism chosen, and the residual risk.

**Best for:**
- Killing the intermittent "the model's JSON broke in prod" exceptions.
- Turning best-effort JSON into guaranteed, schema-valid output.

### /token-cost-audit

```
/token-cost-audit src/llm
```

**What it does:**
- Audits call sites for oversized/duplicated system prompts, no prompt caching, redundant re-sent context, over-powered model tier, missing `max_tokens`, and unbatched calls.
- Quantifies the potential token/cost reduction per issue, labeling estimates and their assumptions.
- Dispatches the token-cost-optimizer agent to apply the safe, correctness-preserving wins and leaves quality-affecting changes as eval-gated proposals.

**Best for:**
- Cutting an inflated inference bill without guessing where the waste is.
- Enabling prompt caching correctly (prefix-match aware) instead of hoping.

### /rag-tune

```
/rag-tune rag/
```

**What it does:**
- Statically audits a RAG pipeline stage by stage: chunking strategy and size, embedding-model choice, retrieval top-k and filtering, reranking, context assembly and ordering, and citation/grounding.
- Emits prioritized, concrete fixes ordered by impact, labeling each as a quality or cost fix.
- Points the retrieval-quality checks back at `/eval-scaffold` so the fixes are measured, not assumed.

**Best for:**
- Fixing "the right chunk never reaches the model" retrieval problems.
- Trimming RAG cost (over-large top-k, oversized chunks, padding context).

## Agents

### prompt-injection-auditor

**Triggers when:** you mention "prompt injection", "jailbreak", "is this agent safe", "indirect injection", "tool abuse", or "data exfiltration", or when a security sweep dispatches it.

**What it does:** Red-teams prompt construction and tool-calling against the OWASP LLM Top 10, especially LLM01. It traces every path by which untrusted content (user text, retrieved docs, tool outputs, fetched web/email) reaches a prompt unfenced, maps the tool capability graph, finds read-secret + send-data exfiltration pairs, and checks output sinks (HTML/SQL/shell/redirect). It is strictly read-only (`Read`, `Grep`, `Glob`), it reports each finding with `file:line`, the concrete attack that exploits it, and the mitigation, and never edits code.

### token-cost-optimizer

**Triggers when:** you mention "reduce LLM cost", "our token bill is too high", "enable prompt caching", "batch these calls", or "cheaper model for this", or when `/token-cost-audit` dispatches it.

**What it does:** Applies token/cost optimizations to real call sites, enabling prompt caching on stable prefixes (prefix-match aware), trimming redundant context, routing clearly-easy tasks to a cheaper tier, setting `max_tokens`, and batching independent calls. It has `Edit` because applying the safe wins is its job; it explains the estimated saving per change, leaves quality-affecting changes as eval-gated proposals, and never sacrifices correctness for cost.

## Skills

Skills auto-activate from keywords and supply the deep methodology the commands and agents consume, the commands orchestrate, the skills carry the catalogs.

### eval-authoring

How to author eval suites that escape vibes-based development. Reference files:
- `references/eval-frameworks.md`: promptfoo and DeepEval configs/scaffolds, the assertion-type catalog, a framework-free Vitest/pytest + LLM-judge pattern, and a CI job that fails a PR on regression.
- `references/llm-judge-rubrics.md`: writing reliable LLM-as-judge rubrics: criteria, scoring scales, pointwise vs. pairwise, and bias mitigations.

### owasp-llm-top10

The OWASP Top 10 for LLM applications mapped to code-level signals. Reference files:
- `references/attack-templates.md`: concrete prompt-injection and jailbreak strings (direct, indirect/RAG-poisoning, tool-abuse, exfiltration, encoding variants) to test against.
- `references/llm-top10-catalog.md`: LLM01–LLM10 with the code pattern that causes each and the mitigation.

### structured-output

Reliable, schema-conformant structured output from LLMs. Reference files:
- `references/structured-output-apis.md`: native structured-output / tool-schema APIs per provider (Anthropic, OpenAI, Gemini/Vertex, Vercel AI SDK, Pydantic AI, LangChain) and which guarantee valid output.
- `references/validate-and-retry.md`: schema validation (Zod/Pydantic) plus the retry-with-error-feedback loop, and why regex/`JSON.parse` extraction is fragile.

### prompt-versioning-hygiene

Treating prompts as versioned, reviewable, testable code. Reference files:
- `references/prompt-management.md`: externalizing prompts, versioning (semver vs. content hash), environment-specific rendering, and change review.
- `references/prompt-testing.md`: testing prompts as code and wiring prompt changes into the eval suite so a regression fails CI.

## Hooks

LLM App Hardener ships a **PostToolUse(Write|Edit)** hook that is **advisory and non-blocking**. When you edit a file that looks like a prompt or an LLM call site, paths like `prompts/`, names like `*.prompt` or `*prompt*`, or files that construct system/user messages, it injects a short reminder to run `/eval-scaffold` (to pin the new behavior with tests) or `/structured-output-doctor` (to harden a parse).

The hook only surfaces a suggestion. It is fail-safe: it never blocks the edit, never rejects a tool call, and never fails the session. Disable it any time via the `/hooks` menu or by removing the plugin.

## Typical Workflow

1. You edit a system prompt under `prompts/`. On save, the advisory hook reminds you to run `/eval-scaffold`.
2. Run `/eval-scaffold prompts/support_reply.txt`. It detects your SDK and runner, generates assertion + judge + golden tests and a CI gate, and tells you exactly what behavior is now pinned.
3. Before shipping the agent, run the **prompt-injection-auditor** over `agents/` to catch untrusted-input concatenation, tool-abuse paths, and exfiltration pairs, each with the attack that exploits it.
4. Run `/structured-output-doctor src/agents` to replace fragile `JSON.parse`/regex extraction with native schema-constrained output plus validate-and-retry.
5. Run `/token-cost-audit src/llm`; the token-cost-optimizer applies prompt caching, context trimming, and `max_tokens`, and proposes any tier downgrade gated on the eval suite.
6. If the app is RAG, run `/rag-tune rag/` to fix chunking, reranking, and context ordering, then feed the retrieval checks back into the eval suite.

## Plugin Structure

```
llm-app-hardener/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── eval-scaffold.md
│   ├── structured-output-doctor.md
│   ├── token-cost-audit.md
│   └── rag-tune.md
├── agents/
│   ├── prompt-injection-auditor.md
│   └── token-cost-optimizer.md
├── skills/
│   ├── eval-authoring/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── eval-frameworks.md
│   │       └── llm-judge-rubrics.md
│   ├── owasp-llm-top10/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── attack-templates.md
│   │       └── llm-top10-catalog.md
│   ├── structured-output/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── structured-output-apis.md
│   │       └── validate-and-retry.md
│   └── prompt-versioning-hygiene/
│       ├── SKILL.md
│       └── references/
│           ├── prompt-management.md
│           └── prompt-testing.md
└── README.md
```

## Requirements

- Claude Code CLI
- An LLM app in the repo (any of: Anthropic SDK, OpenAI SDK, LangChain, LlamaIndex, Vercel AI SDK, Pydantic AI). Analysis is static and repo-native, no API keys or model calls are required to run the audits themselves; running the generated eval suites uses whatever provider your app already uses.

## License

MIT

## Version

1.0.0

Harden your LLM app where it lives, in the prompts, schemas, and call sites.
