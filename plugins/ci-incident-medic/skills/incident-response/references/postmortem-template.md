# Postmortem Template + Worked Example

## The template

```markdown
# Postmortem: <short incident title>

**Status:** Draft | In review | Final
**Severity:** SEV<n>
**Authors:** <role/team>          # not for blame, for follow-up ownership
**Date of incident:** YYYY-MM-DD
**Duration:** <detection → resolution>, <N> minutes

## Summary
<2-3 sentences: what broke, who/what was affected, how long, how it was resolved.>

## Impact
- **Users affected:** <count / % / segments>
- **Duration:** <start UTC> → <end UTC> (<N> min)
- **Severity:** SEV<n>, <one-line justification>
- **SLO / error budget:** <burn, e.g. "consumed 40% of monthly availability budget">
- **Revenue / data impact:** <if any; "no data loss" is a valid, important statement>

## Timeline (UTC)
| Time (UTC) | Event | Source |
|------------|-------|--------|
| HH:MM | <what happened> | <alert / log / chat / deploy record> |
... detection → mitigation → resolution ...

## Root Cause / Contributing Factors
<System-level narrative. List multiple contributing factors, trigger, amplifiers,
and the gaps that let it reach production and persist. Blameless: name the missing
guardrail, not the person.>
1. **Trigger:** <the change/event that started it>
2. **Amplifier:** <what made the blast radius larger>
3. **Detection gap:** <why it wasn't caught sooner>
4. **Mitigation gap:** <why recovery took as long as it did>

## What Went Well
- <specific, e.g. "rollback tooling worked; recovery took 4 min once triggered">

## What Went Poorly
- <specific, e.g. "no alert fired; detected via customer report 22 min in">

## Action Items
| Owner | Due | Item | Type |
|-------|-----|------|------|
| <team/role> | YYYY-MM-DD | <verifiable action> | preventive |
| <team/role> | YYYY-MM-DD | <verifiable action> | detective |

## Lessons Learned
- <durable takeaway that outlives this specific incident>
```

## Worked example

```markdown
# Postmortem: Checkout API 5xx spike after config rollout

**Status:** Final
**Severity:** SEV2
**Authors:** Payments on-call
**Date of incident:** 2026-06-18
**Duration:** 14:02 → 14:41 UTC, 39 minutes

## Summary
A configuration change reduced the checkout service's database connection-pool
size to 5, exhausting connections under normal load. ~18% of checkout requests
returned HTTP 500 for 39 minutes until the change was rolled back. No orders were
lost; affected requests were retried by clients.

## Impact
- **Users affected:** ~18% of checkout attempts (~4,300 requests) returned 500.
- **Duration:** 14:02 → 14:41 UTC (39 min).
- **Severity:** SEV2, major feature (checkout) degraded, not fully down; workaround (retry) partially succeeded.
- **SLO / error budget:** consumed ~35% of the monthly checkout availability budget.
- **Revenue / data impact:** no data loss; delayed (not lost) orders.

## Timeline (UTC)
| Time (UTC) | Event | Source |
|------------|-------|--------|
| 13:58 | Config PR merged reducing `db.pool.max` 50 → 5 | deploy record |
| 14:02 | Rollout completes; 500 rate begins climbing | Grafana 5xx panel |
| 14:11 | Customer support reports failed checkouts | support channel |
| 14:14 | On-call paged (manual, via support escalation) | PagerDuty |
| 14:23 | On-call correlates spike start with 14:02 rollout | chat thread |
| 14:31 | Decision to roll back the config change | chat thread |
| 14:37 | Rollback deployed | deploy record |
| 14:41 | 500 rate returns to baseline; incident resolved | Grafana 5xx panel |

## Root Cause / Contributing Factors
1. **Trigger:** a config change lowered the DB connection-pool max to a value below steady-state concurrency, so requests queued and timed out.
2. **Amplifier:** no per-request connection timeout, so exhausted-pool requests hung and consumed threads.
3. **Detection gap:** the 5xx spike had no alert wired to paging; detection came from a customer report 9 minutes after onset.
4. **Mitigation gap:** the config value change was not covered by a load test in CI, so the regression shipped unblocked.

## What Went Well
- Rollback tooling worked cleanly; recovery took 4 minutes once triggered.
- Clear deploy records let on-call correlate cause quickly once engaged.

## What Went Poorly
- No automated alert fired on the 5xx spike; MTTD was ~12 minutes via a human report.
- Connection-pool config had no guardrail or load-test gate.

## Action Items
| Owner | Due | Item | Type |
|-------|-----|------|------|
| Payments team | 2026-06-25 | Add a paging alert on checkout 5xx rate > 2% for 2 min | detective |
| Platform team | 2026-07-02 | Add a CI load test that fails if p99 latency regresses under configured pool size | preventive |
| Payments team | 2026-06-27 | Enforce a per-request DB acquisition timeout with a sane default | preventive |
| SRE | 2026-07-05 | Add pool-utilization dashboard + alert at 80% | detective |

## Lessons Learned
- Resource-sizing config (pools, limits) needs a load-test gate; schema validity is not safety.
- Alerting on user-facing symptoms (5xx rate) beats alerting only on infrastructure metrics.
```

## Authoring notes
- Keep the timeline factual and source-cited; put interpretation in Root Cause.
- Prefer three to five contributing factors over one "root cause", real incidents are multi-causal.
- If a fact is unknown, write `[unknown, needs follow-up]`; do not fabricate.
- Never name an individual as the cause. Roles are fine for timeline attribution.
