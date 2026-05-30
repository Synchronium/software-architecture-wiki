---
title: "Reliable Machine Learning"
type: source
tags: [ai, machine-learning, mlops, reliability, sre, data-management, monitoring, production]
sources: [reliable-machine-learning]
created: 2026-05-30
updated: 2026-05-30
---

# Reliable Machine Learning

**Authors:** [[authors/cathy-chen]], [[authors/niall-richard-murphy]], [[authors/kranti-parisa]], [[authors/d-sculley]], [[authors/todd-underwood]]
**Published:** 2022
**Slug:** `reliable-machine-learning`

## Overview

*Reliable Machine Learning* is the SRE perspective on ML systems — it applies the discipline of Site Reliability Engineering to the full ML lifecycle. Where Chip Huyen's [[sources/designing-machine-learning-systems]] focuses on the data science and engineering lifecycle, this book emphasises operational reliability, production engineering, organisational structure, and the SRE's role in ML systems. The two books are highly complementary.

The book's central metaphor is the **ML loop**: a cyclical lifecycle that starts with data and never truly ends. The book argues that ML systems are production systems and should be treated with the same engineering discipline as any other distributed system — plus additional vigilance for ML-specific failure modes.

The target audience is explicitly multidisciplinary: SREs, ML engineers, data scientists, product managers, and business leaders who must collaborate on production ML. Niall Richard Murphy is also co-editor of [[sources/site-reliability-engineering]], giving the book a direct lineage to Google's SRE practices.

## Key Claims

- ML applications are never truly done; the ML loop is continuous and cyclic (→ ch. 1)
- ML training pipelines are production systems deserving the same care as serving infrastructure — "models as code" (→ ch. 1)
- Data is not just an asset but also a liability: privacy, compliance, deletion, and anonymisation are costly and often neglected (→ ch. 2)
- ML pipelines are uniquely sensitive to non-random distribution changes in input data — subtle biases in a small subset of data can corrupt the entire model (→ ch. 2)
- Monitoring ML systems requires three layers: golden signals (system health), generic ML signals (basic model health), and domain-specific signals (model quality) (→ ch. 1)
- SLOs apply to ML systems; compliance requirements are SLOs with SLIs (→ chs. 1, 2)
- Anonymisation of data is fundamentally hard: 87% of US residents can be uniquely identified by only gender, age, and zip code (→ ch. 2)
- "Better is not better, better is different" — upstream bug fixes or data format improvements can silently corrupt a trained model (→ ch. 3)
- Feature generation is arguably the single most common source of errors in ML systems: bugs are invisible to aggregate metrics, train/serve skew is pervasive, and upstream dependencies fail silently (→ ch. 3)
- Feature stores are the primary mechanism for eliminating train/serve skew: transforming features should run the same code path at training and serving time (→ ch. 4)
- An evaluation is always a metric + distribution: specifying only the metric (e.g., "accuracy is better") is meaningless and dangerous without specifying the data distribution (→ ch. 5)
- Group parity and calibration fairness definitions are mathematically incompatible when base rates differ between groups — which is almost always the case (→ ch. 6)
- Fairness is a process, not an endpoint: it requires continuous monitoring as deployment conditions change (→ ch. 6)

## Chapter Notes

### Chapter 1 — Introduction

Motivates the ML loop as the organising framework and introduces the key operational concerns of ML systems.

**The ML loop:** Six stages cycle continuously — (1) data collection and analysis; (2) ML training pipelines; (3) build and validate applications; (4) quality and performance evaluation; (5) SLOs definition and measurement; (6) launch. After launch: monitoring and feedback loops restart the cycle. No clean endpoint.

**Training pipelines as production systems:** Common ML pipeline failure modes: lack of data, incorrectly formatted data, software bugs, misconfiguration, resource shortage, hardware failure, distributed system failures. These parallel non-ML ETL pipeline failures, plus ML-specific silent failures from distribution shifts. "Making a habit of writing down what you've done and turning that into something automated" is the fundamental operational discipline.

**Models as code:** Deploying a new model can crash a serving system. New models carry equivalent risk to new code releases. Progressive rollout and rollback plans are required for model deployments. Rollout isolation at the data layer is critical — a new model writing logs in a new format while old code reads them is a common source of hard-to-diagnose outages.

**Quality and performance evaluation:** Offline evaluation → dark launch (technical integration confidence only, no model quality signal) → partial rollout (model quality + integration) → full launch.

**SLO taxonomy for ML systems:**
- *Serving SLOs:* error rates, latency percentiles (standard golden signals)
- *Training SLOs:* throughput (examples/second, bytes/second), training run completion rate (e.g., 95% of runs complete within N seconds)
- *Application SLOs:* click-through rate, revenue attributable to model — measured not just in aggregate but across subslices (geography, customer type)

**Monitoring taxonomy (three layers):**
1. *Golden signals (system health):* standard distributed-system metrics — are processes running, making progress, is data arriving?
2. *Generic ML signals (basic model health):* context-free model checks — are new models the expected size, do they load without error?
3. *Domain-specific signals (model quality):* hardest to specify; no objective "good enough"; product/business leaders must define real-world metrics; ML engineers and SREs jointly determine correlated quality measures.

### Chapter 2 — Data Management Principles

Covers data as liability, the data lifecycle, ML pipeline sensitivity to distribution shifts, data reliability properties, and data privacy/policy.

**Data as liability:** Data requires compliance (collection permissions, access controls, audit logging, deletion on request). Data deletion is technically hard — distributed storage makes it difficult to ensure every copy is eliminated. Two common approaches: periodically rewrite data and exclude the "deleted" records from the next rewrite; or encrypt all data per user and discard keys to effect deletion.

**ML pipeline sensitivity:** ML pipelines are more sensitive to input data than conventional ETL pipelines. A non-random subset omission — e.g., losing all data from December 31 — removes specific distribution information and silently corrupts the model. Spanish-language site outage example: payments failure → fewer Spanish completions → model learns Spanish queries don't convert → shows fewer Spanish results → model degrades for Spanish users after outage ends. These failures are subtle and hard to detect at gross volume level because the affected slice may be small overall.

**Data lifecycle phases:** Creation → Ingestion → Processing (validation, cleaning/normalisation, enrichment/labelling) → Storage → Deletion.

**Normalisation techniques:** Scaling to range (0-1), clipping (remove extreme outliers), log scaling (power-law distributions), Z-score normalisation. Each technique is unsafe if range/distribution statistics are computed on data with different properties than where they are applied — same data leakage concern as [[concepts/feature-engineering]].

**Bucketing errors:** Changing bucket boundaries mid-system (e.g., age on decade vs five-year boundaries) is a common consistency bug. Always preserve original data and write a new field with the bucket; never overwrite.

**Storage: column-oriented for ML feature stores:** Different ML models typically use different subsets of the same features. Column-oriented storage (BigQuery, Redshift, Snowflake) allows each training pipeline to read only the columns it needs without fetching full rows. Critical for multi-model environments.

**Data reliability properties:**
| Property | Definition | ML-specific concern |
|----------|------------|---------------------|
| Durability | Data is not lost/corrupted | Log transformations; store pre/post copies |
| Consistency | Same data from all replicas | Sparse data is more sensitive to inconsistency than dense data |
| Version control | Track what data, who created/updated, when | MLflow; not Git — large files, not diffs |
| Performance | Read bandwidth sufficient for GPU/TPU training | Slow reads stall expensive compute; often underfunded |
| Availability | Data is there when needed | Product of durability + consistency + performance |

**Anonymisation:** Hard — not a one-time operation. 87% of US residents uniquely identifiable by gender + age + zip (Latanya Sweeney, Harvard). Anonymisation is context-dependent — safe anonymisation with one dataset may be broken by combination with another. Must be reviewed when new data sources are added. Two architectural choices: eliminate PII before storage (simplest; not always feasible for personalisation) or lock it down with access controls and encryption at rest.

**Privacy and federated learning:** When models require individual user history (personalisation), per-user encrypted datastores combined with federated learning provide privacy while enabling ML — an advanced topic referenced but not covered in depth.

**Compliance as SLOs:** Policy and compliance requirements are SLOs; reporting requirements are SLIs. Normalising compliance alongside reliability work avoids treating it as a separate, lower-priority concern.

### Chapter 3 — Basic Introduction to Models

Covers the three meanings of "model", ML-specific vulnerability taxonomy, and serving failure modes.

**Three meanings of "model":**
- *Model architecture* — the strategy or family (linear regression, ResNet, BERT). Defines the structure, not the parameters.
- *Model definition / configured model* — the full closure of the training environment: architecture + hyperparameters + random seeds + dependency versions. Reproducibility requires capturing this entire context.
- *Trained model* — a snapshot of learned parameters. Non-deterministic in distributed settings: same inputs + same code does not guarantee same output in distributed training.

**Training data vulnerabilities:**
- *Incomplete coverage:* sensors that fail in cold weather → the model never sees low-temperature data → blind spot undetectable by any held-out test set drawn from the same corrupted distribution.
- *Spurious correlations:* model learns "white walls" → "aesthetically pleasing" because training photos of nice apartments happened to have white walls. Works until the distribution shifts.
- *Cold start:* new products have no history; must bootstrap from proxy signals or content-based approaches.
- *Self-fulfilling prophecies / feedback loops:* only top-ranked items receive user feedback; model is trained only on the items it previously showed; exploration decays.
- *Changes in the world:* COVID hotel bookings example — model trained on pre-COVID data no longer valid; the world changed, not the code.

**Label vulnerabilities:**
- *Label noise:* systematic label error is worse than random noise — it can teach the model a consistent wrong pattern.
- *Wrong label objective:* clicks ≠ satisfaction → optimising for CTR produces clickbait.
- *Malicious feedback:* spam systems are vulnerable to poisoning via manipulated user feedback signals.

**Training method vulnerabilities:**
- *Overfitting:* validation data can become stale — must refresh the held-out set as the training set grows over time.
- *Lack of stability:* 1% daily error rate × 30 days = the whole user base inconvenienced at least once per month. Stability matters at scale.
- *Deep learning peculiarities:* randomisation in training (GPUs, parallel ops), exploding/vanishing gradients, hyperparameter sensitivity, resource intensity, highly confident errors on adversarial inputs.

**Feature generation as the dominant failure mode:** Three reasons: (1) bugs in feature code are invisible to aggregate accuracy metrics; (2) train/serve skew — the same feature is computed by different code paths in training and serving; (3) upstream dependency failures are silent — the feature pipeline keeps running but the underlying data source changed.

**"Better is not better, better is different":** A bug fix upstream (e.g., a temperature sensor switching from Fahrenheit to Celsius) looks like an improvement to the data provider but is a catastrophic distribution shift for any model trained on the old data. Always evaluate model impact before accepting upstream improvements.

**MLOps questions for any model:** What is the training data source? How is it stored/verified? How are features computed? What are the worst failure examples? How often is it updated? How does it fit into the serving ecosystem? What is the worst-case scenario?

**Common serving failures:** Infinite latency (must add timeouts and fallbacks); all predictions zero (monitor output range); all predictions bad (monitor output variance — unexpectedly low variance is a sign of collapse); model favours a few items (needs randomised exploration to break concentration).

### Chapter 4 — Feature and Training Data

Covers the feature lifecycle, feature store architecture, metadata systems, and human annotation.

**Feature definition vs feature value:** A feature *definition* is the code or algorithm that describes how to extract a feature from raw data. A feature *value* is the specific output of that code applied to a specific datum. This distinction matters for versioning — when code changes, old values may be invalid.

**Feature lifecycle (10 steps):** Data collection → Data cleaning → Candidate feature definition → Feature value extraction → Feature store storage → Feature evaluation → Model training/serving → Feature definition updates → Deletion of feature values → Feature discontinuation. Each step has its own operational concerns — the lifecycle is the unit of management.

**Feature store API requirements:**
1. Store feature definitions (code and metadata)
2. Store feature values (the computed outputs)
3. Serve data efficiently — must not stall GPU/TPU compute; I/O is often the bottleneck
4. Coordinate metadata writes across distributed feature computation jobs

**Two storage patterns:**
- *Columns (structured):* column-oriented storage (BigQuery, Parquet) for structured, tabular ML data. Efficient for training pipelines that read feature subsets.
- *Blobs (unstructured):* object stores for images, audio, video. Best accessed by key; not suitable for columnar scans.

**Transforming features:** Feature stores can host transformation logic (stored procedures equivalent) that runs the same code path at training and serving time. This is the primary mechanism for eliminating train/serve skew — a single definition, executed in both contexts. Transformations can be materialised for performance.

**Labels:** Labels are more important than features for supervised ML. Can be stored in the feature store. Label quality determines the ceiling on model performance — no amount of feature engineering compensates for incorrect labels.

**Human annotation:** Consensus labelling, golden set test questions, and QA steps are standard. Annotation costs can exceed compute costs for complex tasks. Workforce quality improves with training, recognition for quality (not throughput), task variety, easy tools, balanced workload, and feedback channels. AI-assisted labelling and active learning reduce cost.

**Metadata systems:** Four types of metadata to track — dataset metadata (provenance, location, responsible person, creation date, use restrictions); feature metadata (definition version, responsible person, creation date, use restrictions); label metadata (definition version, set version, source, confidence); pipeline metadata (run history, performance, dependencies). Design choice: one unified metadata system (simpler joins, harder to evolve independently) vs multiple systems (decoupled, require shared IDs or a meta-metadata layer).

**Feature use restrictions (legal):** A raw feature (e.g., age) may have legal use restrictions — it can be used for insurance only with specific bucketing, or not at all for some applications. Solution: create a compliant *transforming feature* that applies the legally required transformation and permits restricted use, rather than banning the raw feature outright.

### Chapter 5 — Evaluating Model Validity and Quality

Covers the two-phase pre-deployment gate: validity (won't break the system?) and quality (is it any good?).

**Model validity checks — will the new model break our system?**
- *Is it the right model?* Include timestamp and metadata in model files; easy to accidentally serve a stale version.
- *Will it load in production?* File format evolution, memory footprint (file size ≠ RAM footprint), dependency version mismatches.
- *Can it serve one result without crashing?* Causes of single-request failure: platform version incompatibility, feature version incompatibility (train/serve skew), corrupted model files, missing serving pipelines, results out of range.
- *Is computational performance within bounds?* Latency must be tested in production hardware, not dev environments; offline batch cost is also a gate.
- *Canary ramp-up:* the final validity step is a controlled production ramp-up with careful monitoring — validity and monitoring overlap here.

**An evaluation = metric + distribution.** The distribution matters as much as the metric. "Better accuracy" is meaningless without specifying the evaluation distribution. Much of the late-2010s fairness crisis traced back to evaluation distributions that did not represent affected populations.

**Evaluation distribution types:**
| Distribution | Use | Limitations |
|---|---|---|
| IID held-out test set | Standard; respects supervised ML theory | Can leak future data for time-ordered data; may not represent deployment distribution |
| Progressive validation / backtesting | Time-ordered data; simulates real prediction timing | Awkward for multi-pass training; must compare over same time ranges |
| Golden sets | Fixed historical snapshot; detects sudden quality changes or bugs | Not useful for absolute quality; privacy/deletion may force expiration |
| Stress-test distributions | Deliberately probe under-represented slices (e.g., snowy roads, non-English speakers) | Must be designed intentionally |
| Sliced analysis | Filter any test set by feature values to create targeted sub-evaluations | Slices too fine → statistically meaningless |
| Counterfactual testing | Synthetic examples probing "what if X had been different?" | Requires synthetic data generation; most useful for testing invariants |

**Metric taxonomy:**
- *Canary metrics (bias, calibration):* detect that something is wrong; do not distinguish good from great. Bias has a correct value of 0 — trivially achievable by a naïve model; must use in conjunction with sliced analysis. Calibration reveals over/under-prediction by score bucket.
- *Classification metrics (accuracy, precision, recall, AUC ROC):* accuracy requires base rate context (99% is useless if 99% of examples are negative); precision/recall trade off against each other via threshold; AUC ROC is threshold-independent but can be fooled by changes far from any real decision boundary; precision/recall curves better for class-imbalanced settings.
- *Regression and ranking metrics (MAE, MSE, log loss):* avoid threshold tuning; MSE penalises large errors more; MAE more robust to outliers; log loss appropriate when model outputs are used as true probabilities; watch for NaN from exact 0/1 predictions.

**Organisational maturity model for evaluation:** Early stage → coarse AUC ROC on IID held-out set; mature stage → additional sliced metrics, stress tests, calibration; late stage → revisit whether the metric proxies actual business goals.

### Chapter 6 — Fairness, Privacy, and Ethical ML Systems

*(Chapter by Aileen Nielsen, author of *Practical Fairness*, O'Reilly 2020.)*

**Sources of algorithmic bias:**
- *Sampling bias:* data collection is biased (crime-prediction models over-police certain communities because policing data itself is biased).
- *Disparate treatment:* algorithm explicitly uses irrelevant protected attributes (Amazon hiring algorithm penalised women's college attendance).
- *Systemic bias:* aggregate structural disadvantage baked into proxy features (extracurricular activity data advantages middle-class students).
- *Tyranny of the majority:* models optimise aggregate loss, which means minority group errors are underweighted relative to majority group errors.

**Fairness definitions are mutually incompatible:** Group parity (equal error rates across groups) and calibration (same model score means same thing for all groups) cannot both be satisfied simultaneously when base rates differ between groups — which is almost always the case in the real world. The COMPAS recidivism algorithm was calibrated yet had disparate false-positive rates by race. Practitioners must choose a fairness metric appropriate to their domain and harms.

**Anti-solutionism:** The smartest thing an ML team can do is consistently and sceptically consider whether ML is necessary at all. ML adds complexity, risk, and potential for unfairness — it should be justified by clear value.

**Three modes of bias intervention:**
- *Preprocessing:* intervene on data before training — relabelling, removing or transforming sensitive attributes; model-agnostic; earliest intervention is usually most effective.
- *In-processing:* intervene during training — add fairness penalty to loss function; adversarial debiasing (train adversary to predict sensitive attribute from model output, then suppress that signal).
- *Post-processing:* intervene on model outputs — different decision thresholds per group; output randomisation; model-agnostic but raises normative concerns about differential treatment.

**Privacy techniques:**
- *k-anonymity:* ensure at least k individuals share any combination of quasi-identifying attributes. Recommended k ≥ 5 in medical domains.
- *Differential privacy:* add calibrated noise such that inclusion/exclusion of any single individual cannot be inferred from aggregate outputs. Compatible with ML training but degrades model quality; noise injection is the fundamental trade-off.
- *GDPR right to deletion* is technically challenging to honour for trained models — full retraining is impractical; differential privacy training is a partial mitigation.

**Technical privacy measures:** access controls (need-to-know basis), access logging (detect misuse, inform schema refactoring), data minimisation (collect only what has an immediate use case), data separation (keep PII separate from ML-relevant data).

**Fairness as a process:** there is no "perfectly fair" endpoint. The world changes (model deployment conditions shift), and models must evolve with it. Fairness monitoring is a continuous operation.

**Responsible AI pipeline checklist:**
- Use case: does this undermine privacy? Does it touch legally regulated domains (employment, credit, housing, healthcare)?
- Data: informed consent? Privacy-preserving storage? Bias analysis?
- Training: fairness intervention plan? Error costs weighted in loss? Architecture interpretability vs accuracy trade-off?
- Validation: robustly tested on realistic and stress-test distributions? Global and local explanations available?
- Deployment: monitoring for fairness drift? Ex ante criteria established? Fallback plan?
- Products: recourse mechanism? User-facing explanations? Unknown unknown detection?

### Chapter 7 — Training Systems

Covers the architecture and reliability principles of ML training systems, emphasising that they are distributed production systems first and ML systems second.

**Training system components (minimum viable set):**
1. *Training data* — preprocessed, stored in an access-controlled environment, formatted for efficient access.
2. *Model configuration system* — versioned storage of model definitions, hyperparameters, developer authorship.
3. *ML training framework* — orchestration, job/process scheduling, and ML algorithm implementation (TensorFlow, PyTorch).
4. *Model quality evaluation system* — the most commonly skipped but mandatory component; provides automatic gates to prevent bad models reaching serving.
5. *Model syncing to serving* — reliable handoff of trained models to the serving environment.

**Feature store considerations:** Unstructured feature engineering environments (files in directories) create two failure modes: train/serve skew (different feature definitions in training vs serving) and provenance loss (no record of who added a feature, when, or why). Feature stores enforce consistency and enable collaboration.

**Model management system:** Stores model metadata (configuration, hyperparameters, authorship), trained model snapshots, and feature authorship/usage. Ties serving all the way back through training to storage. Without this data, it is often impossible to diagnose production problems.

**General reliability principles:**
- *Most failures are not ML failures.* "How ML Breaks" (Papasian and Underwood): the majority of ML system failures are software and distributed systems failures — wrong permissions, wrong model version deployed, corrupted data pipelines — not ML algorithm failures. Fix distributed systems reliability before ML-specific reliability.
- *Assume every model will be retrained.* Even "done" models will be retrained (new ideas, disaster recovery, toolchain verification). Design for it: version configs, keep training data, store model snapshots.
- *Models will have multiple concurrent versions.* A/B testing for models requires infrastructure to route traffic, track which version served which request, and compare results.
- *Good models become bad.* Every model needs a non-ML fallback (heuristic or simpler model). But dependence on fallbacks limits how good ML can become — wean off them as the ML system matures.
- *Data will be unavailable.* Training data is already subsampled; unavailability events are biased (losing data from Spain is worse than random loss). Consider whether data loss is random or biased before deciding to ignore it.
- *Models can train too fast.* In distributed training, race conditions between learner tasks cause divergence rather than convergence. Fewer parallel learners, or more tightly synchronised model state, mitigates this. No simple test — train faster and slower, compare quality.
- *Resource utilisation ≠ efficiency.* Utilisation = resources used / resources paid for. Efficiency = value produced / cost. Both matter; measure in resource-indexed terms (e.g., millions of examples per GPU-second) to isolate engineering changes from pricing changes.
- *Outages include recovery time.* SLO modelling must account for model retraining time after an outage, not just detection and fix time.

**Three common training reliability failure modes:**
1. *Data sensitivity* — small, non-random gaps in training data (e.g., a format change that excludes discounted purchases) produce quietly biased models.
2. *Reproducibility* — ML training is inherently non-reproducible due to random initialisations, parallel ordering effects, and data ordering differences. Treat each trained model as a slightly different variant of the same configuration; renounce equality between identically configured training runs. Fixable causes: version configs, data, and binaries consistently. Unfixable causes: parallel ordering.
3. *Compute capacity* — not just raw capacity, but I/O capacity (feature store read bandwidth), compute capacity, and memory bandwidth. Distribution shifts in training data (not just volume) can create unexpected capacity bottlenecks.

### Chapter 8 — Serving

Covers the four serving architectures and their trade-offs, model API design, scaling, and disaster recovery.

**Four serving architecture patterns:**

| Architecture | Mechanism | Best for | Key weakness |
|---|---|---|---|
| Offline (batch inference) | Precompute predictions; serve from database | Stable query spaces, low-latency lookups, easy verification | Cannot handle long-tail queries; stale models if upstream data unavailable |
| Online (online inference) | Real-time predictions from live traffic | Highly personalised; adapts to concept drift at inference time | High oversight and rollback requirements; not horizontally scalable |
| Model as a Service (MaaS) | Dedicated model cluster behind API (REST/gRPC) | Flexible, scalable, independent deployment cycles | Latency budget required for all calls; management overhead; partial failure handling |
| Edge serving | Model on-device (mobile, IoT, vehicle) | Ultra-low latency; privacy; offline capability | Memory/compute constraints; user controls update cycle; heterogeneous devices |

**Architecture selection heuristic:** ultra-low latency → offline/in-memory; otherwise → MaaS; on-device → edge.

**Key serving considerations:**
- *QPS vs latency:* more replicas helps throughput; does not help per-request latency. Use more powerful hardware or cheaper models to reduce latency.
- *Hardware:* deep models use dense matrix multiplication → GPUs/TPUs. Sparse models (random forests, sparse linear models) → CPUs; GPU provides no benefit.
- *GPU batching:* GPUs are often I/O-bound, not compute-bound. Batching multiple requests amortises input/output cost; hundreds of requests can process in the same wall-clock time as one. Trade-off: latency while waiting for a full batch.
- *Model hot-swapping:* two strategies — (1) double-RAM allocation: load new model while old one serves, then hot-swap; (2) overprovision replicas and progressively roll 10% at a time. The second enables canarying.
- *Feature pipeline at serving time:* often the dominant source of latency. Join multiple real-time data sources (user history, product catalogue, location) in milliseconds. This is also the primary source of train/serve skew.
- *Serving for resilience vs accuracy:* a resilient model (smaller standard deviation in cross-validation, similar error rates over time, lower test-validation gap) may not be the best on any single offline metric. Monitor ML metrics and business KPIs separately.
- *Disaster recovery extras for ML:* all standard SaaS DR applies plus: data schema change accommodation; stateful online learning recovery; graceful degradation when upstream ETL fails; model backups for rollback.

**Model API testing checklist:** functional (expected output), statistical (output distribution matches training distribution), error handling, load testing, end-to-end.

**Fairness in serving:** minimise PII in request/response schemas; avoid logging personal data during inference; use short-lived tokens rather than stable user IDs for personalisation where privacy is critical.

### Chapter 9 — Monitoring and Observability for Models

*(Chapter by Niall Murphy and Aparna Dhinakaran.)*

Monitoring provides data about system performance; observability is the property of a system that allows that data to be used to correctly infer the system's behaviour. An observable system emits labelled metrics that can be sliced along arbitrary dimensions.

**The ML-specific monitoring problem:** model developers think in terms of pre-deployment optimisation metrics, not post-deployment detection. Monitoring in ML contexts must serve *detection* (is something wrong now?) as well as *optimisation* (how do I improve this?). Tools like TensorBoard and Weights & Biases do not naturally translate from development to production.

**Train/serve skew:** the most dangerous form of ML skew is the gap between model performance in training and in serving. Common causes: feature definition differences between training and serving code paths, data gaps, feedback loops between algorithm and task. Skew is model-specific — no general "monitor all skew" function exists. Model-specific monitoring must be implemented by production and ML engineers jointly.

**Three-layer monitoring taxonomy (Table 9-1):**

| Layer | Training signals | Serving signals | Application signals |
|---|---|---|---|
| **Golden signals / system health** | Model build time, concurrent trainings, failed build attempts, resource saturation (GPU/I/O) | Latency, traffic, error count, saturation | Purchase rate, login rate, cart abandonment, page component failure rate |
| **Generic ML signals / basic model health** | Source data size (hasn't grown/shrunk since last build), training time as function of model type and data size, training configurations (hyperparameters), post-training quality metrics (accuracy, precision, recall) | Model serving latency (as fraction of overall latency), model serving throughput, model serving error rate (timeout/empty value), serving resource use (RAM), age/version of model in serving | Estimated quality (predicted CTR) of recommendations, number of recommendations per page, similar metrics for search model |
| **Domain-specific signals / model quality** | Built model passes validation tests (golden set and held-out tests), recommendations for new products are similar or better quality | Offline signals match served predictions in aggregate and in relevant slices, number of recommendations for specific queries matches pre-serving expectations | Session/user-journey specific metrics, percentage of visits with purchases not declining, average sale per visit maintained |

**Monitoring for actuals — four cases:**
1. *Real-time actuals* — ground truth arrives quickly (ads: click or not; food delivery: arrived or not). Track same metrics as training/validation.
2. *Delayed actuals* — ground truth arrives slowly or unreliably (fraud detection: dispute may take weeks or months). Use proxy metrics — signals correlated with ground truth but arriving sooner. Proxy metrics need statistical significance and periodic re-evaluation.
3. *Biased actuals* — actuals exist only for the model's positive decisions (credit: only approved loans have repayment data). Fundamental selection bias; cannot be fully corrected.
4. *No/few actuals* — no feasible way to get ground truth (image classification requiring manual verification). Use proxy metrics and A/B comparison of model versions on product metrics.

**Data monitoring — drift detection:**
- *Feature drift / data drift:* input distribution diverges from training distribution. Measure with PSI (population stability index, common in banking), KL divergence (asymmetric, detects order switching), Wasserstein distance (amount of "work" to move one distribution to another — useful for detecting cross-bucket shifts).
- *Concept drift:* the distribution of correct answers (actuals) changes. Model predictions may be unchanged but wrong.
- When actuals unavailable, drift becomes the primary signal. Pair feature drift with feature importance to identify which drifted features matter most.

**Data quality checks (for sudden failures, not slow drift):**
- *Categorical:* cardinality change, missing values, type mismatch, volume change.
- *Numerical:* out-of-range violations, missing values, type mismatch, moving average trend.

**SLOs for ML:**
- ML availability SLOs must encompass quality/confidence thresholds, not just request-response uptime.
- Scope SLOs to business objectives — a temporarily degraded serving system is acceptable if the overall user experience is within bounds.
- Self-service SLO infrastructure: SREs provide the platform; ML engineers define per-model or per-class-of-model SLOs, enabling scaling across many models.
- SLOs for ML systems are entangled with adjacent systems — specifying them in isolation is impractical for anything beyond small deployments.

**Pre-rollout validation:** dark launch → sandbox preproduction A/B → 1-5% canary in production with careful monitoring → staged ramp-up. Shadowing (sending production traffic to a new model without serving results to users) tests the serving path without exposing users to risk.

**Fallback strategy:** keep previous model binary + trained model checkpoint for rapid rollback. Simpler algorithmic fallback (top-10 popular products) for catastrophic failures. Beware schema/format changes that make rollback incompatible with current data formats.

**Privacy in monitoring:** monitoring dashboards will display whatever is fed to them. PII must be stripped or anonymised at the first egress point from the target system, not at the dashboard — access control to dashboards is insufficient.

### Chapter 10 — Continuous ML

Continuous ML systems receive new data in a streaming or periodic batch fashion and use it to trigger training of updated model versions pushed to serving. In data-is-code terms: accepting continuous ML is accepting a steady stream of new code that can change production behaviour.

**Anatomy of a continuous ML system:**
- *Training examples + labels:* labels arrive separately with unavoidable delay (label joining is production-critical; outage → unlabelled training examples).
- *Filtering bad data:* spam, adversarial manipulation, pipeline bugs must be detected before training. Often requires dedicated teams or models for anomaly detection.
- *Feature stores:* manage input streams, feature computation, efficient storage, and training/serving coordination. Raw data must also be retained for feature backfill and debugging.
- *Model updates:* SGD-based training works in continuous settings if data arrives in sufficiently shuffled order; batch ordering (all positives then all negatives) causes SGD to fail.
- *Checkpointing + pushing to serving:* each checkpoint push is effectively a small automated model launch; automated validation (golden set scoring in sandbox → canary → staged ramp-up) is required.

**Major challenges:**
1. *External world events:* any distribution shift causes undefined model behaviour. Sporting events, elections, pandemics, weather — all are potential sources. Propensity scoring (inverse-probability weighting to normalise for distributional change) is theoretically correct but practically very difficult. Manage instability rather than trying to eliminate it.
2. *Feedback loops:* recommendation and action models influence what data gets collected for retraining. Recommendation models may never discover new products. Stock models can create market crashes. Mitigated by: logging model version as a training feature (disambiguates world changes from model state changes), propensity weighting, randomised exploration.
3. *Temporal effects:* seasonal (yearly cycles), weekly (day of week), daily (time of day, time zones). Continuous systems run 6-12 hours behind reality due to pipeline delays — models may be "out of phase." Solution: include time-of-day and day-of-week features in training.
4. *Emergency response must be done in real time.* Five response steps: **stop training** (halt new model pushes); **fall back** (simpler model or lookup table); **roll back** (prior model checkpoint or binary); **remove bad data** (excise data that caused the crisis); **roll through** (accept atypical data, wait for world event to pass).
5. *New launches require staged ramp-up and stable baselines.* A/B tests with continuous ML models are complicated by mutual feedback (model A influences training data for model B). Four baseline strategies: fallback-as-baseline, stop trainer (frozen model), delay trainer (time-lagged model), parallel universe model (independent data universe). The parallel universe model is most robust but takes time to stabilise.
6. *Models must be managed, not shipped.* Daily dashboard review ("cup of coffee with the model"), short writeups on observations, postmortems after incidents. Pre-negotiate outage consequences and escalation paths before incidents occur.

**Recommendation:** *Treat all production ML systems as continuous ML systems.* Even "static" models will eventually be retrained. Applying continuous ML standards and practices to all production models ensures validation procedures become part of organisational culture.

> **Contradiction with common practice:** Many organisations treat model training as a one-time activity and only retrofit operational practices after incidents. This chapter argues the inverse — design for continuous operation from the start, even if actual retraining cadence is weekly or monthly.

### Chapter 11 — Incident Response


ML incidents share the standard incident management phases (pre-incident, trigger, outage, detection, troubleshooting, mitigation, resolution, follow-up) but differ substantially in three dimensions: detection, organisational scope, and timeline clarity.

**Three ML-specific differences from standard distributed systems incidents:**
1. *Detection is harder:* ML failures manifest as model quality degradation, not hard errors. A model calling `predict()` successfully but returning wrong answers will never be detected by infrastructure monitoring. Quality metrics (click-through rate, revenue per recommendation) must fill this gap.
2. *Broader organisational scope:* ML outages routinely involve finance, retail, partner, product, and legal teams — not just engineering. The broader the system's economic impact, the broader the incident stakeholders.
3. *Fuzzy timeline and unclear resolution:* "When did the outage start?" and "Is the outage resolved?" are often unanswerable precisely. Model quality degrades gradually; "fixed" means returning to approximately previous quality on a model that is now two weeks behind the world.

**Four minimum viable roles (from US FEMA/National Incident Management System):**
- *Incident commander* — high-level coordination and role assignment
- *Communications lead* — inbound/outbound; updates public documents; liaisons with non-technical stakeholders
- *Operations lead* — approves, schedules, and records all production changes during the outage
- *Planning lead* — records longer-term items, schedules postmortem, preserves logs for analysis

**Three guiding principles for ML incidents:**
1. *Public* — ML quality outages often first appear as user complaints; end-user signals matter as early-detection mechanisms even when not actionable alone.
2. *Fuzzy* — ML outages are less sharply defined in both impact (degraded vs broken is a continuum) and time (no sharp start/end boundary).
3. *Unbounded* — troubleshooting spans technical, product, and business dimensions; more teams are needed to reach resolution than for equivalent non-ML outages.

**ML incident response principles by role:**

*Model developer / data scientist:* version all models and data; specify a fallback before launch; choose implementation-independent quality metrics. Must be reachable on-call — not expected to page frequently but may be indispensable. Must resist ethics violations under stress (accessing raw user data without proper logging or consent).

*Software engineer / ML engineer:* maintain clean data provenance with as few copies of the same data as possible; decouple model and binary rollouts so they can be investigated independently; implement model rollout and rollback tooling; maintain train/serve feature consistency.

*ML SRE / production engineer:* conduct regular architectural reviews; set up SLOs for model quality (not just infrastructure); educate themselves about the business impact of the ML system. *Key stance:* start incident troubleshooting at the model's output (what is it saying and why is that wrong?) rather than at the data (too much to search blindly). Be prepared to escalate to product and business leaders — ML outages rarely stop at the engineering boundary.

*Product manager / business leader:* understand how the ML system works and its limitations; ensure the organisation is staffed and trained for ML incident management; formalize escalation paths for on-call decisions with revenue consequences. During incidents: stay out of direct communications channels; act as informants on business impact rather than incident commanders.

**Ethical on-call manifesto:** ML incident response often requires access to raw user data — a privacy exposure risk. Four ethical dimensions: (1) *Impact* — fairness failures can wreak massive user harm without showing on aggregate dashboards; (2) *Cause* — a team may discover the system was built without fairness consideration; (3) *Troubleshooting* — raw query logs accessed for debugging may expose PII; (4) *Resolution* — some ethical violations require whistleblowing beyond the technical team. Recommended mitigations: Responsible AI evaluation at design time; access-controlled data access with logging and dual-key oversight.

> **RPO for ML systems:** Most ML systems have no meaningful recovery point objective. They exist to adapt to the current state of the world — the only RPO is "now." Resolution means returning to approximately previous quality on a model that is now weeks behind reality — not restoring to an earlier state.

### Chapter 12 — How Product and ML Interact

Covers the PM/product perspective on building ML-powered products: development phases, business goal setting, build vs buy, and why Agile is a poor fit for ML.

**Why Agile fits ML poorly:**
- Feedback loops are long (months or years from deployment to outcome signal), not sprint-length.
- Small team execution is less useful — ML integration involves people across the company.
- Model development has unpredictable delays; data-first development violates "build then validate."
- ML models are never "done" — neither reproducible nor stable over time — so ML products have limited determinism.

**ML product development phases:**
1. *Discovery and definition* — define the problem space before touching code; user research, user journey mapping, market sizing, feasibility assessment (rule-based proxy test before committing to ML).
2. *Business goal setting* — define intrinsic safety nets (logically impossible predictions), extrinsic safety nets (user confirmation flows), and business performance metrics. Understand the cost of wrong predictions — wrong in a low-stakes context (weird recommendations) vs wrong in a high-stakes context (accidental order cancellation) demand very different product guardrails.
3. *MVP construction and validation* — build a rule-based approximation first to prove the feature creates user value before investing in full ML. This validation is the highest-leverage checkpoint.
4. *Model and product development* — iterative; requires coordinated design + engineering + ML research + PM stakeholder management.
5. *Deployment* — tied to business metric tracking and controlled rollout. PMs act as translators between low-level engagement metrics (model training signal) and high-level business objectives.
6. *Support and maintenance* — never done; the cost of maintenance is consistently underestimated. Models must evolve as the world, the product, and the customers change.

**Build vs buy decision framework:**

Five scoring dimensions: alignment (does the product meet our needs?), investment (total cost of ownership), time (speed to production), competitive advantage (proprietary IP vs commodity), maintenance and support (ongoing human/hardware/software costs).

Key considerations:
- Models are generally *local* — trained on the organisation's own data. Generic pretrained models (object recognition, sentiment, speech-to-text) are exceptions where buy often wins.
- Data processing infrastructure: build vs buy is now more about *delegating operational responsibility* (managed service vs self-hosted) than technical capability.
- End-to-end ML platforms: few fully integrated platforms exist; most require assembly from components. Choose based on the organisation's long-term data strategy and expected scale, not point capability.

**When ML is a strong fit for a product:**
- Logic is too complex for handwritten rules (multi-phase search ranking)
- Scale implies personalisation for thousands+ users (justifies the up-front investment)
- Rules change quickly (real-time review-driven recommendations)
- Clear evaluation metric exists (conversion, CTR, revenue)
- 100% accuracy is not required (recommendation failure is acceptable; loan approval failure is not)

> **The most important business truth:** ML development cost is frequently overestimated for the initial build and underestimated for maintenance. The maintenance investment is *ongoing* — not a one-time cost.

### Chapter 13 — Integrating ML into Your Organization

An organisational leadership chapter. Core argument: ML is a horizontal activity that touches all data-generating parts of the business — it cannot be successfully siloed. Introduces Galbraith's Star Model as a framework for organisational design.

**Why ML integration is unusual:**
- ML follows data — anywhere there is data in the organisation, there is something potentially relevant to ML
- A successful small pilot does not predict success at scale — siloisation kills ML adoption
- Leaders must engage with detail (what data, what features, what the model is doing) in a way that's unusual for management; ML is not yet a sufficiently mature discipline to be managed via KPIs alone
- Westrum's organisational typology applied: power-oriented organisations crush novelty and are unlikely to adopt ML at all; *rule-oriented organisations* can adopt ML but punish failure, suppressing the cross-cutting risk communication that ML requires; performance-oriented organisations are the natural fit

**Galbraith's Star Model applied to ML:**

| Dimension | ML-specific considerations |
|-----------|---------------------------|
| Strategy | What role ML plays (experimental vs core vs transformational); drives funding and organisational scope |
| Structure | Functional (centralised ML team), product (ML embedded in product teams), or process (horizontal standards function) |
| Processes | Vertical (budgeting and prioritisation) and horizontal (workflow, review, and knowledge-sharing processes); the most underused lever |
| Rewards | Must align with reliability, fairness, and cross-functional collaboration — not just raw feature throughput |
| People | Prefer candidates who can learn ML on the job over narrow ML specialists; ML production engineering requires distributed systems skills more than ML algorithm skills |

**Six ML roles (organisational functions, not necessarily separate people):** business analysts, product managers, data engineers/scientists, ML engineers, product engineers, ML SREs/MLOps staff. SREs are uniquely valuable because they view the entire process end-to-end; all other roles are scoped to a layer.

**Key recommendation:** Start small on something purely additive (new feature, not replacement) where ML failure has low cost. Use the early implementation to build the cross-organisational connections that future ML work will require.

### Chapter 14 — Practical ML Org Implementation Examples

Three archetypal ML organisational structures, each evaluated via the Star Model (process, rewards, people dimensions):

**Scenario 1 — Centralised ML team (Centre of Excellence):**
- *Advantages:* specialisation, collaboration, clear leadership, strong influence on ML priorities across the company
- *Disadvantages:* distance from product domain knowledge; slow to see opportunity; centralised organisation may not understand or respect reliability processes; siloed from product teams may cause competition rather than cooperation
- *Key processes:* regular cross-functional stakeholder reviews; independent evaluation of each model change; de-risked combination testing (go/no-go meetings before multi-model launches)
- *People requirement:* experimentation mindset in product leaders; tolerance for ML's probabilistic and non-deterministic nature

**Scenario 2 — Decentralised ML expertise (embedded in product teams):**
- *Advantages:* fast to start; close to business domain; each team prioritises according to its own needs
- *Disadvantages:* no central management oversight of ML quality/fairness/ethics; duplicated infrastructure; proliferating dashboards; cross-team debugging is very difficult; a single bad model from one team can damage the organisation's reputation
- *Key processes:* company-wide technical infrastructure standards; weekly ML triage meetings; internal model findings reports reviewed by senior stakeholders
- *Rewards:* explicitly reward consistency and published quality standards, not just local velocity

**Scenario 3 — Hybrid (centralised infrastructure, decentralised modelling):**
- *The most common evolution path:* organisations typically start centralised or decentralised and grow into hybrid
- *Advantages:* efficiency of shared infrastructure; speed and domain alignment of local modelling teams
- *Disadvantages:* still subject to inter-team friction; cross-team model interaction bugs are hard to resolve
- *Key rewards:* incentivise business units to use central infrastructure (not build their own); incentivise infrastructure teams to serve business units; rotate modellers through the central team and vice versa

> **Core insight:** The biggest barrier to ML success is leadership tolerance for risk, change, and detail. Leaders who treat ML as magic and expect outcomes without engaging with the how are creating invisible externalities that will eventually surface as incidents, fairness failures, or regulatory violations.

### Chapter 15 — Case Studies: MLOps in Practice

Five practitioner case studies, each illustrating a different failure mode or operational lesson from production ML systems.

**Case study 1 — Dialpad: Privacy-preserving ASR across dialects**

*System:* Automatic speech recognition (ASR) for business calls across accent and dialect variation. Challenge: transcription accuracy degrades significantly for non-native accents; the most affected users are those who cannot correct errors or opt out.

*Operational lessons:*
- *Privacy-preserving data collection at scale:* transcription requires audio data — which is highly sensitive PII. Solution: user opt-in with strict data retention windows and automated deletion pipelines. Privacy was treated as a system design constraint from the start, not a compliance bolt-on.
- *Model confidence as a diversity proxy:* low-confidence transcription regions flag accent/dialect underrepresentation in training data. Confidence score distribution is a monitoring signal for coverage bias, not just accuracy.
- *Data retention creates reproducibility tension:* fixed retention windows mean that training data from months ago may be gone. Reproducing an older model for debugging or rollback requires careful data provenance management; often exact reproduction is impossible. Dedicated data engineering team is required to manage this at scale.

**Case study 2 — Google: Continuous ML corruption from an app update**

*System:* Query auto-completion model trained on user click data (CTR). An app update introduced duplicate queries in the user event log — the same user action was logged twice, doubling the apparent click count for affected sessions.

*Failure cascade:* the duplicate queries corrupted training labels → model learned incorrect CTR values → model quality degraded silently (no infrastructure alert fired, because `predict()` always succeeded) → quality degradation was detected via user-facing metrics weeks later.

*Resolution:* the duplicates could not be easily removed from historical training data, and repeated mitigation attempts (partial data cleaning) each introduced new artefacts. The final resolution was "roll through" — accept the atypical data, wait for the app update to be fully deployed (eliminating new duplicates), and allow the model to train through the noisy period.

*Key lesson:* When a data corruption is pervasive and irreversible, trying to surgically remove it often creates more damage than accepting it and waiting. "Roll through" is a valid crisis response step, not a concession.

**Case study 3 — Landing AI: Data-centric approach to steel defect inspection**

*System:* Computer vision model for industrial steel surface defect detection. Baseline model (industry-standard architecture, standard training pipeline) achieved ~80% accuracy — insufficient for production use.

*Approach:* switched from a model-centric workflow to a data-centric workflow. Less than 10% of engineering effort went into model architecture and hyperparameter tuning; more than 90% went into iterative data labelling improvement — standardising labelling criteria, resolving annotator disagreements, adding challenging examples.

*Result:* accuracy improved to 93% with the same model architecture. The insight: the bottleneck was label quality and label consistency, not model capacity.

*Key lesson:* For many industrial ML applications, the primary lever is data quality and annotation consistency, not model sophistication. (→ [[concepts/dataset-engineering]])

**Case study 4 — Dialpad: Load-testing NLP models**

*System:* NLP models serving business transcription and analytics. Problem: local profiling of inference performance did not match production behaviour — latency under load was significantly higher than predicted.

*Solution:* built a self-service staging load-test tool that replicates production traffic patterns. Engineers can run load tests against staging before deployment, with results comparable to production performance.

*Outcome:* the load-test tool was adopted as a standard step in the deployment process for all NLP models. What was once a surprise became a predictable gating check.

*Key lesson:* Load testing must reflect production traffic patterns — local profiling is structurally misleading for models serving heterogeneous request distributions. Self-service tooling dramatically improves adoption of the practice.

**Case study 5 — Google: Ad click prediction — models predict their training labels, not ground truth**

*System:* ad click prediction model trained on a click event feed. The click feed pipeline broke silently — it stopped delivering real clicks, filling the training dataset with false negatives (no click signal, even for ads that were clicked).

*The insidious failure:* the model's validation and test sets were drawn from the same corrupted pipeline. Validation metrics looked normal because both model and evaluation were working from the same corrupted data. The model learned to predict "no click" for everything — which matched the (corrupted) labels perfectly.

*Detection:* the failure was detected only when live business metrics (actual revenue) degraded — weeks after the pipeline broke.

*Key lessons:*
1. *Models predict their training labels, not ground truth.* A model that accurately predicts a corrupted label is still a broken model. Validation metrics are only as good as the labels they are computed against.
2. *Validate label completeness independently of model metrics.* Check that the label pipeline is producing expected volume and distribution before trusting any model quality metric.
3. *Label pipeline monitoring is as important as model monitoring.* The failure was in the data pipeline, invisible to all model-level checks.

## Notable Quotes

> "ML training pipelines are absolutely and completely a production system, worthy of the same care and attention as serving binaries or data analysis." (ch. 1)

> "If your infrastructure doesn't allow you to roll back easily, or at all, we strongly recommend you solve that first before launching." (ch. 1)

> "Data should properly be considered a liability as much as an asset." (ch. 2)

> "Anonymization is hard. It's a topic people study and develop expertise on. Don't try to just muddle through." (ch. 2)

> "Compliance requirements are SLOs, and reporting includes the SLIs that establish the status of our implementation with respect to those compliance SLOs." (ch. 2)

> "Better is not better, better is different — when your upstream data supplier improves their data, what they're sending you has changed, and your model may be broken." (ch. 3)

> "Feature generation is arguably the single most common source of errors in ML systems." (ch. 3)

> "An evaluation is always composed of both a metric and a distribution together... when we hear a statement like 'this model has better accuracy' without clarifying what the distribution is, this sort of shorthand can be dangerous." (ch. 5)

> "Statistical parity and calibration cannot be mathematically satisfied at the same time, unless base rates of events are the same in each group." (ch. 6)

> "One neat trick can help you avoid the entire problem: don't use ML/AI (if you can get away with it)." (ch. 6)

## Related Pages

- [[sources/designing-machine-learning-systems]] — highly complementary; Huyen covers the data science and engineering lifecycle; this book covers the SRE and operational layer
- [[sources/site-reliability-engineering]] — direct lineage; Niall Richard Murphy is co-editor of both
- [[concepts/ml-systems-design]] — the ML loop from ch. 1 is the operational framing of the ML lifecycle
- [[concepts/data-distribution-shifts]] — ch. 2 Spanish-language outage example illustrates covariate shift from operational failure; monitoring covered in ch. 9
- [[concepts/feature-engineering]] — data normalisation, bucketing, and leakage concerns in ch. 2; feature lifecycle and feature store architecture in ch. 4
- [[concepts/continual-learning]] — the ML loop's continuous nature motivates continual retraining; continuous ML challenges from ch. 10
- [[operations/monitoring]] — ch. 1 and ch. 9 monitoring taxonomy (golden signals + generic ML + domain-specific) with drift detection and ML SLOs
- [[operations/incident-management]] — ch. 11 ML incident response principles, guiding principles (public/fuzzy/unbounded), and ethical on-call manifesto
