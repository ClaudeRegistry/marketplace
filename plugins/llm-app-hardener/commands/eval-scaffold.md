---
description: Scaffold a real eval suite for an app's prompts/agents so a change can be proven better, not eyeballed
argument-hint: [prompt-or-agent-file]
model: inherit
---

Scaffold a runnable eval suite for the prompt, agent, or LLM call site at `$ARGUMENTS` (default: the app's prompt/agent files under `prompts/`, `agents/`, `chains/`, or the LLM call sites in the current diff). This escapes "vibes-based" development: after this command, a prompt change is graded by tests instead of by reading three outputs. It applies the **eval-authoring** skill and rides an existing eval framework where one is present rather than reinventing it.

## Process

### Step 1: Detect the SDK, runner, and any eval framework
Read manifests and imports to fix the stack before writing anything:

| Layer | Signal |
|---|---|
| Anthropic SDK | `anthropic`, `@anthropic-ai/sdk`, `client.messages.create` |
| OpenAI SDK | `openai`, `OpenAI(`, `chat.completions.create`, `responses.create` |
| LangChain | `langchain`, `ChatOpenAI`, `ChatAnthropic`, `.invoke(` |
| LlamaIndex | `llama-index`, `VectorStoreIndex`, `query_engine` |
| Vercel AI SDK | `ai`, `generateText`, `generateObject`, `streamText` |
| Pydantic AI | `pydantic-ai`, `Agent(`, `result_type=` |
| Test runner | `pytest`/`pyproject.toml`, `vitest`/`jest`/`package.json`, `go test` |
| Eval framework | `promptfooconfig.yaml`, `promptfoo`, `deepeval`, `.deepeval`, `ragas` |

If **promptfoo** or **DeepEval** is already present, generate configs/tests for it (see the skill's `references/eval-frameworks.md`). If neither is present, generate framework-free tests on the detected unit runner (Vitest/pytest) plus a small LLM-judge helper.

### Step 2: Identify what to evaluate
Read the target prompt/agent and name its contract: the inputs it takes, the output shape it promises, and the failure modes worth catching (wrong format, missing field, hallucinated fact, ignored instruction, unsafe content, verbosity). Pull 3–6 representative cases from fixtures, logs, or the prompt's own examples, never invent domain facts.

### Step 3: Generate the suite (apply the eval-authoring skill)
Produce four artifacts:
1. **Assertion tests**: deterministic checks per case: `equals`/`contains`/`icontains`, `regex`, `is-json` + `json-schema`, `not-contains` (banned strings), latency/cost budget. Cheap, fast, run every commit.
2. **LLM-as-judge tests**: for qualities assertions can't capture (faithfulness, helpfulness, tone). Use a rubric from `references/llm-judge-rubrics.md`: explicit criteria, a fixed scale, and a pass threshold. Prefer pairwise (new vs. baseline) for regression gates.
3. **Golden-dataset stub**: a versioned `cases` file (`jsonl`/`yaml`) with `input`, `expected`/`assert`, and a `tags` field, plus a short note on how to grow it from production traces.
4. **CI job**: a GitHub Actions workflow that runs the suite on PRs and **fails the check on a quality regression** (assertion failure, or judge score below threshold / below the baseline).

### Step 4: Output
Emit each file with its path, then a `## How to run` block with the exact local command and the CI trigger. Close with `## What this pins`: the concrete behaviors now guarded, and `## Next cases to add`: the gaps a reviewer should fill from real traffic.

## Important Notes
- Base every case on real code or real fixtures, cite the `file:line` each assertion is derived from. Never fabricate expected outputs or domain facts.
- Ride the present framework; do not add promptfoo/DeepEval if the repo already standardized on the other, and do not add either if the team clearly runs plain unit tests.
- Keep assertion tests deterministic and offline where possible; reserve live model calls for the judge and golden-set runs so CI stays cheap and stable.
- A judge test without a threshold is not a gate, every judge assertion must define the score that fails the build.
