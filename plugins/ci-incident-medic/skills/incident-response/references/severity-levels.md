# Severity Levels, Escalation, and Reliability Metrics

## Severity model (SEV1-SEV4)

Severity measures **user-facing impact and urgency**, not effort. Assign it from symptoms at declaration time; it can be revised as scope becomes clear.

| Severity | Definition | Examples | Response |
|----------|------------|----------|----------|
| **SEV1** | Critical: full outage or data loss; core business function down for many/all users | payment processing down, data corruption, security breach, total site outage | Immediate. Page on-call + incident commander; all-hands; exec/status-page comms; 24/7 until resolved |
| **SEV2** | Major: significant degradation or a key feature down; partial user impact; workaround may exist | checkout 5xx spike, login degraded for a region, one major service down | Page on-call within minutes; dedicated responder; internal comms; work through to resolution |
| **SEV3** | Minor: limited impact; non-critical feature degraded; workaround available | a background job delayed, a secondary dashboard broken, elevated but sub-SLO errors | Next business hours; ticket + owner; no paging |
| **SEV4** | Low: cosmetic or negligible user impact | typo in UI, minor log noise, a flaky non-blocking test | Backlog; normal prioritization |

Declaration rules of thumb:
- If unsure between two levels, declare the **higher** one and downgrade later, under-declaring delays response.
- SEV1/SEV2 warrant a **postmortem**; SEV3 often does; SEV4 usually does not.
- Any suspected **security** or **data-integrity** incident starts at SEV1/SEV2 regardless of current visible impact.

## Escalation paths

```
Alert fires ──▶ On-call engineer (ack within N min)
                     │ can't mitigate alone / SEV1-2
                     ▼
              Incident Commander (coordinates, owns comms/decisions)
                     │ needs domain depth
                     ▼
              Subject-matter experts / service owners paged in
                     │ business / external impact
                     ▼
              Management + status-page/customer comms
```

Roles during a declared incident:
- **Incident Commander (IC):** owns coordination and decisions; does not debug hands-on. Single decision-maker.
- **Operations/Responders:** do the hands-on mitigation.
- **Communications lead:** owns internal updates and the status page.
- **Scribe:** timestamps events for the eventual timeline (feeds the postmortem).

## On-call communication norms
- **Acknowledge** the page fast, even if you can't fix it yet, silence looks like no response.
- Post a **status update on a cadence** (e.g. every 15-30 min for SEV1/2), even "no change yet."
- Separate **facts** (what we observe) from **hypotheses** (what we think) in the channel.
- Prefer **mitigation over root-causing** during the incident: stop the bleeding (roll back, failover, feature-flag off) first; diagnose in the postmortem.
- Hand off explicitly across shifts with a written state summary.
- Escalate early and without ego, escalation is a tool, not an admission of failure.

## Reliability metrics

| Metric | Meaning | Formula / definition |
|--------|---------|----------------------|
| **MTTD**: Mean Time To Detect | how long from incident begin to detection | detect_time − begin_time (averaged) |
| **MTTA**: Mean Time To Acknowledge | detection to a human acking the page | ack_time − detect_time |
| **MTTR**: Mean Time To Recover/Repair | detection (or begin) to service restored | resolve_time − detect_time |
| **MTBF**: Mean Time Between Failures | reliability of a system over time | total uptime ÷ number of failures |
| **MTTF**: Mean Time To Failure | expected lifetime for non-repairable components | total operating time ÷ number of units |

Notes:
- Be explicit whether **MTTR** counts from incident *begin* or *detection*, teams differ; pick one and stay consistent.
- **Lower MTTD/MTTR** usually beats chasing a higher MTBF: you cannot prevent every failure, but you can detect and recover fast. Detective action items target MTTD; better rollback/failover targets MTTR.
- Tie metrics to **SLOs and error budgets**: an incident's severity often correlates with how much error budget it burned. When the budget is exhausted, prioritize reliability work over features.

## SLO / error-budget quick reference
- **SLI**: a measured signal (e.g. success rate, latency p99).
- **SLO**: the target for an SLI over a window (e.g. 99.9% success monthly).
- **Error budget**: `1 − SLO`: the allowed unreliability. An incident consuming a large share of the budget is a strong signal to invest in the preventive/detective action items from its postmortem.
