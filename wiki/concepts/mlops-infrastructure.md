---
title: "MLOps Infrastructure and Tooling"
type: concept
tags: [ai, machine-learning, mlops, infrastructure, feature-store, workflow-orchestration, devops]
sources: [designing-machine-learning-systems]
created: 2026-05-30
updated: 2026-05-30
---

# MLOps Infrastructure and Tooling

## Overview

The infrastructure layer that enables machine learning in production consists of four stacked layers: storage and compute, resource management, ML platform, and development environment. Understanding this stack is essential for designing maintainable, scalable ML systems. (→ [[sources/designing-machine-learning-systems]] ch. 10)

## The Four Infrastructure Layers

```
┌─────────────────────────────────────┐
│      Development Environment        │  Notebooks, IDE, Docker, cloud dev envs
├─────────────────────────────────────┤
│           ML Platform               │  Model store, feature store, model deployment
├─────────────────────────────────────┤
│       Resource Management           │  Workflow orchestration, schedulers, Kubernetes
├─────────────────────────────────────┤
│       Storage and Compute           │  Cloud/on-prem, object storage, databases
└─────────────────────────────────────┘
```

## Storage and Compute

### Cloud vs On-Premises

The cloud-first default of the 2010s is being revisited. **Cloud repatriation** is accelerating:
- Dropbox saved $75M by moving off AWS
- a16z estimated that cloud margins cost publicly traded companies over $100B in market capitalisation
- Per-unit cloud costs are significantly higher than owned hardware at scale; the flexibility premium diminishes as workloads stabilise

**Multi-cloud** is now the dominant strategy: 81% of enterprises use two or more cloud providers. Drivers: avoid lock-in, optimise cost per workload, satisfy data residency requirements.

The build-vs-buy calculation on cloud vs on-prem depends on scale, workload predictability, and operational capability. Startups default to cloud; mature companies with stable, large ML workloads often repatriate selectively.

## Development Environment

### Standardisation

Dev environment divergence is a major source of "works on my machine" failures. Standardising the dev environment across the team prevents: dependency conflicts, hardware-specific behaviour, reproducibility failures.

**Jupyter notebooks:** dominant for exploration and experimentation. Key weaknesses:
- *Non-linear execution:* cells can be executed out of order; state accumulates in unpredictable ways
- *Non-reproducible:* running cells in a different order yields different results
- *Poor version control:* notebooks store output alongside code; diffs are noisy
- *No unit testing:* notebook code is harder to test than module code

Cloud-based dev environments (GitHub Codespaces, Deepnote, Google Colab) standardise the environment but introduce latency and internet dependency.

**Docker** solves environment reproducibility for deployment:
- Dockerfile → Docker image → container
- Images are versioned and shareable; the environment is part of the artifact
- Kubernetes orchestrates containers at scale; co-locates training jobs with data, handles restarts and resource allocation

## Resource Management and Workflow Orchestration

### From Cron to Orchestrators

ML pipelines are DAGs of interdependent steps (data ingestion → feature computation → training → evaluation → deployment). Managing these requires more than cron:

| Tool | Paradigm | Strengths | Weaknesses |
|------|----------|-----------|------------|
| **Cron** | Time-based scheduling | Simple | No dependency management, no retries, no visibility |
| **Airflow** | DAG-based orchestration | Mature, large ecosystem | Monolithic; static DAGs (not parameterised); everything in one cluster |
| **Argo** | Kubernetes-native DAG | Per-step containers; YAML; K8s native | K8s only; verbose YAML |
| **Prefect** | Modern DAG | Parameterised; dynamic DAGs; Python-native | Younger ecosystem |
| **Metaflow** | ML-specific | Best developer UX; `@conda` and `@batch` decorators for seamless dev→prod; designed for ML workflows | Netflix-centric lineage |

Metaflow (Netflix open-source) is notable for closing the dev-to-production gap: the same code runs locally with `@conda` environment isolation and in AWS Batch with the `@batch` decorator — no separate pipeline specification required.

## ML Platform

The ML platform layer provides shared services so individual teams don't reinvent deployment, experiment tracking, and feature management.

### Model Deployment

Options range from cloud-managed to self-hosted:
- **Cloud-managed:** SageMaker (AWS), Vertex AI (GCP) — opinionated, low ops overhead, vendor lock-in
- **Framework-level:** MLflow Models — framework-agnostic model packaging and serving
- **Inference servers:** Seldon, Ray Serve, TorchServe — more control, more ops

### Model Store

A model store manages ML artifacts beyond just the model weights. Eight artifact types that should be tracked per model version:
1. Model definition (architecture code)
2. Model parameters (weights)
3. Featurise and predict functions
4. Dependencies (library versions, Docker image)
5. Data (pointers to training data versions)
6. Model generation code (training script)
7. Experiment artifacts (metrics, charts, logs)
8. Tags and metadata (use case, owner, deployment status)

MLflow is the most widely adopted open-source model store; cloud providers offer proprietary equivalents (SageMaker Model Registry, Vertex AI Model Registry).

### Feature Store

A feature store is shared infrastructure for managing, computing, and serving features consistently across training and inference. Three core functions:

| Function | Description |
|----------|-------------|
| **Feature management** | Central registry of feature definitions, lineage, documentation, access control |
| **Feature computation** | Batch and streaming pipelines that materialise features on a schedule or on demand |
| **Feature consistency** | Same feature code runs at training time and inference time — eliminates training-serving skew |

The training-serving skew problem (→ [[concepts/model-development]]) is the primary motivation for feature stores. Without one, batch training pipelines and online inference pipelines implement the same feature logic separately — divergence is inevitable.

**Adoption:** approximately 40% of companies use a feature store; roughly half of those build their own. Open-source options include Feast and Tecton (commercial). Large companies (Uber, Airbnb, Twitter) built their own; Uber's Michelangelo is the canonical early example.

Feature store limitations: (1) adding a new abstraction layer increases operational complexity; (2) batch feature computation may not meet latency requirements for real-time features; (3) vendor-specific feature stores introduce lock-in.

## Build vs Buy

The build-vs-buy decision for MLOps tooling depends on three factors:

1. **Company stage:** early-stage companies lack the engineering bandwidth to maintain bespoke infrastructure; buy or use managed services. Later-stage companies with scale and stability can justify building.
2. **Competitive advantage:** build only what differentiates you. Feature stores, model serving infrastructure, and orchestration are generic — rarely worth building from scratch. The ML model and the features are differentiating; the infrastructure is a cost centre.
3. **Tool maturity:** mature tools (Airflow, Kubernetes, Docker) have large ecosystems, established operational patterns, and abundant hiring pools. Novel tools (purpose-built ML platforms) may be more ergonomic but less battle-tested.

> **Open question:** The MLOps tooling landscape is fragmented and changing fast. The tools listed here represent the state of the field around 2022; many have since merged, pivoted, or been replaced by cloud-native equivalents.

## Related Concepts

- [[concepts/continual-learning]] — the automation of retraining pipelines depends on workflow orchestration infrastructure
- [[concepts/ml-systems-design]] — infrastructure sits beneath the ML lifecycle
- [[concepts/model-development]] — experiment tracking and model stores are direct extensions of the experiment tracking workflow
- [[concepts/data-distribution-shifts]] — feature stores help prevent training-serving skew, which is a major source of apparent drift
- [[operations/monitoring]] — observability tooling integrates with the ML platform layer
