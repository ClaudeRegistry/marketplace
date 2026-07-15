---
description: Audit LLM call sites for token and cost waste, quantify the savings, and apply the safe wins
argument-hint: [file-or-dir]
model: inherit
---

Audit the LLM call sites at `$ARGUMENTS` (default: the current diff, or the app's model-calling modules) for token and cost waste, quantify the potential reduction, and dispatch the **token-cost-optimizer** agent to apply the safe wins. Large cost cuts (frequently 60–85%) are routinely on the table in LLM apps but hide behind tedious manual auditing, this command does that auditing directly on your call sites and prompt assembly.

## Process

### Step 1: Detect the provider(s) and map the call sites
Identify each SDK in use (Anthropic, OpenAI, Gemini/Vertex, LangChain, LlamaIndex, Vercel AI SDK) and enumerate the call sites, the system prompts they send, and how per-turn context is assembled. Note the model tier each call uses and whether calls run in a loop.

### Step 2: Classify the waste
Score each site against this catalog:

| Issue | Signal | Fix |
|---|---|---|
| Oversized / duplicated system prompt | Multi-KB system string, or the same preamble rebuilt per request | Extract once; trim dead instructions |
| No prompt caching | Stable prefix re-sent uncached every call | Enable prompt caching on the stable prefix |
| Cache-busting prefix | `now()`/UUID/unsorted JSON early in the prompt | Move volatile content after the cache breakpoint |
| Redundant context re-sent | Full history/RAG docs resent each turn unchanged | Cache, trim, or window the context |
| Over-powered model tier | Frontier model on classification/extraction/routing | Route easy tasks to a cheaper tier |
| Missing `max_tokens` | No output cap on a bounded task | Set a sensible cap |
| Unbatched calls | Independent calls in a serial loop | Batch, or use the batch endpoint |

### Step 3: Quantify
For each finding, estimate the token/cost reduction from what is visible in code: prompt size (count the tokens in the static string), call frequency, cache hit-rate opportunity (reads cost a small fraction of base input; a stable multi-KB prefix reused across calls is the highest-leverage win), and tier price deltas (cheaper tiers are typically several times less per token). State assumptions; mark anything needing a production token count as *estimated*.

### Step 4: Dispatch and report
**Launch the token-cost-optimizer agent** to apply only the safe, correctness-preserving wins (caching, trimming, tier routing for clearly-easy tasks, `max_tokens`, batching). Then relay:
- `## Savings Table`: `Issue | Site (file:line) | Est. token/cost reduction | Fix | Applied?`
- `## Applied`: the changes the agent made, with before/after.
- `## Needs Judgment`: wins that change behavior (a tier downgrade on a quality-sensitive path) left for human review, each with the eval to run first.

## Important Notes
- Base every finding on real call sites, cite `file:line`. Never fabricate token counts, prices, or a percentage; label estimates as estimates and show the assumption.
- Correctness first: never trade accuracy for cost. A model-tier downgrade on anything quality-sensitive is a *proposal* gated on an eval (pair with `/eval-scaffold`), not an automatic edit.
- Prompt caching is a prefix match, verify the stable content actually precedes the volatile content before claiming a cache win.
- Prefer provider-native mechanisms (caching, batch endpoints) over hand-rolled ones.
