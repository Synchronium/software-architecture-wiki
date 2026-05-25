---
title: "Conway's Law"
type: concept
tags: [architecture, teams, organizational-design, coupling, evolutionary-architecture]
sources: [building-evolutionary-architectures, fundamentals-of-software-architecture, building-event-driven-microservices, team-topologies, accelerate]
created: 2026-05-13
updated: 2026-05-18
---

# Conway's Law

## Definition

> "Any organisation that designs a system (defined broadly) will produce a design whose structure is a copy of the organisation's communication structure."
> — Melvin Conway, 1968

Conway's Law is an empirical observation: the software a team produces mirrors the team's own structure. Functional silos (frontend team, backend team, DBA team) produce technically partitioned architectures. Domain teams (order team, payment team, fulfilment team) produce domain-partitioned architectures aligned to business capabilities.

## Why It Matters

Conway's Law operates whether architects intend it to or not. Ignoring it means the system's structure is determined by the organisation chart rather than deliberate architectural reasoning. Architects who only design the code without designing the team structure will find the code drifting back toward the organisational shape.

The corollary is actionable: **if you want a particular architecture, design your team structure first**.

## The Inverse Conway Maneuver

The Inverse Conway Maneuver (→ [[sources/building-evolutionary-architectures]] Ch 8) is the deliberate application of Conway's Law in reverse: restructure teams to produce the desired system architecture.

If the goal is a microservices architecture with domain-aligned service boundaries:
1. Identify desired service boundaries using [[concepts/bounded-contexts]] (→ [[concepts/architecture-quantum]])
2. Reorganise into cross-functional teams aligned to those boundaries — one team per service or bounded context
3. Minimise communication channels *between* teams to prevent inter-service coupling
4. Maximise communication *within* teams to promote intra-service cohesion

The PenultimateWidgets case study in evo-arch illustrates this: reorganising from functional silos to business-capability–aligned teams caused service boundaries to follow, with inter-team communication governed by explicit API contracts.

## Team Size and Connection Links

J. Richard Hackman's research explains why large teams struggle: the issue is not headcount but the number of communication links that must be maintained:

```
connections = n(n-1)/2
```

| Team size | Communication links |
|-----------|-------------------|
| 5 | 10 |
| 10 | 45 |
| 20 | 190 |
| 50 | 1,225 |

Amazon's two-pizza rule (no team larger than can be fed by two pizzas) is an informal operationalisation of this principle. Small teams minimise internal communication overhead and produce services with clean, tight boundaries.

> "Strive for a low number of connections between development teams." (→ [[sources/building-evolutionary-architectures]] Ch 8)

## Cross-Functional Teams

Functional silos create coordination friction at every handoff: frontend hands to backend, backend hands to DBA, DBA hands to ops. Each handoff is a communication link across team boundaries — which Conway's Law predicts produces architectural coupling at those same seams.

Cross-functional teams (each containing all skills needed to build, test, deploy, and operate a service) eliminate the handoff. The team communicates internally about its service and communicates with other teams only at explicit service contract boundaries. Fitness functions (→ [[concepts/fitness-functions]]) automate verification of those integration contracts, removing the need for manual inter-team coordination at each release.

> "Each team shouldn't have to know what other teams are doing, unless integration points exist between the teams. Even then, fitness functions should be used to ensure integrity of integration points." (→ [[sources/building-evolutionary-architectures]] Ch 8)

## Product over Project

The project/product distinction reinforces Conway's Law (→ [[sources/building-evolutionary-architectures]] Ch 8). Software *projects* have a lifecycle: a team forms, builds something, hands it off to operations, then disbands. The original builders lose connection to the running code; quality decays; "us vs them" emerges between development and operations.

Software *products* live forever. The cross-functional team stays associated with the product indefinitely. Because the team owns the product through its entire life — including 3 AM pages — it has strong incentive to build it well. Amazon's two-pizza rule operationalises this: small, cross-functional, permanently associated with one product; "you build it, you run it."

The product model produces better architecture because the architects and developers are also the operators. They make infrastructure and observability investment decisions that project teams — who will never see the consequences — have no incentive to make.

## Relationship to Technical vs Domain Partitioning

Conway's Law directly predicts [[concepts/technical-vs-domain-partitioning]]:
- Technically partitioned organisations (frontend/backend/DBA) → technically partitioned architectures (layered)
- Domain-partitioned organisations (order/payment/fulfilment) → domain-partitioned architectures (service-based, microservices)

The Inverse Conway Manoeuvre is the mechanism for deliberately transitioning from the former to the latter.

## The Three Organisational Structures

Niels Pflaeging (cited by → [[sources/team-topologies]] ch. 1) identifies three simultaneous structures in every organisation:

1. **Formal structure** (the org chart) — facilitates compliance
2. **Informal structure** — the realm of influence between individuals
3. **Value creation structure** — how work actually gets done based on inter-personal and inter-team reputation

The key insight: Conway's Law operates on the *value creation structure*, not the org chart. Decisions based solely on the org chart optimise locally and miss systemic bottlenecks. The actual communication paths — not the lines on the chart — determine the architecture.

## Tool Choices Drive Communication Patterns

An underappreciated corollary of Conway's Law: the tools teams share (or don't) are themselves communication structures and thus influence architecture (→ [[sources/team-topologies]] ch. 2).

- **Shared tools** signal an expectation of collaboration → produce tighter coupling between the teams (and their software)
- **Separate tools** signal independence → produce cleaner boundaries

Implication: don't select a single tool for the whole organisation without considering team inter-relationships first. If two teams *should* be independent, giving them a shared ticketing system or monitoring tool may inadvertently couple them.

## Unexpected Communication as a Diagnostic Signal

If two teams that *should* be independent are frequently communicating, this is a diagnostic signal that something is wrong — not a collaboration opportunity (→ [[sources/team-topologies]] ch. 2):

- Is the API insufficient?
- Is the platform missing a capability?
- Is a component boundary wrong?

Mike Cohn: "Does the structure minimise the number of communication paths between teams? Does the structure encourage teams to communicate who wouldn't otherwise do so?" If teams that logically shouldn't need to communicate are doing so, the architecture has a problem.

> "More communication is not necessarily a good thing." (→ [[sources/team-topologies]] ch. 2)

## Organisation Design Is Technical Work

Ruth Malan's modern formulation of Conway's Law: *"If the architecture of the system and the architecture of the organisation are at odds, the architecture of the organisation wins."* (→ [[sources/team-topologies]] ch. 2)

The logical implication: anyone deciding the shape and placement of engineering teams is making architecture decisions. HR and management decisions about team structure directly constrain the solution space for software design. Organisation design must involve architects and engineers — not just management.

Michael Nygard: *"Team assignments are the first draft of the architecture."* (→ [[sources/team-topologies]] ch. 2)

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/accelerate]] | Empirical validation: teams with loosely coupled architectures (can test/deploy independently, change design without coordinating outside the team) are the highest performers; this is the largest single contributor to CD performance in 2017 data, larger even than test and deployment automation. Scaling finding: high performers' deploys-per-developer-per-day *increases* as team grows; low performers' decreases. Validates Inverse Conway Maneuver as the mechanism for achieving independent deployability. |
| [[sources/building-evolutionary-architectures]] | Primary treatment; Conway's Law as an architectural force requiring deliberate counteraction via Inverse Conway Maneuver |
| [[sources/fundamentals-of-software-architecture]] | Mentions Conway's Law in the context of architecture style selection; notes that team structure affects the feasibility of certain styles |
| [[sources/building-event-driven-microservices]] | Frames Conway's Law through the lens of three communication structures (business, implementation, data); argues that the data communication structure has historically been absent, forcing the implementation communication structure to play double duty and creating the conditions Conway's Law predicts — teams can't separate services cleanly because they can't separate data cleanly |
| [[sources/team-topologies]] | Most thorough treatment. Empirically grounds Conway's Law beyond software (MacCormack's studies, vehicle manufacturing, aircraft design). Introduces Pflaeging's three-structure model; tool choices as communication drivers; unexpected communication as diagnostic signal; organisation design as technical work. Operationalises the reverse Conway maneuver via the four fundamental team types and three interaction modes (→ [[concepts/team-topologies-model]]) |

## Related Concepts

- [[concepts/team-topologies-model]] — the four team types and three interaction modes that operationalise the reverse Conway maneuver
- [[concepts/technical-vs-domain-partitioning]] — the architectural outcome Conway's Law predicts from team structure
- [[concepts/architecture-quantum]] — bounded contexts as quantum boundaries; team boundaries should align with quantum boundaries
- [[concepts/evolutionary-architecture]] — Inverse Conway Maneuver is one of the core guidelines for building evolvable architectures
- [[concepts/fitness-functions]] — automate verification of integration contracts between teams
- [[concepts/deployment-pipelines]] — enterprise pipeline templates require Conway-aligned team boundaries to work effectively
- [[styles/microservices-architecture]] — the canonical domain-partitioned architecture requiring domain-partitioned teams
- [[concepts/westrum-culture]] — Westrum's culture typology; generative culture is the organisational condition that enables the architectural outcomes Conway's Law predicts
