---
title: "Architecture Quantum"
type: concept
tags: [quantum, coupling, distributed-systems, evolutionary-architecture]
sources: [fundamentals-of-software-architecture, building-evolutionary-architectures, software-architecture-the-hard-parts, building-event-driven-microservices]
created: 2026-05-13
updated: 2026-05-14
---

# Architecture Quantum

## Definition

An architecture quantum is an independently deployable artifact with high functional cohesion, high static coupling, and synchronous dynamic coupling. In practice it is the smallest unit of a system that can be deployed, scaled, and governed independently, and within which a consistent set of [[concepts/architecture-characteristics]] applies.

The four criteria (SATH formulation, → [[sources/software-architecture-the-hard-parts]] ch. 2):
1. **Independently deployable** — can be released without deploying anything else.
2. **High functional cohesion** — encapsulates a coherent portion of domain behaviour.
3. **High static coupling** — the elements inside are tightly wired together via their dependency graph: OS, frameworks, libraries, databases, message brokers, and other operational dependencies.
4. **Synchronous dynamic coupling** — components within the quantum call each other synchronously at runtime (shared fate under failure).

**Static vs dynamic coupling** are distinct concepts that must be analysed separately:
- *Static coupling* = wiring — the set of dependencies required to bootstrap the quantum. Measurable at compile time from POM files, npm packages, container manifests, etc. An easy mental model: "What would I need to stand up from scratch to run this service?"
- *Dynamic coupling* = communication — how quanta call one another at runtime. Affects operational characteristics (performance, scale, elasticity) rather than structural dependencies.

## Quantum Count by Architecture Style

The key rule for static coupling: **any shared coupling point (database, mediator, UI) collapses all dependent services into a single quantum** (→ [[sources/software-architecture-the-hard-parts]] ch. 2):

| Architecture | Quantum count | Reason |
|---|---|---|
| Any monolith | 1 | Single deployment unit |
| Service-based architecture | 1 | Separate services but shared database |
| Mediator-style EDA | 1 | Mediator is a holistic coupling point |
| Broker-style EDA, shared DB | 1 | Database is the coupling point |
| Broker-style EDA, separate DBs | Multiple | No shared coupling point |
| Microservices, per-service DB | Multiple (one per service) | Full decoupling |
| Microservices + tightly coupled UI | 1 | UI collapses quanta |
| Microservices + micro-frontends | Multiple | Each service + its UI element forms its own quantum |

**Micro-frontends** are the pattern that allows a microservices architecture to achieve multiple quanta even in the presence of a UI: each service emits its own UI components; the browser acts as a canvas rather than a coupling point. This preserves per-service architecture characteristic independence even at the UI layer.

Micro-frontends pair particularly well with event-driven backends (→ [[sources/building-event-driven-microservices]] ch. 13): both are composition-based. Each backend microservice materializes exactly the state it needs from event streams; the corresponding microfrontend renders that state, with no cross-component coupling. This enables independent evolution of each bounded context's UI and backend simultaneously. Design requirements: a common style guide + shared UI element library to maintain visual consistency; graceful loading states for slow or failing components; avoid bounded-context-specific business logic in shared element libraries.

## Dynamic Quantum Coupling

How quanta communicate creates a second set of coupling concerns orthogonal to static coupling. The three interlocking dimensions (→ [[sources/software-architecture-the-hard-parts]] ch. 2):

1. **Communication**: synchronous vs asynchronous
2. **Consistency**: atomic vs eventual
3. **Coordination**: orchestrated vs choreographed

These three binary dimensions produce 2³ = 8 distinct distributed workflow patterns, which SATH names as "saga types" — a vocabulary for describing how services collaborate. The coupling level correlates with position in the space: synchronous + atomic + orchestrated = very high coupling; asynchronous + eventual + choreographed = very low coupling.

See [[patterns/saga]] for the full 8-type taxonomy.

## Origin

The architecture quantum concept was developed during the writing of *Building Evolutionary Architectures* (→ [[sources/building-evolutionary-architectures]]). The authors needed a measure of structural evolvability that went beyond code-level metrics: cyclomatic complexity, coupling, and LCOM only reveal information about the code itself. They cannot capture dependent external components — particularly databases — that directly affect operational architecture characteristics. An architect can design a perfectly elastic code base, but if the database doesn't support those characteristics, the system will fail. The quantum unit provides the scope that includes these external dependencies.

## Why It Matters

The architecture quantum solves the question of *scope*: for which part of the system does a given architecture characteristic apply? A system with a single quantum needs only one set of characteristics — potentially validating a monolithic deployment. A system with multiple quanta (each needing different characteristics for scalability, reliability, or security) requires a distributed architecture to honour those differences.

Examples:
- An e-commerce system where the payment service needs five nines of availability but the product catalogue only needs three → two quanta → distributed architecture.
- A simple CRUD app with a single frontend and a single backend sharing a deployment → one quantum → monolith is a valid option.
- An online auction with different availability requirements for the auctioneer vs. bidders → multiple quanta → distributed.

> "Using quantum analysis at the component design stage allowed the architect to more easily identify service, data, and communication boundaries." (→ [[sources/fundamentals-of-software-architecture]], Ch 18)

## Practical Use

Quanta analysis is a design technique performed during component design (Ch 8) and refined during architecture style selection (Ch 18). Steps:
1. Identify domain components.
2. Determine which components have differing operational requirements (performance, scaling needs, availability SLAs).
3. Group components that can share a deployment and tolerate the same characteristics → each group is a candidate quantum.
4. If multiple quanta emerge → a distributed style (service-based, event-driven, microservices) is likely appropriate.
5. If a single quantum → monolith styles (layered, microkernel, modular monolith) are viable.

## Connascence and Quanta Boundaries

The quantum definition extends the connascence concept (→ [[concepts/modularity]]) to distributed systems. Within a quantum, **synchronous connascence** binds services: when one service calls another synchronously, the caller waits for the callee's response. Both services must exhibit the same operational characteristics for the duration of the call — if the caller is significantly more scalable than the callee, timeouts and reliability failures result. Components with strong synchronous connascence cannot have meaningfully different architecture characteristics; they share a quantum.

**Asynchronous connascence** (via queues or events) allows fire-and-forget semantics: the caller does not wait. This decouples operational characteristics and allows the two services to exist in separate quanta, each independently tunable. Moving from synchronous REST calls to async messaging is therefore one of the primary mechanisms for splitting quanta and enabling distributed architecture.

**Example (auction domain):** a Payment service and Auction service where Auction sends payment requests synchronously after each auction ends. If many auctions end simultaneously, the Payment service may be overwhelmed. Redesigning the connection to be asynchronous (Auction publishes to a queue; Payment consumes at its own rate) decouples them into separate quanta with independent scalability profiles.

## Case Study: Going, Going, Gone (Ch 7)

An online auction kata illustrates quantum-based characteristic scoping. The kata has requirements for real-time bidding, nationwide scale, credit card processing, and live video streaming. Analysing at the quantum level reveals three distinct quanta rather than a single system:

| Quantum | Description | Key characteristics |
|---|---|---|
| Bidder feedback | Live bid stream + video stream to online viewers | Availability, scalability, performance |
| Auctioneer | The single live auctioneer conducting the auction | Availability, reliability, scalability, elasticity, performance, security |
| Bidder | Online bidders placing bids | Reliability, availability, scalability, elasticity |

The auctioneer quantum has *higher* reliability and availability requirements than the bidder quantum: a dropped bidder connection is a bad experience; a dropped auctioneer connection stops the auction entirely. This difference in requirements is invisible at the system level but visible at the quantum level — it drives the decision to use a distributed architecture and informs where to invest redundancy budget.

(For connascence taxonomy, see [[concepts/modularity]].)

## Bounded Context as Quantum Boundary

*Building Evolutionary Architectures* identifies the DDD **bounded context** as the natural quantum boundary in a microservices architecture (→ [[sources/building-evolutionary-architectures]] Ch 4). A bounded context defines a cohesive domain subdomain with its own ubiquitous language and data model — exactly the criteria for high functional cohesion within a quantum.

The Inverse Conway Maneuver (→ [[concepts/conways-law]]) aligns team boundaries with quantum boundaries: one cross-functional team per bounded context produces a system where service boundaries and quantum boundaries coincide.

## Quantum Size, Cost, and Evolvability

Evo-arch observes a cost sweet-spot relationship between quantum size and per-quantum cost (→ [[sources/building-evolutionary-architectures]] Ch 8):

- **Too few, large quanta**: coordination cost is low but characteristics cannot be independently tuned; the entire system must support the most demanding requirement
- **Sweet spot**: quanta are fine enough that concerns are well-separated and automation takes over operational management; per-quantum cost is minimised
- **Too many, tiny quanta**: the sheer number of quanta drives coordination cost back up (service-per-field is the pathological extreme in microservices)

Smaller quanta also reduce cycle time: **v ∝ c** — a quantum that can be independently deployed and tested evolves faster than one coupled to a large deployment unit.

## Per-Quantum Architecture Styles

Because each quantum has its own technical architecture, different quanta within the same system can use different internal architecture styles (→ [[sources/building-evolutionary-architectures]] Ch 8):
- A write-heavy service may use an event-driven internal architecture for scalability
- An extension-point–heavy service may use a microkernel
- A simple CRUD service may use a layered approach internally

This is only possible when quanta are truly independently deployable — when they share a deployment unit, they must share an architecture.

## Transactions as the Strong Nuclear Force

Two-phase commit (2PC) across quanta effectively merges them into a single quantum: the two services share fate at the transaction boundary (→ [[sources/building-evolutionary-architectures]] Ch 4). This is why microservices require saga/eventual consistency patterns — preserving quantum independence requires abandoning distributed ACID transactions. Service-based architectures accept coarser quanta specifically to preserve ACID within each quantum.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Introduces the concept formally; used as the primary monolith-vs-distributed decision mechanism |
| [[sources/building-evolutionary-architectures]] | Extends the concept: bounded context as the natural microservices quantum boundary; sweet-spot cost curve; per-quantum style selection; transactions as the strong nuclear force |
| [[sources/understanding-distributed-systems]] | Does not use this term, but the underlying idea appears in discussions of service boundaries and data isolation per service |
| [[sources/software-architecture-the-hard-parts]] | Most rigorous treatment: explicit static/dynamic coupling distinction added to the definition; quantum count rules per architecture style; micro-frontends as a quantum-preserving UI pattern; 3D dynamic coupling space (communication × consistency × coordination) leading to 8 saga types |

## Related Concepts

- [[concepts/architecture-characteristics]] — the characteristics that apply within a quantum
- [[concepts/modularity]] — connascence taxonomy that defines intra- and inter-quantum coupling strength
- [[concepts/technical-vs-domain-partitioning]] — domain partitioning maps naturally to quantum boundaries; component identification flow drives quantum discovery
- [[concepts/conways-law]] — team boundaries should align with quantum boundaries (Inverse Conway Maneuver)
- [[concepts/evolutionary-architecture]] — quantum size as the primary lever for evolvability
- [[distributed/fallacies-of-distributed-computing]] — the fixed costs incurred when quanta require a distributed architecture
- [[styles/microservices-architecture]] — exemplifies maximum quanta (one bounded context per service)
- [[styles/service-based-architecture]] — intermediate quantum count (4–12 coarse services); supports ACID within quanta
