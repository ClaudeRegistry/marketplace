---
description: Find LLM calls whose output is parsed as JSON and harden them with native structured output plus validate-and-retry
argument-hint: [file-or-dir]
model: inherit
---

Find every LLM call at `$ARGUMENTS` (default: the LLM call sites in the current diff, or `src/`/`app/`/`lib/`) whose response is parsed as JSON, and harden it. Plain "JSON mode" or prompt-and-pray produces invalid JSON on a meaningful fraction of calls; provider-native structured output drops that failure rate by one to two orders of magnitude. This command applies the **structured-output** skill: switch to native schema-constrained output where the provider supports it, add a validated parse, and wrap it in a retry-with-error-feedback loop.

## Process

### Step 1: Detect provider and locate fragile parses
Identify the SDK (Anthropic, OpenAI, Gemini/Vertex, LangChain, Vercel AI SDK, Pydantic AI), then grep the call sites for the fragile shapes:

| Smell | Pattern |
|---|---|
| Blind parse | `JSON.parse(`, `json.loads(`, `json.loads(resp...)` right after a completion |
| Regex extraction | `re.search(r"\{.*\}"`, ```/```json```/```, `.split("```")`, "strip the markdown fence" |
| Prompt-only JSON | "Respond ONLY with JSON", "return valid JSON" with no schema enforcement |
| Unvalidated dict access | `data["field"]` with no schema/model between the parse and the use |
| Bare JSON mode | `response_format={"type": "json_object"}` / `json` mode with no schema |

### Step 2: Choose the strongest available mechanism (apply the structured-output skill)
Per `references/structured-output-apis.md`, pick the best option the provider offers:
- **Schema-constrained output**: Anthropic `output_config.format` (`json_schema`) or strict tool use (`strict: true`); OpenAI `response_format: json_schema` with `strict: true`; Gemini `responseSchema`; Vercel AI SDK `generateObject`; Pydantic AI `result_type`. These *guarantee* schema-valid output.
- **Tool/function schema**: when the value is really a function argument, route it through a strict tool schema instead of free-text JSON.
- **Fallback**: if the provider/model lacks native support, keep JSON mode but add strict validation + retry (below).

### Step 3: Add validation and a retry-with-error-feedback loop
Define the schema once (Zod / Pydantic / JSON Schema) and validate every response against it. On a validation failure, retry a bounded number of times, feeding the **validator's error message** back into the next request so the model can correct itself. Replace `JSON.parse`/regex extraction with the validated parse. See `references/validate-and-retry.md` for the loop and why regex extraction is fragile.

### Step 4: Output
For each hardened site emit a `### <file>:<line>` block with **Before** and **After** snippets, the mechanism chosen, and the schema. Close with `## Summary`: a table of `site → smell → mechanism → residual risk`: and `## Caveats` (any provider that only offers best-effort JSON, or a schema feature the provider won't enforce).

## Important Notes
- Base every change on real call sites, cite `file:line` for each parse you replace. Never fabricate a provider capability; if native structured output isn't available for the detected model, say so and use the validate-and-retry fallback.
- Preserve behavior: the hardened call must return the same data the code already consumes. Do not silently change field names or drop fields.
- Bound retries and cap the total attempts; an unbounded correction loop is a cost and latency hazard.
- Structured output and citations/streaming can interact per provider, note any incompatibility instead of assuming it composes.
