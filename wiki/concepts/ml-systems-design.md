---
title: "ML Systems Design"
type: concept
tags: [ai, machine-learning, mlops, production, reliability, scalability, maintainability, adaptability]
sources: [designing-machine-learning-systems, reliable-machine-learning]
created: 2026-05-30
updated: 2026-05-30
---

# ML Systems Design

## Definition

ML systems design takes a systems approach to MLOps — considering an ML system holistically (business requirements, data stack, deployment, monitoring, infrastructure) so that all components and stakeholders can work together to satisfy the specified objectives. The ML algorithm is only a small part of the system. (→ [[sources/designing-machine-learning-systems]] ch. 1–2)

## When to Use ML

ML learns complex patterns from existing data to make predictions on unseen data. Nine conditions where ML is a strong fit:

1. There are patterns to learn (not pure randomness).
2. The patterns are complex (a lookup table won't do).
3. Data is available or collectable.
4. The problem is framed as a predictive question.
5. Unseen data shares the training distribution.
6. The task is repetitive (patterns repeat at scale).
7. Wrong predictions are cheap (or the aggregate benefit outweighs errors).
8. The problem is at scale (many predictions justify the up-front investment).
9. Patterns constantly change (handwritten rules become stale; ML adapts with new data).

**When not to use ML:** unethical use cases, simpler solutions suffice, not cost-effective.

**Key nuance:** even if ML can't solve the whole problem, it may solve a sub-problem. Break the problem down first.

## Research vs Production

The dominant source of confusion for ML engineers coming from academia is the degree to which research and production differ:

| Dimension | Research | Production |
|-----------|----------|------------|
| Requirements | State-of-the-art on benchmarks | Multiple stakeholders, conflicting requirements |
| Computational priority | Fast training, high throughput | Fast inference, low latency |
| Data | Static, clean, well-formatted benchmarks | Messy, shifting, biased, sparse labels |
| Fairness | Often neglected | Must be first-class |
| Interpretability | Often neglected | Typically required |

**Silent failure:** ML systems fail without raising errors. A wrong prediction is not a 404. Users may continue interacting with a broken system indefinitely — see [[operations/monitoring]].

**Latency is a distribution, not a number.** Use percentiles (p50, p90, p95, p99), not averages. Averages are distorted by outliers. High-latency users are often the most valuable (Amazon's top purchasers have the most data in their accounts). 100 ms delay → 7% drop in conversion rates (Akamai, 2017).

**Throughput vs latency trade-off:** batching improves throughput but adds latency. Research maximises throughput; production minimises latency. These pull in opposite directions.

## Four System Requirements

### Reliability

The system should perform correctly even in the face of hardware faults, software bugs, or human error. For ML, correctness is hard to determine — the model may call `predict()` successfully and return wrong answers. Invest in monitoring to detect silent failures.

### Scalability

ML systems can grow in three dimensions:
- **Complexity** — larger models, more sophisticated architectures.
- **Traffic volume** — from thousands to millions of predictions per day.
- **Model count** — from one model to one-model-per-customer (a startup can reach 8,000+ models).

Scalability requires both **resource scaling** (autoscaling compute) and **artifact management** (reproducible model pipelines, versioning, monitoring at scale). These are different engineering problems.

### Maintainability

Multiple teams — ML engineers, DevOps, domain experts — must be able to work on the system without forcing their tools on others. Code, data, and model artefacts must be versioned and documented. Models must be reproducible. Incident response must not involve finger-pointing.

### Adaptability

The system must respond to shifting data distributions and changing business requirements without service interruption. This is distinct from reliability (handling adversity within the current requirements) — adaptability is about evolving the requirements themselves. Tightly linked to continual learning.

## Business Objectives vs ML Objectives

Most companies don't care about ML metrics (F1, AUC, accuracy) unless they move business metrics (revenue, retention, engagement). ML projects die when engineers optimise ML metrics without moving the business needle.

**Pattern for bridging the gap:**
- Identify business metrics the ML system should influence (conversion rate, churn rate, revenue per session).
- Instrument experiments (A/B tests) to measure the causal relationship between ML performance and business metrics.
- Map intermediate ML metrics to business outcomes (Netflix's take-rate = quality plays / recommendations shown).

> **Open question:** For ML embedded in complex workflows (e.g., ML anomaly detection → rule engine → human review → threat response), it may be impossible to attribute business outcomes to the ML component. In these cases, proxy metrics must be used carefully.

## Framing ML Problems

A business problem is not an ML problem until it has defined **inputs**, **outputs**, and an **objective function**.

**Task types:**
- **Binary classification** — simplest; two classes; easiest to compute metrics and visualise confusion matrices.
- **Multiclass classification** — more classes; high cardinality (thousands of classes) requires hierarchical classifiers and careful data collection.
- **Multilabel classification** — each example can have multiple labels; hardest to implement correctly (label multiplicity problem, threshold selection for extraction from raw probabilities).
- **Regression** — continuous output; can often be reformulated as classification (bin the output) and vice versa.

**Framing choices matter.** Predicting "next app to open" as multiclass (one prediction, output of size N) forces retraining whenever a new app is added. Framing as regression (N predictions, each a scalar) lets you add new apps without retraining. Better framing reduces maintenance cost.

**Decoupling multiple objectives:**

When a system must optimise conflicting goals (e.g., engagement + content quality):

| Approach | Pros | Cons |
|---------|------|------|
| Combined loss: `α·loss_A + β·loss_B` | One model | Retraining required every time α or β is tuned |
| Separate models, combined scores | Tune α/β without retraining | More models to maintain |

Separate models is preferred because: (1) coefficients can be tuned at serving time; (2) different objectives evolve at different rates (spam patterns change faster than quality norms, so spam model needs more frequent updates).

## Iterative Development Cycle

ML system development is never done. The six-step cycle:

1. **Project scoping** — goals, objectives, constraints, stakeholders, resources.
2. **Data engineering** — raw data sources, data pipelines, storage.
3. **ML model development** — feature engineering, model selection, training, offline evaluation.
4. **Deployment** — serving infrastructure, prediction APIs.
5. **Monitoring and continual learning** — performance decay detection, model updates.
6. **Business analysis** — evaluate against business goals, generate insights, scope next iteration.

The cycle loops: a business analysis finding (e.g., revenue is down) triggers a new scoping step.

## The Mind vs Data Debate

A recurring tension in ML research and practice:

- **Data camp (Sutton's "Bitter Lesson", 2019):** "The biggest lesson from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin. Researchers who rely on domain knowledge end up outdated." Also: Norvig — "We don't have better algorithms. We just have more data."
- **Mind camp (Pearl, Manning):** Pearl: "Data is profoundly dumb." Manning: intelligent structural design allows learning from less data.

> **Contradiction:** Both positions have empirical support. The scaling law success of LLMs (data + compute) supports the data camp. The effectiveness of causal inference, physics-informed neural networks, and structured architectures supports the mind camp. The debate may be domain-dependent rather than resolvable globally.

**Practical implication:** regardless of which camp is right, data quality and quantity are a prerequisite for any ML system. Monica Rogati's AI Hierarchy of Needs places data at the base — without good data, no ML approach succeeds.

## ML Model Vulnerabilities Taxonomy

[[sources/reliable-machine-learning]] (ch. 3) provides a systematic taxonomy of ML-specific failure modes, organised by stage:

### Training Data Vulnerabilities

| Vulnerability | Description |
|---------------|-------------|
| Incomplete coverage | Sensors or pipelines that fail under specific conditions create blind spots undetectable by any test set drawn from the same corrupted distribution |
| Spurious correlations | Model learns a proxy feature correlated with the label in training but not in production |
| Cold start | New products or entities have no history; proxy signals or content-based approaches required |
| Feedback loops / self-fulfilling prophecies | Only top-ranked items receive user feedback; model learns only from items it previously ranked highly; exploration decays |
| Changes in the world | External events (COVID, regulatory changes) shift the data distribution; model trained on pre-shift data silently degrades |

### Label Vulnerabilities

| Vulnerability | Description |
|---------------|-------------|
| Label noise | Systematic label error (consistent wrong pattern) is worse than random noise |
| Wrong objective | Optimising clicks ≠ optimising satisfaction; produces clickbait |
| Malicious feedback | Spam/ranking systems vulnerable to poisoning via manipulated user signals |

### Training Method Vulnerabilities

| Vulnerability | Description |
|---------------|-------------|
| Overfitting | Validation data becomes stale as training set grows; validation set must be refreshed periodically |
| Instability | 1% daily error rate × 30 days = entire user base inconvenienced at least once per month; stability matters at scale |
| Deep learning peculiarities | GPU randomisation, exploding/vanishing gradients, hyperparameter sensitivity, resource intensity, highly confident errors on adversarial inputs |

### Feature Generation Vulnerabilities

Feature generation is "arguably the single most common source of errors in ML systems" (→ [[sources/reliable-machine-learning]] ch. 3), for three reasons:
1. Bugs in feature computation code are invisible to aggregate accuracy metrics.
2. Train/serve skew: the same feature is computed by different code paths in training vs serving.
3. Upstream dependency failures: the pipeline keeps running but the underlying data source changed without notice.

> **"Better is not better, better is different":** A bug fix upstream (e.g., temperature sensor switching from Fahrenheit to Celsius) is a catastrophic distribution shift for any model trained on the old data. Always evaluate model impact before accepting upstream improvements.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-machine-learning-systems]] | Holistic systems view of the full ML lifecycle; framing, requirements, iteration |
| [[sources/ai-engineering]] | Narrows to foundation-model applications; evaluation and adaptation layers |
| [[sources/dataset-engineering]] (AI Engineering ch. 8) | Data quality, synthesis, and curation as the primary lever |
| [[sources/reliable-machine-learning]] | SRE perspective; the ML loop as a cyclic production system; monitoring taxonomy (golden signals + generic ML + domain-specific) |

## Related Concepts

- [[concepts/ai-engineering]] — the sister discipline focused on foundation-model applications
- [[concepts/dataset-engineering]] — data quality and synthesis, the primary lever for ML performance
- [[concepts/ai-evals]] — offline evaluation; the bridge between ML metrics and business metrics
- [[operations/monitoring]] — production monitoring; essential for detecting silent failure
- [[concepts/four-key-metrics]] — delivery performance metrics that apply to ML pipelines too
