---
title: "Fundamentals of Software Architecture"
type: source
tags: [architecture, patterns, soft-skills, fundamentals]
sources: [fundamentals-of-software-architecture]
created: 2026-05-13
updated: 2026-05-14
---

# Fundamentals of Software Architecture

**Authors:** [[authors/mark-richards]], [[authors/neal-ford]]
**Published:** 2020
**Slug:** `fundamentals-of-software-architecture`

## Overview

A breadth-first guide to software architecture, covering what the discipline is, how to think about it, and how to practise it. Unlike books focused on a single style or problem domain, FOSA attempts to map the entire landscape: from the definition of architecture itself and the metrics of modularity, through a taxonomy of 8 architecture styles with trade-off scorecards, to the soft skills (ADRs, risk storming, negotiation, team leadership) that distinguish effective architects from technically competent ones.

The thesis is that architecture is not primarily about structure — it is about making decisions under constraints. The book's two governing laws are: (1) *Everything in software architecture is a trade-off*, and (2) *Why is more important than how.* Every tool the book offers (fitness functions, ADRs, the architecture quantum, risk matrices) is an instrument for making trade-offs visible and decisions defensible.

The audience is backend developers moving into architecture or early-career architects seeking a conceptual map of the whole field. Richards & Ford recommend pairing with Kleppmann's *Designing Data-Intensive Applications* (→ [[sources/designing-data-intensive-applications]]) for depth on data systems.

## Key Claims

- Software architecture is the union of four things: structure, architecture characteristics ("-ilities"), architecture decisions, and design principles. Most practitioners only think about structure.
- Every architecture characteristic (scalability, testability, etc.) must be measurable; if it can't be measured, it can't be governed.
- The [[concepts/architecture-quantum]] is the unit of scope for architecture characteristics. Differing quanta → distributed architecture is likely required.
- Domain partitioning is almost always preferable to technical partitioning for top-level component design (→ [[concepts/technical-vs-domain-partitioning]]).
- Distributed architectures incur a fixed cost captured by the 8 Fallacies of Distributed Computing; the decision to go distributed must be justified against that cost.
- ~50% of being an effective architect is soft skills: negotiation, leadership, facilitation, and communication.

## Chapter Notes

### Part I — Foundations

**Ch 1 — Introduction**
Defines architecture as the combination of four things: (1) **structure** — the architecture style(s) implemented; (2) **architecture characteristics** — "-ilities" the system must support; (3) **architecture decisions** — hard rules constraining how the system is built (e.g., only business/services layers may access the database); (4) **design principles** — guidelines, not rules, for how the system *should* be built (e.g., prefer async messaging within microservices where feasible). The distinction between decisions and principles matters: decisions form constraints enforced by governance; principles guide teams in making the right technical choice within those constraints.

Architecture decisions may be challenged through a **variance** process — an ARB (Architecture Review Board) or chief architect approves formal exceptions to established decisions based on justification and trade-off analysis. This is the formal mechanism for escaping a decision that doesn't fit a particular context.

**Engineering practices vs process:** The chapter distinguishes software development *process* (team structure, meetings, workflow — how people organise and interact) from *engineering practices* (process-agnostic, repeatable-benefit techniques such as continuous integration, automated testing, infrastructure-as-code). Process is largely orthogonal to architecture; engineering practices are not. Microservices assume automated provisioning, automated testing, and deployment pipelines — building microservices without these practices creates severe friction.

> "All architectures become iterative because of unknown unknowns, Agile just recognises this and does it sooner." (Ch 1)

The Pets.com failure (early internet era) illustrates why elastic scale became a first-class architectural concern: too much success killed the business because the infrastructure couldn't scale. This hard lesson drove the engineering frameworks architects now take for granted.

Introduces the 8 core expectations of a software architect: make decisions, continually analyse, keep current, ensure compliance, diverse exposure, business domain knowledge, interpersonal skills, navigate politics. Gerald Weinberg's dictum applies: *"No matter what they tell you, it's always a people problem."*

**Ch 2 — Architectural Thinking**
Four aspects of architectural thinking: (1) understanding the difference between architecture and design and collaborating bidirectionally with development teams; (2) having technical breadth while maintaining some depth; (3) analysing trade-offs; (4) understanding business drivers and translating them into architecture characteristics.

**The knowledge pyramid:** All knowledge partitions into three zones: *stuff you know* (current expertise, requires active maintenance), *stuff you know you don't know* (things you've heard of but can't use), and *stuff you don't know you don't know* (the largest zone — the source of unknown unknowns that derail projects). Developers should maximise depth; architects should maximise *breadth* — how far the "know you don't know" zone extends into the bottom. An architect who knows five caching solutions at a moderate level is more valuable than one who knows one deeply.

**The Frozen Caveman Anti-Pattern:** An architect who always reverts to a pet irrational concern (e.g., "But what if we lose Italy?") born of a past trauma. Risk assessment must be realistic — past incidents create cognitive bias toward their repetition probability. Effective architects override this by asking whether the concern is genuine or perceived.

**The bottleneck trap:** An architect who takes ownership of code on the critical path (framework code, underlying infrastructure) becomes a bottleneck — they're not a full-time developer, so they're slower than the team at this code while also being unavailable for architecture work. Solution: delegate the critical path to developers; architect writes business-domain code one or two iterations ahead of the team, plus POC work, tech debt stories, bug fixes, and automation tooling.

> "Programmers know the benefits of everything and the trade-offs of nothing. Architects need to understand both." — Rich Hickey (creator of Clojure) (Ch 2)

The topic vs queue trade-off example is a canonical illustration: topics provide extensibility and decoupling but sacrifice data security (easy to wiretap), heterogeneous contracts, and per-consumer autoscaling. Neither is categorically better — the choice depends on which trade-offs the business context can tolerate.

**Ch 3 — Modularity**
Software systems tend toward entropy — modularity degrades unless architects actively work against it. The chapter provides the full measurement toolkit for assessing and improving structural health.

Cohesion types from best to worst: functional → sequential → communicational → procedural → temporal → logical → coincidental. **LCOM (Lack of Cohesion in Methods)**: measures the degree to which a class's methods do not share instance fields. High LCOM = candidate for splitting. Practically valuable when migrating architectures: LCOM exposes incidentally coupled "utility" classes that were never a coherent unit and should be separated before extraction.

Afferent coupling (Ca, inbound fan-in) vs efferent coupling (Ce, outbound fan-out). **Robert Martin's derived metrics**: abstractness (A = abstract types / total types), instability (I = Ce / (Ca + Ce)), distance from Main Sequence (D = |A + I − 1|). Components in the *Zone of Pain* (low A, low I — concrete and stable, hard to change) or the *Zone of Uselessness* (high A, high I — abstract but depended on by nothing) are structural defects.

**Connascence** (Meilir Page-Jones, 1996): generalises coupling. Two components are connascent if a change to one requires a change to the other. Static connascence (source-level, weakest → strongest): Name, Type, Meaning/Convention, Position, Algorithm. Dynamic connascence (runtime, avoid): Execution, Timing, Values, Identity.

**Jim Weirich's two rules for connascence:**
- *Rule of Degree*: convert strong forms of connascence into weaker forms (e.g., refactor magic constants to named constants — CoM → CoN)
- *Rule of Locality*: as the distance between software elements increases, use weaker forms of connascence (strong coupling close together is a code smell; strong coupling across service boundaries is an architectural defect)

**Limitation for distributed systems**: connascence was defined for structured/OO code within a monolith. It doesn't directly address the synchronous vs asynchronous decision in distributed architectures. The [[concepts/architecture-quantum]] concept extends connascence to this scope.

**Ch 4 — Architecture Characteristics**
"-ilities" are the non-functional requirements that architecture must support. The book prefers "architecture characteristics" over "non-functional requirements" (self-denigrating) and "quality attributes" (implies after-the-fact assessment). Three criteria to qualify: (1) specifies a non-domain design consideration, (2) influences a structural design decision, (3) is critical to application success.

Categorised as: **operational** (availability, continuity, performance, recoverability, reliability/safety, robustness, scalability), **structural** (configurability, extensibility, installability, maintainability, portability, supportability, upgradeability), and **cross-cutting** (accessibility, archivability, authentication, authorisation, legal, privacy, security, usability).

**Italy-ility:** A team working for a client with a centralised architecture was told, at each design review, "But what if we lose Italy?" Years earlier, a freak communication outage had severed the head office from Italian branches. The team eventually coined *Italy-ility* — a unique compound of availability, recoverability, and resilience. The story illustrates that real architectures often require named, custom characteristics drawn from specific organisational history. No standard list is ever complete.

**Least worst architecture:** Because each characteristic adds design cost *and* conflicts with others (security degrades performance; deployability conflicts with simplicity), architects should identify the *fewest* characteristics that matter most — never the most. Optimising for everything produces generic solutions that work for nothing.

> "Never shoot for the best architecture, but rather the least worst architecture." (Ch 4)

**Scalability vs elasticity**: scalability is the ability to handle *growing concurrent load*; elasticity is the ability to *respond to sudden spikes*. Many systems require both, but they are different constraints — scalability is a sustained-load problem; elasticity is a burst problem. They are easily conflated in requirements gathering.

**Ch 5 — Identifying Architecture Characteristics**
Three sources of characteristics: (1) explicit requirements from domain and stakeholder statements; (2) implicit domain knowledge — baseline expectations never stated; (3) domain concerns translated into architectural needs. Architects must identify both explicit and implicit.

**Vasa anti-pattern:** designing an architecture that supports every possible characteristic produces a generic solution optimised for nothing — overspecified, like the 17th-century Swedish warship that sank on its maiden voyage because excessive armament made it top-heavy. The solution is stakeholder collaboration: ask domain stakeholders to *select* the top 3 characteristics from a prepared list. This forces genuine prioritisation and surfaces hidden disagreements. Do not ask them to rank; asking them to select forces elimination.

**Domain concern → architecture characteristic translation table:**

| Domain concern | Architecture characteristics |
|---|---|
| Mergers/acquisitions | Interoperability, scalability, adaptability, extensibility |
| Time to market | Agility + testability + deployability (not just agility) |
| User satisfaction | Performance, availability, fault tolerance, testability, deployability, agility, security |
| Competitive advantage | Agility, testability, deployability, scalability, availability, fault tolerance |
| Time and budget | Simplicity, feasibility |

"Agility ≠ time to market" is a common mistranslation: time to market requires agility *and* testability *and* deployability together. An architect who selects only agility misses two-thirds of the solution.

**Architecture katas** (Ted Neward): teaching technique for practicing architecture characteristic extraction. Each kata has four sections: Description, Users, Requirements, Additional Context.

**Silicon Sandwiches kata** (worked example): explicit characteristics are scalability (millions of users), elasticity (mealtime bursts), and performance. Implicit: availability, reliability, security. The customizability requirement is a pivotal case: it can be addressed at the *architecture* level via microkernel, or at the *design* level via the Template Method pattern — the right answer depends on how many custom variants exist and how often they change.

**Ivory Tower Architect anti-pattern:** an architect who makes decisions in isolation from the implementation team. Decisions made without implementation context produce friction and resentment. Solution: collaborate continuously with development teams during the component identification and design phases.

**Eliminate-the-least-important exercise:** when stakeholders cannot agree on priorities, ask them to eliminate the least important rather than rank the most important. Elimination is cognitively easier and surfaces the truly critical characteristics.

> "There are no wrong answers in architecture, only expensive ones." — Mark Richards (Ch 5)

**Ch 6 — Measuring and Governing Architecture Characteristics**
Three problems with "architecture characteristics" as a concept: they are not physics (vague and inconsistently defined), wildly varying definitions exist within the same organisation, and most are composite (agility decomposes into testability + deployability + modularity). Objective definitions create a ubiquitous language that prevents talking past each other.

**Performance measurement nuances:** average is insufficient — architects must define p99, first contentful paint, first CPU idle, and K-weight budgets (maximum bytes allowed for a page download). Statistical models with alarm thresholds make performance a measurable characteristic rather than a gut feeling.

**Cyclomatic Complexity (CC):** introduced by Thomas McCabe Sr. in 1976. Formula: CC = E − N + 2 (single function; E = edges, N = nodes in the control-flow graph). Industry threshold: CC ≤ 10 is acceptable; the authors prefer ≤ 5. Crap4J combines CC with test coverage to identify high-risk methods (high CC + low coverage = "crap"). CC > 50 is considered impossible to maintain. An interesting side-effect of TDD: the discipline of writing tests first forces small, focused methods, which accidentally produces lower CC even when CC is not an explicit goal.

**Process measures:** testability is measured by code coverage thresholds; deployability by success/fail deployment ratio, deployment duration, and count of post-deployment issues raised. Agility decomposes into testability + deployability + (modular structure enabling both).

**Fitness functions framing:** "NOT a new framework, a new perspective on existing tools." JDepend, ArchUnit, NetArchTest, Chaos Monkey — all existed before the term "fitness function." The [[concepts/fitness-functions]] abstraction frames them as a unified governance mechanism rather than disparate tests.

**Netflix Simian Army** (named from Chaos Monkey, which terminates production instances): Conformity Monkey checks services against governance rules; Security Monkey identifies security defects and vulnerabilities; Janitor Monkey decommissions orphaned services (services with no active callers). Chaos Kong simulates the failure of an entire AWS region.

**Chaos Engineering origin:** Netflix moved to AWS and lost direct control of hardware operations. Anxiety about this drove the creation of Chaos Monkey as a way to ensure services were resilient by design. The insight: if random terminations cannot break the system, planned terminations certainly won't.

Fitness functions framed as engineering checklists (Atul Gawande's *The Checklist Manifesto*): they enforce discipline not because engineers lack knowledge, but because complex systems create too many simultaneous concerns to rely on memory alone.

> **Key principle:** "Architects must ensure that developers understand the purpose of the fitness function before imposing it on them." Fitness functions imposed without explanation breed resentment and workarounds.

**Ch 7 — Scope of Architecture Characteristics**
Traditional assumption: architecture characteristics apply at system level. Now outdated. The [[concepts/architecture-quantum]] concept was developed during the writing of *Building Evolutionary Architectures* specifically because the authors needed a measure that included external dependencies (like databases) that affect operational characteristics but lie outside the code base. Code-level metrics (CC, coupling) are insufficient for this.

Connascence is extended to distributed systems: **synchronous connascence** means the caller waits for the callee — both services must exhibit the same operational characteristics for the duration of the call, otherwise timeouts and reliability failures occur. **Asynchronous connascence** via events/queues allows fire-and-forget semantics, decoupling services' operational characteristics.

**DDD bounded context** (Eric Evans): each entity works best within a localised context with its own ubiquitous language. Rather than a unified `Customer` class across the entire organisation, each domain creates its own `Customer` and reconciles differences at integration points. This recognises that coupling shared domain types across service boundaries creates hidden connascence.

**Going, Going, Gone kata** (worked example of quantum-based scoping): an online auction with three quanta, each with distinct characteristics:
- *Bidder feedback* (bid stream + video): availability, scalability, performance
- *Auctioneer* (the live auctioneer, most critical path): availability, reliability, scalability, elasticity, performance, security
- *Bidder* (online bidders): reliability, availability, scalability, elasticity

The auctioneer has higher reliability requirements than bidders (one dropped auctioneer connection stops the auction; one dropped bidder connection is a bad experience but not catastrophic). Scoping characteristics at the quantum level surfaces this difference earlier than system-level analysis would, enabling hybrid architecture design during initial decomposition.

**Ch 8 — Component-Based Thinking**
A component is the physical manifestation of a module (jar in Java, dll in .NET, gem in Ruby). The component is the lowest level of a software system that an architect directly interacts with — class and function design is delegated to tech leads and developers. Architecture is independent of development process, with the notable exception of engineering practices (CI, deployment automation) that some architecture styles (microservices) depend on.

**Conway's Law** (Melvin Conway, late 1960s): "Organisations which design systems are constrained to produce designs which are copies of the communication structures of those organisations." Technically-partitioned architectures emerge naturally from technically-organised teams (frontend dept, backend dept, DBA dept), which is why the layered monolith is the default architecture in many organisations.

**Inverse Conway Maneuver** (Jonny Leroy, ThoughtWorks): deliberately evolve team and organisational structure to promote the desired architecture, rather than letting team structure dictate architecture. Domain-partitioned architectures require cross-functional teams owning a complete domain end-to-end.

**Component identification flow** (iterative cycle): (1) identify initial components, (2) assign requirements/stories to components, (3) analyse roles and responsibilities for granularity fit, (4) analyse architecture characteristics to determine if differing characteristics require splitting a component, (5) restructure. The cycle repeats until the design stabilises. An initial component design is expected to be wrong — the value is in iterating quickly.

**Entity Trap anti-pattern:** creating one component per domain entity (CustomerManager, OrderManager, PaymentManager) is not an architecture — it is a component-relational mapping of a framework to a database. This anti-pattern arises from mistaking database entities for workflows. Components created this way are too coarse-grained and provide no guidance on source code structure. Naked Objects and Rails scaffolding exist precisely for simple CRUD needs that don't require architecture.

**Component discovery techniques:**
- *Actor/Actions* (Rational Unified Process): identify actors and the actions they perform; works for all system types, monolithic or distributed
- *Event Storming* (DDD-based): identify events and messages in the system; builds components around event/message handlers; ideal for distributed architectures that will use messaging
- *Workflow approach*: identify key roles and the workflows they engage in; similar to event storming but without the explicit message-passing constraint

**Architecture style vs pattern distinction:** an architecture *style* defines the overarching structure of how the UI, backend, and datastore are organised and interconnected. An architecture *pattern* is a lower-level design structure that solves a specific problem within a style (e.g., how to achieve high scalability within a microservices style via event-driven messaging).

**Quantum → monolith vs distributed decision:** if a system's initial component design yields one set of architecture characteristics (one quantum), a monolithic architecture is viable. If different components need meaningfully different characteristics (e.g., the auctioneer needs higher reliability than bidders), a distributed architecture is required. This decision can be made earlier using quantum analysis than by waiting for performance or reliability failures.

### Part II — Architecture Styles

**Ch 9 — Architecture Styles: Foundations**
An architecture style name acts as shorthand between architects: saying "layered monolith" conveys assumed topology, default and anti-characteristics, deployment model, and data strategy simultaneously. This is analogous to design pattern names — they compress a large amount of understood detail into a single term.

**Fundamental historical patterns:** *Big Ball of Mud* (Foote & Yoder, 1997) — no discernible structure, promiscuous information sharing, "duct-tape-and-baling-wire spaghetti"; the default outcome without governance. *Unitary architecture* — software and hardware as a single system; now confined to embedded systems. *Client/server* — 2-tier (desktop+db; browser+web server) and 3-tier (application server between browser and database). Three-tier coincided with CORBA and DCOM.

**Java serialisation as architectural artifact:** Java baked serialisation into the core of the language because 3-tier computing was assumed to be the permanent future. That style came and went; serialisation remains, frustrating language designers to this day. The lesson: favour simple designs as defence against unknown future consequences of current architectural assumptions.

**Monolith vs distributed classification:** monolithic (layered, pipeline, microkernel — single deployment unit) vs distributed (service-based, event-driven, space-based, SOA, microservices — multiple deployment units over a network). Distributed architectures are more powerful but incur fixed structural costs.

**The 8 Fallacies of Distributed Computing** (L. Peter Deutsch and colleagues at Sun Microsystems, 1994):
1. *Network is reliable* — timeout and circuit breaker patterns exist because it isn't
2. *Latency is zero* — local calls are nanoseconds; remote calls are milliseconds; p95/p99 "long tail" matters more than average; chaining 10 calls at 100ms each = 1,000ms added latency
3. *Bandwidth is infinite* — **stamp coupling** (sending more data than needed) is the main violation; sending 500kb when 200 bytes needed at 2,000 req/s = 1Gb bandwidth consumed; solutions: private API endpoints, field selectors, GraphQL, consumer-driven contracts, internal messaging endpoints
4. *Network is secure* — attack surface magnifies in distributed systems; every service endpoint must be secured
5. *Topology never changes* — a "minor" network upgrade at 2am can invalidate all latency assumptions and trigger cascading timeouts
6. *There is only one administrator* — large companies have dozens of network administrators; coordination cost is non-trivial
7. *Transport cost is zero* — actual monetary cost: distributed architectures require additional hardware, servers, gateways, firewalls, subnets, proxies
8. *Network is homogeneous* — multiple hardware vendors with incomplete interoperability; affects reliability, latency, and bandwidth

**Other distributed challenges:** distributed logging (dozens to hundreds of separate logs; tools like Splunk help but don't fully solve root-cause tracing); distributed transactions (ACID is local-only; distributed systems use eventual consistency, transactional sagas via event sourcing or finite state machines, and BASE: Basic availability, Soft state, Eventual consistency); contract maintenance and versioning (decoupled services owned by different teams; communication models for version deprecation are complex).

**Ch 10 — Layered Architecture Style** → [[styles/layered-architecture]]
The layered (n-tier) style is the default that teams fall into by inertia — the *architecture by implication* and *accidental architecture* anti-patterns both describe this. Conway's Law explains why: organisations partitioned by technical function (UI team, backend team, DBA team) naturally produce technically-partitioned layered systems.

Standard four layers: presentation, business, persistence, database. Closed layers enforce **layers of isolation** — a change in one layer cannot leak into non-adjacent layers, providing the basis for replacing technology within a layer (e.g., JSF → React.js) without touching others. Open layers can be bypassed and exist for shared utilities that multiple layers need (e.g., a services layer with audit/logging utilities). Failure to document which layers are open/closed produces tightly coupled, brittle systems.

**Architecture sinkhole anti-pattern:** requests pass through every layer with no business logic performed at each stop — pure pass-through. Acceptable at ≤20%; if 80%+ of requests are sinkholes, the style is wrong for this domain. Solution is either open layers or a different architecture.

**Starting-point use:** recommended as the initial structure while evaluating whether microservices or another style is needed. Keep reuse minimal and inheritance shallow to facilitate later migration. MTTR is high: startup times 2–15 minutes for large applications, causing extended downtime per incident.

**Ch 11 — Pipeline Architecture Style** → [[styles/pipeline-architecture]]
The pipeline style organises processing as a sequence of discrete, stateless, single-task filters connected by unidirectional pipes. Filters are self-contained and independent. Four types: *producer* (outbound only, the source), *transformer* (map — accepts and optionally transforms input), *tester* (reduce — tests a criterion and optionally routes), *consumer* (terminal — persists or displays result).

The **Doug McIlroy story** (from the blog "More Shell, Less Egg") captures the principle: Donald Knuth wrote 10+ pages of Pascal to find the N most frequent words in a text; Doug McIlroy solved it in a six-line shell pipeline. The Unix pipe/filter model is the canonical reference implementation.

Real-world applications: EDI tools (document type transformation), ETL tools, Apache Camel route-based orchestration, Kafka Streams topologies. Architectural extensibility via unused publishing: a filter should advertise what it did even when no downstream filter currently listens — this creates a hook that future filters can plug into without modifying existing ones.

**Ch 12 — Microkernel Architecture Style** → [[styles/microkernel-architecture]]
Two valid definitions of the core system: (1) the minimal functionality required to run; (2) the happy path through the application with little or no custom processing. Both resolve the same way: move cyclomatic complexity out of the core and into plug-in components, improving extensibility, maintainability, and testability.

**Plug-in types:** compile-based (simple; redeploy entire monolith on change) vs runtime-based (added/removed at runtime without redeploying; managed by OSGi, Penrose/Jigsaw for Java, Prism for .NET). Remote plug-ins accessed via REST or messaging are possible but make the architecture distributed (though still a single quantum due to the monolithic core).

**Registry:** locates plug-ins. Can be a simple HashMap within the core, an embedded config file, or a discovery service (Apache ZooKeeper, Consul). Each entry contains the plug-in name, data contract, and access protocol.

**Contracts and adapters:** plug-ins expose a standard interface defined by the core. Third-party plug-ins that don't conform to the standard contract are wrapped in an adapter — the core remains clean regardless of plug-in source.

**Data:** plug-ins should not connect directly to the shared core database; data is passed in by the core. Plug-ins may own their own private data stores (embedded DB or external).

**Unique partitioning property:** the only architecture style that can be both technically *and* domain partitioned. Core is often technically partitioned; plug-ins correspond to domain variations (jurisdictions in insurance, tax forms in tax software, device types in recycling assessment).

Real-world examples: Eclipse IDE (core = basic text editor), Chrome/Firefox (core browser + viewer plug-ins), Jira, Jenkins, PMD. Business applications: insurance claims (per-jurisdiction rules as plug-ins), US tax prep (1040 core, each form/worksheet as a plug-in).

**Ch 13 — Service-Based Architecture Style** → [[styles/service-based-architecture]]
Service-based architecture is described as a *hybrid of microservices* — it gains meaningful deployment independence and domain isolation without the operational overhead of hundreds of fine-grained services. Services ("portions of an application") are coarse-grained domain services deployed like traditional monolithic applications (EAR/WAR/assembly — no containerization required, though possible). Average: 7 services; range: 4–12.

**ACID vs BASE:** the central trade-off distinguishing service-based from microservices. Because services are coarse-grained and share a database, ACID transactions via standard DB commits/rollbacks work within a service. In microservices with fine-grained services, ACID is local-only; cross-service operations require BASE (Basic Availability, Soft state, Eventual consistency) and saga patterns. The catalogue checkout example: if a credit card is expired, service-based can roll back the entire operation atomically; microservices leave the order in an inconsistent state.

**Database partitioning:** single shared library of entity objects (anti-pattern — a change requires redeploying every service) vs federated shared libraries per logical domain partition (preferred — changes impact only services using that library). Tip: make logical database partitions as fine-grained as possible while still maintaining coherent data domains.

**Topology variants:** (1) federated user interfaces matching each domain service; (2) separate databases per service group (moves toward microservices); (3) optional API layer/reverse proxy between UI and services.

**Service design internally:** layered (API facade + business + persistence layers) or domain partitioned (sub-domains within the service, similar to a modular monolith). Internal design is a per-service decision.

**Orchestration vs choreography:** orchestration = separate mediator service controls and manages the workflow (conductor). Choreography = services communicate directly without a central mediator (dancers). Service-based avoids both through coarse granularity: operations that would require multi-service orchestration in microservices are handled as internal class-level coordination in one domain service.

Electronics recycling example: 7 services (Quoting, Receiving, Assessment, Accounting, ItemStatus, Recycling, Reporting). Two quanta: customer-facing (separate UI+DB) and internal operations (shared DB).

> Ferrari analogy: "It's like having the power, speed, and agility of a Ferrari used only for driving back and forth to work in rush-hour traffic at 50 kilometres per hour—sure it looks cool, but what a waste." (Ch 13) — used to illustrate that more powerful distributed architectures (microservices, event-driven) are overkill for many business contexts.

**Ch 14 — Event-Driven Architecture Style** → [[styles/event-driven-architecture]]
EDA is built around the contrast between the *request-based model* (deterministic, synchronous, data-driven — retrieve order history) and the *event-based model* (reactive, asynchronous, action-driven — bid submitted, system reacts).

**Broker topology (choreography):** no central mediator. Relay race analogy — once an event processor hands off, it's done and available for the next event. Events in the broker topology are *things that have happened* (order-created, payment-applied). Four components: initiating event, event broker, event processor, processing event. Topics/pub-sub used (fire-and-forget). Best practice: always advertise what a processor did even if no one currently listens — creates an extensibility hook. Weaknesses: no workflow control, poor error handling, no recoverability/restart, data inconsistency risk.

**Mediator topology (orchestration):** event mediator manages workflow via point-to-point queues. Event processors respond back to the mediator. Messages in mediator topology are *commands* (things that must happen). Mediator implementation choices based on event complexity: Apache Camel/Mule ESB/Spring Integration (simple event flows), Apache ODE/Oracle BPEL Process Manager (complex conditional flows with BPEL — XML-based workflow language), BPM engine/jBPM (long-running workflows requiring human intervention). Recommended: always route through a simple mediator first; it interrogates the event class and delegates to a more complex mediator only when needed. Weaknesses: more coupling, lower scalability/performance, harder to model complex dynamic flows.

**Responsiveness vs performance distinction:** async communication improves *responsiveness* (user receives ACK in 25ms instead of waiting 3,100ms) but does not improve *performance* (the actual processing still takes 3,000ms). These are different characteristics with different solutions.

**Error handling — workflow event pattern:** reactive architecture pattern for async error handling without impacting responsiveness. Event consumer immediately delegates an error to a workflow processor and moves on to the next message (preserving throughput). Workflow processor tries to repair the message programmatically and resubmits; if repair fails, routes to a dashboard queue for human intervention.

**Data loss prevention:** (1) persisted queues + synchronous send (producer blocks until broker has persisted the message); (2) client acknowledge mode (message stays in queue until consumer explicitly ACKs — prevents loss if consumer crashes mid-processing); (3) last participant support (LPS) — atomically removes message from queue when the final DB commit succeeds.

**Request-reply messaging:** synchronous communication emulated in EDA via two queues (request + reply). Two techniques: *correlation ID* (standard message header field set to original message ID; consumer creates reply with matching CID; preferred for high-volume systems) vs *temporary queue* (dedicated ephemeral queue per request; simpler but expensive to create/delete under high load).

**Competing consumers:** programmatic load balancing — as load increases, additional event processor instances are added to consume from the same queue. This is how 5-star scalability and elasticity are achieved.

**Quanta note:** shared database = same quantum even in EDA. Request-reply requiring an immediate response ties two event processors into the same quantum (synchronous connascence, even through async messaging).

**Ch 15 — Space-Based Architecture Style** → [[styles/space-based-architecture]]
Space-based eliminates the database bottleneck by keeping all transactional data in replicated in-memory caches across processing units. The database is off the critical path — written to asynchronously via data pumps. Near-infinite scalability is achieved because the processing tier scales horizontally without any central data constraint.

Five main components of the architecture: *processing unit* (application logic + in-memory cache + replication engine — e.g., Hazelcast, Apache Ignite, Oracle Coherence), *messaging grid* (routes requests to available processing units; round-robin or next-available; typically HA Proxy/Nginx), *data grid* (manages cache synchronisation across processing units via member list + async replication — typically within 100ms), *processing grid* (optional orchestration for multi-processing-unit requests), *deployment manager* (spins up/down processing units in response to load — the elasticity mechanism).

**Data flow during writes:** processing unit that handles the request becomes the *owner of the update* → sends message through a data pump (async, FIFO-guaranteed) → data writer receives and persists to DB. Data readers perform the inverse: on cold start or crash recovery, the first processing unit instance to acquire a lock on the named cache becomes temporary cache owner, requests data via a data reader, and receives it via a reverse data pump; then releases the lock so others sync.

**Data abstraction vs data access layer:** if the cache schema mirrors the database schema, it's a data access layer (processing units coupled to table structure). If a transformation layer (data writers/readers) buffers the difference, it's a data abstraction layer (preferred) — allows DB schema changes without touching processing units.

**Replicated vs distributed cache trade-off:**

| Criterion | Replicated cache | Distributed cache |
|-----------|-----------------|-------------------|
| Optimisation | Performance | Consistency |
| Cache size | Small (<100 MB) | Large (>500 MB) |
| Data type | Relatively static | Highly dynamic |
| Update frequency | Low | High |
| Fault tolerance | High (no single point of failure) | Low (single cache server) |

Recommendation: use both within one application based on data characteristics — not a single model across all processing units.

**Near-cache** (hybrid: distributed backing cache + in-memory front caches per processing unit) is explicitly *not recommended* for SBA — front caches across processing units diverge, causing inconsistent responsiveness between instances.

**Data collision formula:** when two processing units update the same cache entry simultaneously (before replication completes), the last update wins and intermediate updates are lost. Formula: `CollisionRate = N × (UR² / S) × RL` where N = instances, UR = update rate (updates/ms, squared), S = cache size (rows), RL = replication latency. Collision rate is proportional to N and RL, inversely proportional to S. Use 100ms as a planning replication latency; target RL of 1ms makes collisions negligible.

**Cloud/on-prem hybrid:** processing units + virtualized middleware deploy to cloud (elastic); databases stay on-prem (secure, compliant data management). Data pumps' async nature makes this topology effective.

**Partitioning:** both domain *and* technically partitioned. Domain: processing units correspond to business domains. Technical: the processing/data pump/data reader/DB layers form a technical stack analogous to n-tier, but oriented around caching vs persistence.

**Quanta:** delineated by user interface associations and synchronous inter-unit communication. The database is excluded from the quantum equation because processing units do not communicate with it synchronously.

Implementation examples: concert ticketing (deployment manager pre-starts instances before tickets go on sale), online auction (processing units per auction; async data pumps forward bid data to history/analytics services without blocking the bidding flow).

Ratings: 5-star elasticity, scalability, performance; 1-star testability and simplicity. Most expensive style due to caching infrastructure licensing and high resource utilisation. Testing hundreds of thousands of concurrent users is complex and typically performed in production.

**Ch 16 — Orchestration-Driven Service-Oriented Architecture** → [[styles/soa-architecture]]
SOA emerged in the late 1990s under specific external pressures: commercial OS licensing per machine (before reliable open-source alternatives), Byzantine database licensing schemes, scarce computing resources. These forces pushed architects toward extreme *enterprise-level reuse* — the defining philosophy and ultimately the fatal flaw.

**Service taxonomy (four layers):**
1. *Business services* — coarse-grained, domain-facing (ExecuteTrade, PlaceOrder). These contained **no code** — just input, output, and schema definitions. Defined by business users. Litmus test: "Are we in the business of [this service]?"
2. *Enterprise services* — fine-grained, reusable building blocks (CreateCustomer, CalculateQuote). The atomic behaviour architects spent years perfecting for reuse.
3. *Application services* — single-use, application-specific (e.g., geo-location for one app). Owned by a single application team.
4. *Infrastructure services* — cross-cutting: monitoring, logging, authentication, authorisation. Owned by infrastructure team.

**Orchestration engine (ESB):** the heart of the architecture. Handles routing, message transformation, transactional coordination, and integration with package/legacy software. Crucially, Richards & Ford note that Conway's Law correctly predicted: the team of integration architects responsible for the ESB became a **political force** within organisations, and eventually a **bureaucratic bottleneck**. All requests route through the engine, even internal ones.

**The reuse trap:** architects were instructed to find reuse opportunities aggressively. Customer behaviour across auto/disability/health insurance was consolidated into one shared Customer service. The consequence: any change to Customer rippled across all consumers, making incremental change risky and requiring coordinated deployments. Domain concepts like CatalogCheckout were "ground to dust" across dozens of services in several tiers — adding an address line could involve dozens of changes across a single DB schema.

**Quanta: single quantum**, despite being a distributed architecture. Two reasons: (1) shared database(s) create coupling points across concerns; (2) the orchestration engine acts as a giant coupling point — no part of the architecture can have *different* architecture characteristics from the mediator. The SOA paradox: it found the disadvantages of both monolithic *and* distributed architectures simultaneously.

**Historical lesson:** SOA is important because it taught architects how difficult distributed transactions are in practice, and the practical limits of technical partitioning. The backlash against SOA's disadvantages directly led to microservices.

**Ch 17 — Microservices Architecture** → [[styles/microservices-architecture]]
Microservices is unusual in that it was **named early** — a March 2014 blog post by Martin Fowler and James Lewis that recognised common characteristics forming in a new style. Most architecture styles are named retrospectively.

The style is heavily inspired by DDD, specifically *bounded context*: each service models a domain or workflow, includes everything necessary to operate (classes, sub-components, database schemas), and is never coupled to another bounded context. The primary philosophy is **duplication over coupling** — if decoupling is the goal, then reuse (which requires coupling) is the anti-goal.

**Protocol-aware heterogeneous interoperability** (the communication model): *Protocol-aware* — no centralised hub means each service must know how to call others; architects standardise on specific protocols (REST, gRPC, messaging). *Heterogeneous* — services may use different technology stacks; polyglot environments are fully supported. *Interoperability* — services call one another over the network to collaborate.

**Enforced heterogeneity** (notable story): one early microservices architect at a personal-information-manager startup mandated that each development team use a *different technology stack*. If one team used Java and another .NET, accidental class sharing across service boundaries was physically impossible. The anti-entropy approach to forced decoupling.

**Operational reuse — sidecar and service mesh:** operational concerns (monitoring, logging, mTLS, circuit breaking) are extracted from service code into a sidecar component co-deployed alongside each service. All sidecars connect to form a *service plane* — the service mesh — giving a holistic operational interface across all services. Service discovery is typically embedded in the service mesh or API layer.

**Frontends:** two patterns. *Monolithic frontend*: a single UI calls through the API layer. *Microfrontends*: each service emits its own UI component, which the frontend coordinates. Microfrontends extend bounded context all the way to the user interface, enabling a single team to own the end-to-end domain.

**Choreography vs orchestration in microservices:** choreography preserves maximum decoupling (aligns with broker EDA as a symbiotic pattern — domain/architecture isomorphism). However, in complex workflows, a nominally choreographed service accumulates coordination responsibility, becoming the **front controller anti-pattern** — it should be extracted into an explicit mediator service. Orchestration is valid for inherently coupled business workflows; the cost is increased coupling to the mediator.

**Granularity guidelines** — three granularity disintegrators (reasons to split): (1) purpose (multiple domain responsibilities), (2) transaction (a transaction spans unrelated concerns), (3) choreography (a service orchestrates others — extract a mediator). Iteration is the only path to good service design; first-pass granularity will be wrong.

**Transactions:** cross-service transactions violate the core philosophy and create connascence of value (worst dynamic connascence). Fix: adjust granularity. If truly unavoidable, use the saga pattern *sparingly*.

> "The term 'microservice' is a label, not a description." — Martin Fowler (Ch 17). The name was coined to contrast with SOA's "gigantic services," not to prescribe small size.

> "Don't do transactions in microservices—fix granularity instead!" (Ch 17)

> "A few transactions across services is sometimes necessary; if it's the dominant feature of the architecture, mistakes were made!" (Ch 17)

**Ch 18 — Choosing the Appropriate Architecture Style**
Architecture style selection is always contextual — no universally correct answer. Six factors shift architecture fashion over time: (1) observations from past failures/successes; (2) changes in the ecosystem; (3) new capabilities (e.g., Docker causing a tectonic shift); (4) acceleration of change; (5) domain changes (mergers, business evolution); (6) external factors (licensing costs, compliance).

**Five pre-decision inputs:** (1) understanding the domain and its operational requirements; (2) identifying architecture characteristics that impact structure; (3) data architecture — architects must understand how data design interacts with the service model; (4) organizational factors (cloud cost, planned M&A); (5) process, team, and operational maturity — e.g., Agile engineering practices are a prerequisite for microservices, not an add-on.

**Three key determinations (in order):**
1. *Monolith vs distributed:* does the system need a single set of architecture characteristics (→ monolith viable) or do different parts need meaningfully different characteristics (→ distributed required)?
2. *Where should data live:* in a monolith, typically a shared DB; in distributed, per-service data requires thinking about data flow through the architecture.
3. *Synchronous vs asynchronous:* **default to synchronous; use asynchronous when necessary.** Async provides performance/scale benefits at the cost of design complexity (deadlocks, race conditions, debugging).

**Case study — Silicon Sandwiches (monolith):** single quantum, simple app, small budget. Two designs:
- *Modular monolith*: domain-partitioned components, single relational DB, single UI. Override endpoint for customisation; fitness function enforces that domain components reference the Override component.
- *Microkernel*: customisation as plug-ins (domain/architecture isomorphism). BFF pattern used — the API layer is a thin microkernel adaptor; per-device BFF adaptors (iOS, Android, web) translate generic backend output to device-specific format.

**Case study — Going, Going, Gone (distributed, microservices):** three distinct UIs (bidder, auctioneer, streamer). Eight services: BidCapture (no persistence — conduit only), BidStreamer (read-only high-performance stream), BidTracker (unifies bid sources), AuctioneerCapture (separate from BidCapture due to differing characteristics), AuctionSession, Payment, VideoCapture, VideoStreamer. Asynchronous communication chosen where services have differing operational characteristics (e.g., Payment can only process one payment per 500ms — queue buffers spikes). Final design resolves to **five quanta**: Payment, Auctioneer, Bidder, Bidder Streams, Bid Tracker.

> "This isn't the 'correct' design for GGG... We don't even suggest it's the best possible design, but it seems to have the least worst set of trade-offs." (Ch 18)

### Part III — Techniques and Soft Skills

**Ch 19 — Architecture Decisions** → [[concepts/adrs]]
Three anti-patterns: *Covering Your Assets* (deferring decisions from fear of being wrong — fix: wait until the *last responsible moment*, not Analysis Paralysis); *Groundhog Day* (decisions re-litigated because justification was never documented — fix: always include both technical *and* business justification); *Email-Driven Architecture* (decisions buried in inboxes — fix: never put the decision in the email body; only the context and a link to the single source of record).

**Architecturally significant** (Nygard's five criteria): structure, nonfunctional characteristics ("-ilities"), dependencies, interfaces (contracts + versioning), construction techniques.

**ADR structure (Title, Status, Context, Decision, Consequences) + Richards & Ford additions:**
- *Compliance*: how will the decision be measured and governed? Can a [[concepts/fitness-functions|fitness function]] automate compliance? (e.g., ArchUnit test verifying shared service classes are annotated and reside in the services layer)
- *Notes*: metadata (author, approval date, approver, modification history)

**ADR status:** Proposed → Accepted → Superseded (never deleted — preserves the historical link: "ADR 42 superseded by ADR 68"). RFC (Request for Comments) status with a deadline prevents Analysis Paralysis.

**Self-approval criteria:** architects should define when they can approve their own ADRs vs requiring ARB approval. Three common criteria: *cost* (estimate: hours × FTE rate; above a threshold → requires approval), *cross-team impact* (any ADR affecting other teams/systems → cannot self-approve), *security* (any security implications → requires higher-level approval).

**The gRPC example:** years ago, an architect chose gRPC between two services for low latency. A later architect, not knowing the reason, refactored to messaging "for decoupling." The increased latency caused upstream timeouts. Knowing the *why* would have prevented the mistake. The Decision section of an ADR must capture *why*, not just *what*.

**Storing ADRs:** wiki or shared directory (not per-application Git repos — cross-app and enterprise ADRs need accessibility without repo access). Hierarchy: Application (per-app) → Integration (cross-system) → Enterprise (global, e.g., "All access to a system database only from the owning system").

**ADRs as documentation:** the Context section describes the architecture; the Decision section documents the reasoning; the Consequences section covers trade-offs. Together they form architecture documentation that captures the intent, not just the structure.

**ADRs for standards:** the ADR format reveals whether a standard is valid. If the architect cannot justify the standard in the Decision section, or the Consequences section reveals the impacts are disproportionate, the standard should be reconsidered. Developers who understand *why* a standard exists are more likely to follow it.

**Ch 20 — Analysing Architecture Risk** → [[concepts/risk-storming]]
Risk matrix: two dimensions — *overall impact* (1–3) × *likelihood* (1–3) = 1–9 score. Scores 1–2 = low risk (green); 3–4 = medium (yellow); 6–9 = high (red). Always evaluate impact first, then likelihood. Unknown or unproven technologies always receive the maximum score (9) — the matrix cannot be applied to the unknown.

**Risk assessments** summarise risk across both domain areas (customer registration, order fulfilment) and risk dimensions (availability, data integrity), with accumulated scores per row and column. Direction of risk is tracked over time: +/− signs preferred over arrows (arrows are ambiguous — 50/50 split on whether ↑ means improving or worsening). Alternative: arrow + the number it's trending toward (e.g., "↑4"), which needs no key.

**Risk storming** (see [[concepts/risk-storming]] for full process): three activities — (1) *Identification* (individual, non-collaborative; colour-coded Post-it notes); (2) *Consensus* (collaborative discussion of disagreements and single-person identifications; the unknown-technology case: if a participant doesn't know a technology, that alone is high risk 9 — valuable developer knowledge surfaces here); (3) *Mitigation* (architectural changes; cost vs risk trade-off negotiation with business stakeholders).

**Nurse diagnostics worked example** — three risk storming sessions on a nurse call-center diagnostics system:
- *Availability*: central DB identified as high risk (6) → split into two physical DBs (nurse profiles clustered; case notes single-instance). External systems: research SLA/SLO. SLA = contractual/legally binding; SLO = not legally binding. Publishing SLAs on the architecture diagram documents risk context.
- *Elasticity*: diagnostics engine interface identified as high risk (9) at 500 req/sec ceiling. Mitigation: (a) async queuing for back-pressure; (b) **Ambulance Pattern** — two message channels give nurses priority over self-service patients; (c) outbreak cache to serve high-volume repeated questions without reaching the diagnostics engine.
- *Security*: single API gateway rated high risk (6) because all user types (admin, self-service, nurses) share one gateway. Mitigation: three separate API gateways per user type — physically prevents admin or self-service paths from reaching medical records.

**Agile story risk analysis:** risk storming applies beyond architecture. During sprint grooming, risk matrix dimensions become: *impact if story is not completed in the iteration* × *likelihood it won't be completed*. Identifies high-risk stories early for priority tracking.

**Ch 21 — Diagramming and Presenting Architecture** → [[concepts/architect-soft-skills]]
**Representational consistency:** when drilling into a specific portion of an architecture, always first show the full topology and indicate where the detail fits within it. Prevents viewer confusion about the scope of what is being described.

**Irrational Artifact Attachment anti-pattern:** attachment to a diagram is proportional to time invested in creating it. Use low-fidelity artifacts (whiteboard, tablet sketch) early so the team can discard and iterate freely. Only invest in polished tools once the design has stabilised.

**Diagramming tool features architects need:** *layers* (show/hide groups of related elements; enable incremental presentation builds); *stencils/templates* (reusable component library, promotes organisational consistency); *magnets* (snap-to connection points on shapes for alignment).

**Formal standards:** *UML* (class and sequence diagrams still useful; most other types fell into disuse); *C4* (Context/Container/Component/Class; Simon Brown; better suited to monolithic than distributed architectures); *ArchiMate* (open-source enterprise modeling language; Open Group standard; deliberately "as small as possible").

**Diagram guidelines:** titles on all elements; solid lines = synchronous, dotted = asynchronous (one near-universal convention); shapes consistent within organisation; labels on every item where ambiguity exists; colour to disambiguate (e.g., distinct services in microservices coordination diagrams); key when any shape is ambiguous.

**Presentation two-channel model:** presenters have verbal and visual channels. Bullet-Riddled Corpse anti-pattern overloads one channel (text on slides + reading them aloud). Better: use incremental builds (reveal graphical information progressively to maintain suspense). Cookie-Cutter anti-pattern: don't pad slides with content to fill space — ideas don't have a fixed word count. **Infodecks** (slide decks emailed as standalone documents) need comprehensive content; presentations deliberately need only half the content (the other half is the speaker). **Invisibility pattern:** blank black slide redirects all audience attention to the speaker — useful when making a high-stakes point.

**Ch 22 — Making Teams Effective** → [[concepts/architect-soft-skills]]
**Architect personality types:** *Control Freak* (creates tight boundaries — too many constraints, too fine-grained, dictates class design and pseudocode; steals the art of programming; results in developer frustration and loss of respect); *Armchair Architect* (creates loose boundaries — hasn't coded in a long time or is spread too thin across projects; development teams take on architecture role; easy to fake since architecture doesn't produce runnable code like programming does); *Effective Architect* (provides the right level of constraints, correct tools, and removes roadblocks).

**Elastic leadership — five factors (−20 to +20 scale per factor, accumulated):**
1. *Team familiarity* — new team (+20, more control); existing team (−20, less control; they self-organise)
2. *Team size* — large 12+ (+20); small ≤4 (−20)
3. *Overall experience* — mostly junior (+20); mostly senior (−20; architect shifts to facilitator)
4. *Project complexity* — high (+20); simple (−20)
5. *Project duration* — long 2yr+ (+20); short 2mo (−20; urgency is built-in; a control freak just delays)

*Counterintuitive*: short projects need *less* control, not more — the team already has urgency. Long projects need more — developers aren't thinking in terms of urgency. Re-evaluate these factors throughout the project as conditions change.

**Three team-size warning signs:**
- *Process loss* (Brook's Law, Fred Brooks, *The Mythical Man Month*): adding people increases project time. Indicator: frequent merge conflicts. Remedy: identify parallelism opportunities, separate work streams. Question why any new team member is being added.
- *Pluralistic ignorance*: everyone privately rejects a norm but publicly agrees, believing they're missing something obvious. Named for "The Emperor's New Clothes." Effective architects observe body language during meetings and act as facilitator — proactively invite the hesitant person to share their view.
- *Diffusion of responsibility*: as team size grows, individuals assume someone else will handle problems. Smaller teams → higher individual accountability. Effective architect watches for dropped items and confusion about ownership.

**Checklists:** effective for processes with no procedural order among steps (not sequential procedures). Keys to success: small, automatable items removed, don't over-index (law of diminishing returns). **Hawthorne effect** to enforce adoption: tell the team you will verify all checklist items; in practice, only spot-check occasionally — the threat of observation is sufficient. Three valuable checklists: (1) *Developer code completion* — coding standards, absorbed exceptions, project-specific requirements; (2) *Unit and functional testing* — unusual edge cases, boundary values (add items whenever QA finds something); (3) *Software release* — config changes, third-party libraries added, DB migrations (add items whenever a deployment fails).

**Providing guidance via design principles:** frame boundaries graphically. Example for layered stack governance: *Special purpose* libraries (developer decides independently) → *General purpose* libraries (developer recommends after overlap analysis, architect approves) → *Framework* libraries (architect decides, developer doesn't analyse). Always require both *technical* and *business* justification for new library requests. Business justification story: Scala enthusiast on Mark Richards' Java project couldn't find a business justification despite having many technical ones; recognised the disruption he was causing and became one of the best team members.

**Ch 23 — Negotiation and Leadership Skills** → [[concepts/architect-soft-skills]]
**With business stakeholders:**
- *Leverage grammar/buzzwords*: "zero downtime" = availability concern; "lightning fast" = performance concern; "I needed it yesterday" = time-to-market concern. These clues direct the negotiation.
- *Gather data first*: translate "nines" into hours/minutes/seconds of downtime. "Five nines" = 5 min 35 sec/year = 1 sec/day. Putting concrete numbers into the conversation bypasses the emotional attachment to technical vernacular.
- *When all else fails, state cost and time* — use this last, not first; starting with cost shuts down other rationale.
- *Divide and conquer*: qualify whether the entire system needs the expensive requirement, or just the part where it actually matters.

**With other architects:**
- *Demonstration defeats discussion*: run a comparison in a production-like environment rather than arguing. Every environment is different — Googling the answer is insufficient.
- *Calm leadership always wins*: when things get too personal or heated, stop the negotiation and re-engage later.

**With developers:** avoid "you must" and "you need to" (shuts down collaboration). State the reason *before* the constraint ("Since change control is most important to us, we have a closed-layered architecture, which means…"). Have the developer *arrive at the solution themselves* — offer to use Framework Y if they can demonstrate it satisfies the security requirements. One of two outcomes: (1) they fail and now own the decision to use Framework X; (2) they succeed and the architect learns something. Both are wins.

**Ivory Tower anti-pattern**: architects who dictate from on high without regard for developer concerns. Developers stop respecting the architect and team dynamics break down.

**4 C's of architecture:** *Communication, Collaboration, Clarity, Conciseness.* The antidote to accidental complexity.

**Essential vs accidental complexity:** *Essential complexity* — the problem is genuinely hard (six nines availability). *Accidental complexity* — the architect made the problem hard, often to prove worth, ensure involvement, or guarantee job security. The 4 C's guards against accidental complexity.

> "Developers are drawn to complexity like moths to a flame—frequently with the same result." — Neal Ford (Ch 23)

**Pragmatic yet visionary:** *Visionary* = strategic thinking, planning for the future, architectural vitality. Risk: too theoretical, produces solutions too difficult to understand or implement. *Pragmatic* = budget constraints, time constraints, team skill level, trade-offs, technical limitations. Good architects find the balance — solutions that fit constraints while applying imagination.

**Leading by example:** rank and title mean very little. Gerald Weinberg: *"No matter what the problem is, it's a people problem."* Use collaborative grammar: "have you considered…" and "what about…" rather than "you must" and "what you need to do is." Use people's names. Host brown-bag lunches. Sit with the development team (or walk around if not co-located). Turn requests into favours.

**Managing meetings:** two types — *imposed upon* (invited by others; ask why you're needed; review the agenda; attend only relevant portions; attend in place of developers to keep them working) and *imposed by* (you call it; minimise; consider whether email would suffice; schedule outside developer flow state — early morning, after lunch, or late day). **Developer flow state:** a state of 100% cognitive engagement on a problem, where hours feel like minutes — never disrupt this with an unscheduled meeting.

**Ch 24 — Developing a Career Path** → [[concepts/architect-soft-skills]]
**The 20-minute rule:** devote at least 20 minutes per day to technical breadth — reading articles, watching presentations, learning new buzzwords. Do this first thing in the morning, before email, as email causes irreversible diversion. Resources: InfoQ, DZone Refcardz, ThoughtWorks Technology Radar.

**Personal technology radar:** adapted from the ThoughtWorks Technology Radar (created by the ThoughtWorks Technology Advisory Board under CTO Rebecca Parsons; published biannually). Four rings:
- *Hold*: avoid for new work; can also be bad habits to break
- *Assess*: heard good things, haven't investigated yet; staging area for future research
- *Trial*: actively researching via spikes; worth spending time to enable effective trade-off analysis
- *Adopt*: best practices and most exciting new capabilities

**Technology portfolio as financial portfolio:** diversify. Include some high-demand/stable skills and some technology gambits (open source, mobile, emerging platforms). Creating the radar forces structured thinking about investment — the exercise matters more than the output.

**Social network for learning:** three link types — *strong* (family, daily coworkers), *weak* (occasional acquaintances), *potential* (not yet met). McAfee: next job is more likely to come from a weak link than a strong one (weak links offer perspective outside your normal experience). Use social media professionally to build weak links with technologists whose advice you respect — this is how new technologies make it into the Assess ring.

**Architecture katas** (Ted Neward): practice is the only way to build architecture skills — there is no answer key. "There are no right or wrong answers in architecture—only trade-offs." Teams at katas produce topology solutions without ADRs; the topology is only half the story; the *why* (trade-offs considered) is what matters.

## Notable Quotes

> "There are no right or wrong answers in architecture—only trade-offs." (Ch 24)

> "There are no wrong answers in architecture, only expensive ones." — Mark Richards (Ch 5)

> "Developers are drawn to complexity like moths to a flame—frequently with the same result." (Ch 23)

> "The First Law of Software Architecture: Everything in software architecture is a trade-off."

> "The Second Law of Software Architecture: Why is more important than how."

> "All architectures become iterative because of unknown unknowns, Agile just recognises this and does it sooner." (Ch 1)

> "Programmers know the benefits of everything and the trade-offs of nothing. Architects need to understand both." — Rich Hickey (Ch 2)

> "Architecture is the stuff you can't Google." (Ch 2)

> "Never shoot for the best architecture, but rather the least worst architecture." (Ch 4)

> "Don't do transactions in microservices—fix granularity instead!" (Ch 17)

> "Use synchronous by default, asynchronous when necessary." (Ch 18)

## Related Pages

- [[concepts/architecture-characteristics]] — the central decision framework
- [[concepts/architecture-quantum]] — scope unit for characteristics
- [[concepts/fitness-functions]] — governance mechanism
- [[concepts/modularity]] — structural health metrics
- [[concepts/technical-vs-domain-partitioning]] — top-level component design
- [[concepts/adrs]] — decision documentation
- [[concepts/risk-storming]] — risk analysis technique
- [[comparisons/architecture-styles-comparison]] — all 8 styles rated side by side
