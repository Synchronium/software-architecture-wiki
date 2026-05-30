---
title: "Feature Engineering"
type: concept
tags: [ai, machine-learning, data, features, preprocessing, data-leakage, feature-store]
sources: [designing-machine-learning-systems, reliable-machine-learning]
created: 2026-05-30
updated: 2026-05-30
---

# Feature Engineering

## Definition

Feature engineering is the process of transforming raw data into a form that makes it easier for ML models to learn from. Despite the rise of deep learning, feature engineering remains essential for structured/tabular data and for metadata and behavioural signals that deep learning doesn't learn automatically. (→ [[sources/designing-machine-learning-systems]] ch. 5)

## Operations

### Missing Value Handling

Missing values come in three types with different causes and appropriate responses:

- **MNAR (missing not at random):** the value is missing *because* of the value itself — e.g., high earners not disclosing income, or a blood glucose sensor failing above the measurement range. MNAR is hardest to handle because the missingness is informative.
- **MAR (missing at random):** the value is missing because of *another observable variable* — e.g., married people less likely to disclose age. Once that other variable is conditioned on, the remaining missingness is random.
- **MCAR (missing completely at random):** truly random, no pattern. Rare in practice.

Strategies:
- **Deletion:** drop the column (if most values missing and not predictive) or drop the row (if MCAR and few rows affected). Never delete rows from test data.
- **Imputation:** replace with a default value, mean, median, or mode. Use with care — imputation adds noise and obscures distribution. For MNAR, mean/median is likely to mislead.

### Feature Scaling

Models that use gradient descent or distance metrics are sensitive to feature scale; tree-based models are not.

- **Min-max normalisation:** rescales to [0, 1]. Sensitive to outliers — one outlier compresses the rest of the range.
- **Standardisation (Z-score):** subtracts mean, divides by standard deviation → zero mean, unit variance. Handles outliers better.
- **Log transformation:** useful for right-skewed distributions (e.g., income, word frequency). Compresses large values.

**Critical rule:** compute scaling statistics (mean, min, max) on the *training set only*, then apply to the validation and test sets. Scaling before splitting leaks test statistics into training — a form of data leakage.

### Discretisation (Binning)

Continuous features can be discretised into buckets. Makes the model less sensitive to small numerical variations but introduces artificial discontinuities at bin boundaries. Generally more useful for decision trees (where the algorithm itself finds good splits) than for models that assume smooth functions.

### Categorical Encoding

Naïve approaches (one-hot, label encoding) assume a fixed, known category set. In production, new categories appear constantly — new products, new cities, new user agents.

**Hashing trick:** hash category values into a fixed-size integer space. Eliminates the fixed-vocabulary problem. Used by Vowpal Wabbit and widely at scale. At a reasonable hash space size, collision rates are low: Booking.com found <0.5% accuracy loss at 50% hash collision rate.

### Feature Crossing

Combine multiple features to model non-linear interactions explicitly. The model `f(x₁, x₂)` can be expressed as a linear model over a crossed feature `x₁ × x₂`. Essential for linear/logistic regression, which cannot otherwise capture non-linear relationships. Can cause feature space explosion — hashing is frequently applied to crossed features to bound the space.

### Positional Embeddings

Encode position within a sequence as a learnable vector:
- **Discrete learned embeddings (BERT-style):** each position has a learned vector; bounded by max sequence length.
- **Sinusoidal fixed embeddings (original Transformer):** deterministic mathematical function of position; generalises to unseen lengths.
- **Continuous Fourier features:** generalisation to arbitrary spatial coordinates; used in NeRF and similar models.

## Data Leakage

Data leakage occurs when label information that would not be available at inference time is inadvertently included in the training features. Leakage produces optimistically biased offline metrics that do not hold up in production.

### Common Sources

| Source | Description |
|--------|-------------|
| Random train/test split on time-correlated data | Future data leaks into training set. Always split by time. |
| Scaling before splitting | Test-set mean/std used in training features. Scale after splitting, using train statistics only. |
| Imputation with test statistics | Missing values filled using statistics that include the test set. |
| Data duplication across splits | CIFAR-10: 3.3% of test images had near-duplicate training images, inflating benchmark scores. |
| Group leakage | Same patient's multiple scans in both train and test; model memorises per-patient signal not applicable to new patients. |
| Leakage from data generation process | COVID-19 X-ray models learned to distinguish scanner type (proxy for hospital, proxy for COVID prevalence) rather than pathology. |

### Detection

- **Predictive power measurement:** if a feature is suspiciously predictive, investigate whether it is causal or correlated-via-the-label.
- **Ablation studies:** remove suspected features and observe performance change.
- **Train/test distribution comparison:** features should have similar distributions in both splits.

## Feature Importance and Generalisability

**Feature importance:** XGBoost's built-in importance scores and SHAP values identify which features contribute most. Facebook found that the top 10 features account for ~50% of total model importance; the last 300 features contribute less than 1%. Pruning unimportant features reduces latency, training cost, and maintenance burden.

**Feature generalisability:** two axes:
- **Coverage:** the fraction of production samples for which a feature has a value. A feature present in only 1% of samples may add little even if it has high signal for those samples.
- **Distribution overlap:** does the feature distribution in production match training? A feature can be high-coverage but with a shifted distribution that harms generalisation.

Generalisation and specificity trade off — a very task-specific feature may have high signal but narrow applicability.

## Best Practices

1. **Split by time, not randomly** — for time-series or event data.
2. **Oversample after splitting** — resampling applied to training data only.
3. **Scale after splitting** — use training-set statistics, apply to all splits.
4. **Remove unused features** — every feature is a maintenance liability and an inference cost.
5. **Track feature lineage** — know the origin and transformation history of every feature; enables debugging.
6. **Inspect distributions** — shift between training and serving distributions (feature skew) is a common silent failure mode.

## Feature Lifecycle

[[sources/reliable-machine-learning]] (ch. 4) describes a 10-step lifecycle as the operational unit of feature management:

1. Data collection
2. Data cleaning
3. Candidate feature definition (code describing the extraction algorithm)
4. Feature value extraction (running the code against data)
5. Feature store storage
6. Feature evaluation (signal quality, coverage, distribution overlap)
7. Model training/serving (feature is live in a production model)
8. Feature definition updates (versioned changes to extraction code)
9. Deletion of feature values (remove computed values for deprecated features)
10. Feature discontinuation (retire the definition)

The distinction between *feature definition* (the code) and *feature value* (a specific computed output) is fundamental: changing the definition invalidates prior values.

## Feature Stores

A feature store is the infrastructure layer that manages feature definitions, computes and stores feature values, and serves them to training and serving pipelines. (→ [[sources/reliable-machine-learning]] ch. 4)

**API requirements:**
1. Store feature definitions (code + metadata)
2. Store feature values (computed outputs)
3. Serve data efficiently — must not stall GPU/TPU compute; I/O is often the bottleneck
4. Coordinate metadata writes across distributed computation jobs

**Storage patterns:**
- *Columns (structured):* column-oriented storage (BigQuery, Parquet) for tabular ML data — efficient for pipelines that read feature subsets
- *Blobs (unstructured):* object stores for images, audio, video — accessed by key, not columnar scan

**Transforming features:** Feature stores can host transformation logic that runs the same code path at training and serving time — the primary mechanism for eliminating train/serve skew. Transformations can be materialised (precomputed) for latency-critical serving paths.

**Legal use restrictions:** A raw feature (e.g., age) may have legal restrictions — usable for insurance only with specific bucketing. The solution is a compliant *transforming feature* that applies the legally required transformation, allowing restricted use without banning the raw feature from all contexts.

## Metadata Tracking

Four types of feature metadata needed for reliable ML systems (→ [[sources/reliable-machine-learning]] ch. 4):

| Type | Key fields |
|------|------------|
| Dataset metadata | Provenance, location, responsible person, creation date, use restrictions |
| Feature metadata | Definition version, responsible person, creation date, use restrictions |
| Label metadata | Definition version, set version, source, confidence |
| Pipeline metadata | Run history, performance, dependencies |

Design choice: one unified metadata system (simpler joins, harder to evolve independently) vs multiple systems (decoupled, require shared IDs or a meta-metadata layer).

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-machine-learning-systems]] | Operations (scaling, encoding, crossing, embeddings), data leakage taxonomy, best practices |
| [[sources/reliable-machine-learning]] | Feature lifecycle as the operational unit; feature stores to eliminate train/serve skew; metadata systems; legal use restrictions |

## Related Concepts

- [[concepts/dataset-engineering]] — training data acquisition and synthesis upstream of feature engineering
- [[concepts/ml-systems-design]] — feature engineering sits within the broader ML lifecycle
- [[concepts/finetuning]] — foundation model finetuning reduces but does not eliminate feature engineering for structured inputs
- [[operations/monitoring]] — feature drift monitoring is a key production concern
