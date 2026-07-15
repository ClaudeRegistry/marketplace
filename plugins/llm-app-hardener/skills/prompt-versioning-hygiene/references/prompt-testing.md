# Testing Prompts as Code

A prompt is code that runs on a model. Like any code, a change to it needs a test that fails when it regresses. This reference covers how to test prompts and wire a prompt change into the eval suite so CI blocks a bad edit, the operational payoff of treating prompts as versioned artifacts.

## The principle: a prompt change must trigger the evals
The single most important wiring: **when a prompt file changes, the eval suite runs and gates the merge.** Without it, versioning is bookkeeping. With it, "did this prompt edit improve or regress behavior?" is answered mechanically before the change ships.

```yaml
# .github/workflows/prompt-evals.yml
name: prompt-evals
on:
  pull_request:
    paths:
      - "prompts/**"          # any prompt edit triggers the suite
      - "promptfooconfig.yaml"
jobs:
  evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx promptfoo eval -c promptfooconfig.yaml   # non-zero exit fails the PR
        env: { ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }} }
```

Point this at whatever grader stack the repo uses, promptfoo, DeepEval, or the framework-free runner from the eval-authoring skill. The `paths:` filter means the eval cost is paid only when a prompt actually changes.

## What to test at the prompt level

| Test type | Catches | How |
|---|---|---|
| **Assertion evals** | Format/contract regressions (missing field, wrong shape, banned phrase) | Deterministic checks per case (see eval-authoring) |
| **Judge evals** | Quality regressions (relevance, faithfulness, tone) | LLM-as-judge with a threshold; prefer pairwise vs. the current-prod prompt |
| **Golden-set regression** | Re-introducing a previously-fixed bug | Curated cases that must keep passing |
| **Snapshot / contract test** | Unintended edits to the prompt text itself | Assert the rendered prompt matches an approved snapshot |
| **Injection resistance** | Security regressions in the prompt's handling of untrusted input | Run the owasp-llm-top10 attack templates as cases |

## Snapshot the rendered prompt
A cheap, model-free test: assert that assembling the prompt with fixed inputs produces the approved text. This catches accidental edits (a stray character, a lost instruction, a broken placeholder) instantly and for free, no model call.
```python
def test_summarize_prompt_snapshot(snapshot):
    rendered = render(SUMMARIZE, doc="<<FIXED SAMPLE>>")
    assert rendered == snapshot        # fails on any unreviewed change to the assembled prompt
```
When the change is intentional, updating the snapshot is an explicit, reviewable diff in the PR, which is exactly the point. Pair the snapshot (did the text change?) with the evals (did behavior change?).

## Pairwise regression gating
For quality, the most stable gate compares the candidate prompt against the version currently in production, not against an absolute bar:
1. Run both `prompt@current-prod` and `prompt@candidate` over the golden cases.
2. Judge pairwise (both orderings, count a win only if it survives both, neutralizes position bias).
3. Fail the PR if the candidate loses on a case it previously won ("no regressions"), or require net improvement.

This answers "is the new prompt at least as good as what's live?", a cleaner question than an absolute score, and it moves with the baseline as the prompt improves over time.

## The change workflow, end to end
1. Edit the prompt file; bump its version and changelog entry (see `prompt-management.md`).
2. Open a PR that isolates the prompt change.
3. CI runs: snapshot test (text changed as intended?), assertion evals (contract holds?), judge/golden evals (behavior ≥ baseline?), injection cases (still resistant?).
4. A human reviews intent; the evals prove no regression. Both must pass.
5. Merge; promote through environments (staging → prod) per the version-pinning rules.
6. The active version is logged with each request, so any post-ship quality change is traceable to this exact edit.

## Rollback
Because the prompt is versioned and pinned per environment, rollback is a one-line change: repoint the environment to the prior version (`2.3.0`) while you debug `2.4.0`. No code deploy, no guessing which change caused the dip, the request logs already name the version that was live. This is the concrete payoff of the whole hygiene discipline: a bad prompt is as recoverable as a bad deploy.

## Keep the model-calling tests bounded
Judge and golden-set evals cost a model call each. Keep them on the `pull_request`/nightly path (not every push), run the free snapshot and assertion tests everywhere, and cache/record judge outputs so a threshold change is auditable. A prompt suite that's too expensive to run is a suite that gets skipped.
