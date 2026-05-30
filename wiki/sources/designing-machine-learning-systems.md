---
title: "Designing Machine Learning Systems"
type: source
tags: [ai, machine-learning, mlops, data-engineering, model-deployment, monitoring, production]
sources: [designing-machine-learning-systems]
created: 2026-05-30
updated: 2026-05-30
---

# Designing Machine Learning Systems

**Authors:** [[authors/chip-huyen]]
**Published:** 2022
**Slug:** `designing-machine-learning-systems`

## Overview

*Designing Machine Learning Systems* is a comprehensive guide to building and operating ML systems in production. Where Huyen's later book [[sources/ai-engineering]] focuses on adapting foundation models, this book covers the full ML lifecycle for traditional ML (and early neural network) systems: data engineering, training data curation, feature engineering, model development, deployment, monitoring, continual learning, and infrastructure.

The book's core thesis is that the ML algorithm is only a small part of a production ML system. Business requirements, data pipelines, deployment infrastructure, monitoring, and feedback loops are equally important — and most ML courses neglect them entirely. The book is structured around a six-step iterative lifecycle that never truly ends.

The second major theme is that production ML is fundamentally different from research ML: different stakeholders, different computational priorities (inference over training), messy shifting data instead of static clean benchmarks, and hard requirements around fairness and interpretability that research routinely ignores.

## Key Claims

- ML = learn complex patterns from existing data → make predictions on unseen data; nine conditions where ML is a strong fit (repetitive, wrong predictions are cheap, at scale, constantly changing patterns) (→ ch. 1)
- Production prioritises fast inference and low latency; research prioritises fast training and high throughput (→ ch. 1)
- ML systems fail silently — users may never know the model returned wrong predictions (→ ch. 2)
- Business metrics, not ML metrics, are what organisations care about; tie every ML objective to a business outcome (→ ch. 2)
- Decoupling multiple objectives into separate models enables independent tuning without retraining (→ ch. 2)
- Sutton's "Bitter Lesson": general methods that leverage computation/data have outperformed architecturally-biased approaches over 70 years of AI history (→ ch. 2)
- Data is not separable from code in ML systems; the system is code + data + artefacts together (→ ch. 1–2)

## Chapter Notes

### Chapter 1 — Overview of Machine Learning Systems

Motivates the need for a systems-level view of ML. ML algorithms are only a small part of a production system.

**When ML is appropriate:** ML learns complex patterns from existing data and makes predictions on unseen data. Nine conditions where it shines: (1) there are patterns to learn; (2) patterns are complex; (3) data is available or collectable; (4) the problem is predictive; (5) unseen data shares the training distribution; (6) task is repetitive; (7) wrong predictions are cheap; (8) problem is at scale; (9) patterns constantly change. Three conditions where it should not be used: unethical, simpler solutions suffice, not cost-effective.

**Research vs production (five key differences):**

| Dimension | Research | Production |
|-----------|----------|------------|
| Requirements | State-of-the-art on benchmarks | Multiple stakeholders, conflicting requirements |
| Computational priority | Fast training, high throughput | Fast inference, low latency |
| Data | Static, clean, well-formatted | Messy, shifting, biased, sparse labels |
| Fairness | Often neglected | Must be a first-class concern |
| Interpretability | Often neglected | Typically a requirement |

**Latency vs throughput:** In production, latency is a distribution — use percentiles (p50, p90, p95, p99) not averages. High-value customers (e.g., Amazon's most-purchasing users) often have the highest latency. 100 ms delay → 7% drop in conversion (Akamai 2017). Batching can improve throughput at the cost of latency.

**ML vs traditional SWE:** In SWE, code and data are separated. In ML, the system is code + data + artefacts from the two. Data can change quickly, requiring faster development cycles. Testing and versioning must cover data and models, not just code.

**Fairness:** ML algorithms encode the past and perpetuate biases at scale. A misclassification affecting a 2% minority group may have minor effects on aggregate accuracy metrics but devastating effects on those individuals. As of 2019, only 13% of large companies were taking steps to mitigate algorithmic bias.

**Interpretability:** Required in production for user trust, regulatory compliance, and developer debugging — but rarely prioritised in research.

### Chapter 2 — Introduction to Machine Learning Systems Design

Covers objectives, requirements, the iterative development process, problem framing, and the mind vs data debate.

**Business vs ML objectives:** Most companies care about business metrics (revenue, retention, engagement), not ML metrics (accuracy, F1, AUC). ML projects die when engineers optimise ML metrics without moving business metrics. Netflix's take-rate (quality plays / recommendations shown) maps recommender system performance to business outcomes. A/B testing bridges ML performance and business impact.

**Four system requirements:**
- **Reliability:** correct function at desired performance even in adversity. ML systems fail silently — no 404, no crash. (See [[operations/monitoring]].)
- **Scalability:** can grow in complexity (bigger models), traffic volume, and model count. Includes resource scaling (autoscaling) and artifact management (reproducing 100+ models). A startup may reach 8,000+ models in production.
- **Maintainability:** code, data, and artifacts should be versioned and documented. Multiple contributor groups (ML engineers, DevOps, SMEs) must be able to work without finger-pointing.
- **Adaptability:** the system must respond to shifting data distributions and business requirements without service interruption. Tightly linked to continual learning (ch. 9).

**Iterative development cycle (six steps):** project scoping → data engineering → ML model development → deployment → monitoring and continual learning → business analysis → back to scoping. Never truly done.

**Framing ML problems:** business problem → ML task. Define inputs, outputs, objective function. Task types: binary classification, multiclass, multilabel, regression, hierarchical classification. For multilabel, the challenge is label multiplicity and threshold selection. Framing can make a problem harder or easier: predicting next app as multiclass (one prediction per user per moment) vs. regression (N predictions, one per app) — the latter avoids retraining when new apps are added.

**Decoupling multiple objectives:** When a system must optimise multiple conflicting goals (engagement + quality), train one model per objective and combine scores with coefficients α, β at serving time. Tuning α and β doesn't require retraining models. Different objectives may also need different update frequencies (spam changes faster than quality norms).

**Mind vs data debate:**
- Pearl: "Data is profoundly dumb" — causal structure matters.
- Manning: intelligent design + structure lets systems learn from less data.
- Sutton's "Bitter Lesson": the biggest lesson of 70 years of AI — general methods that leverage computation win by a large margin; researchers who rely on domain knowledge end up outdated.
- Norvig: "We don't have better algorithms. We just have more data."
- Monica Rogati's AI Hierarchy of Needs: data quality/quantity is the foundation of all data science.

### Chapter 3 — Data Engineering Fundamentals

Covers data sources, formats, data models, storage engines, and dataflow modes for ML systems.

**Data sources:** user input (messy, must be processed fast), system-generated logs (less messy, can be processed periodically), internal databases (operational data — inventory, CRM, etc.), first-party data (your own users), second-party data (another company's customers), third-party data (the public). Third-party data is declining post-Apple IDFA opt-in (2021).

**Data formats:** row-major (CSV) vs column-major (Parquet). Row-major: faster writes and row reads; column-major: faster column-based reads and more compact for analytics. Text (CSV, JSON) vs binary (Parquet, Avro, Protobuf, Pickle): binary files up to 6× smaller (AWS recommends Parquet — 2× faster unload, 6× less S3 storage than text). pandas is column-major; accessing DataFrames by row is slow — convert to NumPy ndarray for row access.

**Data models:** relational (Codd 1970, SQL, declarative, normalisation reduces redundancy but joins are expensive; query optimizers as the hard part), document (flexible schema, better locality, harder cross-document joins; PostgreSQL and MySQL now support both), graph (relationships as first-class nodes and edges; multi-hop queries that are impossible in SQL/document become natural). Structured data (predefined schema, stored in data warehouses) vs unstructured data (no committed schema, stored in data lakes; responsibility for structure shifts from writer to reader).

**Storage engines:** OLTP (row-major, ACID: atomicity/consistency/isolation/durability; low latency, high availability) vs OLAP (column-major, analytical queries across rows). OLTP/OLAP boundary is dissolving: CockroachDB (OLTP with analytics), Apache Iceberg/DuckDB (OLAP with transactions). Decoupled storage/compute: BigQuery, Snowflake, IBM, Teradata — same data, different processing layers per query type.

**ETL vs ELT:** ETL (extract→transform→load): traditional, structured, data warehouses. ELT (extract→load→transform): load raw to data lake first for flexibility; less practical as data volumes grow because searching raw data is expensive. Data lakehouse (Databricks, Snowflake): hybrid combining lake flexibility with warehouse management.

**Dataflow modes:** (1) through databases — simplest but slow and requires shared database access; (2) through services (REST/RPC) — synchronous, request-driven; tightly coupled with microservice architecture; (3) through real-time transport (Apache Kafka, Amazon Kinesis, RabbitMQ) — asynchronous, event-driven, low latency without DB overhead; pubsub (Kafka/Kinesis) vs message queue (RocketMQ/RabbitMQ). Request-driven better for logic-heavy systems; event-driven better for data-heavy systems.

**Batch vs stream processing:** batch (periodic jobs on historical data in databases — static features; MapReduce, Spark); stream (continuous or near-continuous computation on streaming data — dynamic features; Apache Flink, KSQL, Spark Streaming). Stream processing is harder (unbounded data, variable arrival rates) but more general: Apache Flink maintainers argue batch is a special case of stream processing. Many ML problems need both static and dynamic features joined together at prediction time.

### Chapter 4 — Training Data

Covers sampling, labeling, handling label scarcity, class imbalance, and data augmentation.

**Sampling methods:**
- *Nonprobability:* convenience, snowball, judgment, quota — riddled with selection bias; used in practice far more than it should be (language models trained on Wikipedia/Reddit, not representative of all texts).
- *Simple random:* equal probability; rare classes may not appear.
- *Stratified:* sample from each stratum separately — guarantees rare class representation; can't be used when examples belong to multiple strata.
- *Weighted:* assign weights to reflect true distribution or domain knowledge; closely related to sample weights used during training.
- *Reservoir:* sample k items from an unknown-length stream with equal probability; can stop at any time and have a correctly-proportioned sample.
- *Importance:* sample from an easier distribution Q(x) and weight by P(x)/Q(x); used in policy-gradient RL to reuse rollouts from an older policy.

**Labeling:**
- *Hand labels:* expensive (expert labelers for medical imaging), slow (400h per 1h of phonetic speech annotation), privacy-limiting, slow to adapt to requirement changes.
- *Label multiplicity:* multiple conflicting labels per example from different annotators; mitigate with precise guidelines and annotator training; inter-annotator agreement as a data quality metric.
- *Data lineage:* track origin of every sample and its labels; enables debugging mysterious model failures from mixed data quality.
- *Natural labels:* labels inferrable from system behaviour (e.g., click-through on recommendations; ETA accuracy; stock price after two minutes). 63% of companies surveyed work with tasks with natural labels. Feedback loop length: short (minutes, recommender clicks) to long (months, fraud disputes).
- *Implicit vs explicit labels:* implicit (non-click after window = negative) vs explicit (user downvotes). Window length: speed/accuracy trade-off — premature negative labels; Twitter Ads study: some clicks arrive hours after ad impression.

**Handling the lack of labels:**
- *Weak supervision (Snorkel):* labeling functions (LFs) encode heuristics (keywords, regex, DB lookup, other model outputs) → noisy labels; LFs combined/denoised/reweighted. No ground truth required; privacy-preserving. Stanford Medicine case study: 8 hours of LF writing by one radiologist ≈ nearly a year of hand labeling. LFs versioned, reusable, adaptable without relabeling.
- *Semi-supervision:* small set of seed labels + structural assumptions → generate more labels. Self-training: train on labeled → high-confidence predictions become new labels → repeat. Perturbation-based: small perturbations to a sample shouldn't change its label.
- *Transfer learning:* pretrained base model (language modeling on cheap unlabeled data) → fine-tune on downstream task with fewer labels. Larger base models perform better on downstream tasks.
- *Active learning:* model selects samples most useful for learning (uncertainty sampling, query-by-committee); higher accuracy with fewer labels.

**Class imbalance:** norm in production (fraud: 6.8¢ per $100, most transactions not fraudulent; churn prediction; disease detection; object detection bounding boxes). Imbalance makes learning hard: insufficient signal for minority class, model exploits majority-class heuristic (99.99% accuracy by always predicting NORMAL), asymmetric error costs.
- *Metrics:* use F1/precision/recall/AUC rather than overall accuracy; precision-recall curve better than ROC for heavy imbalance.
- *Resampling:* oversampling (SMOTE for low-dimensional data), undersampling (Tomek links, removes majority-class samples near minority boundary); two-phase learning; dynamic sampling. Only effective for low-dimensional data; don't evaluate on resampled data.
- *Algorithm-level:* cost-sensitive learning (cost matrix C_ij), class-balanced loss (weight ∝ 1/class_count), focal loss (higher weight for samples model is uncertain about).

**Data augmentation:** label-preserving transformations (image: crop/flip/rotate; text: synonym replacement); perturbation (adding noise improves robustness to adversarial attacks; BERT uses 1.5% random token replacement); data synthesis (templates for chatbot queries; mixup for computer vision: combine two samples with blended labels).

### Chapter 5 — Feature Engineering

Covers feature operations, data leakage, feature importance, and generalisation.

**Missing values:** three types — MNAR (value absent because of its own value; most harmful), MAR (absent because of another observable variable), MCAR (truly random; rare). Strategies: deletion (column if low-signal; row only for MCAR) or imputation (default, mean/median/mode). Never delete from test splits.

**Scaling:** min-max normalisation (sensitive to outliers), standardisation (zero mean, unit variance; more robust), log transformation (right-skewed distributions). Critical: compute statistics on training set only; applying before splitting is data leakage.

**Discretisation/binning:** continuous → discrete; useful for trees but introduces artificial discontinuities for smooth-function models.

**Categorical encoding:** naïve one-hot breaks on unseen categories in production. **Hashing trick:** hash values into fixed-size space; Booking.com: <0.5% loss at 50% collision rate.

**Feature crossing:** encodes non-linear interactions for linear models. Produces feature space explosion → often paired with hashing.

**Positional embeddings:** discrete learned (BERT; bounded by max length), fixed sinusoidal (Transformer; generalises to new lengths), continuous Fourier features (NeRF-style).

**Data leakage:** label information available only at inference time leaks into training. Common causes:
- Random split on time-correlated data (use time-based split)
- Scaling before splitting (compute on train, apply to all)
- Imputing with test statistics
- Data duplication across splits (CIFAR-10: 3.3% near-duplicates)
- Group leakage (same patient in train and test)
- Data generation process (COVID X-ray models learned scanner type ≈ hospital ≈ COVID prevalence)

Detection: predictive power measurement (suspicious accuracy), ablation studies, distribution comparison.

**Feature importance:** Facebook top 10 features ≈ 50% total importance; last 300 features < 1%. Prune unused features — each is a maintenance burden and an inference cost.

**Feature generalisation:** coverage (fraction of samples with a value) × distribution overlap. High-signal but low-coverage features contribute little in aggregate.

### Chapter 6 — Model Development and Offline Evaluation

Covers model selection, ensembles, experiment tracking, distributed training, AutoML, and offline evaluation methods.

**Six model selection tips:** (1) avoid SOTA trap; (2) start simple — establishes pipeline validity and a baseline; (3) avoid human bias — run comparable experiments for each candidate; (4) evaluate now vs. later — use learning curves to estimate future data value; (5) evaluate trade-offs explicitly (FP/FN, compute, interpretability); (6) understand model assumptions (IID, linearity, conditional independence, Gaussian).

**Four phases of ML adoption:** heuristics → simplest ML → optimise simple models → complex models. Heuristics capture 50% of eventual ML boost (Zinkevich).

**Ensembles:** 20/22 Kaggle winners (2021) and top SQuAD 2.0 solutions use ensembles. Uncorrelated base learners compound accuracy. Three methods: bagging (bootstrap sampling, reduces variance; random forests), boosting (sequential reweighting of examples; GBM, XGBoost, LightGBM), stacking (meta-learner trained on base learner outputs).

**Experiment tracking:** track loss curves, metrics, sample/prediction/label logs, speed, system metrics, hyperparameter values. Data versioning is harder than code versioning — DVC uses checksums rather than diffs; GDPR complicates historical data retention.

**Debugging:** three challenges — silent failure, slow validation cycle (must retrain to verify fix), cross-functional complexity. Techniques: start simple, overfit one batch, set random seed.

**Distributed training — data parallelism:** replicate model across workers; aggregate gradients. Synchronous SGD: stragglers block all workers. Asynchronous SGD: gradient staleness; benign when gradients are sparse (large models). Large batch sizes require scaled learning rates; past a threshold, diminishing returns.

**Distributed training — model parallelism:** partition model components across machines. Pipeline parallelism uses micro-batches to reduce idle time. Data + model parallelism are complementary.

**AutoML:** hyperparameter tuning (soft) via random/grid/Bayesian search — well-tuned weaker models beat poorly-tuned stronger ones. Neural Architecture Search (hard) — three components: search space, performance estimation, search strategy (RL or evolutionary). EfficientNets: up to 10× efficiency gain. Learned optimisers: replace Adam/SGD with a neural network trained on a distribution of tasks; self-improving.

**Offline evaluation baselines:** random (uniform or label-distribution), simple heuristic, zero rule (always predict modal class), human performance, existing solution. A 0.90 F1 on a 90/10 imbalanced task may be no better than random.

**Evaluation methods:**
- *Perturbation tests:* add noise to test inputs; choose the model most robust to production-representative noise.
- *Invariance tests:* sensitive attributes (race, gender) should not change outputs. Berkeley mortgage study: 1.3M creditworthy Black/Latino applicants rejected; removing race → accepted.
- *Directional expectation tests:* monotone input changes should produce monotone output changes.
- *Model calibration:* predicted P(x%) should equal empirical frequency of x% outcomes. Essential for revenue forecasting and recommendations. Platt scaling for recalibration.
- *Confidence measurement:* per-sample metric; enables routing low-confidence predictions to humans.
- *Slice-based evaluation:* analyse per-subgroup performance. Model A: 98% majority / 80% minority; Model B: 95% / 95%. Simpson's paradox: a model can outperform per-subgroup but underperform in aggregate. Slices found via heuristics, error analysis, or slice finder algorithms.

### Chapter 7 — Model Deployment and Prediction Service

Covers deployment myths, batch vs online prediction, model compression, edge vs cloud, and compiler-level model optimisation.

**Four deployment myths:** (1) Only 1-2 models in production — Uber has thousands; 41% of companies with 25K+ employees have 100+ models. (2) Performance stays constant — software rot + data distribution shifts mean models degrade. (3) Infrequent updates — "how often can I update?" not "how often should I?"; Weibo: 10-minute iteration cycles. (4) Scale only matters for hyperscalers — half the engineering workforce is at companies with 100+ employees.

**Batch vs online prediction:**
- *Batch (asynchronous):* periodic; optimises for throughput; uses only batch features; precomputed predictions stored in DB; stale for unpredictable queries; good workaround when online is too slow.
- *Online (synchronous):* on-demand; optimises for latency; can use streaming features (streaming prediction); required for fraud detection, autonomous vehicles, real-time translation.
- Hybrid: precompute for popular queries; generate online for rare ones.

**Training-serving skew:** two separate pipelines (batch for training, stream for inference) are a common bug source. Features computed differently across pipelines cause silent failures. Uber/Weibo moved to Apache Flink to unify. Feature stores enforce consistency.

**Model compression techniques:**
- *Low-rank factorisation:* replace high-dimensional weight tensors with lower-rank approximations. SqueezeNets: 50× fewer parameters than AlexNet at same accuracy. MobileNets: depthwise + pointwise convolution reduces parameters 8–9×.
- *Knowledge distillation:* small student trained on teacher outputs. DistilBERT: 40% smaller, 97% accuracy, 60% faster.
- *Pruning:* set least-useful parameters to 0 (sparsification). Can reduce nonzero parameters by 90%+ without accuracy loss. Lottery Ticket Hypothesis: the pruned architecture itself may be the primary value, not the inherited weights.
- *Quantisation:* FP32 → FP16 → INT8 → 1-bit. Reduces memory and improves throughput. Roblox: quantising BERT to INT8 reduced latency 7× and increased throughput 8×. Post-training quantisation is standard; quantisation-aware training allows larger batch sizes during training. NVIDIA Tensor Cores and TPU Bfloat16 support mixed precision natively.

**Edge vs cloud:**
- Cloud: easy setup; expensive at scale; network latency often > inference latency; data privacy and breach risk.
- Edge: no internet required; eliminates network latency; privacy-preserving; battery/memory constrained.
- Hardware race: custom ML chips from Google, Apple, Tesla; 30 billion edge devices projected by 2025.

**Compilers and IRs:** ML models must be lowered from framework code (PyTorch/TF) → high-level IR (computation graph) → hardware-native code. Intermediate representations allow one framework to target many hardware backends. Local optimisations: vectorisation, parallelisation, loop tiling, operator fusion. Global optimisation: autoTVM — breaks graph into subgraphs, ML cost model predicts subgraph execution time, finds optimal execution plan. cuDNN autotune for convolutions. WASM for browser deployment (45–55% slower than native but runs on any device).

### Chapter 8 — Data Distribution Shifts and Monitoring

Covers ML system failures, distribution shift taxonomy, detection methods, and monitoring tooling.

**ML system failure types:** (1) Software system failures — dependency, deployment, hardware, downtime. Google study (Papasian & Underwood 2020): 60/96 ML pipeline failures were non-ML-specific (distributed systems, data pipeline bugs). MLOps tooling maturity will reduce this share. (2) ML-specific failures — production data ≠ training data, edge cases, degenerate feedback loops.

**Train-serving skew:** training distribution ≠ production distribution. Caused by selection bias, sampling bias, artificially balanced training sets, and natural world change.

**Edge cases:** performance failures on extreme inputs. Not all outliers are edge cases (outlier = rare data; edge case = rare performance failure). Critical for safety-critical ML.

**Degenerate feedback loops:** predictions influence user behaviour → that behaviour becomes training data → model amplifies its own biases. Common in recommender systems and ads CTR. Example: song A marginally ranked higher → clicked more → ranked even higher → homogeneous recommendations. Resume screening biased toward feature X → only X candidates interviewed → X reinforced. Detection: measure popularity diversity; measure accuracy vs popularity buckets. Correction: randomisation (TikTok: each video gets initial random traffic pool); positional features (encode where predictions were shown during training; set to False at inference).

**Data distribution shift types:**
- *Covariate shift:* P(X) changes, P(Y|X) unchanged. Input distribution changes. Caused by selection bias, oversampling, active learning. Example: marketing brings more affluent users.
- *Label shift:* P(Y) changes, P(X|Y) unchanged. Output distribution changes. Often co-occurs with covariate shift.
- *Concept drift:* P(Y|X) changes, P(X) unchanged. "Same input, different output." COVID example: Wuhan search → travel info vs origin of outbreak. Often seasonal/cyclic.
- *Feature change:* features added/removed/re-ranged.
- *Label schema change:* new classes, retired classes, class splits. Requires relabelling and retraining.

**Detecting distribution shifts:**
- Monitor accuracy metrics when ground truth labels are available (natural labels).
- When labels unavailable: monitor input distribution P(X), features, and predictions.
- Summary statistics (min/max/mean/median/variance) — simple but insufficient; don't detect shape changes.
- Two-sample tests — Kolmogorov–Smirnov (1D only; expensive; many false positives), Least-Squares Density Difference, MMD (research but not widely in production).
- Reduce dimensionality before two-sample tests on high-dimensional features.
- Sliding vs cumulative statistics — cumulative statistics can hide sudden performance dips.
- Time window affects what shifts are detectable; match window to expected cycle length.

**Monitoring toolbox:**
- *Accuracy metrics:* most direct; requires labels; log all user feedback (click, share, downvote) as proxy.
- *Prediction monitoring:* low-dimensional, easy to visualise; distribution shift in predictions is a proxy for input shift. Detecting all-False predictions immediately vs waiting for label-based metrics.
- *Feature monitoring:* feature validation (min/max/regex/membership checks; Great Expectations, Deequ); two-sample tests on features. Concerns: compute cost at scale; most feature shifts are benign → alert fatigue; multi-step pipelines obscure root cause; schema versioning needed.
- *Raw input monitoring:* usually data platform team's responsibility.
- *Logs, dashboards, alerts:* logs for events; distributed tracing (unique process ID + metadata); dashboards for visualisation (dashboard rot anti-pattern); alerts with policy + notification channel + description + runbook.
- *Observability vs monitoring:* monitoring = track external metrics; observability = instrument system so internal states are inferable from external outputs. Enables slice-level queries: "show me wrong predictions in the last hour grouped by zip code."

### Chapter 9 — Continual Learning and Test in Production

Covers stateless vs stateful retraining, the four stages of continual learning maturity, and a comparative treatment of test-in-production methods.

**Continual learning definition:** micro-batch updates to a model from a stream of fresh data. Not online learning (per-sample); not periodic stateless retraining. The goal is keeping the model current with the distribution the system sees in production. (→ [[concepts/continual-learning]])

**Stateless retraining vs stateful training (fine-tuning):** stateless retrains from scratch on combined old + new data — simple but expensive and requires storing all historical data. Stateful continues from the last checkpoint on new data only — 45× compute reduction and 20% purchase increase for Grubhub. Stateful is the only viable approach when historical data cannot be retained (GDPR).

**Model iteration vs data iteration:** data iteration (same architecture, fresh data) is stateful-compatible; model iteration (architecture/feature changes) requires stateless retraining.

**Why continual learning:** (1) combat distribution shifts; (2) handle rare events (Black Friday); (3) continuous cold-start — TikTok adapts to new users in ~10 minutes.

**Four stages:** (1) manual stateless; (2) automated stateless; (3) automated stateful; (4) trigger-based (time/performance/volume/drift triggers). Most mature systems use multiple trigger types.

**Value of data freshness:** measure empirically. Facebook: weekly → daily retraining reduced ad CTR loss by 1%. Compare models trained on different time windows against a fixed evaluation window.

**Test in production methods:**

| Method | Traffic | User impact | Sample efficiency |
|--------|---------|-------------|-------------------|
| Shadow deployment | 100% (doubled cost) | None | Low — can't measure user outcomes |
| A/B testing | Split | Exposed to both | ~630K samples to significance |
| Canary release | Progressive (1%→100%) | Proportional | Medium |
| Interleaving | 100% (mixed results) | Sees both models | Very high — within-user variance eliminated |
| Bandits | Dynamic | Proportional to performance | ~12K samples (Thompson Sampling) |
| Contextual bandits | Dynamic, per-context | Proportional | High; partial feedback problem |

A/B testing is the industry standard but slow. Interleaving (Netflix) achieves same statistical power with dramatically fewer samples but requires list-shaped output (recommendations, rankings). Bandits explicitly model exploration-exploitation trade-off and adapt allocations — stateful; require reward signal. Contextual bandits extend to per-prediction action selection.

### Chapter 10 — Infrastructure and Tooling for MLOps

Covers the four-layer MLOps infrastructure stack and the build-vs-buy decision.

**Four infrastructure layers:** (1) storage/compute; (2) resource management; (3) ML platform; (4) development environment.

**Cloud repatriation:** Dropbox saved $75M. a16z: $100B+ market cap lost across public companies due to cloud margin drag. 81% of enterprises use 2+ cloud providers (multi-cloud for lock-in avoidance and cost optimisation). (→ [[concepts/mlops-infrastructure]])

**Dev environment:** standardisation critical to reproducibility. Jupyter: powerful for exploration but non-linear execution, non-reproducible, poor version control, no unit testing. Docker: Dockerfile → image → container; makes environment part of the artifact. K8s for orchestration at scale.

**Workflow orchestration — tool comparison:**

| Tool | Paradigm | Notable |
|------|----------|---------|
| Airflow | Monolithic DAG, static, non-parameterised | Most widely deployed |
| Argo | Per-step containers, YAML, K8s-native | Verbose |
| Prefect | Parameterised, dynamic DAGs | Ergonomic |
| Metaflow | ML-specific, `@conda`/`@batch` decorators | Best dev→prod UX (Netflix) |

**ML platform — model store:** eight artifact types to track: model definition, parameters (weights), featurise/predict functions, dependencies, data pointers, training code, experiment artifacts, metadata. MLflow is the dominant open-source implementation.

**Feature stores:** manage, compute, and serve features consistently across training and inference. Three functions: management (registry, lineage, access control); computation (batch and streaming materialisation); consistency (same feature code at train and inference time — eliminates training-serving skew). 40% of companies use one; ~50% of those build their own. Feast (open-source), Tecton (commercial), or bespoke (Uber Michelangelo, Airbnb, Twitter).

**Build vs buy:** buy unless it is a genuine competitive differentiator. ML models and features differentiate; infrastructure is a cost centre. Company maturity and tool maturity are the two modifying factors.

### Chapter 11 — The Human Side of Machine Learning

Covers user experience with probabilistic ML systems, team structure, and responsible AI.

**ML UX challenges — three issues:**

1. *Consistency vs accuracy:* ML predictions are probabilistic; the same user may receive different recommendations on consecutive visits. Booking.com solved this with explicit rules: return the same recommendations when the user has applied filters; allow new recommendations when context changes. The consistency–accuracy trade-off is a design decision, not a technical constraint.

2. *Mostly correct predictions:* large models generate mostly correct but imperfect outputs. Users who can correct them (experts) benefit; users who cannot are worse off. Mitigation: show multiple predictions rendered in a user-evaluable format — the human-in-the-loop AI pattern.

3. *Smooth failing:* models may take unexpectedly long on certain inputs. Backup systems — a faster, less accurate model or cached precomputed predictions — serve if latency exceeds a threshold.

**Team structure — two approaches:**

*Approach 1 — separate Ops team:* ML engineers develop models; platform/ops team productionises them. Easier to hire but creates communication overhead, debugging ambiguity, finger-pointing, and narrow context.

*Approach 2 — end-to-end data scientists:* data scientists own the full pipeline. High competency bar; risks making data scientists spend more time on boilerplate than data science. Scales only when tooling abstracts away infrastructure (Netflix model: specialists build tools, data scientists use them end-to-end).

**Responsible AI framework:**

1. *Discover bias sources:* training data representativeness, labelling subjectivity, disparate impact via proxy features correlated with protected classes (zip code → race), wrong objective (Ofqual optimised school-level fairness, not student-level accuracy), insufficient slice-based evaluation.

2. *Understand data-driven limitations:* data encodes socioeconomic context; cross-disciplinary collaboration needed. Ofqual A-level grading failure (UK, 2020): model optimised historical school performance distributions → punished students in historically low-performing (lower-SES) schools.

3. *Understand trade-offs:*
   - *Privacy vs accuracy:* differential privacy reduces accuracy disproportionately for underrepresented classes (Bagdasaryan & Shmatikov 2019).
   - *Compactness vs fairness:* compression (pruning especially) concentrates accuracy loss in long-tail underrepresented features (Hooker et al. 2019).

4. *Act early:* NASA study: error correction costs increase by one order of magnitude at each successive project stage.

5. *Create model cards:* standardised documentation per model version covering intended use, metrics, evaluation data, training data, intersectional analysis, ethical considerations. Model stores and model cards converge naturally.

6. *Establish processes:* systematic bias audits, third-party audits, internal toolkits (Google Responsible AI practices, IBM AI Fairness 360, H2O Infogram).

**Strava privacy case study (2018):** aggregated heatmap of 1 billion exercises exposed US military base locations. Data was "anonymised" but aggregate patterns re-identified sensitive activities. Default opt-out (not opt-in) for data collection is the proximate failure; deeper: aggregated anonymised data can reveal sensitive patterns developers never anticipated.

## Notable Quotes

> "The algorithm is only a small part of an ML system in production." (ch. 1)

> "ML systems can fail silently. End users don't even know that the system has failed and might have kept on using it as if it were working." (ch. 2)

> "Magically: possible. Overnight: no." (ch. 2, on expectations for ML ROI)

> "We don't have better algorithms. We just have more data." — Peter Norvig (ch. 2)

> "The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin." — Richard Sutton (ch. 2)

## Related Pages

- [[concepts/ml-systems-design]] — the central concept this book develops
- [[concepts/ai-engineering]] — Huyen's later book on building applications with foundation models
- [[concepts/dataset-engineering]] — Huyen's treatment of training data in AI Engineering
- [[operations/monitoring]] — chapter 8 covers data distribution shifts and monitoring in depth
- [[concepts/ai-evals]] — offline evaluation overlaps with concepts in AI Engineering ch. 3–4
- [[concepts/feature-engineering]] — chapter 5; MNAR/MAR/MCAR taxonomy, data leakage, feature importance
- [[concepts/model-development]] — chapter 6; model selection, ensembles, distributed training, offline evaluation
- [[concepts/data-distribution-shifts]] — chapter 8; shift taxonomy, degenerate feedback loops, detection
- [[concepts/continual-learning]] — chapter 9; stateless vs stateful retraining, test in production methods
- [[concepts/mlops-infrastructure]] — chapter 10; four-layer infrastructure stack, feature stores, workflow orchestration
