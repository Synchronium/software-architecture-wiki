---
title: "Data Distribution Shifts"
type: concept
tags: [ai, machine-learning, monitoring, production, distribution-shift, concept-drift, covariate-shift, data-quality]
sources: [designing-machine-learning-systems, reliable-machine-learning]
created: 2026-05-30
updated: 2026-05-30
---

# Data Distribution Shifts

## Definition

Data distribution shift (also: dataset shift) is the phenomenon in supervised learning where the data distribution a model encounters in production diverges from the distribution it was trained on. A model's performance is best immediately after training; shifts cause it to degrade over time. (→ [[sources/designing-machine-learning-systems]] ch. 8)

The stationary distribution assumption — that training and production data come from the same fixed distribution — is wrong in almost all real-world deployments. Distributions change suddenly (competitor price changes, product launches, celebrity mentions), gradually (social norms, language, industry trends), and seasonally.

Operational failures can produce covariate shift indirectly: a payments failure on a Spanish-language site caused Spanish-speaking users to abandon purchases, reducing Spanish-language purchase completions in training data, causing the model to learn that Spanish queries don't convert, causing it to show fewer Spanish results — which continued to degrade quality for Spanish users even after the payments system recovered. (→ [[sources/reliable-machine-learning]] ch. 2)

> **Open question:** 80% of apparent drifts captured by monitoring services are caused by internal errors — bugs in pipelines, missing values incorrectly inputted, wrong model version — rather than true distribution changes. Disentangling the two is often harder than detecting the shift itself.

## Types of Distribution Shifts

Given training data drawn from joint distribution P(X, Y) decomposed as P(X, Y) = P(Y|X)·P(X):

| Type | Formal definition | Plain language |
|------|------------------|----------------|
| **Covariate shift** | P(X) changes; P(Y|X) unchanged | Input distribution changes; the relationship between input and output is constant |
| **Label shift** | P(Y) changes; P(X|Y) unchanged | Output distribution changes; the reverse conditional stays the same |
| **Concept drift** | P(Y|X) changes; P(X) unchanged | "Same input, different output" |
| **Feature change** | Feature schema changes | Features added/removed/re-ranged |
| **Label schema change** | Set of output labels changes | New classes, retired classes, class splits |

Multiple shift types can occur simultaneously, making detection and correction harder.

### Covariate Shift

The input distribution P(X) changes, but the conditional P(Y|X) — the true relationship between inputs and outputs — remains the same. Common causes:
- Selection bias during data collection (e.g., only older patients appear in training data because only they self-select for screening)
- Oversampling rare classes during training to address imbalance
- Active learning, which deliberately alters the training distribution
- Real-world demographic or behavioural changes (e.g., a new marketing campaign attracting different users)

Can be addressed prospectively with importance weighting: estimate the density ratio P_production(X) / P_training(X) and up-weight underrepresented training examples.

### Label Shift

P(Y) changes but P(X|Y) remains the same. Often co-occurs with covariate shift — when the input distribution shifts, the label marginal usually shifts too. But not all covariate shifts produce label shifts (e.g., a new drug changes P(Y|X) for all ages uniformly without changing the age-given-cancer conditional).

### Concept Drift

The conditional P(Y|X) changes while the input distribution P(X) stays the same. Examples:
- Pre-COVID "Wuhan" search → travel information; post-COVID → pandemic origin.
- Housing prices: same features, but values collapsed in some cities at the start of COVID-19.
- Rideshare prices: weekday vs weekend concept drift; seasonal patterns.

Cyclic and seasonal concept drift is often addressed by training separate models per context (weekday/weekend, region) or by retraining more frequently.

### Label Schema Change

The set of possible output labels changes: new classes added, existing classes split or merged, regression target range changes. Requires relabelling historical data and often retraining from scratch. Common in high-cardinality classification tasks (product categorisation, document routing).

## Detecting Distribution Shifts

Detection difficulty increases when ground truth labels are delayed or unavailable.

### When Labels Are Available

Monitor accuracy-related metrics (F1, AUC-ROC, recall) directly. Log all user feedback — click, share, upvote, downvote, completion — as label proxies. Sudden changes in these metrics signal a shift.

### When Labels Are Unavailable

Monitor the input distribution P(X), feature distributions, and prediction distributions instead.

**Summary statistics:** min, max, mean, median, variance, quantiles, skewness, kurtosis. Simple and cheap; fails to detect shape changes in distributions with the same mean and variance.

**Two-sample hypothesis tests:** determine whether two populations come from the same distribution.
- **Kolmogorov–Smirnov (KS) test:** non-parametric; works for any distribution; one-dimensional only; computationally expensive; high false-positive rate.
- **Least-Squares Density Difference:** works on multidimensional inputs.
- **Maximum Mean Discrepancy (MMD):** kernel-based; popular in research; limited production adoption.
- Reduce dimensionality before applying two-sample tests to high-dimensional features.

**Prediction monitoring:** prediction distributions are low-dimensional and easy to test. A shift in prediction distribution — assuming model weights unchanged — is a proxy for input distribution shift. Detecting extreme prediction patterns (all-False, identical predictions) can trigger faster than accuracy-based alerts.

**Feature validation:** schema checks (min/max range, regex format, value membership, cross-feature constraints). Tools: Great Expectations, Deequ (AWS). Useful for catching pipeline errors as well as distributional shifts.

### Time Windows

The window size used for monitoring affects what shifts can be detected. Sliding statistics (reset per window) are more sensitive to sudden shifts. Cumulative statistics (continuously updated) can mask recent changes. Seasonal variation can create apparent shifts if the baseline window does not cover a full cycle. Match window length to expected data cycle.

## Degenerate Feedback Loops

A special failure mode where the model's predictions influence user behaviour, which becomes training data, which reinforces the model's existing biases.

**Mechanism:** item A ranked marginally higher → shown more prominently → clicked more → ranked even higher → long-tail items never discovered.

**Real-world forms:** exposure bias, popularity bias, filter bubbles, echo chambers.

**High-stakes example:** resume-screening model biased toward candidates from elite institutions → only those candidates are interviewed → only those are hired → bias amplifies in next training iteration.

**Detection:** measure popularity diversity of recommendations; measure accuracy across popularity buckets (Chia et al. 2021) — if accuracy on popular items greatly exceeds accuracy on long-tail items, popularity bias is likely.

**Correction:**
- *Randomisation:* show some random items and use their feedback to estimate unbiased quality. TikTok assigns each new video a random initial traffic pool. Trade-off: reduces diversity of the degenerate kind but hurts user experience.
- *Positional features:* include the position at which a prediction was shown as a feature during training; at inference, set to a neutral value to estimate position-independent quality.
- *Two-model decomposition:* model 1 predicts whether a user will see and consider a recommendation given position; model 2 predicts click probability conditional on consideration. Only model 2 is position-independent.

## Addressing Distribution Shifts

**Train on massive data:** the research community's dominant approach; hope the training distribution encompasses production variation.

**Domain adaptation without new labels:** adapt model to target distribution using causal or kernel methods (Zhang et al. 2013; Zhao et al. 2020). Understudied; limited industry adoption.

**Retrain on new labelled data:** the dominant industry approach.
- *Stateless retraining:* retrain from scratch on combined old + new data.
- *Stateful training (fine-tuning):* continue training from last checkpoint.
- What data to use (last 24h, last week, last 6 months) and how often require empirical determination.

**Proactive design:** choose features that shift slowly over rapidly-shifting features. Bucket high-velocity signals (app rankings → top-10/11-100/101-1000 tiers). Train separate models per context where drift rates differ significantly (city A vs city B housing prices).

## Related Concepts

- [[concepts/ml-systems-design]] — data distribution shift is the canonical ML-specific failure mode
- [[concepts/dataset-engineering]] — data quality and acquisition choices affect the training-production distribution gap
- [[concepts/feature-engineering]] — feature drift monitoring is a key production concern; feature schema versioning
- [[operations/monitoring]] — monitoring toolbox for detecting and alerting on shifts
- [[concepts/ai-engineering-architecture]] — model drift in the LLM context (provider-side model updates, user behaviour drift)
