---
title: "Continual Learning and Test in Production"
type: concept
tags: [ai, machine-learning, mlops, deployment, testing, bandits, a-b-testing, continual-learning]
sources: [designing-machine-learning-systems]
created: 2026-05-30
updated: 2026-05-30
---

# Continual Learning and Test in Production

## Definition

Continual learning is a model update paradigm in which systems are retrained on a stream of fresh data rather than on fixed historical snapshots. It is distinct from online learning in that updates occur on mini-batches, not per-sample. (→ [[sources/designing-machine-learning-systems]] ch. 9)

Test in production is the discipline of validating ML models against real production traffic — complementing offline evaluation, which can never fully replicate production data distributions.

## Why Continual Learning Matters

Three motivations:

1. **Combat distribution shifts.** Static models degrade as production data diverges from training data. More frequent updates reduce the staleness gap. (→ [[concepts/data-distribution-shifts]])
2. **Handle rare events.** Black Friday traffic, viral events, and one-off market shocks cannot be anticipated in training data; models must adapt as they occur.
3. **Continuous cold start.** New users and new items have no history. A continually-updating model can personalise within minutes. TikTok can adapt to a new user's preferences in ten minutes.

**Empirical evidence for data freshness value:** Facebook found that moving from weekly to daily retraining reduced loss by 1% for ad click-through rate — a large number given revenue scale. The value of data freshness should be measured empirically: compare models trained on different time windows (last day, last week, last month) against a held-out evaluation window.

## Stateless Retraining vs Stateful Training

| Approach | Description | Trade-offs |
|----------|-------------|------------|
| **Stateless retraining** | Train from scratch on a combined historical + new dataset | Simple; reproducible; computationally expensive; requires storing all historical data |
| **Stateful training (fine-tuning)** | Continue training from the last model checkpoint on new data only | Computationally efficient; avoids storing all historical data; risk of catastrophic forgetting; harder to debug |

Grubhub switched to stateful training and achieved a 45× compute reduction alongside a 20% increase in purchase completion rate. Stateful training is also the only viable approach when historical data cannot be retained (GDPR, privacy constraints).

**Model iteration vs data iteration:**
- *Data iteration:* same model architecture, fresh training data. Stateful-compatible; more frequent.
- *Model iteration:* architecture changes, new features, new objective. Requires full stateless retraining.

## Four Stages of Continual Learning Maturity

| Stage | Description |
|-------|-------------|
| **1 — Manual stateless** | Ad hoc retraining from scratch; triggered by observed degradation |
| **2 — Automated stateless** | Scheduled retraining pipeline; fixed cadence; no human trigger needed |
| **3 — Automated stateful** | Scheduled fine-tuning pipeline; retains checkpoint; reduces compute |
| **4 — Trigger-based** | Automated retraining triggered by time, performance degradation, data volume threshold, or detected drift |

Trigger types for stage 4: time-based (simplest), performance-based (when accuracy drops below threshold), volume-based (after N new labelled examples), drift-based (when distribution shift is detected). Most production systems combine multiple trigger types.

## Champion / Challenger Model Pattern

Running a challenger model in shadow mode against the champion model — receiving the same inputs but not serving its predictions — allows evaluation without user impact. When the challenger's offline metrics and shadow performance are sufficient, it is promoted to champion. This pattern is the production-safe way to validate model iteration.

## Test in Production Methods

Offline evaluation is necessary but insufficient. The following methods validate models against real production traffic.

### Shadow Deployment

The challenger receives all production traffic in shadow mode. Predictions are logged but not served. Safe but doubles compute cost and cannot measure user-facing outcomes (click, purchase, engagement).

### A/B Testing

Random traffic split: group A receives model A, group B receives model B. Standard statistical hypothesis testing determines whether differences in business metrics are significant. Requirements:
- Sufficient sample size — Booking.com runs 1,000+ A/B tests simultaneously
- Sufficient duration — early stopping causes false positives; test until statistical significance threshold is reached
- Metric alignment — ML metrics (accuracy) ≠ business metrics (revenue); A/B testing bridges the gap
- Random assignment must be stable per user (consistent hashing), not per request, to avoid mixed experiences

Google and Microsoft each run 10,000+ A/B tests per year.

### Canary Release

Progressive traffic rollout: 1% → 5% → 20% → 50% → 100%. Monitor key metrics at each stage; abort and roll back on degradation. Canary release is slower than A/B testing but allows gradual risk exposure. Particularly important for safety-critical models or models with high rollback cost.

### Interleaving Experiments

Both models' recommendations are interleaved in a single response — a user sees results from both models simultaneously, not assigned to a single model. Each item is attributed to the model that produced it; aggregate attribution reveals which model is preferred.

Netflix showed interleaving experiments require dramatically fewer samples than A/B testing to reach the same statistical power, because within-user variance is eliminated. Interleaving requires results to be list-shapeable (rankings, recommendations).

### Bandits

Bandits treat model selection as an exploration-exploitation problem. The system continuously allocates traffic to explore model candidates and exploits the currently best-performing one.

| Algorithm | Description |
|-----------|-------------|
| **ε-greedy** | Exploit the current best model with probability 1-ε; explore randomly with probability ε |
| **Thompson Sampling** | Sample from the posterior distribution of each model's expected reward; naturally balances exploration with uncertainty |
| **Upper Confidence Bound (UCB)** | Select the model with the highest upper confidence bound on expected reward; optimistic under uncertainty |

Empirical comparison: a standard A/B test requires ~630,000 samples to reach significance; a bandit with Thompson Sampling needs only ~12,000. Bandits are stateful and require a reward signal (feedback loop) to update allocation.

### Contextual Bandits

Extend bandits to make exploration context-dependent. Instead of choosing globally which model to deploy, contextual bandits choose which action (recommendation, prediction) to show a given user given their context. This is essentially a partial-feedback supervised learning problem: the model observes reward only for the action it took, not for counterfactual actions.

Contextual bandits are the principled solution to the degenerate feedback loop problem — they explicitly separate exploration (showing suboptimal items to learn their value) from exploitation. (→ [[concepts/data-distribution-shifts]])

## Related Concepts

- [[concepts/data-distribution-shifts]] — continual learning is the primary response to distribution shift
- [[concepts/model-development]] — offline evaluation must precede continual deployment; champion/challenger builds on model selection
- [[operations/monitoring]] — drift triggers for stage-4 continual learning come from the monitoring layer
- [[concepts/ml-systems-design]] — continual learning sits in the monitoring and adaptation phase of the ML lifecycle
