---
title: "Goal-Question-Metric (GQM)"
type: concept
tags: [architecture, metrics, measurement, architecture-process, fitness-functions]
sources: [software-architecture-metrics]
created: 2026-05-22
updated: 2026-05-22
---

# Goal-Question-Metric (GQM)

## Definition

**Goal-Question-Metric (GQM)** is a structured approach to defining software measurements by working top-down from goals rather than bottom-up from what tools make easy to measure. Developed by Basili & Weiss (1984). A GQM tree has four levels:

```
Goal        (root)  — what you want to achieve or understand
  └── Questions     — how you would evaluate progress toward the goal
        └── Metrics — what you would measure to answer each question
              └── Data (leaves) — the raw data needed to produce the metric
```

This structure creates traceability: every collected data point links upward to a metric, which links to a question, which links to the goal. Metrics without a traceable goal are candidates for retirement. (→ [[sources/software-architecture-metrics]] ch. 10)

## Why It Matters

The alternative to GQM is measuring what tools make convenient — which typically produces implementation metrics (code coverage, cyclomatic complexity, build time) that are easy to collect but may not reflect the architectural properties that actually matter. GQM forces the team to articulate goals first, then derive what evidence would indicate progress, then select or build the instruments to collect that evidence.

GQM is equally valuable as a **coaching and alignment tool**: the process of writing the goal statement and generating questions surfaces hidden disagreements about what the system should achieve — disagreements that, if left implicit, eventually surface as architectural misalignment.

## The Goal Statement

A well-formed GQM goal statement has four parts:

| Element | Meaning | Example |
|---------|---------|---------|
| **Purpose** | What you are trying to do | "Understand the impact of…" / "Improve…" / "Characterise…" |
| **Object** | What is being measured | "the rate-limit handling of the job queue" |
| **Issue/Topic** | The specific concern | "reliability under load" |
| **Viewpoint** | Whose perspective matters | "from the perspective of the on-call team" |

Investing time in a precise goal statement pays off: a vague goal produces vague questions and unmeasurable metrics. Rewrite the goal if the questions derived from it feel unfocused.

## Questions

Questions operationally focus the goal — they ask what evidence would indicate progress. Good questions:

- Do not prejudge the answer
- "Let go of what is practical" — ask what you would want to know, not just what is easy to measure; cost constraints enter at the metric level, not the question level
- Evaluate progress positively and negatively (negative metrics prevent optimising one dimension at the expense of another)

## Metrics

For each question, identify one or more metrics. Select by:

- **Signal strength**: a metric with a strong, unambiguous signal is preferable to one that only weakly indicates the answer
- **Cost**: inexpensive metrics are preferable; some valuable metrics are expensive to collect only short-term (e.g., a manual experiment worth running once)
- **Cross-question reuse**: a metric that answers multiple questions is more efficient than a single-purpose one

Include both positive and negative metrics to ensure honesty — optimising deployment frequency while ignoring change failure rate produces misleading progress signals.

## Data Collection Strategy

Once metrics are selected, plan how each will be collected:

- Instrument the code (logs, traces, counters)
- Surveys (for qualitative signals like team confidence or cognitive load)
- Task databases (Jira, Linear — for lead time, failure counts)
- Static source code analysis
- Automated tools
- Manual collection for short-duration experiments

## The GQM Workshop (9-Step Process)

Keeling describes a facilitated workshop format (→ [[sources/software-architecture-metrics]] ch. 10):

1. **Introduction and ground rules** — set expectations; explain GQM; establish psychological safety
2. **Write the goal** — collaboratively draft the goal statement using the four-part structure
3. **Gather questions** — brainstorm independently, then share; group and consolidate
4. **Brainstorm metrics per question** — for each question, generate candidate metrics without filtering for feasibility yet
5. **Sanity-check the goal** — revisit the goal statement; do the questions feel right? Rewrite the goal if needed
6. **Identify data** — for each metric, identify what data is needed and where it could come from
7. **Prioritise metrics** — apply signal-strength, cost, and reuse criteria; agree on a working set
8. **Open floor for reflection** — surface doubts, gaps, concerns
9. **Document and share** — publish the GQM tree; circulate before the next meeting

## Case Study: Foo Service

A job-processing service exceeded its external API rate limit every Monday morning. The team treated it as a recurring ops issue for months before a postmortem triggered a GQM exercise.

**Goal**: Understand why Foo Service exceeds its API rate limit on Monday mornings from the perspective of the on-call team.

**Questions**: How many jobs are queued at the start of the week? What retry behaviour occurs when rate-limited? How quickly does the team detect a failure?

**Metrics**: Queue depth over time; retry count per job per week; time from failure to alert.

**Resulting architectural decisions**:
1. New **heartbeat component** — publishes regular queue-depth telemetry; enables trend monitoring
2. **Fail-fast ADR** — jobs that hit rate limits fail immediately and return to the work queue; the work queue handles retries (rather than jobs retrying themselves, causing a burst)

Nine months later, the same service went down for 14 hours due to an infrastructure failure. The team was alerted within **10 minutes** before any users were affected — what would have been a priority-zero incident became a barely noteworthy event.

> "A metric by itself can only tell you something is wrong. It can't tell you what to do about it." (team leader, → [[sources/software-architecture-metrics]] ch. 10)

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/software-architecture-metrics]] | Keeling (ch. 10): GQM as measurement and alignment tool; 9-step workshop; Foo Service case study; practical metric selection criteria |

## Related Concepts

- [[concepts/fitness-functions]] — GQM produces the goals and metrics that fitness functions operationalise; fitness functions are one data collection mechanism for GQM metrics
- [[concepts/four-key-metrics]] — the DORA four are a ready-made GQM answer for delivery performance goals; can be incorporated into a broader GQM tree
- [[concepts/architecture-characteristics]] — GQM is a method for making quality attribute measurement explicit and traceable
- [[concepts/evolutionary-architecture]] — GQM supports the "last responsible moment" decision culture by clarifying what needs to be measured before deciding what to build
