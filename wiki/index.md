---
title: "Wiki Index"
type: index
updated: 2026-05-25

---

# Wiki Index

---

## Overview

- [[overview]] — Evolving synthesis of software architecture as a discipline


## Architecture Styles

- [[styles/architecture-styles]] — Summary and comparison of all 8 styles; decision guide (informed by: fundamentals-of-software-architecture)
- [[styles/event-driven-architecture]] — Broker vs mediator topologies; DDD: three event types (notification, ECST, domain event); private vs public events; distributed big ball of mud anti-pattern; data liberation (informed by: fundamentals-of-software-architecture, building-event-driven-microservices, learning-domain-driven-design)
- [[styles/layered-architecture]] — Technical partitioning; simplest monolith; domain layer isolation as the DDD prerequisite; Smart UI anti-pattern; sinkhole anti-pattern; closed/open layers (informed by: fundamentals-of-software-architecture, software-architecture-patterns, learning-domain-driven-design, domain-driven-design)
- [[styles/ports-and-adapters]] — Hexagonal/onion/clean architecture; DIP-inverted dependencies; business logic at centre; DDD fit: domain model and event-sourced domain model; architectural slices principle (informed by: learning-domain-driven-design)
- [[styles/microkernel-architecture]] — Core system + plug-ins; single quantum; customisability-focused (informed by: fundamentals-of-software-architecture)
- [[styles/microservices-architecture]] — Fine-grained domain services; maximum quanta; highest agility/cost; DDD: deep module heuristic, BC vs microservice relationship, subdomain as safe granularity, OHS/ACL for deeper services (informed by: fundamentals-of-software-architecture, understanding-distributed-systems, learning-domain-driven-design)
- [[styles/pipeline-architecture]] — Filter-and-pipe; technically partitioned; ETL/data processing; EIP treats Pipes and Filters as a messaging composition pattern (informed by: fundamentals-of-software-architecture, enterprise-integration-patterns)
- [[styles/service-based-architecture]] — 4–12 coarse domain services; pragmatic middle ground; supports ACID (informed by: fundamentals-of-software-architecture)
- [[styles/modular-monolith]] — Domain-partitioned single quantum; appropriate coupling via fitness function enforcement; intermediate migration step (informed by: building-evolutionary-architectures)
- [[styles/soa-architecture]] — Orchestration-driven SOA; technically partitioned; legacy enterprise pattern (informed by: fundamentals-of-software-architecture)
- [[styles/space-based-architecture]] — In-memory replicated cache; extreme performance/scalability; high cost (informed by: fundamentals-of-software-architecture)

---

## Concepts

### DDD / Domain Design

- [[concepts/bounded-contexts]] — DDD strategic design: subdomain taxonomy (core/generic/supporting), bounded context definition, subdomains vs bounded contexts, physical/ownership boundaries, sizing heuristic (start wide), subdomain type evolution (all 6 transitions), growth management; Evans' originating treatment: Continuous Integration within context, false cognates vs duplicate concepts, context sizing trade-offs (informed by: domain-driven-design, building-event-driven-microservices, learning-domain-driven-design)
- [[concepts/ubiquitous-language]] — DDD cornerstone practice: shared business language eliminating translation chains; must pervade the code; modeling out loud; documents must track UL or be archived; UML limitations; explanatory models as separate teaching aids (informed by: domain-driven-design, learning-domain-driven-design)
- [[concepts/model-driven-design]] — Evans' binding principle: one model for analysis and design; code is the model's expression; hands-on modellers; bones-showing; requires layered architecture for domain isolation; breakthroughs: non-linear returns, cascade of insights, Share Pie story (informed by: domain-driven-design)
- [[concepts/supple-design]] — Evans' six patterns for design that is easy to work with and extend: Intention-Revealing Interfaces, Side-Effect-Free Functions, Assertions, Conceptual Contours, Standalone Classes, Closure of Operations; declarative style as outcome (informed by: domain-driven-design)
- [[concepts/core-domain]] — strategic distillation: CORE DOMAIN identification, generic subdomains, domain vision statement, highlighted core, cohesive mechanisms, segregated core, abstract core; escalation of distillation techniques (informed by: domain-driven-design)
- [[concepts/large-scale-structure]] — organising principle for entire system; four patterns: System Metaphor, Responsibility Layers (Potential/Operations/Decision Support/Policy/Commitment), Knowledge Level, Pluggable Component Framework; Evolving Order; six essentials for strategic design (informed by: domain-driven-design)
- [[concepts/eventstorming]] — Low-tech collaborative workshop; 10-step process (domain events, commands, policies, aggregates, bounded context candidates); when to use; two-phase facilitation; remote considerations; Rosa: Big Picture EventStorming for domain boundary/KPI mapping + KPI Value Tree; Process Modeling EventStorming for operational value stream analysis (informed by: learning-domain-driven-design, monolith-to-microservices, software-architecture-metrics)
- [[concepts/conways-law]] — Conway's Law; Inverse Conway Maneuver; three organisational structures (Pflaeging); tool choices as communication drivers; unexpected communication as diagnostic signal; organisation design as technical work (informed by: building-evolutionary-architectures, team-topologies)
- [[concepts/continuous-delivery-practices]] — Eight Accelerate-validated CD capabilities; key empirical findings: config-in-VCS more predictive than code, developer-owned tests, trunk-based development, loosely coupled architecture as the single largest CD lever; shift-left security (DevSecOps); lightweight change approval vs CABs; relationship between CD, culture, burnout, and job satisfaction (informed by: accelerate, building-evolutionary-architectures)
- [[concepts/team-topologies-model]] — Four team types (stream-aligned, platform, enabling, complicated-subsystem); three interaction modes with constraints/matrix; Dunbar-based team sizing; team API; one-owner-per-component rule; promise theory / SemVer; organisational sensing; discovery-to-establish pattern; topology evolution triggers; TVP; fractal platforms; Spotify model; DevOps anti-patterns (informed by: team-topologies)
- [[concepts/cognitive-load]] — Sweller's three cognitive load types (intrinsic/extraneous/germane); team cognitive capacity as software boundary constraint; domain complexity heuristics; platform as extraneous load eliminator (informed by: team-topologies)
- [[concepts/fracture-planes]] — Eight types of natural split points for monolith decomposition: business domain (primary), regulatory compliance, change cadence, team location, risk, performance, technology (sparingly), user personas; six forms of monolith; distributed monolith anti-pattern (informed by: team-topologies)
- [[concepts/westrum-culture]] — Ron Westrum's organisational culture typology (pathological/bureaucratic/generative); information flow as core mechanism; Likert measurement with psychometric validation; predicts delivery performance, org performance, job satisfaction; how to improve culture (implement practices first); blameless postmortems; Google Project Aristotle alignment (informed by: accelerate)

### Architecture Practice

- [[concepts/adrs]] — Architecture Decision Records: structure, anti-patterns, compliance governance, Type 1/2 decisions (informed by: fundamentals-of-software-architecture, mastering-api-architecture)
- [[concepts/architect-soft-skills]] — Diagramming, presenting, team leadership (architect personality types, elastic leadership, team warning signs, checklists), negotiation (4 C's, stakeholder/architect/developer tactics), career (20-minute rule, personal technology radar) (informed by: fundamentals-of-software-architecture)
- [[concepts/architectural-decomposition]] — Modularity drivers (availability, scalability, deployability, testability, maintainability); scalability vs elasticity; component-based vs tactical forking; six decomposition patterns; architecture stories (informed by: software-architecture-the-hard-parts)
- [[concepts/architecture-characteristics]] — The "-ilities": taxonomy, selection, measurement, governance (informed by: fundamentals-of-software-architecture)
- [[concepts/architecture-quantum]] — Independently deployable artifact; static/dynamic coupling distinction; quantum count by architecture style; micro-frontends (including EDM pairing); 3D dynamic coupling space → 8 saga types (informed by: fundamentals-of-software-architecture, building-evolutionary-architectures, software-architecture-the-hard-parts, building-event-driven-microservices)
- [[concepts/coupling]] — Coupling taxonomy: structural (Ca/Ce, Martin A/I/D, connascence), operational (Newman's implementation/temporal/deployment/domain types), contract (strict/loose, stamp coupling), integration-style spectrum (File Transfer → Messaging); coupling and quantum boundaries; coordinated deployments as coupling signal; concept leakage and flatten-when-publishing (informed by: fundamentals-of-software-architecture, software-architecture-the-hard-parts, monolith-to-microservices, building-evolutionary-architectures, enterprise-integration-patterns, release-it)
- [[concepts/deployment-pipelines]] — Fitness function automation; stages, fan-in/fan-out; CD vs CDP; cycle time as business metric; zero-downtime deployment (four phases: prepare/drain/apply/start); expand/contract relational schema pattern; trickle-then-batch schemaless migration; canary group evaluation; immutable infrastructure; EDM deployment patterns (informed by: building-evolutionary-architectures, understanding-distributed-systems, mastering-api-architecture, building-event-driven-microservices, release-it)
- [[concepts/evolutionary-architecture]] — Three pillars; evolvability by style; strangler fig; six Rs; guidelines; antipatterns; DDD brownfield modernisation strategy; "form follows failure"; bad layering (horizontal coupling); component-based decomposition; decision loop speed and thrashing; service extinction; Farley: testability+deployability as operational drivers, TDD as architectural feedback, architectural descriptions as "tourist maps" (informed by: building-evolutionary-architectures, mastering-api-architecture, fundamentals-of-software-architecture, learning-domain-driven-design, monolith-to-microservices, release-it, software-architecture-metrics)
- [[concepts/evolutionary-database-design]] — Expand/contract pattern; Flyway/Liquibase; shared DB decomposition; reporting antipattern; Newman's ~12 database decomposition patterns (database view, wrapping service, tracer write, synchronize in application, etc.) (informed by: building-evolutionary-architectures, monolith-to-microservices)
- [[concepts/fitness-functions]] — Full classification taxonomy; priority tiers; enterprise fitness functions; mechanism and concern taxonomies; fitness function testing pyramid (triggered/continuous × atomic/holistic → three pyramid layers); ISO 25010 quality attribute anchoring (informed by: building-evolutionary-architectures, fundamentals-of-software-architecture, mastering-api-architecture, software-architecture-metrics)
- [[concepts/four-key-metrics]] — DORA four key metrics (deployment frequency, lead time for changes, change failure rate, time to restore service); empirical basis (4-year, 23K+ respondents, Accelerate); Lean conceptual basis; cluster analysis; no-tradeoff finding; CABs negatively correlated with both metrics; Goodhart's Law warning; pipeline topology variants; instrumentation; MVD; virtuous cycle mechanism; complementary metrics (informed by: accelerate, software-architecture-metrics)
- [[concepts/goal-question-metric]] — GQM framework (Basili & Weiss 1984): goal → questions → metrics → data tree; goal statement structure (purpose/object/issue/viewpoint); metric selection criteria (signal strength, cost, cross-question reuse); 9-step workshop; Foo Service case study (rate-limit incident → heartbeat + fail-fast ADR → 10-minute detection before user impact) (informed by: software-architecture-metrics)
- [[concepts/modularity]] — Cohesion types, LCOM, coupling metrics, connascence taxonomy (static vs dynamic); SATH: applying D/A/I metrics to decomposition feasibility; Modularity Maturity Index (MMI 0-10, three cognitive principles: modularity 45%/hierarchy 30%/pattern consistency 25%, decision thresholds, architecture erosion, implementation vs design/architecture debt); advanced structural metrics: ACD/CCD/Propagation Cost, Relative Cyclicity, SDI, Maintainability Level, LCOM4, change history metrics, Component Rank, six golden rules (informed by: fundamentals-of-software-architecture, software-architecture-the-hard-parts, software-architecture-metrics)
- [[concepts/reuse-patterns]] — Four reuse techniques: code replication, shared library, shared service, sidecar; core reuse principle (reuse = abstraction + slow rate of change); versioning discipline; orthogonal coupling (informed by: software-architecture-the-hard-parts)
- [[concepts/risk-storming]] — Collaborative risk identification: risk matrix, risk assessment, 3-activity process (informed by: fundamentals-of-software-architecture)
- [[concepts/service-granularity]] — Granularity vs modularity distinction; six disintegrators; four integrators; volatility-based decomposition; MTTS; trade-off-to-business-question method (informed by: software-architecture-the-hard-parts)
- [[concepts/software-complexity]] — Ousterhout's complexity definition: three symptoms (change amplification, cognitive load, unknown unknowns), two causes (dependencies, obscurity), incremental accumulation; strategic vs. tactical programming; technical debt as borrowed time (informed by: a-philosophy-of-software-design)
- [[concepts/technical-vs-domain-partitioning]] — Technical (layered) vs domain (bounded context) top-level component design (informed by: fundamentals-of-software-architecture)

### API & Integration

- [[concepts/api-design]] — REST, gRPC, GraphQL exchange format decision; HTTP methods; URL modeling; status codes; OAS; versioning; Postel's Robustness Principle; non-breaking vs breaking changes; implementation-as-de-facto-spec; version translation in controllers; API-first (informed by: mastering-api-architecture, understanding-distributed-systems, building-event-driven-microservices, release-it)
- [[concepts/api-gateway]] — Gateway taxonomy (enterprise/microservices/mesh), capabilities, pitfalls, history (informed by: mastering-api-architecture)
- [[concepts/api-testing]] — Test pyramid, consumer-driven contracts, Pact, component/integration/E2E testing; scope vs size distinction, test double fidelity hierarchy, user journey tests, formal verification with TLA+; EDM topology testing, integration testing strategies, event data sourcing (informed by: mastering-api-architecture, understanding-distributed-systems, building-event-driven-microservices)
- [[concepts/contracts]] — Strict/loose contract spectrum; consumer-driven contracts; stamp coupling; event schema evolution (forward/backward/full compatibility); schema registry; event design anti-patterns; Newman: structural vs semantic breakages, expansion changes, dual-version strategies; EIP: Format Indicator (version number/foreign key/embedded schema), Canonical Data Model (informed by: software-architecture-the-hard-parts, mastering-api-architecture, building-event-driven-microservices, monolith-to-microservices, enterprise-integration-patterns)
- [[concepts/integration-styles]] — the four EIP integration styles (File Transfer, Shared Database, RPI, Messaging); eight decision criteria; trade-offs and when to use which style (informed by: enterprise-integration-patterns)
- [[concepts/messaging]] — Command/Document/Event message types; one-way/req-resp/broadcast styles; Request-Reply (sync block vs async callback; Return Address; Correlation Identifier); point-to-point/pub-sub/datatype channels; Pub-Sub as distributed Observer (push vs pull; channel design); at-least-once delivery; guaranteed delivery; exactly-once via idempotency; invalid vs dead letter channel; backlogs; poison message isolation; competing consumers; data safety trade-off (publisher confirms + persistent queues + manual ACKs); quorum queues (RAFT); RabbitMQ internals; Pipes and Filters; Message Router; Message Bus; Messaging Bridge; Aggregator; Resequencer; Composed Message Processor; Scatter-Gather; Routing Slip; Process Manager; Message Broker (architectural pattern); Envelope Wrapper; Content Enricher; Content Filter; Claim Check; Normalizer; Canonical Data Model; Messaging Gateway; Messaging Mapper; Transactional Client; Polling Consumer; Event-Driven Consumer; Competing Consumers; Message Dispatcher; Selective Consumer; Durable Subscriber; Idempotent Receiver; Service Activator; Control Bus; Detour; Wire Tap; Message History; Message Store; Smart Proxy; Test Message; Channel Purger (informed by: understanding-distributed-systems, enterprise-integration-patterns, release-it, foundations-of-scalable-systems)
- [[concepts/oauth2-and-authn]] — OAuth2 roles, JWT, grants (Auth Code, PKCE, Client Credentials), OIDC, refresh tokens (informed by: mastering-api-architecture)
- [[concepts/threat-modeling]] — STRIDE, DREAD, OWASP API Top 10, six-step process, rate limiting strategies (informed by: mastering-api-architecture)
- [[concepts/zero-trust]] — Zonal architecture critique, NCSC eight principles, service mesh + OAuth2 implementation stack (informed by: mastering-api-architecture)

### Data

- [[concepts/data-decomposition]] — Data disintegrators/integrators; five-step process; data domains; data sovereignty; connection quotas; polyglot persistence; database type selection; data ownership (single/common/joint); eventual consistency patterns; four distributed data access patterns (informed by: software-architecture-the-hard-parts)
- [[concepts/data-mesh]] — Data Warehouse, Data Lake, Data Mesh evolution; four Data Mesh principles; DPQ; OLTP vs OLAP; star/snowflake schema; DDD/Data Mesh alignment (OHS as analytical published language, CQRS for projections) (informed by: software-architecture-the-hard-parts, learning-domain-driven-design)

---

## Distributed Systems

- [[distributed/broadcast-protocols]] — best-effort, reliable (eager/gossip), total order broadcast; consensus requirement; relationship to CRDTs and replication (informed by: understanding-distributed-systems)
- [[distributed/caching]] — HTTP caching (Cache-Control, ETag, fresh/stale, immutable static resources); reverse proxies; application-layer: side vs inline cache, LRU eviction, TTL, local vs external cache, thundering herd, cascading failure; 80% hit rate as scalability threshold (informed by: understanding-distributed-systems, foundations-of-scalable-systems)
- [[distributed/cap-theorem]] — CAP theorem and PACELC extension; Kleppmann's critique ("best avoided"); timeliness vs integrity distinction (informed by: understanding-distributed-systems, designing-data-intensive-applications)
- [[distributed/cdn]] — CDN overlay network; BGP limitations; global DNS LB; IXP placement; edge+intermediary caching layers; DDoS shielding (informed by: understanding-distributed-systems)
- [[distributed/consensus-algorithms]] — Raft, Paxos, Zab; FLP result; ZooKeeper/etcd; equivalence theorem (linearizable CAS = total order broadcast = locks = uniqueness) (informed by: designing-data-intensive-applications, understanding-distributed-systems)
- [[distributed/consistency-models]] — Full spectrum: linearizability, sequential, causal, strong eventual, eventual; COPS causal+ implementation; isolation levels; linearizability ≠ serializability; timeliness vs integrity; safety vs liveness (informed by: understanding-distributed-systems, designing-data-intensive-applications)
- [[distributed/control-plane-data-plane]] — data plane (on critical path, availability), control plane (off-path, consistency); static stability; scale imbalance solutions (file store buffer, push deltas, hybrid); control theory feedback loop (informed by: understanding-distributed-systems, mastering-api-architecture)
- [[distributed/crdts]] — Conflict-free Replicated Data Types; semilattice + LUB merge; strong eventual consistency; LWW/MV registers; CALM theorem (application-level consistency, not linearizability) (informed by: understanding-distributed-systems)
- [[distributed/distributed-transactions]] — ACID, 2PL, OCC, MVCC, 2PC, Spanner, Saga, Outbox; XA limitations; coordination-avoiding correctness; Newman's "just say no" to 2PC during migration (informed by: understanding-distributed-systems, designing-data-intensive-applications, monolith-to-microservices)
- [[distributed/dns]] — Hierarchical resolution process; TTL trade-offs; DNS as eventually consistent KV store; DNS as SPOF; static stability principle (informed by: understanding-distributed-systems)
- [[distributed/failure-detection]] — Timeouts (fundamental limitation), pings vs heartbeats, when to use active detection; imperfect failure detection theorem (informed by: understanding-distributed-systems)
- [[distributed/fallacies-of-distributed-computing]] — The 8 fallacies (Deutsch/Sun 1994): network reliable, latency zero, bandwidth infinite, network secure, topology fixed, one admin, transport free, homogeneous network; stamp coupling; distributed logging/transactions/contracts (informed by: fundamentals-of-software-architecture)
- [[distributed/http]] — HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC); multiplexing; HOL blocking; connection management; relationship to REST (informed by: understanding-distributed-systems)
- [[distributed/idempotency]] — Idempotency keys (atomicity requirement, principle of least astonishment), at-least-once delivery, retry safety (informed by: understanding-distributed-systems)
- [[distributed/leader-election]] — Raft state machine (follower/candidate/leader); election terms; CAS+lease practical approach; fencing tokens for mutual exclusion; leader as SPOF (informed by: understanding-distributed-systems)
- [[distributed/load-balancing]] — DNS LB, L4 (transport), L7 (application), service discovery, health checks, power of two choices, sidecar as client-side LB; stateless services as prerequisite for scale-out (informed by: understanding-distributed-systems, foundations-of-scalable-systems)
- [[distributed/logical-clocks]] — Physical clock failures (drift, NTP jumps, monotonic); happened-before relation; Lamport clocks (total order); vector clocks (partial order, concurrent detection) (informed by: understanding-distributed-systems)
- [[distributed/partitioning]] — Key range, hash, consistent hashing, secondary indexes (local/global), rebalancing strategies, request routing; cross-partition complexity costs (informed by: designing-data-intensive-applications, understanding-distributed-systems)
- [[distributed/rate-limiting]] — Load shedding (503, priority/age ordering), load leveling (async channel + auto-scaling), rate limiting (sliding window buckets, distributed atomic increment, fail-open), constant work pattern (periodic full-state dump, antifragile, self-healing) (informed by: understanding-distributed-systems)
- [[distributed/replication]] — State machine replication (Raft), chain replication (head/tail topology, failure modes, data/control plane split), leader-follower, Dynamo-style; replication lag anomalies; multi-leader conflict resolution (informed by: understanding-distributed-systems, designing-data-intensive-applications)
- [[distributed/scalability]] — definition; replication vs optimization strategies; scale up vs scale out; stateless services requirement; Amdahl's Law; hyperscale; quality attribute trade-offs (performance, availability, security, manageability); architecture evolution pattern (informed by: foundations-of-scalable-systems)
- [[distributed/serverless]] — serverless model (pay-per-invocation, managed autoscaling); cold start by runtime; GAE autoscaling parameters; AWS Lambda (freeze/thaw, provisioned/reserved concurrency, burst limits); parameter study methodology; vendor lock-in (informed by: foundations-of-scalable-systems)
- [[distributed/system-models]] — Link models (fair-loss/reliable/authenticated), process failure models (Byzantine/crash-recovery/crash-stop), timing models (sync/async/partial sync); default assumptions (informed by: understanding-distributed-systems)
- [[distributed/tls]] — TLS encryption (asymmetric key exchange + symmetric data), authentication (certificate chain, root CA), integrity (HMAC), handshake, certificate expiry risk (informed by: understanding-distributed-systems)

---

## Operations

- [[operations/availability]] — Uptime/downtime definition; the nines table (90%–99.999%); techniques for high availability; dependency chaining effects; design-for-production philosophy; ROI of availability investment; MTBF/MTTR/RPO/RTO measurement framework; tyranny of the nines antipattern; Allspaw: MTTR > MTBF; SRE: 100% is always the wrong target (informed by: understanding-distributed-systems, release-it, software-architecture-metrics, site-reliability-engineering)
- [[operations/chaos-engineering]] — definition, prerequisites, experiment design, injection types (Chaos Monkey/Latency Monkey/FIT), targeting strategy, automation and moderation, disaster simulations; theoretical foundations (drift into failure, regulator paradox, antifragility) (informed by: release-it)
- [[operations/common-failure-causes]] — failure taxonomy: hardware, incorrect error handling (2014 study), configuration changes, SPOFs, gray failures, resource leaks, cascading/metastable failures; risk = probability × impact; airline/Black Friday/"Trampled" case studies; building-for-tests vs building-for-production; GC death spiral, queue management (LIFO/CoDel), deadline propagation, latency vs capacity cache (informed by: understanding-distributed-systems, release-it, site-reliability-engineering)
- [[operations/error-budgets]] — error budget = 1 − SLO target; resolves dev/ops conflict by aligning incentives; budget exhaustion triggers release freeze; burn rate alerting; 100% is wrong target argument (informed by: site-reliability-engineering)
- [[operations/manageability]] — Dynamic configuration (config store, runtime re-read); feature flags (progressive rollout, A/B testing, kill switch, deployment-release decoupling); operational triad: monitor → observe → manage (informed by: understanding-distributed-systems)
- [[operations/monitoring]] — Black-box vs white-box monitoring; metrics and pre-aggregation; SLIs (ratio definition, percentiles, Little's Law); SLOs (error budget, burn rate alerting, stakeholder alignment); SRE output taxonomy (alerts/tickets/logs); dashboards (SLO/API/service types); chaos testing; on-call practices (informed by: understanding-distributed-systems, release-it, site-reliability-engineering)
- [[operations/observability]] — Observability as superset of monitoring; three telemetry sources (metrics, logs, traces); structured event logs (one event per work unit, request ID, sampling); distributed tracing (trace ID propagation, spans, Zipkin/X-Ray); metrics and traces as derived views of event logs; Newman: log aggregation first, correlation IDs, Jaeger, synthetic transactions (informed by: understanding-distributed-systems, monolith-to-microservices)
- [[operations/site-reliability-engineering]] — SRE as discipline: dev/ops conflict; error budgets; toil cap (50%); SLO-driven alerting; blameless postmortems; SRE vs DevOps distinction; applicability outside Google (informed by: site-reliability-engineering)
- [[operations/automation]] — Automation vs autonomy; 5-level hierarchy (manual → autonomous); safety properties (rate limiting, idempotency); MySQL on Borg case study (informed by: site-reliability-engineering)
- [[operations/incident-management]] — Hypothetico-deductive troubleshooting; ICS roles; "only Ops modifies"; blameless postmortems; outage tracking (Outalator aggregation/tagging/analysis) (informed by: site-reliability-engineering)
- [[operations/testing-for-reliability]] — Zero-MTTR via pre-production testing; traditional test hierarchy; production tests (config tests, stress tests, canary); production probes; barrier defence pattern; configuration file risk management (informed by: site-reliability-engineering)
- [[operations/data-integrity]] — Data integrity vs availability distinction; replication ≠ recoverability; failure mode matrix (cause × scope × rate); defence in depth: soft deletion / tiered backups / out-of-band validation; point-in-time recovery; continuously test restore; Gmail and Google Music case studies (informed by: site-reliability-engineering)

---

## Implementation Patterns

- [[patterns/mvc-web-presentation]] — MVC pattern; Page Controller vs Front Controller; Template/Transform/Two Step View; Application Controller (informed by: patterns-of-enterprise-application-architecture)
- [[patterns/bulkhead]] — Resource partitioning, shuffle sharding, cellular architecture (informed by: understanding-distributed-systems)
- [[patterns/circuit-breaker]] — Closed/open/half-open state machine for downstream resiliency (informed by: understanding-distributed-systems)
- [[patterns/timeout]] — Bounding wait time on every blocking call; sizing by P99.9; absent-timeout gotchas; relationship to circuit breaker and retry (informed by: release-it, understanding-distributed-systems)
- [[patterns/retry]] — Transient failure recovery; exponential backoff with jitter; retry amplification in chains; idempotency prerequisite; retry queues (informed by: understanding-distributed-systems, release-it)
- [[patterns/outbox-pattern]] — Atomic write + publish without 2PC; relay process; CDC; data liberation patterns; DDD: two wrong approaches + correct approach; NoSQL embedding; pull vs push relay (informed by: understanding-distributed-systems, building-event-driven-microservices, learning-domain-driven-design)
- [[patterns/saga]] — Distributed transactions via local transactions + compensations; 8 saga type taxonomy; semantic vs implementation coupling; orchestration/choreography trade-offs; DDD: saga vs process manager distinction; stateless/stateful saga; process manager as aggregate; Newman: backward/forward recovery, semantic rollbacks, step reordering, team-based coordination choice (informed by: understanding-distributed-systems, fundamentals-of-software-architecture, software-architecture-the-hard-parts, building-event-driven-microservices, learning-domain-driven-design, monolith-to-microservices)
- [[patterns/strangler-fig]] — Incremental migration pattern: identify → implement → redirect via proxy; HTTP/FTP/message variants; UI composition (page, widget, micro frontends); deployment ≠ release; feature freeze (informed by: monolith-to-microservices)
- [[patterns/branch-by-abstraction]] — Migration for deeply embedded capabilities: 5 steps; feature toggles; verify variant with automatic fallback (informed by: monolith-to-microservices)
- [[patterns/parallel-run]] — Correctness verification: both implementations run per request; old result returned; GitHub Scientist; dark launching vs canary vs parallel run; progressive delivery (informed by: monolith-to-microservices)
- [[patterns/sidecar-service-mesh]] — East–west traffic governance: mTLS, service authorisation, evolution from libraries to eBPF; sidecar as reuse mechanism for operational concerns; orthogonal coupling; data-sinking sidecar for EDM legacy integration (informed by: understanding-distributed-systems, mastering-api-architecture, software-architecture-the-hard-parts, building-event-driven-microservices)
- [[patterns/anti-corruption-layer]] — Translation boundary protecting a bounded context's model from upstream language corruption; structure (FACADE+ADAPTER); ACL vs Conformist vs Open-Host Service; migration use with Strangler Fig (informed by: domain-driven-design, learning-domain-driven-design, monolith-to-microservices, building-evolutionary-architectures)
- [[patterns/context-map]] — Six bounded context integration patterns grouped by team collaboration type; context map notation; model translation: stateless proxy (sync/async) and stateful aggregation (stream processing, BFF); private vs public events; Evans' originating eight-pattern taxonomy (Shared Kernel, Customer/Supplier, Conformist, ACL, Separate Ways, OHS, Published Language, CI) and transformation recipes (informed by: domain-driven-design, learning-domain-driven-design)
- [[patterns/business-logic-patterns]] — Four-pattern spectrum: transaction script, active record, domain model, event-sourced domain model; subdomain-to-pattern mapping; transaction script failure modes; full tactical decision tree (pattern→architecture→testing strategy); migration paths between patterns (informed by: learning-domain-driven-design)
- [[patterns/domain-model]] — DDD tactical pattern for core subdomain business logic: value objects (immutable, identified by values), entities, aggregates (consistency boundary, one-per-transaction rule, aggregate root, OCC), domain events, domain services; Evans elaborations on associations, entity identity, context-dependent entity/VO classification, service partitioning, modules as model elements (informed by: learning-domain-driven-design, domain-driven-design)
- [[patterns/repository]] — Evans' REPOSITORY pattern: in-memory collection illusion over aggregate roots; hides persistence technology; only for roots needing direct access; transaction control left to client; factory/repository complementarity (informed by: domain-driven-design)
- [[patterns/specification]] — predicate VALUE OBJECT for expressing domain rules: three uses (validation, selection/querying, building to order); composite Specification with AND/OR/NOT; subsumption; integrates with REPOSITORY via selectSatisfying() (informed by: domain-driven-design)

---

## Databases

- [[databases/object-relational-mapping]] — O/R mapping architectural patterns (Table Data Gateway, Row Data Gateway, Active Record, Data Mapper); behavioural patterns (Unit of Work, Identity Map, Lazy Load); structural mapping; inheritance strategies (Single/Class/Concrete Table Inheritance) (informed by: patterns-of-enterprise-application-architecture)
- [[databases/storage-engines]] — Hash indexes, SSTables/LSM-Trees, B-Trees, OLTP vs OLAP, column-oriented storage, materialized aggregates (informed by: designing-data-intensive-applications)
- [[databases/data-models]] — Relational, document, graph models; schema-on-read vs write; SQL, Cypher, SPARQL, Datalog query languages (informed by: designing-data-intensive-applications)
- [[databases/encoding-and-evolution]] — JSON/XML, Thrift, Protobuf, Avro; schema evolution; forward/backward compatibility; dataflow modes (informed by: designing-data-intensive-applications)
- [[databases/transactions]] — ACID, isolation levels (dirty reads, read skew, write skew, phantoms), MVCC, SSI, actual serial execution, 2PL (informed by: designing-data-intensive-applications, understanding-distributed-systems)

---

## Streams

- [[streams/batch-processing]] — Unix philosophy, MapReduce, join algorithms, Hadoop vs MPP, Spark/Flink dataflow engines, Pregel graph processing (informed by: designing-data-intensive-applications)
- [[streams/stream-processing]] — Log-based brokers (Kafka), stateless topology primitives, partition assignment, windowing, late event strategies, watermarks vs stream time, reprocessing, state stores (internal/external, changelog, hot replicas), effectively once processing, heavyweight vs lightweight framework comparison, stream joins, exactly-once fault tolerance; Kafka production mechanics: producer batching (acks/idempotence), consumer commit semantics, semantic partitioning, consumer groups, ISR (informed by: designing-data-intensive-applications, building-event-driven-microservices, foundations-of-scalable-systems)
- [[streams/event-sourcing-cqrs]] — CDC, event sourcing, CQRS, immutability, write/read path, correctness without coordination; DDD: CQRS sync/async projections, architectural slices, event-sourced domain model four-step cycle; Fowler's four-way event taxonomy (notification/state-transfer/event-sourcing/CQRS) (informed by: designing-data-intensive-applications, learning-domain-driven-design, release-it)

---

## Reference

- [[reference/technology-glossary]] — Short reference entries for tools: gateways, meshes, testing, observability, identity, databases (Redis Cluster, MongoDB, DynamoDB) (informed by: mastering-api-architecture, understanding-distributed-systems, fundamentals-of-software-architecture, foundations-of-scalable-systems)

---

## Comparisons

- [[comparisons/architecture-styles-comparison]] — All 8 architecture styles rated side by side; decision guide; monolith vs understanding-distributed-systems; partitioning type (informed by: fundamentals-of-software-architecture)
- [[comparisons/orchestration-vs-choreography]] — Decision guide: when to use a central coordinator vs event-driven choreography; team-ownership heuristic; God Orchestrator anti-pattern; workflow state management options (informed by: understanding-distributed-systems, software-architecture-the-hard-parts, building-event-driven-microservices, learning-domain-driven-design, monolith-to-microservices)
- [[comparisons/api-protocol-selection]] — REST vs gRPC vs GraphQL: decision table by traffic type; trade-off analysis across caching, schema, streaming, browser support, evolution; mixing protocols; chatty API anti-pattern (informed by: mastering-api-architecture, understanding-distributed-systems, foundations-of-scalable-systems)
- [[comparisons/decomposition-strategy]] — How far to decompose: modular monolith → service-based → microservices; five decision factors (domain understanding, team structure, DevOps maturity, transaction requirements, scalability); recommended migration path; granularity disintegrators vs integrators; Ferrari anti-pattern (informed by: fundamentals-of-software-architecture, monolith-to-microservices, software-architecture-the-hard-parts, building-evolutionary-architectures, team-topologies, learning-domain-driven-design)
- [[comparisons/consistency-model-selection]] — When to use linearizability vs causal vs eventual consistency; timeliness vs integrity distinction; decision guide by scenario (locks, balances, feeds, shopping carts, multi-region); read routing as the practical knob; CAP trap warning (informed by: designing-data-intensive-applications, understanding-distributed-systems, foundations-of-scalable-systems)
- [[comparisons/sync-vs-async-communication]] — When to use synchronous vs asynchronous communication; temporal coupling as the core distinction; availability chaining risk; async concerns (idempotency, ordering, correlation, observability); mixed model (sync north-south, async east-west); decision guide (informed by: enterprise-integration-patterns, monolith-to-microservices, software-architecture-the-hard-parts, building-event-driven-microservices, understanding-distributed-systems, release-it)
- [[comparisons/build-vs-buy]] — Build vs buy vs open-source decision framework; subdomain type as the primary analytical tool (core → build, generic → buy/adopt, supporting → build simple); hidden costs of buying; platform team as internal build-once option; sourcing reversals as subdomain types evolve (informed by: learning-domain-driven-design, domain-driven-design, software-architecture-the-hard-parts, building-evolutionary-architectures, team-topologies)

---

## Sources

- [[sources/a-philosophy-of-software-design]] — *A Philosophy of Software Design* — John Ousterhout (fully ingested 2026-05-18)
- [[sources/understanding-distributed-systems]] — *Understanding Distributed Systems* — Roberto Vitillo (ingested 2026-05-13)
- [[sources/fundamentals-of-software-architecture]] — *Fundamentals of Software Architecture* — Richards & Ford (ingested 2026-05-13)
- [[sources/mastering-api-architecture]] — *Mastering API Architecture* — Gough, Bryant, Auburn (ingested 2026-05-13)
- [[sources/building-evolutionary-architectures]] — *Building Evolutionary Architectures* — Ford, Parsons, Kua (ingested 2026-05-13; re-ingested 2026-05-14)
- [[sources/designing-data-intensive-applications]] — *Designing Data-Intensive Applications* — Martin Kleppmann (ingested 2026-05-13; re-ingested 2026-05-14)
- [[sources/software-architecture-patterns]] — *Software Architecture Patterns* — Mark Richards (ingested 2026-05-14)
- [[sources/software-architecture-the-hard-parts]] — *Software Architecture: The Hard Parts* — Ford, Richards, Sadalage, Dehghani (ingested 2026-05-14; fully ingested)
- [[sources/building-event-driven-microservices]] — *Building Event-Driven Microservices* — Adam Bellemare (fully ingested 2026-05-14)
- [[sources/learning-domain-driven-design]] — *Learning Domain-Driven Design* — Vlad Khononov (fully ingested 2026-05-14)
- [[sources/team-topologies]] — *Team Topologies* — Skelton & Pais (fully ingested 2026-05-14)
- [[sources/domain-driven-design]] — *Domain-Driven Design* — Eric Evans (fully ingested 2026-05-14)
- [[sources/monolith-to-microservices]] — *Monolith to Microservices* — Sam Newman (fully ingested 2026-05-15)
- [[sources/enterprise-integration-patterns]] — *Enterprise Integration Patterns* — Hohpe & Woolf (fully ingested 2026-05-15)
- [[sources/patterns-of-enterprise-application-architecture]] — *Patterns of Enterprise Application Architecture* — Martin Fowler et al. (fully ingested 2026-05-18)
- [[sources/release-it]] — *Release It! Design and Deploy Production-Ready Software* — Michael Nygard (fully ingested 2026-05-19)
- [[sources/foundations-of-scalable-systems]] — *Foundations of Scalable Systems* — Ian Gorton (fully ingested 2026-05-21)
- [[sources/software-architecture-metrics]] — *Software Architecture Metrics* — Ciceri et al. (fully ingested 2026-05-22)
- [[sources/accelerate]] — *Accelerate: The Science of Lean Software and DevOps* — Forsgren, Humble & Kim (fully ingested 2026-05-18)
- [[sources/site-reliability-engineering]] — *Site Reliability Engineering* — Beyer, Jones, Petoff, Murphy (fully ingested 2026-05-27)

---

## Authors

- [[authors/adam-bellemare]] — Author of *Building Event-Driven Microservices*; event-driven architecture specialist; event schema design and data liberation
- [[authors/vlad-khononov]] — Author of *Learning Domain-Driven Design*; DDD practitioner and educator; strategic and tactical DDD, EventStorming
- [[authors/daniel-bryant]] — Co-author of *Mastering API Architecture*; Principal Technologist at Datawire; security and gateway expert
- [[authors/james-gough]] — Co-author of *Mastering API Architecture*; API-first and contract testing specialist
- [[authors/mark-richards]] — Author of *Fundamentals of Software Architecture* (with Ford), *Software Architecture Patterns*, *Software Architecture: The Hard Parts* (with Ford, Sadalage, Dehghani)
- [[authors/pramod-sadalage]] — Co-author of *Software Architecture: The Hard Parts*; data architect at ThoughtWorks; evolutionary database design and NoSQL specialist
- [[authors/zhamak-dehghani]] — Co-author of *Software Architecture: The Hard Parts*; creator of Data Mesh; analytical data and domain data ownership advocate
- [[authors/matthew-auburn]] — Co-author of *Mastering API Architecture*; cloud migration and deployment strategy specialist
- [[authors/neal-ford]] — Author of *Fundamentals of Software Architecture* (with Richards), *Building Evolutionary Architectures*, *Software Architecture: The Hard Parts* (with Richards, Sadalage, Dehghani); contributing author *Software Architecture Metrics* ch. 8 (metrics → engineering, zero-day fitness function, checklist manifesto framing)
- [[authors/patrick-kua]] — Co-author of *Building Evolutionary Architectures*; technical leadership and engineering culture specialist
- [[authors/rebecca-parsons]] — Co-author of *Building Evolutionary Architectures*; ThoughtWorks CTO; distributed systems and evolutionary computation background
- [[authors/martin-kleppmann]] — Author of *Designing Data-Intensive Applications*; distributed systems researcher at Cambridge; CRDT and local-first software advocate
- [[authors/eric-evans]] — Author of *Domain-Driven Design* (2003); originator of DDD vocabulary (ubiquitous language, bounded contexts, aggregates, strategic design)
- [[authors/sam-newman]] — Author of *Monolith to Microservices* and *Building Microservices*; independent deployability, migration planning, monolith decomposition
- [[authors/roberto-vitillo]] — Author of *Understanding Distributed Systems*
- [[authors/matthew-skelton]] — Co-author of *Team Topologies*; co-creator of Team Topologies model; fast flow and organisational design specialist
- [[authors/manuel-pais]] — Co-author of *Team Topologies*; DevOps and platform engineering consultant; team interaction and organisational sensing specialist
- [[authors/gregor-hohpe]] — Co-author of *Enterprise Integration Patterns*; enterprise messaging and integration architect; ESB and MOM specialist
- [[authors/bobby-woolf]] — Co-author of *Enterprise Integration Patterns*; messaging middleware and design patterns practitioner
- [[authors/martin-fowler]] — Author of *Patterns of Enterprise Application Architecture*; ThoughtWorks Chief Scientist; coined Transaction Script, Domain Model, Active Record, Data Mapper, Repository, Service Layer
- [[authors/michael-nygard]] — Author of *Release It!*; stability patterns practitioner; coined Circuit Breaker, Bulkhead, Timeout in the software context; design-for-production advocate
- [[authors/ian-gorton]] — Author of *Foundations of Scalable Systems*; distributed systems architect; scalability measurement and empirical architecture
- [[authors/andrew-harmel-law]] — Contributing author *Software Architecture Metrics* ch. 1; DORA four key metrics practitioner; delivery transformation consultant
- [[authors/rene-weiss]] — Contributing author *Software Architecture Metrics* ch. 2; fitness function testing pyramid; architectural verification frameworks
- [[authors/dave-farley]] — Contributing author *Software Architecture Metrics* ch. 3; co-author of *Continuous Delivery*; testability and deployability as architectural drivers; TDD as design discipline
- [[authors/carola-lilienthal]] — Contributing author *Software Architecture Metrics* ch. 4; developer of the Modularity Maturity Index (MMI); empirical architecture quality measurement grounded in cognitive science
- [[authors/christian-ciceri]] — Editor of *Software Architecture Metrics*; contributing author ch. 5; private build antipattern remediation; trunk stability as architectural prerequisite
- [[authors/joao-rosa]] — Contributing author *Software Architecture Metrics* ch. 6; sociotechnical architecture; KPI Value Tree; Big Picture EventStorming for architectural strategy
- [[authors/eoin-woods]] — Contributing author *Software Architecture Metrics* ch. 7; co-author of *Continuous Architecture in Practice*; quality attribute measurement framework; MTTR > MTBF; RPO/RTO
- [[authors/alexander-von-zitzewitz]] — Contributing author *Software Architecture Metrics* ch. 9; creator of Sonargraph; structural metrics (Propagation Cost, Relative Cyclicity, SDI, Maintainability Level, LCOM4, Component Rank); six golden rules; structural erosion as default outcome
- [[authors/michael-keeling]] — Contributing author *Software Architecture Metrics* ch. 10; author of *Design It!*; Goal-Question-Metric (GQM) framework; measurement as alignment and coaching tool
- [[authors/john-ousterhout]] — Author of *A Philosophy of Software Design*; Stanford CS professor; creator of Tcl and Raft; deep modules, information hiding, and complexity management advocate
- [[authors/nicole-forsgren]] — Co-author of *Accelerate*; PhD in MIS; DORA research programme; psychometric and statistical rigour applied to DevOps; four key metrics originator
- [[authors/jez-humble]] — Co-author of *Accelerate*; co-author of *Continuous Delivery*; CI/CD, Lean, DevOps practitioner; DORA research programme
- [[authors/betsy-beyer]] — Co-editor of *Site Reliability Engineering*; Google Technical Writer for SRE; cultural and documentary aspects of reliability
- [[authors/benjamin-treynor-sloss]] — Wrote Ch. 1 of *Site Reliability Engineering*; VP Engineering at Google; originator of the term "Site Reliability Engineering"; creator of the error budget model
- [[authors/gene-kim]] — Co-author of *Accelerate*; founder and CTO of Tripwire; co-author of *The Phoenix Project* and *The DevOps Handbook*; high-performing technology organisation researcher
