---
title: "Partitioning"
type: concept
tags: [distributed-systems, partitioning, sharding, scalability, databases]
sources: [designing-data-intensive-applications, understanding-distributed-systems]
created: 2026-05-13
updated: 2026-05-14
---

# Partitioning

Partitioning (also called sharding) divides a large dataset across multiple nodes so that each node holds a subset. The goal is to spread **data volume** and **query load** across nodes so that a single-node bottleneck is avoided. Partitioning is the primary mechanism for achieving horizontal scalability in databases, message brokers, and stream processors.

The challenge is choosing a partitioning scheme that distributes load evenly — a partition that receives a disproportionate share of queries is called a **hot spot**. Avoiding hot spots while still supporting efficient queries is the central tension in partition design.

## Partitioning by Key Range

Assign a contiguous range of keys to each partition (like encyclopaedia volumes: A-C, D-F, ...). Within each partition, keys are kept sorted.

**Advantages**:
- Range queries are efficient — all keys in a range are in one partition.
- Sorted within partition enables sequential reads.

**Disadvantages**:
- Range boundaries must be chosen carefully to distribute load.
- Access patterns can create hot spots: if the key is a timestamp and all writes are to "today," all writes go to one partition. Mitigation: prefix the key with something other than the timestamp (e.g., sensor ID + timestamp).

**Used in**: HBase, Bigtable, MongoDB (range sharding), CockroachDB.

## Partitioning by Hash of Key

Apply a hash function to the key and assign each partition a range of hash values (hash ring or bucket range).

**Advantages**:
- Distributes load uniformly (assuming a good hash function and diverse key space).
- Hot spots from key distribution are eliminated.

**Disadvantages**:
- Range queries require hitting all partitions (or a separate range index).
- Hash boundaries must be managed on rebalancing.

> **Anti-pattern**: `hash(key) mod N` is the naive approach and should be avoided. When N changes (a node is added or removed), almost all keys map to a different partition — requiring moving most of the data. Virtual-node consistent hashing or fixed partitions solve this: the mapping of key → partition stays stable; only the mapping of partition → node changes.

### Consistent Hashing

Arrange hash values on a conceptual ring. Each node is responsible for the range from its position to the next node's position (clockwise). On node addition/removal, only the immediately adjacent partition range is affected — not all data is reshuffled.

**Virtual nodes (vnodes)**: each physical node is assigned multiple positions on the ring. This improves load distribution (prevents load concentration when a node takes a large ring segment) and makes data migration smoother when nodes are added/removed.

> **Terminology caution**: Kleppmann notes that "consistent hashing" as used in practice rarely matches the original 1997 paper's definition, which relied on random node positions on the ring that create uneven distribution. Modern systems use Rendezvous hashing, jump hash, or similar. "Consistent hashing" is best avoided as a precise term; prefer "hash partitioning with virtual nodes." (→ [[sources/designing-data-intensive-applications]] ch. 6)

Used in: Amazon DynamoDB, Apache Cassandra.

### Jump Hash

A minimal, deterministic hash function that maps a key uniformly to one of N buckets and minimises remapping when N changes. Used in Google's Spanner and various storage systems.

## Compound Keys and Hot Spot Mitigation

A compound key (e.g., `(user_id, timestamp)`) enables partitioning by the first component (user_id) while sorting by the second (timestamp) within that partition. This supports range queries scoped to a user's data while distributing across users.

**Celebrity/heavy-hitter problem**: a small number of keys (celebrity users, viral posts) receive orders of magnitude more traffic than average. Uniform distribution cannot help — all operations on that key go to one partition.

Mitigation: **add a random suffix** to the hot key (e.g., `celebrity_id_7`) to distribute across multiple partitions. Reads must query all suffixed variants and merge — a trade-off of write distribution against read complexity. Two-phase aggregation: distribute writes across N partitions, aggregate results at read time.

## Secondary Indexes and Partitioning

Secondary indexes (indexes on non-primary key fields) interact with partitioning in non-obvious ways.

### Local Secondary Index (Document-Partitioned)

Each partition maintains its own secondary index, covering only the records in that partition.

- **Writes**: fast — update only the local index of the partition being written to.
- **Reads**: **scatter-gather** — query must be sent to all partitions, each returns its local results, client merges. Expensive for high-fan-out queries.

Used in: MongoDB, Cassandra, Riak, Elasticsearch (default).

### Global Secondary Index (Term-Partitioned)

A global index covers all partitions, but is itself partitioned by the indexed term.

- **Reads**: efficient — query only the partition(s) of the global index relevant to the search term.
- **Writes**: expensive — writing a record may require updating the global index in multiple partitions. Usually **asynchronous** — there is a lag between writing a record and the global index reflecting it.

Used in: DynamoDB (Global Secondary Indexes), Spanner, Cassandra (secondary indexes with `ALLOW FILTERING` disabled).

## Rebalancing Strategies

As load grows or nodes are added/removed, partitions must be moved between nodes.

### Fixed Number of Partitions

Create many more partitions than nodes at the start (e.g., 1000 partitions for 10 nodes → 100 per node). When a node is added, move some partitions to it. Entire partitions are moved — no splitting needed. Typical: ~1000 partitions for a 10-node cluster in Riak and Elasticsearch.

- Simple operationally.
- Initial partition count must be chosen carefully — too few limits future scaling; too many increases overhead (each partition needs metadata, state tracking).

Used in: Elasticsearch, Couchbase, Riak, Apache Kafka.

### Dynamic Partitioning

Partitions split when they exceed a size threshold (HBase default: 10GB; MongoDB default configurable); merge when they fall below a minimum. Number of partitions adapts to data volume.

- Good for variable workloads and unknown data sizes.
- Risk: all data starts in one partition on an empty database — pre-splitting may be needed to avoid a write hot spot at startup.

Used in: HBase, MongoDB.

### Proportional to Nodes (Cassandra)

Fixed number of partitions **per node** (Cassandra default: 256 per node). When a node is added, it randomly splits existing partitions and takes half the data. New partitions are created proportionally to cluster size.

- Natural scaling: adding more nodes automatically creates more partitions.
- Partition size stays roughly constant as the cluster grows.
- Random split boundaries may create unequal partition sizes.

Used in: Cassandra (Murmur3 partitioner with virtual nodes).

### Fully Automatic Rebalancing: A Risk

Fully automatic rebalancing (no human approval) can interact dangerously with failure detection. If a node is slow (e.g., overloaded), other nodes may declare it dead and initiate rebalancing — which moves load to remaining nodes, which then become overloaded, which triggers more rebalancing. This cascading failure can bring down a healthy cluster. A human approval step for rebalancing (or at least rate limiting) is important in production. (→ [[sources/designing-data-intensive-applications]] ch. 6)

## Request Routing

When a client sends a request, which node handles it? Three options:

1. **Round-robin with forwarding**: any node accepts the request; if it doesn't own the data, it forwards to the correct node. Simple for clients; adds a network hop.

2. **Routing tier / load balancer**: a dedicated routing layer knows the partition-to-node mapping and directs requests. Kafka's clients use this model with ZooKeeper providing the mapping.

3. **Client-side routing**: the client knows the partition-to-node mapping and contacts the correct node directly. Requires clients to track cluster membership — stale routing information causes errors.

**Coordination services** (ZooKeeper, etcd) are commonly used to store partition-to-node mappings. Nodes register themselves; routing tiers or clients subscribe to mapping changes. HBase, Kafka, SolrCloud use ZooKeeper for this.

**Gossip protocol** (Cassandra): nodes share cluster state with each other directly, without a central coordinator. Less operationally complex but eventual consistency of routing information.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Definitive treatment — partitioning strategies, secondary index designs, rebalancing approaches, and request routing with real system examples (ch. 6) |
| [[sources/understanding-distributed-systems]] | Covers range and hash partitioning, consistent hashing (ring model with K/N reshuffling), static vs dynamic partitioning, gateway + coordination service (etcd/ZK) for request routing; emphasises cross-partition complexity costs (aggregations, distributed transactions, hotspots) — "partitioning is not a free lunch" (ch. 16) |

## Related Concepts

- [[distributed/replication]] — partitioning and replication are orthogonal: each partition can be replicated
- [[distributed/consensus-algorithms]] — ZooKeeper is used for partition assignment and membership; consensus underpins consistent routing
- [[databases/storage-engines]] — storage engines are per-partition; partition key determines which node runs which storage engine
- [[streams/stream-processing]] — Kafka partitions are the unit of parallelism for stream consumers
