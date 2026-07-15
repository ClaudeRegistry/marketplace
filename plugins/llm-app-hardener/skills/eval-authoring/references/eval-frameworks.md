# Eval Frameworks: Configs, Assertions, and a Framework-Free Fallback

Ride the framework the repo already uses. Detect it first: `promptfooconfig.yaml` → promptfoo; `deepeval` import or `.deepeval` → DeepEval; `ragas` → Ragas (RAG-specific); none of these → plain unit runner + a judge helper.

## promptfoo

Config-first. A `promptfooconfig.yaml` declares prompts, providers, test cases, and per-case assertions. Run with `npx promptfoo eval` (or `promptfoo eval -c path`).

```yaml
# promptfooconfig.yaml
description: Support-reply eval
prompts:
  - file://prompts/support_reply.txt   # {{question}} placeholder
providers:
  - anthropic:messages:claude-opus-4-8
  - openai:chat:gpt-4o-mini            # compare two providers/tiers side by side
defaultTest:
  assert:
    - type: is-json
    - type: cost
      threshold: 0.01                  # fail if a single call exceeds $0.01
    - type: latency
      threshold: 4000                  # ms
tests:
  - vars: { question: "How do I reset my password?" }
    assert:
      - type: contains
        value: "reset"
      - type: not-contains
        value: "I cannot help"
      - type: llm-rubric
        value: "Answers the user's question, stays on-topic, no invented account details."
  - vars: { question: "Refund policy?" }
    assert:
      - type: javascript
        value: output.length < 800     # verbosity budget
      - type: model-graded-closedqa
        value: "The reply cites the 30-day window from the policy context."
```

Common promptfoo assertion `type`s: `equals`, `contains`, `icontains`, `starts-with`, `regex`, `is-json`, `contains-json`, `is-valid-openai-tools-call`, `javascript` (arbitrary predicate on `output`), `python`, `cost`, `latency`, `perplexity`, `similar` (embedding cosine ≥ threshold), and the model-graded family: `llm-rubric`, `model-graded-closedqa`, `model-graded-factuality`, `answer-relevance`, `context-faithfulness`, `context-recall` (the last two for RAG). Set the grading model with `defaultTest.options.provider`. Use `--repeat N` to check determinism and `promptfoo eval --output results.json` for CI parsing.

## DeepEval

Code-first, pytest-native. Metrics are objects; cases are `LLMTestCase`. Run with `deepeval test run tests/` or plain `pytest`.

```python
# tests/test_support.py
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import (
    GEval, AnswerRelevancyMetric, FaithfulnessMetric, JsonCorrectnessMetric,
)

def test_password_reset():
    case = LLMTestCase(
        input="How do I reset my password?",
        actual_output=run_app("How do I reset my password?"),   # your call site
        retrieval_context=["Users reset passwords from Settings > Security."],
    )
    correctness = GEval(
        name="Correctness",
        criteria="Does the answer correctly explain how to reset a password, "
                 "using only the retrieval_context and inventing nothing?",
        evaluation_params=["input", "actual_output", "retrieval_context"],
        threshold=0.7,
    )
    assert_test(case, [
        correctness,
        AnswerRelevancyMetric(threshold=0.7),
        FaithfulnessMetric(threshold=0.8),     # RAG groundedness
    ])
```

`GEval` is the general LLM-judge metric, supply `criteria` (or `evaluation_steps`) and a `threshold`. RAG metrics: `FaithfulnessMetric`, `AnswerRelevancyMetric`, `ContextualPrecisionMetric`, `ContextualRecallMetric`. Structure: `JsonCorrectnessMetric(expected_schema=...)`. Build regression sets with `EvaluationDataset` (`.add_test_case`, or load a golden `jsonl`), then `dataset.evaluate([...metrics])`.

## Ragas (RAG only)

If the app is RAG and the repo already uses Ragas, express retrieval quality with `faithfulness`, `answer_relevancy`, `context_precision`, `context_recall` over a `Dataset` of `{question, answer, contexts, ground_truth}`. Otherwise prefer promptfoo/DeepEval so the same suite covers non-RAG prompts too.

## Framework-free fallback (Vitest / pytest + a judge helper)

When no eval framework is present and the team runs plain unit tests, do not add one, generate tests on the existing runner plus a tiny judge helper.

```ts
// evals/support.eval.test.ts  (Vitest)
import { describe, it, expect } from "vitest";
import { runApp } from "../src/app";
import { judge } from "./judge";               // helper below

const cases = [
  { q: "How do I reset my password?", must: /reset/i, banned: /cannot help/i },
];

describe("support replies", () => {
  for (const c of cases) {
    it(c.q, async () => {
      const out = await runApp(c.q);
      expect(out).toMatch(c.must);              // assertion grader
      expect(out).not.toMatch(c.banned);
      const { pass, score } = await judge(out, {
        rubric: "Answers the question, on-topic, invents no account details.",
        threshold: 0.7,
      });
      expect(pass, `judge score ${score}`).toBe(true);   // judge grader with threshold
    });
  }
});
```

```ts
// evals/judge.ts, provider-agnostic judge; return a numeric score + pass flag
export async function judge(output: string, o: { rubric: string; threshold: number }) {
  const schema = {
    type: "object",
    properties: { score: { type: "number" }, reason: { type: "string" } },
    required: ["score", "reason"], additionalProperties: false,
  };
  const prompt = `Score the OUTPUT from 0 to 1 against the RUBRIC. Return JSON.\n`
    + `RUBRIC: ${o.rubric}\nOUTPUT: ${output}`;
  // Call your provider with schema-constrained output (see the structured-output skill),
  // then:
  const { score } = await callModelJson(prompt, schema);   // your SDK wrapper
  return { pass: score >= o.threshold, score };
}
```

Keep the judge on a capable model and pin its own prompt/schema; a judge that returns free-text "looks good" is not a gate. Record judge outputs so a threshold change is auditable.

## CI job, fail the PR on regression

```yaml
# .github/workflows/llm-evals.yml
name: llm-evals
on: [pull_request]
jobs:
  evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      # promptfoo: non-zero exit on any failing assertion
      - run: npx promptfoo eval -c promptfooconfig.yaml --output results.json
        env: { ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }} }
      # or DeepEval / plain runner:
      # - run: deepeval test run tests/
      # - run: npx vitest run evals/
```

Store the API key as a repo secret. Split the suite: cheap deterministic assertions on every push; the judge and golden-set (model-calling) runs on `pull_request` or nightly so cost stays bounded. Persist `results.json` as an artifact so a reviewer can see which case regressed, not just that the check went red.
