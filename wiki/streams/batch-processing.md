---
title: "Batch Processing"
type: stream
tags: [batch, mapreduce, data-processing, etl, distributed-systems, databases]
sources: [designing-data-intensive-applications, site-reliability-engineering]
created: 2026-05-13
updated: 2026-05-27
---

# Batch Processing

Batch processing takes a bounded, immutable input dataset and produces a new output dataset. Unlike online systems (which process requests in milliseconds) or stream processors (which handle unbounded event streams with low latency), batch jobs are distinguished by three properties: **offline execution** (latency of minutes to hours is acceptable), **bounded input** (a defined dataset to process in full), and **immutable inputs** (the source data is never modified). Immutability is the key insight: it enables retry, replay, and rollback without the careful ordering constraints of stateful online systems.

## Unix Philosophy as Template

The Unix command-line tools model the principles that batch processing frameworks formalise at scale:

1. **Each program does one thing well** — composable, focused tools.
2. **Output of one program becomes input of another** — stdin/stdout as universal interface.
3. **Immutable inputs** — programs read from files, write to files, never modify inputs.
4. **Transparency** — intermediate state can be inspected at any pipeline stage.

```bash
cat access.log | grep "GET /api" | awk '{print $7}' | sort | uniq -c | sort -rn | head -20
```

This pattern — map, filter, reduce, sort — is exactly what MapReduce formalises.

## MapReduce

MapReduce (Google, 2004) is the foundational batch processing model. A MapReduce job has two phases:

### Map Phase
The **mapper** function is called once per input record. It emits zero or more **(key, value)** pairs.

```
input record → mapper → (k₁, v₁), (k₂, v₂), ...
```

Example: for a word count job, the mapper emits `(word, 1)` for each word.

### Shuffle and Sort
The framework **shuffles** (partitions and copies) mapper output to reducers, partitioned by key hash. Within each reducer's input, records are **sorted** by key. This is the most expensive phase (network-intensive).

**Mapper output is always sorted before reaching the reducer** — this is a guarantee of the MapReduce model.

### Reduce Phase
The **reducer** function receives each key and the list of all values for that key. It produces output records.

```
(k, [v₁, v₂, v₃, ...]) → reducer → output records
```

Example: for word count, the reducer sums the list of 1s and emits `(word, total_count)`.

### Fault Tolerance
If a mapper or reducer task fails, it is retried on another node. Since mappers and reducers are pure functions with immutable inputs, retry is safe. MapReduce was designed for Google's preemptable low-priority infrastructure (~5% task termination risk per hour; a 100-task job has >50% chance of at least one failure).

## Joins in MapReduce

### Sort-Merge Join (Reduce-Side)

Both input datasets are keyed by the join key and processed through the shuffle. All records for a given join key arrive at the same reducer, sorted — the reducer can emit joined records.

**Properties**: scales to arbitrarily large inputs; requires both inputs to be partitioned and sorted; expensive (full shuffle of both sides).

### Broadcast Hash Join (Map-Side)

When one input is small enough to fit in memory, load it as a hash table and distribute it to every mapper. Each mapper looks up the hash table for each record — no shuffle required.

**Properties**: extremely fast (no reduce phase or shuffle); limited to small-large join scenarios.

### Partitioned Hash Join (Map-Side)

If both inputs are **partitioned the same way** (same number of partitions, same hash function on the join key), each mapper handles one partition. The small side of each partition pair is loaded into memory as a hash table.

**Properties**: map-side join with larger datasets; requires careful partition alignment at input preparation time.

### Hot Key Handling

If a small number of keys receive a disproportionate share of values (e.g., a celebrity user in a social network join), those keys produce enormous reducer inputs — a **data skew** problem. Mitigations:
- **Skewed join** (Pig): sample the input to detect hot keys; split hot keys across multiple reducers with a random suffix; two-stage aggregation.
- **Sharded join**: replicate the small side partitioned by hot-key hash.

## Batch Job Output Philosophy

Batch jobs should produce output as immutable files — they never write to an existing production database mid-job. Benefits:
- **Human fault tolerance**: if the output is wrong, delete it and rerun. No partial-update state to reason about.
- **Rollback**: deploy new code and rerun from the same input.
- **Retry safety**: deterministic job + immutable input = identical output on retry.

Common batch outputs:
- **Search indexes**: Lucene segment files written by batch job, then swapped atomically into the search cluster.
- **Key-value stores**: Voldemort, Terrapin, ElephantDB, HBase bulk load — build the SSTable offline, then bulk-import.

This is the batch equivalent of [[concepts/evolutionary-architecture]]'s "deploy ≠ release" principle.

## Hadoop vs MPP Databases

| Property | Hadoop / MapReduce | MPP Databases (Teradata, Redshift) |
|----------|-------------------|-------------------------------------|
| Data model | Schema-on-read (interpret at query time) | Schema-on-write (validate at load time) |
| Query language | Arbitrary code (Java, Python, SQL via Hive/Pig) | SQL primarily |
| Fault tolerance | Task-level retry (cheap, fine-grained) | Query-level abort (retry expensive query) |
| Flexibility | Raw files — any format | Structured tables only |
| Cost model | Cheap commodity nodes; storage separate | Expensive nodes; storage and compute coupled |
| Use case | Data lake (dump first, structure later) | Structured analytics |

Hadoop's key insight: decouple storage (HDFS) from computation (MapReduce). Store everything cheaply; interpret structure at query time. MPP databases require knowing the schema at load time but execute SQL queries more efficiently.

## Dataflow Engines

MapReduce has significant inefficiencies for complex workflows:
- Intermediate results are materialized to HDFS between every stage.
- The sort before every reducer is not always needed.
- Starting a new JVM per task is slow.

**Dataflow engines** (Spark, Flink, Apache Tez) handle the whole workflow as a single job:
- **Operators**: not constrained to map/reduce; join, aggregate, filter, sort as first-class operators.
- **Pipelining**: pass output of one operator directly to the next without materializing to disk.
- **Avoid unnecessary sorting**: sort only when required by the operator (e.g., group-by with aggregate).
- **Reuse JVM**: long-running worker processes; task scheduling overhead is much lower.
- **Memory optimisation**: spill to disk only when memory is exhausted.

**Fault tolerance**:
- **Spark RDD lineage**: recompute lost partitions from the immutable lineage graph. Fine-grained lineage means only the lost partition is recomputed.
- **Flink checkpointing**: periodic consistent snapshots injected via barrier messages into the data stream; roll back to last checkpoint on failure.

**Performance vs MapReduce**: typically 10–100× faster for iterative algorithms (machine learning) and complex multi-stage workflows.

## Graph Processing: Pregel / BSP

Graph algorithms (PageRank, shortest path, connected components) require iterative computation across vertices and edges — poorly suited to standard MapReduce.

**Bulk Synchronous Parallel (BSP) model** (Valiant, 1990), implemented in:
- Google Pregel
- Apache Giraph
- Spark GraphX
- Flink Gelly

**Execution model**:
1. Each vertex has a state and can send messages along outgoing edges.
2. Per **superstep**: each vertex receives all messages from the previous superstep, updates its state, and sends new messages.
3. Repeat until no more messages are sent (convergence) or a fixed number of supersteps.
4. **Vertices remember state between supersteps** — no need to re-read the full graph per iteration.

**Fault tolerance**: periodic checkpointing; roll back all vertices to last checkpoint on failure.

## Operational Failure Patterns in Periodic Pipelines

Well-tuned periodic pipelines are stable. Under organic growth, several failure modes emerge. (→ [[sources/site-reliability-engineering]] ch. 25)

**Hanging chunk problem**: "embarrassingly parallel" workloads partition input into chunks. When a chunk requires disproportionate resources (e.g., a very large customer in a customer-partitioned workload), the pipeline is blocked on the worst-case chunk. Because most periodic pipelines lack checkpointing, the naive fix — kill and restart — discards all completed work.

**Thundering herd in batch scheduling**: a large periodic pipeline starts thousands of workers simultaneously. Misconfigured retry logic compounds the problem: failed workers retry immediately, multiplying load on cluster services. Adding more workers (the intuitive response) makes it worse, not better.

**Moiré load pattern**: two or more pipelines with similar intervals whose execution windows occasionally overlap, causing simultaneous resource spikes on shared infrastructure. Observable as interference patterns in resource usage graphs. Difficult to diagnose because no single pipeline looks problematic in isolation.

**Monitoring gap**: periodic pipelines typically emit metrics only on completion. If the job fails mid-run, no telemetry is produced. Real-time operational visibility requires either continuous pipelines or explicit mid-job instrumentation.

**Minimum effective interval**: reducing the scheduling interval below the job's execution time causes jobs to queue or overlap, rather than producing more progress. The minimum effective interval is bounded by (job execution time + scheduling delay).

**Recommendation**: if a pipeline needs to run more frequently than its execution time, or if data processing needs to be continuous, a continuously running pipeline architecture (like Kafka Streams, Flink, or a leader-follower system with leases) will be more reliable than a faster periodic schedule.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Definitive treatment — derives batch processing from Unix philosophy, mechanistic MapReduce explanation, join algorithms, Hadoop vs MPP analysis, dataflow engines, Pregel (ch. 10) |
| [[sources/site-reliability-engineering]] | Operational failure modes of periodic pipelines at scale: hanging chunks, thundering herd, Moiré load pattern, monitoring gap, minimum effective interval. Advocates for continuous pipeline systems when frequency requirements push against job execution time. (ch. 25) |

## Related Concepts

- [[streams/stream-processing]] — the same concepts applied to unbounded event streams; batch is a special case of streaming
- [[streams/event-sourcing-cqrs]] — event log as the batch input source; reprocessing as the batch use case
- [[distributed/partitioning]] — how data is distributed across nodes for parallel processing
- [[concepts/fitness-functions]] — batch jobs can implement holistic, triggered fitness functions
