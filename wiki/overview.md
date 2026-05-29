---
title: "Overview — Software Architecture"
type: overview
tags: []
sources: [understanding-distributed-systems, fundamentals-of-software-architecture, mastering-api-architecture, building-evolutionary-architectures, designing-data-intensive-applications, software-architecture-the-hard-parts, software-architecture-patterns, building-event-driven-microservices, learning-domain-driven-design, team-topologies, domain-driven-design, monolith-to-microservices, enterprise-integration-patterns, patterns-of-enterprise-application-architecture, release-it, foundations-of-scalable-systems, software-architecture-metrics, accelerate, a-philosophy-of-software-design, site-reliability-engineering, chaos-engineering]
updated: 2026-05-29
---

# Overview — Software Architecture

> This page is the evolving high-level synthesis of everything in the wiki. It is rewritten (not appended) as understanding develops. Current state: **21 sources fully ingested.**

## At a Glance

The wiki's working view of the field, in seven claims:

1. **Architecture is decisions made under uncertainty.** Every choice trades quality attributes against each other; there is no best architecture, only better fits for a context. The architect's job is to identify the *fewest* characteristics that matter most and accept under-optimisation on the rest.
2. **Failures are a fact, not an edge case.** Design for production, not QA: assume hardware fails, networks partition, clocks drift, configs corrupt. Minimise blast radius and stop propagation — don't try to prevent every failure.
3. **Coordination is the most expensive primitive in distributed systems.** Consensus, 2PC, and synchronous quorums are last-resort tools. Most "we need strong consistency" requirements turn out to be integrity requirements, achievable with idempotency and end-to-end IDs at a fraction of the cost.
4. **Architecture is sociotechnical.** Team structure encodes itself in system structure ([[concepts/conways-law]]); cognitive load determines what a team can own; safety is a property of the whole system, not its components. Pure technical reasoning misses half the problem.
5. **Governance must be automated and continuous, not periodic and manual.** Architectural decisions degrade silently. [[concepts/fitness-functions]] in [[concepts/deployment-pipelines]] are the mechanism that makes governance survive over time.
6. **Complexity accumulates incrementally and must be deliberately resisted.** Tactical programming defers cost to every future reader; strategic programming invests ~10–15% in design and pays back compoundingly. Information hiding, deep modules, and bounded contexts are the techniques.
7. **The empirical evidence supports counter-intuitive practices.** Speed and stability correlate positively (not in tension); trunk-based development beats long-lived branches; CABs hurt rather than help; loose architectural coupling matters more than test automation for delivery performance ([[sources/accelerate]]).

---

## The Central Question

Software architecture is fundamentally about making decisions under uncertainty. Every architectural choice involves trade-offs between competing quality attributes — performance vs. maintainability, consistency vs. availability, simplicity vs. flexibility. There is no "best" architecture; there are better or worse fits for a given context.

Richards & Ford distil this into two laws: *everything in software architecture is a trade-off*, and *why is more important than how*. Vitillo frames the same insight from the distributed systems side: the question is never "how do we prevent all failures?" but "how do we minimise blast radius?"

---

## Major Themes

### Architecture Is More Than Structure

FOSA adds a critical clarification: architecture is not synonymous with the architecture style (layered, microservices, etc.). It is the union of four things:
1. **Structure** — the style and topology.
2. **Architecture characteristics** ("-ilities") — the non-functional requirements the system must honour.
3. **Architecture decisions** — explicit, justified choices that constrain the design.
4. **Design principles** — guidelines (not hard rules) for how teams should build within the constraints.

Most architectural failures come from conflating structure with the full picture — choosing a style without explicit analysis of which characteristics matter or without documenting and governing decisions.

### Failures Are Unavoidable — Design for Production, Not QA

The most important disposition in distributed systems design: failures are a fact, not an edge case. Hardware fails, networks partition, clocks drift, config changes cause outages. The question is never "how do we prevent all failures?" but "how do we minimise blast radius and stop propagation?"

Techniques: redundancy (AZs, multi-region), fault isolation ([[patterns/bulkhead]], shuffle sharding, cellular architecture), circuit breakers ([[patterns/circuit-breaker]]), load shedding, graceful degradation.

Nygard (→ [[sources/release-it]]) sharpens this with a production-first mandate: **systems must be designed for the real world, not for QA**. The characteristic failure of engineering teams is optimising to pass load tests with "polite" traffic (valid sessions, correct cookies, sensible URLs) while production sends bots, scrapers, 404 floods, and retry storms. Safety devices — circuit breakers, thread-pool timeouts, bulkheads — must be present from day one. Configuration changes are the leading root cause of catastrophic outages; they take effect when a specific code path runs, hours after the change, after the incident window is forgotten.

A 2014 study of distributed data stores found the majority of catastrophic failures resulted from incorrect error handling, not hardware faults. Error paths are written fast, reviewed lightly, and almost never tested. Treating error handling as first-class code is one of the highest-leverage reliability investments. See [[operations/common-failure-causes]].

### Coordination Is Expensive

Every operation that requires nodes to agree (consensus, 2PC, leader confirmation) is a scalability bottleneck. The art of distributed systems design is minimising coordination:
- Push coordination off the critical path (async replication, eventual consistency).
- Use coordination-free data structures ([[distributed/crdts]]).
- Exploit the CALM theorem: monotonic programs need no coordination at all.

FOSA frames this in terms of distributed architecture costs: the 8 Fallacies of Distributed Computing mean every service boundary has a price. Service decomposition must be justified by the characteristics it unlocks.

### The Consistency vs. Availability Trade-off

Network partitions force a choice — [[distributed/cap-theorem]]. In practice this is a spectrum of [[distributed/consistency-models]]:
- **Linearizability**: strongest, most expensive; required for correctness-critical state.
- **Causal consistency**: strongest model compatible with availability + partition tolerance.
- **Eventual consistency**: highest availability; requires conflict resolution strategy.

PACELC extends this: even without partitions, there is a latency/consistency trade-off. Most operational tuning lives here.

Kleppmann (→ [[sources/designing-data-intensive-applications]]) adds a sharper distinction: **timeliness** (users see up-to-date data) vs. **integrity** (no data loss, no contradictions). Integrity is far more important. A stale read is annoying; missing or corrupted data is catastrophic. Coordination-avoiding systems (end-to-end operation IDs, idempotency, deterministic derivation) can provide strong integrity with weak timeliness — without the cost of distributed transactions. This reframes the CAP question: most applications don't need linearizability, they need integrity, and integrity is achievable at much lower cost.

CAP theorem itself Kleppmann calls "best avoided" — it covers only linearizability + network partitions, ignores normal-operation latency/consistency trade-offs, and conflates many distinct consistency models. PACELC is strictly more useful for operational reasoning.

### Architecture Characteristics Drive Style Selection

The central contribution of FOSA: architecture style selection should be driven by which [[concepts/architecture-characteristics]] the system needs, not by fashion or familiarity. The [[concepts/architecture-quantum]] determines scope — if different parts of the system need different characteristics, a distributed style with multiple quanta is required.

The 8 architecture styles form a spectrum from maximum simplicity (layered) to maximum agility (microservices), with every intermediate position representing a different trade-off between operational complexity and architectural flexibility. See [[styles/architecture-styles]] for an overview and [[comparisons/architecture-styles-comparison]] for full ratings.

### Storage Engines: Physics Drives Design

DDIA (→ [[sources/designing-data-intensive-applications]]) establishes that storage engine design follows from physical constraints, not convention. Sequential disk I/O is orders of magnitude faster than random I/O; this single fact explains:
- **LSM-Trees** (LevelDB, RocksDB, Cassandra): all writes are sequential (memtable flush + compaction). High write throughput; read amplification requires checking multiple SSTables; bloom filters short-circuit misses.
- **B-Trees** (PostgreSQL, MySQL, Oracle): reads are fast (one tree traversal to any key); writes require in-place page updates (random I/O). WAL provides crash recovery. More predictable latency.
- **Column-oriented storage** (Redshift, BigQuery, Parquet): analytics workloads read few columns across many rows — column storage eliminates the I/O of reading unused columns. Vectorised CPU processing on compressed columns enables analytic query performance.

The log — append-only, ordered, immutable — is the unifying data structure: WAL (B-Tree crash recovery), SSTable (LSM-Tree flush), replication log (leader → follower), CDC event log, Kafka partition, and event sourcing. "The truth is the log. The database is a cache of the log."

### Scalability Is Empirical

Gorton (→ [[sources/foundations-of-scalable-systems]]) establishes that scalability must be measured, not assumed. Key principles:
- **Amdahl's Law** sets the theoretical upper bound: if 5% of a workload is serial, no amount of parallelism can exceed 20× speedup. Identify and minimise the serial fraction first.
- **Scale-out requires stateless services**: any shared mutable state — session affinity, local cache, in-memory counters — prevents horizontal scaling. Externalise all state to distributed stores.
- **The 80% caching threshold**: if a cache hit rate is below ~80%, the caching layer adds latency without enabling scale. Design for high hit rates (read-dominated workloads, appropriate TTLs, consistent key design).
- **Hyperscale** adds a second dimension to Amdahl: the coordination overhead of managing thousands of nodes itself becomes a bottleneck. Hyperscale systems minimise cross-node coordination via consistent hashing, gossip protocols, and eventual consistency.

See [[distributed/scalability]], [[distributed/caching]], [[distributed/serverless]].

### The API Contract as Architectural Seam

In distributed systems, the API contract — not the code — is the primary interface between components (→ [[sources/mastering-api-architecture]]). A well-defined contract (OpenAPI for REST, Protocol Buffers for gRPC) makes the implementation replaceable: producers can be rewritten or replatformed without affecting consumers, provided the contract is honoured. This makes API design decisions architectural in scope.

The exchange format decision is among the most consequential API choices:
- **REST** for north–south traffic (external consumers): broad interoperability, cacheable, stateless
- **gRPC** for east–west traffic (internal services): binary HTTP/2, strict schema, high throughput
- **GraphQL** for client-driven aggregation: mobile, reporting, facade over legacy

Two governance layers manage traffic at these boundaries: the **API gateway** handles north–south ingress (auth, rate limiting, routing, lifecycle management); the **service mesh** handles east–west service-to-service communication (mTLS, retries, circuit breaking, service authorisation). These are complementary — most production API platforms require both ([[concepts/api-gateway]], [[patterns/sidecar-service-mesh]]).

### Integration Styles Are Architectural Choices

Hohpe & Woolf (→ [[sources/enterprise-integration-patterns]]) establish that the mechanism by which systems share data is itself an architectural decision with long-term consequences. The four integration styles, ordered by coupling:

1. **File Transfer**: systems produce/consume files on shared storage. Loose coupling; high latency; format negotiation burden.
2. **Shared Database**: systems share tables. Tight schema coupling; synchronous visibility; single SPOF.
3. **Remote Procedure Invocation**: synchronous call between systems. Temporal coupling; technology coupling; discovery and availability concerns.
4. **Messaging**: async communication via a broker. Loose coupling; decoupled availability; requires eventual consistency thinking.

Each style is appropriate in specific contexts — the error is applying one universally. Most large systems use all four styles for different integration points. See [[concepts/integration-styles]] and the full messaging pattern catalogue at [[concepts/messaging]].

### Domain Logic Patterns Are Chosen, Not Inherited

Fowler (→ [[sources/patterns-of-enterprise-application-architecture]]) establishes that how you organise domain logic is one of the most consequential architectural decisions, largely ignored by style-focused discussions:

- **Transaction Script**: simple procedural logic per business transaction. Appropriate for simple, low-duplication domains. Scales poorly as complexity grows.
- **Table Module**: one class per database table; logic co-located with data structure. O/R-impedance-aware but domain-model-limited.
- **Domain Model**: rich object model mirroring the domain, with behaviour on entities. Appropriate for complex, high-volatility domains. Requires an O/R mapping layer ([[databases/object-relational-mapping]]).
- **Service Layer**: defines an application's boundary, coordinates tasks, delegates domain logic to entities. The integration point for presentation and infrastructure layers.

The selection cascades: a domain model requires an identity map and unit-of-work to avoid double-fetching and partial writes; transaction scripts can use a simple data gateway. See [[patterns/business-logic-patterns]].

### Security: From Perimeter to Zero Trust

Traditional perimeter (zonal) security assumes traffic inside the network can be trusted. Cloud environments invalidate this — workloads share infrastructure, network addresses are dynamic. Zero trust replaces implicit network trust with explicit, identity-based verification at every hop (→ [[sources/mastering-api-architecture]]):
- API gateway validates OAuth2/JWT tokens at the north–south edge
- Service mesh enforces mTLS with SPIFFE workload identities for east–west traffic
- Kubernetes NetworkPolicies provide a defence-in-depth layer below the mesh

Threat modeling (STRIDE, DREAD, OWASP API Top 10) identifies what must be protected; the zero trust stack determines how each threat is mitigated ([[concepts/threat-modeling]], [[concepts/zero-trust]], [[concepts/oauth2-and-authn]]).

### Deployment ≠ Release

A critical operational distinction: **deployment** (code running in production) and **release** (activation for users) must be explicitly decoupled. Mechanisms: feature flags (code-level toggles), canary releases (traffic-split), and traffic mirroring (dark launch). The Knight Capital incident ($460M loss from a flag left enabled) illustrates the risk of flag accumulation — feature flags must be cleaned up after each migration (→ [[sources/mastering-api-architecture]]).

### Governance Is Architecture in Motion

Making architectural decisions once is insufficient — decisions must be enforced as the system evolves. *Building Evolutionary Architectures* (→ [[sources/building-evolutionary-architectures]]) is the originating source for this thinking and defines the formal framework:

**Three pillars of evolutionary architecture**: incremental change (supported by deployment pipelines), fitness functions (objective automated governance), and appropriate coupling (matching coupling tightness to business necessity — inappropriate coupling is the root cause of non-evolvability).

**[[concepts/fitness-functions]]** are any mechanism that provides an objective integrity assessment of an architecture characteristic — not just tests, but metrics, chaos experiments, monitoring alerts, and license monitors. They are classified by: atomic vs holistic, triggered vs continual, static vs dynamic, automated vs manual, temporal. Not everything needs the same treatment: key fitness functions block pipeline promotion; relevant ones are tracked; others are excluded.

**[[concepts/deployment-pipelines]]** are the automation mechanism: multi-stage pipelines carry a commit from source to production, with fitness functions as the gates. Cycle time — commit to production — is proportional to evolution speed (v ∝ c). Enterprise architects inject enterprise-wide fitness functions (security, compliance) into shared pipeline templates that all services inherit.

- **[[concepts/adrs]]**: documented decisions with explicit justification and compliance specifications, preventing re-litigation and loss of context.
- **[[concepts/risk-storming]]**: collaborative, structured risk identification before problems reach production.

**Evolvability varies by architecture style**: microservices (highest — fine-grained quanta, maximum decoupling), broker event-driven (high), service-based (medium–high, pragmatic), down to Big Ball of Mud (none). The key limiting factors are quantum size and the presence of cross-quantum transactions (the "strong nuclear force" that binds quanta together).

### Architecture Quality Is Measurable

Ciceri et al. (→ [[sources/software-architecture-metrics]]) establish that architectural quality must be measured systematically, not assessed by feel:

**Metrics become engineering** when applied continuously via automated pipelines with objective thresholds. The same transformation CI did for code integration, fitness function automation does for architectural integrity. ArchUnit and NetArchTest enforce structural rules at compile time; custom fitness functions verify distributed communication patterns at runtime.

**Structural metrics** (von Zitzewitz) provide objective measurements of modularity:
- **Propagation Cost** (CCD/n²): what fraction of the system is affected by a typical change. Target: <20% for 500–5,000 components; <10% for 5,000+.
- **Relative Cyclicity**: what fraction of components participate in dependency cycles. Target: ≤4% for components, 0% for packages.
- **Maintainability Level** (ML): composite score; target ≥75%. Systems below this threshold drift toward Big Ball of Mud.

**The Goal-Question-Metric framework** (Keeling, citing Basili & Weiss 1984) provides a disciplined approach to selecting *which* metrics to collect: start from a goal, derive questions that would answer it, then select metrics that answer those questions. This creates measurement traceability — every data point links to a goal — and prevents collecting metrics that nobody acts on. See [[concepts/goal-question-metric]].

**The DORA four key metrics** (Harmel-Law, citing Forsgren et al.) measure delivery performance: deployment frequency, lead time for changes, change failure rate, and time to restore service. These are leading indicators of organisational health — high performers score well on all four simultaneously, refuting the false trade-off between speed and stability. See [[concepts/four-key-metrics]].

### Complexity Is the Enemy of Maintainability

Ousterhout (→ [[sources/a-philosophy-of-software-design]]) provides the most precise treatment of what makes software hard to change: **complexity** is defined operationally — not as size or intricacy, but as anything that makes it harder to understand and modify the system. It manifests in three symptoms: change amplification (a simple change requires edits in many places), cognitive load (the engineer must hold too much in mind to make a safe change), and unknown unknowns (the engineer doesn't know what they need to know before making a change). Unknown unknowns are the most insidious because you cannot defend against what you can't see.

The root causes are just two: **dependencies** and **obscurity**. Dependencies are unavoidable but manageable; obscurity is eliminable. The primary tool is information hiding — each module should encapsulate a design decision, exposing only what callers need to know. This is the mechanism behind *deep modules*: a deep module has a small, simple interface and a large, complex implementation. The interface hides the complexity. Shallow modules are the anti-pattern: their interface is nearly as complex as their implementation, so they add interaction complexity without providing simplification.

**Complexity accumulates incrementally**: no single decision makes a system unmaintainable. It accretes via tactical programming — making each change "just work" with the minimum visible effort, deferring the cost of each decision to every future reader. Strategic programming invests ~10–15% of engineering time in design: writing abstractions, simplifying interfaces, correcting earlier mistakes before they compound. The compounding nature of complexity makes early investment dramatically more cost-effective than late remediation. See [[concepts/software-complexity]].

### Team Structure Is Architecture

Conway's Law (→ [[concepts/conways-law]]) is an architectural force: team structure encodes itself in system structure. Functional silos produce technically partitioned systems; domain-centric teams produce domain-partitioned systems. The **Inverse Conway Maneuver** deliberately designs team structure to produce the desired architecture — reorganise teams first, then the architecture follows.

Skelton & Pais (→ [[sources/team-topologies]]) operationalise this with a formal model:

**Four team types**: stream-aligned (owns a value stream end-to-end), platform (reduces cognitive load for stream-aligned teams by providing self-service capabilities), enabling (accelerates stream-aligned teams during capability uplift, then withdraws), complicated-subsystem (owns a specific technical depth no stream-aligned team can maintain). One team owns one component; no team owns the same component as another.

**Three interaction modes**: collaboration (high bandwidth, used during discovery), X-as-a-service (low friction, for stable capabilities), and facilitating (temporary, knowledge-transfer focused). Teams are designed for a primary mode; mode mismatches indicate a topology problem.

**Cognitive load as the sizing constraint**: a team's cognitive capacity is the real limit on what it can maintain. Domain complexity, team tooling, and infrastructure overhead all consume cognitive load. Platform teams exist to eliminate *extraneous* cognitive load (how to deploy, monitor, configure) so stream-aligned teams can spend their cognitive budget on *intrinsic* load (the domain problem). See [[concepts/cognitive-load]], [[concepts/team-topologies-model]].

### Delivery Performance Has Four Leading Indicators

Forsgren, Humble & Kim (→ [[sources/accelerate]]) spent four years (2014–2017) empirically studying what separates high from low-performing technology organisations across 23,000+ survey respondents. Their central finding: **speed and stability are positively correlated, not in tension**. High performers deploy more frequently, have shorter lead times, restore service faster, and have lower change failure rates — simultaneously. This refutes the bimodal IT hypothesis that stability requires sacrificing speed.

The **DORA four key metrics** operationalise this: deployment frequency (batch size proxy from Lean), lead time for changes (end-to-end cycle time), mean time to restore (recovery capability), and change failure rate (process quality). Cluster analysis consistently identifies discrete performance bands — elite, high, medium, low — with a gap between elite and the rest that increases year-on-year. See [[concepts/four-key-metrics]].

**Organisational culture independently predicts delivery performance** (→ [[concepts/westrum-culture]]): Westrum's generative culture (information flows freely, collaboration is rewarded, failure triggers inquiry rather than blame) is a separate predictor of both delivery performance and organisational outcomes. Critically, behaviour precedes belief — implementing CD practices improves culture, not the reverse. Culture cannot be mandated into existence; it is a lagging indicator of practices.

**Loosely coupled architecture is the single largest driver of CD capability** — larger than test automation and deployment automation combined in the 2017 data. Teams that can test and deploy their service independently, without coordinating outside the team, are the highest performers. This provides the strongest empirical validation of the Inverse Conway Maneuver (→ [[concepts/conways-law]]): designing team structure for independence directly enables independently deployable services.

### Transactions: Isolation Levels Are Widely Misunderstood

DDIA (→ [[sources/designing-data-intensive-applications]]) makes an important corrective observation: most databases marketed as "Serializable" actually implement Snapshot Isolation (MVCC), which permits **write skew** — two transactions both read an overlapping dataset, make non-conflicting writes, and violate an application invariant (e.g., two on-call doctors both go off-call). True serializability requires SSI (Serializable Snapshot Isolation, PostgreSQL since v9.1) or actual serial execution (VoltDB, H-Store). Engineers should verify isolation level semantics for their specific database, not trust marketing claims.

### Batch and Stream Processing as Derived Data

DDIA's Part III establishes a unified framework: data systems are divided into **systems of record** (source of truth, normalised, one representation) and **derived data systems** (rebuiltable from source, optimised for specific access patterns). The derived data layer — search indexes, caches, data warehouses, materialized views — is not optional; it is where performance is achieved.

**Batch processing** (MapReduce, Spark, Flink): bounded input, offline, immutable — key property is that inputs are never modified, enabling retry and replay.

**Stream processing** (Kafka + stream processors): unbounded event stream, low latency. Log-based brokers (Kafka) differ fundamentally from AMQP/JMS brokers: messages are retained on disk and consumers track their own offset, enabling fan-out, replay, and exactly-once processing. **Change Data Capture (CDC)** bridges the batch and stream worlds: the database's own write-ahead log becomes an event stream, enabling derived stores to stay up-to-date without dual writes.

**Event sourcing and CQRS** extend this further: the event log is the primary store; the mutable database is a derived projection. Multiple read models can be derived from the same event log. See [[streams/event-sourcing-cqrs]].

**The lambda architecture** (batch + stream in parallel, merged) is an anti-pattern — duplicate logic, complex merge, harder to maintain. The unified batch+stream model (Apache Flink, Apache Beam) handles both historical replay and live events through the same code path.

### The Data Communication Layer Is the Missing Piece

Bellemare (→ [[sources/building-event-driven-microservices]]) identifies the historically missing architectural layer: while the **business communication structure** (business processes, team relationships) and **implementation communication structure** (APIs, service calls) are well-understood, the **data communication structure** — the mechanism by which domain data flows across the organisation — has been largely absent or ad hoc in traditional architectures.

Without an explicit data communication layer, services must both implement business logic AND serve as data-access endpoints for every consumer that needs their data. This creates point-to-point data coupling and proliferation of APIs that are really data-synchronisation mechanisms in disguise.

**Event brokers formalise the data communication layer**: each service produces its domain data to event streams; any consumer can access that data independently and at their own pace. Bounded contexts are decoupled not just at the API level but at the data level. The event stream — not the API — becomes the single source of truth for each domain.

### Domain-Driven Design: Language Before Architecture

Evans (→ [[sources/domain-driven-design]]) and Khononov (→ [[sources/learning-domain-driven-design]]) establish DDD's core principle: a model that doesn't live in the code is just a picture. The ubiquitous language must pervade conversations, documentation, and code — when they diverge, the code becomes the real model by default, and the document becomes noise.

**Strategic DDD** starts with business domain structure:
- **Subdomain taxonomy** (core / generic / supporting) drives every implementation decision. Core subdomains = high complexity, high volatility, best engineers. Generic subdomains = use off-the-shelf. Supporting subdomains = simple CRUD, can outsource.
- **Bounded contexts** are the consistency boundary of a ubiquitous language. They are *designed* (our choice); subdomains are *discovered* (business strategy). One team owns one bounded context.
- **Context maps** make inter-context integration patterns explicit: Shared Kernel, Customer/Supplier, Conformist, ACL, OHS, Published Language, and Separate Ways each represent a different team relationship and coupling type (→ [[patterns/context-map]]).

**Tactical DDD** provides the building blocks for complex domain models: value objects (no identity, immutable), entities (identity persists through time), aggregates (consistency boundary, modified as a unit), domain events (facts that occurred), and domain services (stateless operations that don't belong on an entity). The right tactical pattern is chosen per subdomain — complex core subdomains warrant rich domain models; simple supporting subdomains warrant transaction scripts (→ [[patterns/business-logic-patterns]]).

### Monolith Decomposition Is a Journey, Not a Cut-over

Newman (→ [[sources/monolith-to-microservices]]) establishes that "big bang" rewrites are among the highest-risk strategies in software. The characteristic outcome is two systems in production simultaneously, both half-maintained. Migration must be incremental, with each step independently deployable and reversible.

**Core migration patterns**:
- **Strangler Fig** (→ [[patterns/strangler-fig]]): intercept calls at the edge, redirect to the new implementation incrementally. The old system shrinks; the new system grows. The proxy is the safety net.
- **Branch by Abstraction** (→ [[patterns/branch-by-abstraction]]): for deeply embedded capabilities, introduce an abstraction layer, implement the new variant behind it, migrate callers gradually, remove the old implementation.
- **Parallel Run** (→ [[patterns/parallel-run]]): run both implementations simultaneously; return results from the old; compare against the new. Use to verify correctness before committing to the new path (GitHub Scientist).

**Database decomposition** is the hard part. Every shared-database coupling is a hidden contract. Newman's taxonomy of ~12 decomposition patterns includes database views (read-only facade over old schema), wrapping services (API encapsulates shared table access), tracer writes (dual-write with progressive migration), and synchronise-in-application (two stores kept consistent via application code, used transitionally). See [[concepts/evolutionary-database-design]].

### Consensus Is Required for Linearizability

DDIA and [[sources/understanding-distributed-systems]] agree: linearizability requires consensus. Fault-tolerant consensus (Raft, Paxos, Zab) requires a strict majority quorum, has overhead from synchronous replication, and is sensitive to network delays. ZooKeeper and etcd implement consensus as a service for leader election, partition assignment, and distributed locks. The full equivalence theorem: linearizable CAS ≡ total order broadcast ≡ atomic transaction commit ≡ distributed locks ≡ uniqueness constraints — all require consensus. See [[distributed/consensus-algorithms]].

### Observability Is Not Optional

Observability = metrics (detect symptoms) + logs (explain causes) + traces (causally ordered cross-service view). Monitoring tells you that something is wrong; observability tells you why.

SLIs/SLOs with error budgets replace naive alerting — alert on burn rate, not raw thresholds. Allspaw's finding: **MTTR matters more than MTBF**. At hyperscale, MTBF approaches zero asymptotically; the resilience lever is recovery speed, not prevention.

### ~50% of Architecture Is Soft Skills

FOSA is unusually explicit: negotiation, facilitation, leadership, and communication are co-equal with technical knowledge for architect effectiveness. Key practices: turn architecture decisions into favours (not mandates), demonstrate rather than argue, maintain the right level of team control (elastic leadership), use the 4 C's (communication, collaboration, clarity, conciseness).

### SRE Operationalises Reliability as an Engineering Discipline

Beyer et al. (→ [[sources/site-reliability-engineering]]) establish that running production software is an engineering activity, not a maintenance activity. The central mechanism is the [[operations/error-budgets|error budget]] — defined as `1 − SLO target`, it converts the dev/ops conflict (devs want fast releases, ops want stability) into an aligned incentive: the budget is a shared resource that gets spent by deployments and incidents alike. When exhausted, releases halt until reliability work restores it.

The discipline rests on several enforced principles: **100% is always the wrong target** (over-engineering reliability past user-perceptible thresholds wastes engineering capacity that could go to features); **toil capped at 50%** (manual operational work eats engineering capacity exponentially if uncapped); **MTTR matters more than MTBF** at scale (failure is constant; recovery speed is the lever); **blameless postmortems** (blame destroys the information needed to prevent recurrence). See [[operations/site-reliability-engineering]], [[operations/availability]], [[operations/incident-management]].

### Chaos Engineering Discovers Unknown Failure Modes

Rosenthal & Jones (→ [[sources/chaos-engineering]]) make the case that complex distributed systems have failure modes nobody knows to look for. Traditional testing verifies known properties; chaos engineering creates new knowledge — a disproved hypothesis reveals something previously unknown about the system.

Five principles define the discipline: **steady-state hypothesis** (define normal output, then test whether it holds under turbulence); **vary real-world events** (failure modes that actually occur, not the easy ones); **run in production** (staging differs from production in ways humans cannot fully predict); **automate continuously** (the solution space is unknowable; dependencies change over time); **minimise blast radius** (control vs experimental groups, blast radius progression). The Netflix Chaos Monkey lineage matured into Continuous Verification — a CI/CD/CV progression where automated experiments verify system behaviour as a pipeline stage. See [[operations/chaos-engineering]].

The discipline's deeper insight is sociotechnical: the most valuable Game Days don't find bugs; they distil expert mental models that automation cannot capture (the [[sources/chaos-engineering]] *Law of Fluency*). Game Days, ChAP, and Disasterpiece Theater are as much about transferring tacit knowledge as testing the system.

### Performance Is Queueing Theory in Disguise

The newer pages [[distributed/queueing-theory]] and [[distributed/backpressure]] surface a discipline scattered across multiple sources. Most production performance failures are queueing failures wearing other names: "slow database" is a queue at the connection pool; "cascading failure" is a queue at every blocked thread; "tail latency amplification" is a statistical consequence of queues in series.

Three results dominate: **Little's Law** (`L = λW`) sizes capacity and explains why unbounded queues produce unbounded latency; the **utilisation curve** (`W = S/(1−ρ)`) shows response time bending hyperbolically past 70% utilisation — explaining why "run servers hot for efficiency" is wrong; **percentile arithmetic** shows that averaging averages is mathematically meaningless and that P99 of a fan-out request approaches the P99.9 of a single backend call. Architects who internalise these results set utilisation targets, bound every queue, and account for fan-out tail amplification at design time. See [[distributed/queueing-theory]], [[distributed/backpressure]], [[concepts/stability-patterns]].

### Stability Patterns Form a Composable Set, Not Independent Choices

Nygard's stability patterns ([[concepts/stability-patterns]]) — timeout, circuit breaker, bulkhead, retry, fail fast, shed load, backpressure, handshaking, decoupling middleware, governor, test harnesses — defend against specific antipatterns and compose at different boundaries. A production-grade integration point applies *all* of them at different layers: timeout on the outgoing call, circuit breaker for sustained failure, retry with backoff for transient failure, bulkhead to isolate the dependency's thread pool, fail fast on incoming requests when the breaker is open, handshaking with the load balancer. Applying the patterns at only one layer leaves known failure modes at the others.

### Release Is Progressive, Not Atomic

[[patterns/progressive-delivery]] unifies canary, blue-green, ring deployment, dark launch, parallel run, and feature flags as different points on a single design space. The defining shift is **decoupling deployment from release**: code reaches production without immediately being visible to users; visibility ramps via routing, traffic splitting, or [[concepts/feature-flags]]. SRE's "roll back first, diagnose second" makes rollback a routine, low-status action rather than a defeat. The economic case (from [[sources/release-it]]) is direct: a $50K investment in zero-downtime deployment pays back 18× over five years through avoided downtime alone.

### Cost Is a Quality Attribute

Cost is in trade-off with most other -ilities and is determined far more by architecture than by implementation. A poorly-chosen architecture can be 10× more expensive to run than an apt one, and no code-level optimisation closes the gap. The framing from [[sources/release-it]]: architecture decisions are financial decisions playing out over years. Most engineers optimise development cost (where their incentives point); the organisation's interest demands optimising lifetime cost — dominated by operations, change, and downtime. See [[concepts/cost-as-architectural-force]].

---

## Sources in This Wiki

| Slug | Title | Author | Ingested |
|------|-------|--------|---------|
| [[sources/understanding-distributed-systems]] | Understanding Distributed Systems | Roberto Vitillo | 2026-05-13 |
| [[sources/fundamentals-of-software-architecture]] | Fundamentals of Software Architecture | Richards & Ford | 2026-05-13 |
| [[sources/mastering-api-architecture]] | Mastering API Architecture | Gough, Bryant, Auburn | 2026-05-13 |
| [[sources/building-evolutionary-architectures]] | Building Evolutionary Architectures | Ford, Parsons, Kua | 2026-05-13 |
| [[sources/designing-data-intensive-applications]] | Designing Data-Intensive Applications | Martin Kleppmann | 2026-05-13 |
| [[sources/software-architecture-the-hard-parts]] | Software Architecture: The Hard Parts | Ford, Richards, Sadalage, Dehghani | 2026-05-14 |
| [[sources/software-architecture-patterns]] | Software Architecture Patterns | Mark Richards | 2026-05-14 |
| [[sources/building-event-driven-microservices]] | Building Event-Driven Microservices | Adam Bellemare | 2026-05-14 |
| [[sources/learning-domain-driven-design]] | Learning Domain-Driven Design | Vlad Khononov | 2026-05-14 |
| [[sources/team-topologies]] | Team Topologies | Skelton & Pais | 2026-05-14 |
| [[sources/domain-driven-design]] | Domain-Driven Design | Eric Evans | 2026-05-14 |
| [[sources/monolith-to-microservices]] | Monolith to Microservices | Sam Newman | 2026-05-15 |
| [[sources/enterprise-integration-patterns]] | Enterprise Integration Patterns | Hohpe & Woolf | 2026-05-15 |
| [[sources/patterns-of-enterprise-application-architecture]] | Patterns of Enterprise Application Architecture | Martin Fowler et al. | 2026-05-18 |
| [[sources/release-it]] | Release It! | Michael Nygard | 2026-05-19 |
| [[sources/foundations-of-scalable-systems]] | Foundations of Scalable Systems | Ian Gorton | 2026-05-21 |
| [[sources/software-architecture-metrics]] | Software Architecture Metrics | Ciceri et al. | 2026-05-22 |
| [[sources/a-philosophy-of-software-design]] | A Philosophy of Software Design | John Ousterhout | 2026-05-18 |
| [[sources/accelerate]] | Accelerate: The Science of Lean Software and DevOps | Forsgren, Humble & Kim | 2026-05-18 |
| [[sources/site-reliability-engineering]] | Site Reliability Engineering | Beyer, Jones, Petoff, Murphy (eds.) | 2026-05-27 |
| [[sources/chaos-engineering]] | Chaos Engineering: System Resiliency in Practice | Rosenthal & Jones (eds.) | 2026-05-28 |

---

## Open Questions

- Newman's migration patterns (strangler fig, parallel run) assume HTTP/REST interfaces are easy to intercept. How do these apply to systems with tight binary protocol coupling or embedded SDK clients?
- Evo-arch's evolvability scorecard (microservices highest) appears to conflict with FOSA's nuanced view that microservices is not always appropriate. Where exactly is the tension, and what criteria reconcile it?
- DDIA's coordination-avoiding correctness model (integrity without distributed transactions via end-to-end IDs) is compelling but nascent. What production systems have successfully adopted it at scale, and what does failure look like?
- Von Zitzewitz's Propagation Cost thresholds (20% for <5,000 components, 10% for >5,000) are empirical rules. How do they interact with intentional hub services (shared auth, shared logging) that are designed to have high fan-in?
- The DORA four key metrics are organisational health indicators, not system health indicators. Goodhart's Law applies: once teams know they're measured on deployment frequency, they may deploy smaller batches with less value. What counterbalances?
- Evans' Large-Scale Structure patterns (Responsibility Layers, System Metaphor) were articulated in 2003. Are they still applicable to cloud-native, event-driven systems, or have bounded contexts and event streams replaced their function?
- Team Topologies assumes one team per component and one component per team. How does this interact with platform engineering, where a single platform team may be the effective owner of infrastructure used by dozens of stream-aligned teams?
- SRE's "100% is always the wrong target" argument depends on users having degradation thresholds below 100%. Where does this break down — life-critical systems, financial settlement, regulated environments — and how should SLO targets be set in those contexts?
- Chaos engineering's "experimentation creates new knowledge" claim sits uneasily with the practical experience that most chaos experiments confirm what was already known. What does a high-value experiment look like in a mature programme, and at what point does running more experiments stop adding value?
- The eight-page lint pass added [[concepts/feature-flags]] as application-layer release control and [[concepts/cost-as-architectural-force]] as a quality attribute. Both deserve their own ingest source — multi-tenancy, deep security, and ML systems remain genuinely unaddressed by the current corpus.

---

## Key Authors

- [[authors/roberto-vitillo]] — *Understanding Distributed Systems*
- [[authors/mark-richards]] — *Fundamentals of Software Architecture* (with Ford), *Software Architecture Patterns*, *Software Architecture: The Hard Parts*
- [[authors/neal-ford]] — *Fundamentals of Software Architecture* (with Richards), *Building Evolutionary Architectures*, *Software Architecture: The Hard Parts*, contributor *Software Architecture Metrics* ch. 8
- [[authors/rebecca-parsons]] — *Building Evolutionary Architectures* (with Ford, Kua)
- [[authors/patrick-kua]] — *Building Evolutionary Architectures* (with Ford, Parsons)
- [[authors/james-gough]] — *Mastering API Architecture* (with Bryant, Auburn)
- [[authors/daniel-bryant]] — *Mastering API Architecture* (with Gough, Auburn)
- [[authors/matthew-auburn]] — *Mastering API Architecture* (with Gough, Bryant)
- [[authors/martin-kleppmann]] — *Designing Data-Intensive Applications*
- [[authors/pramod-sadalage]] — *Software Architecture: The Hard Parts* (with Ford, Richards, Dehghani)
- [[authors/zhamak-dehghani]] — *Software Architecture: The Hard Parts* (with Ford, Richards, Sadalage); originator of Data Mesh
- [[authors/adam-bellemare]] — *Building Event-Driven Microservices*
- [[authors/vlad-khononov]] — *Learning Domain-Driven Design*
- [[authors/eric-evans]] — *Domain-Driven Design* (2003); originator of the DDD vocabulary
- [[authors/matthew-skelton]] — *Team Topologies* (with Pais)
- [[authors/manuel-pais]] — *Team Topologies* (with Skelton)
- [[authors/sam-newman]] — *Monolith to Microservices*
- [[authors/gregor-hohpe]] — *Enterprise Integration Patterns* (with Woolf)
- [[authors/bobby-woolf]] — *Enterprise Integration Patterns* (with Hohpe)
- [[authors/martin-fowler]] — *Patterns of Enterprise Application Architecture*
- [[authors/michael-nygard]] — *Release It!*; coined Circuit Breaker, Bulkhead, Timeout in the software context
- [[authors/ian-gorton]] — *Foundations of Scalable Systems*
- [[authors/christian-ciceri]] — Editor, *Software Architecture Metrics*; contributor ch. 5 (private builds)
- [[authors/andrew-harmel-law]] — Contributor *Software Architecture Metrics* ch. 1; DORA four key metrics
- [[authors/rene-weiss]] — Contributor *Software Architecture Metrics* ch. 2; fitness function testing pyramid
- [[authors/dave-farley]] — Contributor *Software Architecture Metrics* ch. 3; testability and deployability as architectural drivers
- [[authors/carola-lilienthal]] — Contributor *Software Architecture Metrics* ch. 4; Modularity Maturity Index
- [[authors/joao-rosa]] — Contributor *Software Architecture Metrics* ch. 6; KPI Value Tree; sociotechnical architecture
- [[authors/eoin-woods]] — Contributor *Software Architecture Metrics* ch. 7; MTTR > MTBF; RPO/RTO measurement
- [[authors/alexander-von-zitzewitz]] — Contributor *Software Architecture Metrics* ch. 9; creator of Sonargraph; structural metrics
- [[authors/michael-keeling]] — Contributor *Software Architecture Metrics* ch. 10; Goal-Question-Metric framework
- [[authors/john-ousterhout]] — *A Philosophy of Software Design*; Stanford CS professor; deep modules, information hiding, complexity management
- [[authors/nicole-forsgren]] — *Accelerate* (with Humble, Kim); DORA research programme; psychometric rigour in DevOps research
- [[authors/jez-humble]] — *Accelerate* (with Forsgren, Kim); co-author of *Continuous Delivery*; CI/CD and Lean practitioner
- [[authors/gene-kim]] — *Accelerate* (with Forsgren, Humble); *The Phoenix Project*; high-performing technology organisations
- [[authors/betsy-beyer]] — co-editor of *Site Reliability Engineering*; cultural and documentary aspects of reliability at Google
- [[authors/benjamin-treynor-sloss]] — wrote ch. 1 of *Site Reliability Engineering*; originator of the term SRE; creator of the error budget model
- [[authors/casey-rosenthal]] — co-editor of *Chaos Engineering*; built Netflix's Chaos Engineering team; co-author of the Principles of Chaos Engineering
- [[authors/nora-jones]] — co-editor of *Chaos Engineering*; safety science and sociotechnical perspective on resilience
