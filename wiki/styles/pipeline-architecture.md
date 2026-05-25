---
title: "Pipeline Architecture"
type: style
tags: [monolith, pipeline, etl, technical-partitioning]
sources: [fundamentals-of-software-architecture, enterprise-integration-patterns]
created: 2026-05-13
updated: 2026-05-15
---

# Pipeline Architecture

## Definition

The pipeline architecture organises processing as a sequence of discrete transformation steps (filters) connected by channels (pipes). Data flows unidirectionally through the pipeline; each filter is independent, stateless, and performs one operation on the data before passing it along. (→ [[sources/fundamentals-of-software-architecture]])

Also known as: *filter-and-pipe architecture*, *pipe-and-filter*.

## Topology

```
Producer → [Filter A] → pipe → [Filter B] → pipe → [Filter C] → Consumer
```

**Pipes** are unidirectional channels transporting data between filters. Pipes are typically point-to-point, not broadcast. Data payloads should be kept small for performance.

**Filters** are the processing units. Each filter is **self-contained, independent, and stateless**. Each should perform **one task only**; composite tasks should be a sequence of filters. Four types (→ [[sources/fundamentals-of-software-architecture]]):
- *Producer* (source): originates data, outbound only. E.g., reads from a file, subscribes to a Kafka topic.
- *Transformer*: receives input, optionally transforms some or all of the data, forwards it. Analogous to `map` in functional programming.
- *Tester* (router): accepts input, tests one or more criteria, optionally produces output based on the test. Analogous to `reduce`. Can filter data out of the pipeline or branch it into different downstream paths.
- *Consumer* (sink): terminal step — persists to a database or displays results.

Filters can send output to multiple pipes, enabling fan-out transformations. Composability is the key strength: the same filters can be recombined to build new pipelines.

**The McIlroy principle** (from the blog "More Shell, Less Egg"): Donald Knuth wrote 10+ pages of Pascal to find the N most frequent words in a text. Doug McIlroy solved it in six shell commands (`tr | tr | sort | uniq -c | sort -rn | sed`). The Unix pipe/filter model demonstrates that simple, composable, single-purpose abstractions can outperform complex monolithic implementations in both clarity and conciseness.

**Extensibility via always-advertise** (→ [[sources/fundamentals-of-software-architecture]]): a filter should always emit its output even when no downstream filter currently consumes it. This creates a hook for future filters to plug in without modifying existing ones — a form of open/closed principle at the architecture level.

## When to Use

- ETL (Extract, Transform, Load) processes.
- Data streaming and processing workflows (Apache Kafka consumers, shell-style `|` pipelines).
- Event-driven data transformation (e.g., log parsing, metric aggregation, service telemetry capture).
- Batch jobs where each stage is independently replaceable.
- EDI (Electronic Data Interchange) tools transforming between document types.

Real-world examples: Unix command-line pipelines, Apache Camel EIP routes, Kafka Streams topologies, CI/CD build pipelines. MapReduce programming models follow the same basic topology.

## Architecture Characteristics Ratings

| Characteristic | Rating | Notes |
|----------------|--------|-------|
| Deployability | ★★☆☆☆ | Better than layered (can swap a filter); still usually deployed together |
| Elasticity | ★★☆☆☆ | Individual filters can be parallelised, but topology is fixed |
| Evolutionary | ★★★☆☆ | Adding or replacing filters is relatively safe |
| Fault tolerance | ★☆☆☆☆ | One failed filter stalls the whole pipeline |
| Modularity | ★★★☆☆ | Good — each filter is a clearly bounded unit |
| Overall cost | ★★★★☆ | Low — filters are simple, cheap to implement |
| Performance | ★★☆☆☆ | Sequential processing; bottlenecks accumulate |
| Reliability | ★★★☆☆ | Predictable data flow |
| Scalability | ★★☆☆☆ | Parallel filters help, but the pipeline as a whole still scales as a unit |
| Simplicity | ★★★★☆ | Very easy to understand and reason about |
| Testability | ★★★☆☆ | Each filter is individually testable |

## Trade-offs

**Strengths:**
- Very high modularity at the filter level — each step is independently testable and replaceable.
- Natural fit for data-transformation and streaming workloads.
- Simple mental model: data flows in one direction through discrete steps.

**Weaknesses:**
- Technically partitioned — the pipeline cuts across domain concerns rather than encapsulating them.
- Poor fault tolerance — a single filter failure blocks the entire pipeline (no fallback).
- Asynchronous processing complicates error handling and back-pressure management.
- Not suited to request/response (interactive) workloads.

## Quanta

Single quantum (typically). Pipelines are usually deployed as a single unit, though individual filters can sometimes be independently scaled.

## Partitioning

Technical (pipeline steps correspond to technical transformation roles, not business domains).

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Defines as a distinct style; identifies the four filter types; notes its natural fitness for ETL and streaming |
| [[sources/enterprise-integration-patterns]] | Treats Pipes and Filters as a *composition pattern within messaging systems* rather than a top-level architecture style. Filters are individual message-processing components connected by channels (pipes). Benefits emphasised: testability (inject known inputs via channel), pipeline concurrency (all filters run simultaneously on different messages), and parallel processing (stateless filters scaled via Competing Consumers on a Point-to-Point Channel). Stateful filters (aggregators, deduplicators) cannot be trivially parallelised. |

## Related Pages

- [[styles/event-driven-architecture]] — shares the idea of asynchronous data flow but adds dynamic routing, pub/sub, and independent scalability
- [[comparisons/architecture-styles-comparison]] — side-by-side with all other styles
- [[styles/architecture-styles]] — overview and decision guide for all architecture styles
