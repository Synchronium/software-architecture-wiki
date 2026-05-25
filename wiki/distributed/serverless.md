---
title: "Serverless Computing"
type: concept
tags: [cloud, scalability, serverless, functions-as-a-service, aws-lambda, google-app-engine]
sources: [foundations-of-scalable-systems]
created: 2026-05-20
updated: 2026-05-20
---

# Serverless Computing

## Definition

Serverless computing is a cloud execution model in which the provider manages hardware provisioning, operating systems, runtime environments, and autoscaling. Developers deploy code only. Billing is per-invocation (and per millisecond of execution) — there is no cost while code is idle. The name is a misnomer: servers still exist, but they are invisible to the developer.

## Why It Matters

Serverless eliminates the capacity planning problem. Traditional IaaS deployments require sizing for peak load and paying for that capacity continuously. Serverless matches cost to actual usage, which is especially valuable for spiky or unpredictable workloads. The trade-off is reduced control over the execution environment and exposure to vendor-specific APIs.

## Cold Start Problem

When no warm instance exists, the first request must wait for the runtime to initialise — the **cold start**. Cold start latency varies significantly by language:

| Runtime | Typical cold start |
|---------|-------------------|
| Go (compiled) | < 1 second |
| Python, Node.js | ~1 second |
| JVM (Java, Kotlin, Scala) | 1–3 seconds |

Cold starts are most problematic for low-traffic functions where instances are frequently evicted. Mitigations:
- **Provisioned concurrency** (Lambda): keep N instances permanently warm; eliminates cold starts at the cost of a standing charge.
- **Minimum instances** (GAE): prevent the pool from scaling to zero; instances remain warm even at zero traffic.

## Google App Engine Standard Environment

A container-based serverless platform where each function runs in a managed container. Key autoscaling parameters:

| Parameter | Effect |
|-----------|--------|
| `target_cpu_utilization` | Scale-out threshold (default 0.6); lower = more instances |
| `max_concurrent_requests` | Max simultaneous requests per instance |
| `target_throughput_utilization` | Scale-out threshold when max_concurrent_requests is set |
| `max-pending-latency` | Max wait time before a new instance is started |
| `min_instances` / `max_instances` | Bounds on pool size |

## AWS Lambda

Lambda uses a **freeze/thaw** execution model: the execution environment is frozen between invocations and thawed when the next request arrives.

Key operational parameters:

| Parameter | Description |
|-----------|-------------|
| **Provisioned concurrency** | Keep N instances warm; eliminates cold starts |
| **Reserved concurrency** | Cap max concurrent executions for a function; prevents one function consuming the full account limit |
| **Burst limit** | 3,000 initial burst in US West; 1,000 in EU (Frankfurt); 500 in other regions |
| **Scale rate** | +500 new instances per minute after the initial burst |
| **Throttle response** | HTTP 429 when concurrency limit is exceeded |

**Memory-vCPU proportionality**: Lambda allocates CPU proportional to memory. 1,769 MB = 1 vCPU. Code running below this threshold runs on a fractional CPU — CPU-intensive functions often benefit from higher memory allocations even if the memory itself is not needed.

## Parameter Study Methodology

Serverless performance and cost are highly sensitive to autoscaling configuration, and the defaults are rarely optimal. Gorton's recommended approach (→ [[sources/foundations-of-scalable-systems]] ch. 8):

1. Define the configuration space — a combinatorial grid of key parameters (e.g., `target_cpu_utilization` × `max_concurrent_requests`).
2. Run representative load tests for each configuration.
3. Plot throughput vs. cost for each data point.
4. Select the Pareto-optimal configuration for your workload requirements.

**Findings from a 12-configuration GAE case study:**

| Configuration | Relative throughput | Relative cost |
|---------------|-------------------|---------------|
| Default {CPU60, max10} | baseline | baseline |
| {CPU80, max10} | +3% | same |
| {CPU70, max80} | 96% | 55% |

Without this study, the default configuration appears reasonable but leaves significant performance and cost improvements unclaimed.

## Vendor Lock-In

Serverless functions typically use cloud-provider-specific SDKs and runtime conventions (Lambda handler signatures, GAE request context), making migration between providers expensive. Mitigation options:

- **Apache OpenWhisk**: open-source serverless platform deployable on any cloud or on-premises infrastructure.
- **Serverless Framework**: open-source abstraction layer with multi-provider deployment support (AWS, GCP, Azure, and others), though individual functions often retain provider-specific imports.

The lock-in concern is most acute when functions integrate deeply with other provider services (SQS, DynamoDB, Pub/Sub) — decoupling from those requires significant re-architecture.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/foundations-of-scalable-systems]] | Scalability framing: serverless as managed autoscaling; parameter study as the key operational discipline; cold start as a runtime selection concern; vendor lock-in as an architectural risk (ch. 8) |

## Related Concepts

- [[distributed/scalability]] — serverless is one implementation of elastic scale-out; eliminates the capacity reservation problem
- [[distributed/load-balancing]] — elasticity via autoscaling groups is the IaaS equivalent of serverless scale-out
- [[operations/availability]] — serverless platforms manage instance recovery; cold start can degrade availability under low-traffic conditions
- [[operations/monitoring]] — serverless functions require different observability patterns (distributed traces, invocation counts, cold start rate, concurrency)

## Key Quotes

> "In reality, 69% of respondents to a 2021 survey admitted that they routinely overspend their cloud budget by more than 25%." (→ [[sources/foundations-of-scalable-systems]] ch. 8)
