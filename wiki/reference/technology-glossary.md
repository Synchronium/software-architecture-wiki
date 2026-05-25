---
title: "Technology Glossary"
type: reference
tags: [tools, glossary, reference]
sources: [mastering-api-architecture, understanding-distributed-systems, fundamentals-of-software-architecture, foundations-of-scalable-systems, designing-data-intensive-applications, building-event-driven-microservices, monolith-to-microservices, release-it, learning-domain-driven-design, accelerate]
created: 2026-05-13
updated: 2026-05-19
---

# Technology Glossary

Short reference entries for tools mentioned across wiki sources. Each entry covers what the tool is and where it fits architecturally. For conceptual depth see the linked concept or pattern pages.

---

## API Gateways and Proxies

### Kong

Open-source API gateway and API management platform built on NGINX and Lua. Available in two editions: open-source (micro gateway, Kubernetes-native, lightweight) and enterprise (full APIM with developer portal, analytics, and RBAC). Plugin ecosystem for authentication, rate limiting, and transformation. Uses the deck CLI for declarative configuration. (→ [[concepts/api-gateway]])

### Ambassador / Emissary-Ingress

Kubernetes-native API gateway built on Envoy Proxy. Declarative configuration via CRDs. Self-service routing for developer teams. Supports canary routing and gRPC. Developed by Datawire. Part of the second-generation K8s-native gateway category. (→ [[concepts/api-gateway]])

### Traefik

Kubernetes-native reverse proxy and load balancer. Automatic service discovery via Docker and Kubernetes labels. Supports HTTP, TCP, and UDP. Lighter feature set than full API gateways; suited to microservices ingress rather than enterprise API management. (→ [[concepts/api-gateway]])

### Apigee

Google Cloud's enterprise API management platform. Full APIM feature set: developer portal, analytics, monetisation, API versioning governance. Designed for external API programs. Represents the traditional enterprise gateway category. (→ [[concepts/api-gateway]])

### NGINX

Open-source high-performance web server and reverse proxy. Widely used as a software load balancer, HTTP cache, and TLS termination point. Commonly used as the underlying HTTP engine for other tools (Kong, OpenResty). Emerged in the early 2000s as an alternative to hardware load balancers.

### HAProxy

Open-source TCP/HTTP load balancer and proxy. Extremely high performance; commonly used as a front-end load balancer. Not an API gateway — lacks application-layer features. Emerged alongside NGINX as a software alternative to hardware load balancers.

### Envoy Proxy

High-performance, extensible L4/L7 proxy written in C++. The de facto data-plane proxy for service meshes (Istio, Consul Connect) and second-generation API gateways (Ambassador, Contour). Implements the xDS API — a control-plane protocol that allows dynamic configuration without restarts. Supports HTTP/2, gRPC, and advanced traffic management features. (→ [[patterns/sidecar-service-mesh]])

---

## Service Meshes

### Istio

Full-featured service mesh built on Envoy. Provides traffic management, mTLS, RBAC, and observability. Control plane components: Pilot (service discovery and routing), Citadel (certificate management), Galley (configuration validation). Historically complex to operate; simplified with the istiod merged control plane. Industry standard for enterprise Kubernetes deployments. (→ [[patterns/sidecar-service-mesh]])

### Linkerd

Lightweight, security-focused service mesh. Uses a Rust-based micro-proxy (not Envoy) for low overhead. Simpler operational model than Istio; fewer features but significantly lower complexity. CNCF graduated project. Good choice when operational simplicity is a priority. (→ [[patterns/sidecar-service-mesh]])

### Consul Connect

HashiCorp's service mesh capability within Consul. Uses Envoy as the data-plane proxy. Consul Intentions define service-to-service authorisation by service name (deny-all default + explicit allow rules). Integrates with HashiCorp Vault for certificate management. Works in hybrid cloud and bare-metal environments, not just Kubernetes. (→ [[patterns/sidecar-service-mesh]])

### Cilium

eBPF-based networking, observability, and security for Kubernetes. Uses Linux kernel eBPF to enforce network policies at the kernel level — potentially replacing the sidecar proxy for lower-overhead networking. Supports network policies, L7 visibility, and transparent encryption. Represents the emerging eBPF-based alternative to sidecar meshes. (→ [[patterns/sidecar-service-mesh]])

---

## Identity and Security

### SPIFFE / SPIRE

**SPIFFE** (Secure Production Identity Framework for Everyone): a standard for workload identity. Defines the SVID (SPIFFE Verifiable Identity Document) — a cryptographic identity for a workload, independent of network address.

**SPIRE** (SPIFFE Runtime Environment): the reference implementation. Issues SVIDs to workloads after attesting their identity via node and workload attestors. Service meshes use SPIFFE/SPIRE as the identity foundation for mTLS. (→ [[concepts/zero-trust]])

### OPA (Open Policy Agent)

General-purpose policy engine. Policies are written in the Rego language. Can enforce authorisation policies at the API gateway (input validation, scope checks), Kubernetes admission (prevent insecure pod configurations), and within service code. Part of the CNCF ecosystem. Complements service mesh service-to-service authorisation with fine-grained attribute-based access control. (→ [[concepts/oauth2-and-authn]])

### Keycloak

Open-source Identity Provider and Authorization Server. Implements OAuth2, OIDC, and SAML 2.0. Supports user federation (LDAP, Active Directory), social login, and multi-tenancy. Common choice for self-hosted enterprise identity. (→ [[concepts/oauth2-and-authn]])

---

## Testing

### Pact

Consumer-driven contract testing framework. Consumers write Pact tests that define the interactions they need from a producer; the Pact library generates a pact file (a JSON contract). The producer verifies against the pact file in its own test suite. Supports multiple languages. The de facto CDC tool for internal service-to-service API testing. (→ [[concepts/api-testing]])

### Pact Broker

Centralised store for pact files. Producers and consumers publish and fetch pact files via the Pact Broker API. Supports versioning, tagging (e.g., `production`), and can-i-deploy checks (verify no consumer will be broken by a proposed producer change). PactFlow is the managed SaaS version. (→ [[concepts/api-testing]])

### WireMock

HTTP stub server. Records real API responses or hand-configures stub responses; replays them in tests. Used in integration and component testing to simulate downstream dependencies without running real services. Can be run as a Docker container in CI. (→ [[concepts/api-testing]])

### Testcontainers

Library for running Docker containers in JUnit (and other test framework) tests. Allows tests to start and stop real database, message broker, or service instances as part of the test lifecycle. Preferred over mock objects when real dependency behaviour matters — avoids mock/prod divergence. (→ [[concepts/api-testing]])

### Gatling / JMeter / Locust / K6

Performance testing tools for load, stress, and soak testing:
- **Gatling**: Scala/Kotlin DSL; high throughput simulation; good CI integration; HTML reports.
- **JMeter**: Java-based GUI; long-established; broad protocol support.
- **Locust**: Python; distributed load generation; user-behaviour scripts.
- **K6**: JavaScript DSL; Grafana-native; developer-friendly; good CI integration.

All require production-like environments to produce meaningful results. Used in Q4 of the test quadrant. (→ [[concepts/api-testing]])

---

## Deployment and Release

### Argo Rollouts

Kubernetes controller for progressive delivery. Implements canary deployments (traffic split by weight) and blue-green deployments natively as Kubernetes CRDs. Integrates with Prometheus, Datadog, and other metric providers for automated analysis — automatically roll back if SLIs degrade during a canary. Complements standard Kubernetes Deployment objects. (→ [[concepts/deployment-pipelines]])

### LaunchDarkly

Managed feature flag platform. SDK available in all major languages. Supports Boolean flags, multivariate flags, user targeting, and percentage rollouts. Audit trail for all flag changes. Used to decouple deployment from release. Risk: flag accumulation creates tech debt; flags should be cleaned up after migration is complete (Knight Capital warning). (→ [[sources/mastering-api-architecture]], [[operations/manageability]])

### AWS AppConfig / Azure App Configuration

Managed dynamic configuration stores. Applications read configuration at runtime rather than only at deploy time, enabling config changes without redeployment. Supports versioning, validation, and gradual deployment of configuration changes. Foundational for feature flags and runtime behaviour control. (→ [[operations/manageability]])

---

## Observability

### OpenTelemetry

CNCF standard for telemetry instrumentation. Provides a unified API and SDK for emitting traces, metrics, and logs in a vendor-agnostic format. Replaces vendor-specific agents (Jaeger client, Zipkin client, etc.). Supported by all major observability backends (Datadog, Honeycomb, Grafana Tempo, Jaeger). The correct default choice for new instrumentation. (→ [[sources/mastering-api-architecture]])

### Prometheus

Open-source metrics collection and storage system. Pull-based: Prometheus scrapes metrics endpoints at a configured interval. PromQL for querying. Pairs with Grafana for dashboards. Standard for Kubernetes metrics. (→ [[sources/mastering-api-architecture]])

### Grafana

Visualisation and dashboarding platform. Multi-datasource: connects to Prometheus, Loki, Tempo, Elasticsearch, and others. Standard for operational dashboards. Grafana Labs also offers managed cloud services for the full LGTM stack (Loki, Grafana, Tempo, Mimir). (→ [[sources/mastering-api-architecture]])

### Jaeger / Zipkin

Distributed tracing backends. Receive spans from instrumented services, store them, and provide a UI for trace search and flame graphs. Both are CNCF projects. OpenTelemetry can export to both; Jaeger is the more actively developed of the two. Grafana Tempo is an increasingly popular alternative. (→ [[sources/mastering-api-architecture]], [[operations/observability]])

### AWS X-Ray

AWS-native distributed tracing service. Instruments requests as they flow through Lambda, EC2, ECS, and other AWS services. Generates a service map from collected traces. Integrates natively with other AWS services without requiring a separate collector deployment. (→ [[operations/observability]])

### ELK Stack

Elasticsearch + Logstash + Kibana. The dominant open-source log aggregation stack. Logstash (or Beats agents) ship logs to Elasticsearch for indexing; Kibana provides search and visualisation. High-dimensionality data store suited to event logs. High operational cost at scale; OpenSearch is a community fork. (→ [[operations/observability]])

### AWS CloudWatch

AWS-native monitoring and observability service. Collects metrics (pre-aggregated at ingestion time), logs (CloudWatch Logs), and supports log-based metrics (deriving a time series from event log counts). Also supports dashboards and alarms. Default telemetry sink for most AWS services. (→ [[operations/monitoring]])

### Datadog

SaaS monitoring and observability platform combining metrics, logs, distributed traces, and APM in a single product. Agent-based collection; supports OpenTelemetry ingestion as an alternative to vendor agents. Integrates with Argo Rollouts for automated canary metric evaluation. Popular enterprise choice for production observability across cloud workloads. (→ [[operations/monitoring]], [[operations/observability]])

---

## Async API Standards

### AsyncAPI

Open specification for describing asynchronous APIs — event-driven, message-based, and streaming interfaces. Fills the same role for async APIs that OpenAPI fills for REST: defines channels, messages, bindings, and schemas in a machine-readable format that enables documentation, code generation, and validation. Supports a broad range of brokers and transports (Kafka, AMQP, MQTT, WebSockets, STOMP). An evolving standard — the primary candidate for standardising the documentation and governance of event-driven architectures. (→ [[concepts/api-design]], [[streams/stream-processing]])

---

## Databases and Data Stores

### Redis / Redis Cluster

In-memory key-value store with optional persistence. **Single-threaded event loop** — all operations are serialised by one thread, avoiding locking overhead; throughput is limited to one CPU core per instance.

**Persistence options**: AOF (Append-Only File — logs every write operation; configurable fsync policy) and RDB snapshots (point-in-time dumps). Trade-off: AOF = durability, RDB = fast recovery.

**Redis Cluster**: horizontal sharding across multiple nodes. 16,384 hash slots divided across nodes. **Gossip protocol** for cluster state propagation. **MOVED redirect** — client queries wrong node → receives MOVED response with correct node address → client caches slot map. **Hash tags** (`{tag}` in key name) force multiple keys to the same hash slot — prerequisite for multi-key atomic operations. Maximum cluster size: 1,000 nodes. Replication is asynchronous by default; `WAIT` command forces synchronous replication to N replicas on demand. Custom election protocol can accept data loss for availability — Redis prioritises read/write availability during partitions.

Redis MULTI/EXEC provides atomic batching but is **not ACID** — no isolation during command queuing, no rollback on command failure. (→ [[distributed/consistency-models]], [[distributed/replication]])

### MongoDB

Document database with BSON/JSON data model and schema-on-read (no enforced schema). Uses WiredTiger storage engine: document-level locking with OCC, write-ahead journaling, and transparent compression.

**ACID transactions**: available since v4.0 for multi-document operations using 2PC + snapshot isolation. Significant overhead vs single-document operations — intended as an escape hatch, not the primary access pattern.

**Sharding**: hash-based (uniform distribution) or range-based (range queries). Unit of movement is a 64MB **chunk**. **Mongos** (query router) routes client requests. **Config servers** (3-node Raft replica set) store cluster metadata. A **balancer** process migrates chunks to achieve even distribution.

**Replication**: Raft-based replica sets. Tunable write concerns (`w:1`, `w:majority`, `w:N`) and read preferences (`primary`, `primaryPreferred`, `secondary`, `nearest`). Causal consistency sessions support read-your-own-writes. Linearizable reads available via `readConcern: linearizable` at high latency cost. (→ [[databases/transactions]], [[distributed/replication]])

### Amazon DynamoDB

AWS-managed NoSQL key-value and document database. Two billing modes: **on-demand** (pay per request) and **provisioned** (pre-allocated RCU/WCU, up to 3,000 RCU / 1,000 WCU per partition).

**Hotkey problem**: each partition enforces a hard cap — popular keys can saturate their partition. Mitigation: random suffix on partition key (write sharding), or **DAX** (DynamoDB Accelerator, in-memory read cache with microsecond latency).

**Global tables**: multi-region active-active replication; last-writer-wins conflict resolution; 99.999% SLA. **ACID transactions** are scoped to a single region — do not span regions. 400KB item size limit.

**Secondary indexes**: **LSI** (Local Secondary Index, must be defined at table creation; shares partition key) and **GSI** (Global Secondary Index, can be added later; separate partition key). **PartiQL** for SQL-compatible queries. (→ [[databases/data-models]], [[distributed/partitioning]])

### Apache Cassandra

Wide-column distributed NoSQL database optimised for write-heavy, high-availability workloads. Uses consistent hashing for data distribution across a peer-to-peer ring — no single leader, any node can serve any request. Tunable consistency: N replicas, W write quorum, R read quorum; `R + W > N` yields strong consistency. Designed to survive node and data-centre failures; multi-region active-active replication is native. Eventually consistent by default; not suited to workloads requiring cross-partition ACID transactions. (→ [[distributed/replication]], [[distributed/partitioning]], [[distributed/consistency-models]])

### Google Spanner

Google's globally-distributed relational database providing external consistency — a form of linearizability — across geographic regions. Uses TrueTime, a GPS/atomic-clock API that bounds clock uncertainty, to assign globally ordered commit timestamps without coordination-round-trips. Supports ACID transactions and SQL across shards and regions. Cited as evidence that the CAP theorem's forced tradeoff is not inevitable when clock uncertainty is bounded. (→ [[distributed/distributed-transactions]], [[distributed/consensus-algorithms]])

### CockroachDB

Open-source distributed SQL database inspired by Google Spanner. Uses Raft for per-range replication and multi-version concurrency control (MVCC) for serialisable isolation. Wire-compatible with the PostgreSQL protocol, reducing migration friction. Designed for geo-distribution and survivability; provides linearisable transactions without requiring specialised hardware. (→ [[distributed/distributed-transactions]])

### Flyway / Liquibase

Database schema migration tools that version-control schema changes and apply them in order:

- **Flyway**: SQL-first; migrations are versioned SQL files (e.g., `V2__add_column.sql`); schema history tracked in a metadata table. Simple and widely adopted.
- **Liquibase**: XML/YAML/JSON changesets with database-agnostic syntax; supports rollback specifications per changeset.

Both implement the expand/contract migration pattern for zero-downtime schema changes: the expansion migration adds new structures while keeping old ones; the contraction migration removes deprecated structures after all consumers have migrated. (→ [[concepts/evolutionary-database-design]], [[concepts/deployment-pipelines]])

---

## API Design

### OpenAPI / Swagger

OpenAPI Specification (OAS) is the standard format for describing REST APIs (JSON/YAML). Swagger is the original tool ecosystem around OAS (SwaggerUI, SwaggerEditor, code generators). Core tooling:
- **Swagger UI / Redoc**: render OAS as interactive documentation
- **openapi-generator**: generate client SDKs and server stubs from OAS
- **openapi-diff**: compare two OAS files and classify changes as breaking or backward-compatible; used in CI to prevent accidental breaking changes
(→ [[concepts/api-design]])

### grpc-gateway

Reverse-proxy plugin for gRPC services that automatically generates a RESTful HTTP API from a gRPC `.proto` definition. Allows a single service to be exposed as both gRPC (for internal high-performance consumers) and REST (for external consumers). Annotation-based: REST routes are defined in the `.proto` file using Google API annotations. (→ [[concepts/api-design]])

---

## Code Quality and Governance

### GitHub Scientist

Ruby framework for holistic, continual fitness function–driven refactoring. Wraps old and new code paths in a `science` block: the old path (control) always determines the return value; the new path (candidate) runs at a configurable percentage of requests, with its result compared out-of-band and divergences logged. Randomises execution order to prevent order-dependent false positives. Used by GitHub to safely replace their shell-script Git merge implementation with libgit2 — running 1% of production merges through the new path for 4 days until zero divergences were observed for 24 hours. The pattern generalises to any language. (→ [[concepts/fitness-functions]])

### ArchUnit

Java library for writing unit tests against the architecture. Verifies layer rules, package dependencies, annotation usage, and naming conventions as JUnit tests. Runs in CI; fails the build on violation. Example: enforce that classes in `web` package do not import from `persistence`. (→ [[concepts/fitness-functions]])

### JDepend

Java tool for measuring package-level dependency quality. Detects cyclic dependencies between packages. Lower abstraction, higher instability packages are architectural risk. Older tool; largely superseded by ArchUnit for rule enforcement but still useful for metrics. (→ [[concepts/fitness-functions]])

### SonarQube

Code quality and security scanning platform. Tracks code smells, bugs, vulnerabilities, coverage, and duplication across codebases. Quality gates can block merges or deployments when thresholds are breached. Supports most major languages. (→ [[concepts/fitness-functions]])

### Context Mapper

Open-source DSL and tooling for Domain-Driven Design modelling. Bounded contexts, context maps, and integration patterns (Partnership, ACL, OHS, Conformist, Shared Kernel, Separate Ways) are defined in a structured `.cml` file that can be version-controlled alongside code. Generates PlantUML context map diagrams, service contracts, and Microservices DSL output from the same model. The recommended tool for maintaining a living context map. (→ [[patterns/context-map]], [[concepts/bounded-contexts]])

---

## Message Brokers and Streaming

### Apache Kafka

Distributed log-based event streaming platform. Messages are organised into topics, partitioned for parallelism, and retained for a configurable duration — enabling consumer replay. Consumers track their own offset within a partition, decoupling producer and consumer throughput. Provides at-least-once delivery by default; exactly-once processing is achievable with idempotent producers and transactional APIs. The dominant platform for event-driven microservices and stream processing pipelines. (→ [[streams/stream-processing]], [[concepts/messaging]])

### Kafka Streams

Client library for building stateful stream processing applications on top of Kafka. Processing topology is defined as a DAG of source, processor, and sink nodes. State stores (backed by RocksDB, changelog-replicated to Kafka for fault tolerance) enable stateful joins and aggregations. Runs inside the application process — no separate cluster required. Well-suited to stream processing that is tightly coupled to a single Kafka deployment. (→ [[streams/stream-processing]], [[patterns/context-map]])

### Apache Flink

Distributed stateful stream processing framework for bounded (batch) and unbounded (streaming) data. Provides exactly-once processing via distributed snapshots using the Chandy–Lamport algorithm. Better suited than Kafka Streams for complex multi-source joins, event-time windowing at scale, and workloads that span multiple data sources. Widely used for data pipeline and CEP (complex event processing) workloads. (→ [[streams/stream-processing]])

### Apache Spark

Distributed computing framework for large-scale batch processing. Builds a DAG of transformations applied lazily to resilient distributed datasets (RDDs) or DataFrames; in-memory execution avoids the repeated disk I/O of MapReduce. Also supports stream processing via Structured Streaming. The dominant batch processing framework for data engineering workloads. (→ [[streams/batch-processing]])

### RabbitMQ

Open-source message broker implementing AMQP (Advanced Message Queuing Protocol). Routes messages via exchanges (direct, fanout, topic, headers) to queues, supporting point-to-point, publish/subscribe, and content-based routing patterns. Supports consumer acknowledgements, message persistence, dead-letter exchanges, and quorum queues (Raft-based replication for durability). A traditional MOM: messages are consumed and deleted, unlike Kafka's log-based retention model. (→ [[concepts/messaging]])

### Debezium

Open-source change data capture (CDC) platform. Reads the database transaction log directly (binlog for MySQL, WAL for PostgreSQL, redo log for Oracle) and emits each row-level change as an event to Kafka. Enables data liberation: downstream consumers receive a real-time stream of changes without polling the database. The primary CDC mechanism for implementing the outbox pattern and for publishing data products in a data mesh. (→ [[patterns/outbox-pattern]], [[streams/event-sourcing-cqrs]], [[concepts/data-mesh]])

### Confluent Schema Registry

Central schema management service for Kafka event streams. Producers register Avro, Protobuf, or JSON Schema definitions before publishing; schemas are stored by subject (topic name) and version. Consumers fetch the schema at read time using a schema ID embedded in the message header. Enforces compatibility rules (backward, forward, full) on registration, preventing incompatible schema evolution from reaching consumers. The canonical governance mechanism for event contract management in Kafka ecosystems. (→ [[databases/encoding-and-evolution]], [[concepts/contracts]])

---

## Infrastructure and Orchestration

### Docker

Container runtime and image format. Packages an application with its dependencies into an immutable, layered image that runs in an isolated process namespace on the host kernel. Provides environment reproducibility and is the standard packaging unit for cloud-native deployments. The Dockerfile is the build specification; images are content-addressed and stored in registries. (→ [[concepts/deployment-pipelines]])

### Kubernetes

Container orchestration platform. Schedules containerised workloads across a cluster of nodes; manages service discovery, load balancing, rolling deployments, autoscaling, and storage. The control plane (API server, scheduler, controller manager, etcd) is separated from the data plane (kubelet, kube-proxy on worker nodes). The de facto infrastructure platform for microservices and cloud-native architectures. (→ [[styles/microservices-architecture]], [[patterns/sidecar-service-mesh]])

### Terraform / Pulumi

Infrastructure-as-code tools for declaring and provisioning cloud and on-premises resources:

- **Terraform** (HashiCorp): declarative HCL-based DSL; plan/apply lifecycle with a drift-detection plan step before any change is applied; state stored in a backend (S3, Terraform Cloud, etc.); broad provider ecosystem across all major clouds.
- **Pulumi**: uses general-purpose programming languages (TypeScript, Python, Go, C#) for infrastructure definition, enabling loops, abstractions, and testing; same declarative semantics under the hood.

Both enable infrastructure changes to be reviewed, version-controlled, and promoted through the same pipeline as application code. (→ [[concepts/deployment-pipelines]])

### Chef / Puppet / Ansible

Mutable configuration management tools for applying and maintaining server state:

- **Chef**: Ruby DSL; recipes and cookbooks applied by a chef-client agent; client/server architecture.
- **Puppet**: Puppet DSL; declarative model; agent/master architecture with periodic convergence.
- **Ansible**: YAML playbooks; agentless (SSH-based); procedural execution order.

All three produce mutable infrastructure — machines are patched in place, accumulating configuration history that is difficult to reproduce. This limitation motivates the immutable infrastructure approach (containers + IaC), where machines are replaced rather than modified. (→ [[concepts/deployment-pipelines]])

### AWS Lambda

AWS's serverless compute service. Functions are deployed as code packages and invoked by events (API Gateway, SQS, SNS, S3, DynamoDB Streams, etc.); AWS manages all provisioning and scaling. Instances are frozen after execution and thawed on reuse; cold starts occur when no warm instance is available. Provisioned concurrency pre-warms instances at additional cost. Reserved concurrency caps the maximum simultaneous executions, protecting downstream dependencies from overload. (→ [[distributed/serverless]])

---

## Coordination Services

### Apache ZooKeeper

Distributed coordination service providing distributed locks, leader election, configuration distribution, and group membership via a hierarchical namespace of znodes. Implements Zab (ZooKeeper Atomic Broadcast) — a Paxos variant — for consensus. Widely used as the coordination backbone for distributed systems: Kafka used ZooKeeper for its controller until the KRaft protocol replaced it. Largely superseded by etcd in Kubernetes-native ecosystems. (→ [[distributed/consensus-algorithms]], [[distributed/leader-election]])

### etcd

Strongly consistent, distributed key-value store implementing the Raft consensus algorithm. The backing store for Kubernetes cluster state (all API objects and configuration). Also used as a service registry, distributed lock provider, and feature flag store. Provides linearisable reads by default; supports range queries over keys. Written in Go; part of the CNCF ecosystem. (→ [[distributed/consensus-algorithms]], [[distributed/leader-election]])

---

## Serialization Formats

### Protocol Buffers (Protobuf)

Google's binary serialization format and interface definition language. Schemas are defined in `.proto` files; code is generated for multiple languages. More compact and faster to parse than JSON or XML. Requires the schema to decode (not self-describing). gRPC uses Protobuf as its default wire format. Forward and backward compatibility is maintained via field numbers — adding new fields with new numbers is safe; never reuse or remove field numbers. (→ [[databases/encoding-and-evolution]], [[concepts/contracts]])

### Apache Avro

Binary serialization format with first-class schema evolution support. Unlike Protobuf, Avro encodes no field tags in the binary data — the writer's schema (or its ID in a schema registry) must accompany the data to enable decoding, making schema management explicit. Schemas are defined in JSON. The preferred serialization format for Kafka event streams because of native Confluent Schema Registry integration and compact binary encoding. (→ [[databases/encoding-and-evolution]], [[concepts/contracts]])

### Apache Thrift

Facebook's binary serialization format and RPC framework. Similar to Protobuf: a Thrift IDL (`.thrift` files) generates code for multiple languages; field-number-based binary encoding enables forward/backward compatibility. Includes an RPC transport layer (unlike the core Protobuf library). Predates gRPC; less commonly chosen for new systems but still widely deployed in older distributed architectures. (→ [[databases/encoding-and-evolution]])
