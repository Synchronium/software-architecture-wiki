---
title: "Model Development and Offline Evaluation"
type: concept
tags: [ai, machine-learning, model-selection, ensembles, evaluation, calibration, distributed-training]
sources: [designing-machine-learning-systems]
created: 2026-05-30
updated: 2026-05-30
---

# Model Development and Offline Evaluation

## Model Selection

### Six Tips for Choosing Models

1. **Avoid the state-of-the-art trap.** Academic SOTA is evaluated on static datasets, not production constraints. SOTA on benchmarks does not imply SOTA for your task, data, or latency/cost budget.

2. **Start with the simplest model.** Simpler models deploy faster (validating the pipeline end-to-end earlier), are easier to debug, and establish a baseline. Simplest ≠ least effort — pretrained BERT is complex but low-effort to start with, though high-effort to improve upon.

3. **Avoid human bias in model comparison.** An engineer who is more excited about architecture A will spend more time tuning it. Run comparable numbers of experiments for each architecture before concluding one is better.

4. **Evaluate performance now vs. later.** The best model with current data may not be the best model after 10× more data. Use **learning curves** (performance vs. training size) to estimate whether more data will help and which model will benefit most. A simpler model that updates online may outperform a stronger batch model within weeks.

5. **Evaluate trade-offs explicitly.** False positive/negative costs; compute requirements vs accuracy; interpretability vs performance. Make the trade-off explicit, don't treat accuracy as the only metric.

6. **Understand model assumptions.** Common assumptions: IID examples (neural nets), linear decision boundaries (linear classifiers), conditional independence (naïve Bayes), Gaussian distributions (many statistical methods). Violating assumptions silently degrades models without obvious errors.

### Classical ML vs Deep Learning

Classical ML (gradient-boosted trees, collaborative filtering, k-nearest neighbours) remains widely deployed in production — often with better latency, interpretability, and lower data requirements than deep learning. Hybrid ensembles (neural embeddings into logistic regression; k-means clusters as neural network features) are common.

### Four Phases of ML Adoption

1. **Before ML** — establish heuristic baselines; 50% of ML's eventual boost is achievable with simple rules (Zinkevich's rule).
2. **Simplest ML** — logistic regression, GBTs, k-NN; validate the full pipeline quickly.
3. **Optimise simple models** — hyperparameter tuning, feature engineering, ensembles, more data.
4. **Complex models** — push beyond simple model limits when the use case justifies it; also determine retraining cadence requirements.

## Ensembles

An ensemble combines multiple base learners; the final prediction is a vote or average. Ensembles are more complex to deploy but consistently outperform single models: 20 of 22 Kaggle winning solutions (2021) and 20 top SQuAD 2.0 solutions use ensembles.

**Why they work:** uncorrelated base learners compound their individual accuracy. Three 70%-accurate independent classifiers achieve 78.4% ensemble accuracy via majority vote. Correlation is the enemy — use diverse model types (transformer + RNN + GBT) to minimise it.

### Three Ensemble Methods

**Bagging (bootstrap aggregating):** sample with replacement to create multiple training bootstraps; train one model per bootstrap; aggregate by majority vote (classification) or average (regression). Reduces variance; improves unstable models (neural nets, trees); can mildly hurt stable models (k-NN). Random forests are bagging over decision trees.

**Boosting:** sequential ensemble where each learner focuses on examples misclassified by prior learners, via sample reweighting. Converts weak to strong learners. Gradient boosting machines (GBM) and XGBoost/LightGBM are the dominant production implementations.

**Stacking:** train base learners, then train a meta-learner on their outputs. The meta-learner can be as simple as majority vote or a logistic regression.

## Experiment Tracking and Versioning

### What to Track Per Experiment

- Loss curves (train + all eval splits)
- Model metrics (accuracy, F1, perplexity) on non-test splits
- Sample/prediction/label logs for ad hoc debugging
- Training speed (steps/sec, tokens/sec)
- System metrics (memory, CPU/GPU utilisation)
- Hyperparameter values over time (learning rate schedules, gradient norms, weight norms)

### Data Versioning Challenges

Code versioning is standard; data versioning is widely acknowledged but rarely done (Huyen: "like flossing"). Three reasons: (1) data files are too large for diff-based versioning; (2) there is no clear definition of a data "diff"; (3) GDPR may prohibit retaining historical user data. Tools like DVC track checksums rather than diffs.

Reproducibility requires not just versioned code and data but also the environment (hardware, framework versions) — CUDA atomic operations introduce non-determinism across runs.

### Debugging ML Models

Three reasons ML debugging is harder than traditional debugging:
1. **Silent failure** — code compiles, loss decreases, but predictions are wrong.
2. **Slow validation** — bug fixes require retraining, which can take hours.
3. **Cross-functional complexity** — bugs may originate in data, labels, features, algorithms, or infrastructure across different team boundaries.

Three proven techniques:
- **Start simple, add incrementally** — avoids a large surface area of possible bugs.
- **Overfit a single batch** — if the model can't achieve near-perfect loss on 10 examples, the implementation is broken.
- **Set a random seed** — isolates randomness, enables reproducibility of errors.

## Distributed Training

### Data Parallelism

Each worker has a full copy of the model and trains on a subset of data. Gradients are aggregated across workers.

- **Synchronous SGD:** wait for all workers; stragglers slow the whole run. Straggler problem grows with machine count.
- **Asynchronous SGD:** update weights immediately from each worker; risk of gradient staleness. In practice, when gradients are sparse (large models), staleness is less harmful and async converges similarly to sync.

Large batch sizes (GPT-3: batch size 3.2M across machines) require scaled learning rates; increasing past a threshold yields diminishing returns.

### Model Parallelism

Different model components on different machines. Naive sequential layer assignment creates pipeline bubbles (machine 2 waits for machine 1). **Pipeline parallelism** breaks each batch into micro-batches so machines can overlap computation across micro-batches.

Model and data parallelism are complementary — large-scale training typically uses both.

### AutoML

**Soft AutoML (hyperparameter tuning):** search over learning rate, batch size, architecture choices (dropout, hidden units) using random search, grid search, or Bayesian optimisation. Well-tuned weaker models routinely outperform poorly-tuned stronger models (Melis et al. 2018). Never tune hyperparameters on the test split.

**Hard AutoML (Neural Architecture Search):** treat model components as hyperparameters; search over layer types, connections, and operators. Three components: search space, performance estimation strategy, search strategy (RL or evolutionary). EfficientNets (Google AutoML) achieved up to 10× efficiency improvement over manually designed architectures.

**Learned optimisers:** replace hand-designed update rules (Adam, SGD) with neural networks trained to optimise. Training cost is high, but a learned optimiser can generalise across architectures and datasets and can improve itself iteratively.

## Offline Evaluation

### Baselines

Evaluation metrics are meaningless without baselines:

| Baseline | Description |
|----------|-------------|
| **Random baseline** | Performance if model predicts labels at random (uniform or label-distribution-weighted) |
| **Simple heuristic** | Rule-based approach (e.g., chronological ranking) |
| **Zero rule** | Always predict the most common class |
| **Human baseline** | Expert performance on the same task |
| **Existing solutions** | Current system being replaced |

A system that doesn't outperform its most common class on a 90/10 imbalanced task may be no better than random — F1 of 0.90 means nothing without context.

### Evaluation Methods Beyond Accuracy

**Perturbation tests:** introduce controlled noise to test inputs (background noise, image crops, text typos) to measure robustness. The model that performs best on clean data may not be best on noisy production data. High sensitivity to noise also implies susceptibility to adversarial attacks and high maintenance cost as user behaviour shifts.

**Invariance tests:** verify that changes to sensitive attributes (race, gender, name) do not change outputs. Berkeley mortgage study (2008–2015): 1.3M creditworthy Black and Latino applicants rejected; same income/credit with race removed → accepted. Invariance tests are a fairness audit mechanism.

**Directional expectation tests:** verify that monotone changes to inputs produce monotone changes in outputs (e.g., larger lot size should not decrease predicted house price). Violations indicate the model is learning spurious patterns.

**Model calibration:** a calibrated model's predicted probability of X% should match the empirical frequency of X% across many predictions. Critical for ranking and revenue forecasting. Measured by plotting predicted probability vs. empirical frequency (calibration curve). Platt scaling is a standard recalibration method. Nate Silver: "calibration is the single most important test of a forecast."

**Confidence measurement:** system-level metrics measure average performance; confidence provides a per-sample metric. Low-confidence predictions can be routed to humans, discarded, or used to request more input. Essential when the cost of wrong predictions is asymmetric.

**Slice-based evaluation:** evaluate model performance on subgroups of data separately.
- Overall accuracy can hide dramatic disparities between majority and minority subgroups (Model A: 98% majority / 80% minority; Model B: 95% / 95% — aggregate favours A, fairness favours B).
- **Simpson's paradox:** a model can outperform on every subgroup individually but underperform in aggregate, or vice versa. Berkeley 1973 admissions data: men had higher aggregate admission rates, but women had higher rates in 4 of 6 departments.
- Critical slices are discovered via heuristics (domain knowledge), error analysis (patterns in misclassified examples), or automated slice finder algorithms.

## Related Concepts

- [[concepts/dataset-engineering]] — quality of training data directly bounds model ceiling
- [[concepts/feature-engineering]] — features are the interface between data and model
- [[concepts/ml-systems-design]] — model development sits within the broader ML lifecycle
- [[operations/monitoring]] — offline evaluation must be complemented by production monitoring
- [[concepts/ai-evals]] — AI Engineering eval methodology parallels DMLS offline evaluation; both emphasise baselines, calibration, and slice-based analysis
