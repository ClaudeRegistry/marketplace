# Writing Reliable LLM-as-Judge Rubrics

An LLM judge grades outputs that assertions can't, faithfulness, helpfulness, tone, "did it actually answer the question." A judge is only as trustworthy as its rubric and its bias controls. A vague rubric ("is this good?") produces noisy, uncalibrated scores that make a green build meaningless.

## When to use a judge (and when not to)
- **Use a judge** for subjective or open-ended qualities: relevance, groundedness, coherence, safety, style adherence, "follows the instruction."
- **Do not use a judge** for anything an assertion can check: valid JSON, a required substring, a schema, a number in range, a banned phrase. Assertions are free, deterministic, and non-flaky, always prefer them.
- **Do not use a judge as the only gate** on a critical correctness property. Back it with assertions and a golden set.

## Anatomy of a good rubric
1. **One criterion per judge call.** Grading "accuracy AND tone AND completeness" in one score collapses distinct failures into one number. Run separate judge metrics and threshold each.
2. **Concrete, checkable criteria.** Not "is the answer good," but "the answer resolves the user's question using only the provided context and states 'I don't know' when the context lacks the answer."
3. **A fixed scale with anchors.** Prefer a small integer scale (1–5) or binary pass/fail with explicit anchor descriptions per point, over an ungrounded 0–1 float. Define what a 5 looks like and what a 1 looks like.
4. **Reference-guided when possible.** Give the judge the ground-truth or the source context and ask it to compare, rather than judging from its own prior, this cuts hallucinated approval.
5. **Require a reason before the score.** Make the judge output `{reason, score}` (reason first). Forcing an explanation before the number improves calibration and gives you an audit trail.
6. **Return structured output.** Constrain the judge to a JSON schema (see the structured-output skill) so scores parse reliably and never arrive as prose.

## Pointwise vs. pairwise

| Mode | The judge sees | Best for | Trade-off |
|---|---|---|---|
| **Pointwise** | One output + rubric | Absolute quality bars, per-case thresholds | Scores drift between judge versions; harder to calibrate |
| **Pairwise** | Two outputs (A vs. B) + rubric, pick the better | **Regression gates**: new prompt vs. current-production prompt | Only tells you relative order, not absolute quality |

For CI regression gating, pairwise is usually the right default: "does the new prompt beat the baseline on these cases?" is a cleaner, more stable question than "does the new prompt score ≥ 0.8 absolutely?" Run each pair in **both orders** (A,B and B,A) and count a win only if it survives both, this neutralizes position bias.

## Bias mitigations (the judge lies in predictable ways)
- **Position bias**: judges favor whichever answer is presented first. Mitigation: swap order and require agreement across both orderings; discard non-agreeing pairs or count them as ties.
- **Verbosity bias**: judges reward longer answers regardless of quality. Mitigation: add "length is not quality; penalize padding and repetition" to the rubric, and pair the judge with a verbosity assertion (`output.length < N`).
- **Self-preference bias**: a judge favors outputs from its own model family. Mitigation: judge with a different model than the one under test where feasible, and disclose the pairing.
- **Sycophancy / leniency**: judges skew toward approval. Mitigation: anchor the low end of the scale with a concrete failing example, and calibrate on a labeled set (below).
- **Formatting bias**: markdown, confident tone, or bullet lists inflate scores. Mitigation: instruct the judge to grade substance, not presentation.

## Calibrating and trusting a judge
Before a judge gates CI, verify it agrees with humans on a small labeled set:
1. Hand-label 15–30 outputs pass/fail (or with scores).
2. Run the judge over the same set.
3. Compute agreement (exact-match rate, or Cohen's κ). Aim for high agreement before trusting the judge as a gate; if it disagrees often, tighten the rubric or add anchors and re-check.
4. Re-run this calibration whenever you change the judge model or the rubric, a rubric edit is a grader change and can move every score.

## A rubric template
```
You are grading one OUTPUT against a single CRITERION. Grade substance, not
length or formatting. Longer is not better.

CRITERION: <one concrete, checkable quality>
CONTEXT (ground truth the output must stay faithful to): <source or expected>

Scale:
  5, Fully satisfies the criterion; nothing to fix.
  3, Partially satisfies it; a real but non-fatal gap.
  1, Fails the criterion (wrong, unfaithful, or off-topic).

Return JSON only: {"reason": "<1-2 sentences citing the evidence>", "score": <1-5>}
```

Set the pass threshold on this scale explicitly in the eval (e.g. `score >= 4`). A judge metric with no threshold is documentation, not a gate, every judge assertion in the suite must define the score that fails the build.
