---
title: "Team Topologies Model"
type: concept
tags: [architecture, teams, organizational-design, cognitive-load, flow, conways-law]
sources: [team-topologies]
created: 2026-05-14
updated: 2026-05-14
---

# Team Topologies Model


## Definition

Team Topologies (Skelton & Pais, 2019) is an adaptive model for technology organisation design. It provides four fundamental team types and three team interaction modes as the building blocks for structuring engineering organisations. The core premise: team structure is not separate from software architecture — the two are bound together by [[concepts/conways-law]], and must be designed together.

## Why It Matters

Most software delivery problems attributed to technology or process are actually organisational: wrong team shapes, excessive cognitive load, or undefined interaction modes between teams. Prescribing a fixed org chart fails because it is a static snapshot of a dynamic system. Team Topologies provides a vocabulary for teams to deliberately evolve their structures and interactions as the system and organisation mature.

## The Four Fundamental Team Types

### 1. Stream-Aligned Team

The primary team type. Aligned to a single, valuable stream of work — a product, service, user journey, or business capability. Has end-to-end responsibility: build, run, and own the software delivering that stream.

- Long-lived; not a project team
- Contains all skills needed to build, test, deploy, and operate (cross-functional)
- Minimises dependencies on other teams; fast flow is the goal
- Most teams in an organisation should be stream-aligned

### 2. Platform Team

Provides internal services to stream-aligned teams, reducing their cognitive load by abstracting away infrastructure and cross-cutting concerns. The platform is a product: it has explicit consumers (stream-aligned teams), SLAs, documentation, and a compelling developer experience (the "thinnest viable platform").

- Does not do work on behalf of stream-aligned teams — it provides self-service capabilities they use themselves
- Success metric: stream-aligned teams can use the platform with minimal interaction with the platform team
- Must resist becoming a bottleneck; self-service is the design goal

### 3. Enabling Team

Helps stream-aligned (and other) teams acquire new capabilities they currently lack — skills, practices, tooling, frameworks. Acts as a consultant or coach, not a permanent owner.

- Time-limited engagements; not a permanent dependency
- Goal: raise capability so the stream-aligned team can operate independently afterward
- Avoids creating a permanent service relationship (that would be a platform team)

### 4. Complicated-Subsystem Team

Owns a part of the system requiring deep specialist knowledge that is impractical to embed in a stream-aligned team (e.g., video processing codec, actuarial calculation engine, ML training pipeline).

- Used sparingly; most teams should not be this type
- Created only when the cognitive load of a subsystem genuinely exceeds what a stream-aligned team can carry
- Interfaces to stream-aligned teams via X-as-a-Service interaction mode

> **Open question:** The boundary between "complicated enough to warrant its own team" and "stream-aligned teams can handle it with enabling support" is not precisely defined. The book treats it as a judgement call.

## The Three Team Interaction Modes

Interaction modes define *how* two teams should relate at a given point in time. The mode should be explicitly chosen — not left to emerge from habit.

### 1. Collaboration

Two teams work closely together, with overlapping boundaries, toward a shared goal. High bandwidth; high cognitive load overhead. Used during:
- Periods of exploration and discovery (unknown technology, new product area)
- When the right API or boundary between two systems is not yet clear

Collaboration is expensive and should be time-limited. Once the boundary is understood, transition to X-as-a-Service.

### 2. X-as-a-Service

One team provides a well-defined service that another team consumes with minimal interaction. Low bandwidth; low cognitive load overhead. The consuming team has autonomy and does not depend on the providing team for day-to-day decisions.

- Default mode for platform teams and complicated-subsystem teams
- Requires a stable, well-documented interface (API, SDK, CLI)
- Breakdown signal: the consuming team frequently needs to escalate to the providing team

### 3. Facilitating

An enabling team helps another team adopt a new practice, tool, or approach. The facilitating team does not own the outcome; it raises capability.

- Time-limited; ends when the target team is self-sufficient
- Distinct from collaboration (the enabling team has the expertise; the goal is transfer, not joint discovery)

## Team Sizing and Stability

### Size: Dunbar-Compatible Teams

Teams are bounded by Dunbar's number — the cognitive limits on human trust and relationship depth (→ [[sources/team-topologies]] ch. 3):

| Grouping | Size | Trust type |
|----------|------|-----------|
| Working group | ~5 | Close personal relationships; working memory |
| Team | 5–9 (max ~15 in high-trust orgs) | Deep trust |
| Tribe / family | ≤50 | Mutual trust |
| Division / stream | ≤150 (then 500) | Recognise capabilities |

A team larger than ~9 people begins losing the trust required for high performance; beyond ~15 even in high-trust organisations. When a grouping exceeds a Dunbar limit, split it rather than let it grow — the architecture must be realigned to match the new team groupings.

### Stability: Work Flows to Teams

Teams should be **stable but not static** — changing only when necessary, not after every project. A new team takes two weeks to three months to become cohesive; disbanding a high-performing team destroys that value immediately.

The principle: *flow the work to the team*, not people to projects. Project-based team assembly is an anti-pattern: it optimises for short-term flexibility at the cost of long-term performance.

### One Owner per System Component

Every software system component must be owned by exactly one team. No shared ownership of components, libraries, or services. Outside teams may submit pull requests, but the owning team retains responsibility and final say. Shared ownership is no ownership — no team has cognitive space to care for something that is also someone else's problem.

## Team API

With stable long-lived teams owning bounded software systems, the **team API** becomes the primary interface between teams (→ [[sources/team-topologies]] ch. 3). The team API includes:

- **Code**: runtime endpoints, libraries, clients, UI produced by the team
- **Versioning**: semantic versioning as a promise not to break consumers
- **Documentation**: how-to guides, runbooks, onboarding docs
- **Practices**: preferred ways of working; coding standards
- **Communication**: chat channels, response time expectations, video call norms
- **Work information**: current priorities, backlog visibility, roadmap

The team API should be designed for its consumers (other teams): easy to discover, easy to onboard, stable, and explicitly versioned. Teams should continuously test and evolve it.

## Platform as a Product: The Thinnest Viable Platform

The platform team must treat the internal developer platform as a **product** — not as an internal tooling effort (→ [[sources/team-topologies]] ch. 5):

- **Self-service**: stream-aligned teams consume the platform with minimal interaction with the platform team. A platform that requires tickets or collaboration for routine operations has failed.
- **User personas**: the platform team actively maintains personas for its consumers (web developer, tester, product owner, etc.) and shapes the platform roadmap around their needs — not around arbitrary feature requests.
- **Developer experience (DevEx)**: onboarding ease is the primary UX test. The platform should be compelling to use, consistent in its API design, and well-documented with task-oriented how-to guides.
- **Treated as a live product**: defined hours of operation, SLAs, on-call support, incident communication channels, a curated roadmap.

**Thinnest Viable Platform (TVP)**: the simplest platform that meaningfully reduces cognitive load on stream-aligned teams. Start minimal — even a wiki page listing shared services qualifies. Expand only in response to demonstrated need. Platform teams have a natural tendency to over-engineer; strong product management keeps the platform focused.

> "Software developers love building platforms and, without strong product management input, will create a bigger platform than needed." — Allan Kelly (→ [[sources/team-topologies]] ch. 5)

**Fractal platforms**: in large organisations, the platform itself is composed of the four fundamental team types — stream-aligned teams for platform features, enabling teams for platform practices, complicated-subsystem teams for specialist platform components, and lower-level platform teams for the platform's own infrastructure. From the outside, stream-aligned teams see one platform. Inside, it runs as its own mini-organisation using the same model.

## Team-Type Ratios and Conversions

**Ratio**: in healthy, flow-optimised organisations, 6:1 to 9:1 stream-aligned teams to all other types. One in seven to one in ten teams is non-stream-aligned (→ [[sources/team-topologies]] ch. 5).

**Converting existing teams** (→ [[sources/team-topologies]] ch. 5):

| Existing team type | Best conversion |
|-------------------|----------------|
| Infrastructure team | Platform team — must shift from gating production changes to providing self-service capabilities |
| Component team | Platform, enabling, or complicated-subsystem — decision driven by cognitive load, not sharing opportunity |
| DBA team | Enabling (spread DB performance awareness to stream-aligned teams) or platform (DB-as-a-service) |
| Tooling team | Enabling (time-limited, focused remit) or part of platform (with a clear roadmap) |
| Support team | Align to stream of change; use dynamic "swarming" for cross-stream incidents |
| Architecture team | Part-time enabling team — supports other teams, does not impose designs |

**Architecture team model**: the most effective pattern for an architecture function is a part-time enabling team — not a powerful separate body. Its key role is discovering effective APIs between teams and shaping team interactions with Conway's law in mind.

## Industry Patterns and Anti-Patterns

### The Spotify Model (example, not a recipe)

Spotify's squad/tribe/chapter/guild model is an influential example of stream-aligned team design, not a prescribable recipe (→ [[sources/team-topologies]] ch. 4):

- **Squad**: 5–9 people, cross-functional, long-term mission, autonomous — equivalent to a stream-aligned team
- **Tribe**: grouping of squads working on related areas (Dunbar limit ~50)
- **Chapter**: people with the same skill across squads within a tribe; line management via chapter lead who also works in a squad
- **Guild**: voluntary community of practice across multiple tribes; loose cross-tribe learning

> "We didn't invent this model. Spotify is (like any good Agile company) evolving fast. This article is only a snapshot." — Kniberg & Ivarsson

Many organisations copied the model without its underlying culture and trajectory, producing cargo-culted structures that failed.

### Team Anti-Patterns

Two common failure modes when teams are not deliberately designed (→ [[sources/team-topologies]] ch. 4):

1. **Ad hoc team design**: teams split or merged reactively in response to individual problems (production incident, new technology) without considering the broader team inter-relationship context
2. **Shuffling team members**: project-based staffing; teams assembled for a project and disbanded after, leaving one or two people for maintenance. Optimises for short-term deadlines; ignores ramp-up cost and trust destruction.

### DevOps Team Anti-Pattern

A dedicated "DevOps team" (common ~2015–present) frequently becomes a silo that application teams are hard-dependent on for deployment and automation steps, defeating the purpose. The DevOps team should be a temporary enabling team — raising the capability of stream-aligned teams until they are self-sufficient — not a permanent execution team.

## Cognitive Load as an Architectural Constraint

Team cognitive load is the total mental effort required to operate the software a team owns. The book distinguishes three types:
- **Intrinsic**: inherent complexity of the domain/task
- **Extraneous**: accidental complexity from poor tooling, unclear processes, context switching
- **Germane**: effort that builds mastery (desirable)

The design goal is to minimise extraneous cognitive load and keep intrinsic load within the team's capacity. When cognitive load exceeds capacity:
- Delivery slows (the team becomes the bottleneck)
- Quality drops
- Motivation falls (autonomy, mastery, and purpose are all impeded)

Practical limit: a team should own no more software than it can hold in its collective working memory and maintain confidence in operating.

## Interaction Mode Detail

### Constraints per Mode

Each interaction mode has explicit constraints that prevent misuse (→ [[sources/team-topologies]] ch. 7):

| Mode | Constraint | Reason |
|------|-----------|--------|
| Collaboration | At most one partner at a time | Exceeds cognitive load if multiple simultaneous; collapses focus |
| X-as-a-Service | Many simultaneous consumers | Designed for this; predictable interface; no bandwidth cost |
| Facilitating | Small number simultaneously | Requires deep engagement; enabling team gets stretched |

### Interaction Mode Matrix

Which modes are Typical vs Occasional by team type (→ [[sources/team-topologies]] ch. 7, Table 7.4):

| Team type | Collaboration | X-as-a-Service | Facilitating |
|-----------|--------------|----------------|--------------|
| Stream-aligned | Typical | Typical | Occasional |
| Enabling | Occasional | — | Typical |
| Complicated-subsystem | Occasional | Typical | — |
| Platform | Occasional | Typical | — |

### Awkward Interactions as Diagnostic Signal

Team interactions that feel awkward or require more effort than expected are a diagnostic signal, not a people problem (→ [[sources/team-topologies]] ch. 7):

- **Excessive communication in X-as-a-Service mode** → the API or service is poorly designed; the providing team has not invested sufficiently in DevEx or documentation
- **Lack of communication in collaboration mode** → the wrong teams have been placed together, or the boundary is too ambitious
- **Response**: fix the API or team boundary, not the individuals

### Promise Theory and Semantic Versioning

X-as-a-Service interactions are best understood through **promise theory** (Mark Burgess) (→ [[sources/team-topologies]] ch. 7):

- Inter-team relationships are voluntary promises, not contractual obligations imposed from outside
- Semantic versioning (SemVer) is a team's *promise* to its consumers not to break their integration without explicit warning
- Promise-based relationships are more durable than contracts because teams *choose* to uphold them — motivation comes from within, not enforcement
- This framing helps teams think about their "team API" as a product with genuine commitments to consumers

### Intermittent Collaboration Research

Research by Bernstein et al. (2018) supports the Team Topologies model of time-bounded collaboration over permanent open collaboration: intermittent groups achieved near-identical average quality to constantly-collaborating groups while preserving solution variation — protecting the organisation's ability to discover best solutions. Permanent open collaboration converges to sameness and misses better outcomes (→ [[sources/team-topologies]] ch. 7).

## Evolution of Interaction Modes

Team interactions should change over time. A common healthy trajectory:

1. **Collaboration** (during discovery) → 2. **X-as-a-Service** (during execution)

This **discovery-to-establish pattern** is expected simultaneously across the organisation at different stages for different team pairs. An enabling team that never exits is a platform team in disguise. A platform team that needs constant collaboration with its consumers has a service design problem. Explicit conversations about which mode applies right now — and when to transition — are a key Team Topologies practice.

### Triggers for Topology Evolution

Three signals that the current topology needs to change (→ [[sources/team-topologies]] ch. 8):

1. **Software grown too large**: team exceeds Dunbar limits; key-person dependencies emerge; onboarding and documentation become fragile; team can no longer hold the system in collective working memory
2. **Delivery cadence slowing**: team feels slower, WIP increases, hard dependencies on other teams block delivery
3. **Multiple streams relying on a large underlying service set**: solution is to "platformize" the lower layer — create a platform team and let stream-aligned teams own their own telemetry and diagnostics above it

## Organisational Sensing

The stability of teams and the clarity of their interaction modes is not just an efficiency concern — it makes the organisation capable of *sensing its environment* (→ [[sources/team-topologies]] ch. 8).

Stable, well-defined teams with well-defined interaction modes create reliable communication pathways. These pathways are the organisation's sensory apparatus: signals from users, markets, and operational systems flow through them to inform decisions. Unstable team structures — with constantly shifting membership and interaction patterns — destroy these pathways. The organisation becomes literally *senseless*: unable to detect and respond to environmental change.

**Cybernetic feedback loop**: drawing on Stafford Beer's cybernetics, the book argues that operations must feed back into development. Teams are the sensors. The mechanism: operations experience generates signals (operability failures, user complaints, reliability degradation) that flow through stable team-to-team communication back to development, enabling course correction. This requires:
- IT operations staffed with senior engineers capable of accurate triage and high-fidelity signal generation
- Direct communication pathways between Ops and Dev — not mediated by a project manager or ticket queue
- Dev teams that maintain responsibility for running the systems they build

**BAU/maintenance team anti-pattern**: separating "new-service" teams from "business as usual" maintenance teams breaks the feedback loop entirely. New-service teams implement approaches without seeing operational consequences; BAU teams cannot improve things without authority. Both teams are blind. Better model: one stream-aligned team owns both new and existing services, retrofits telemetry from newer systems to older ones, and learns from the full operational range.

**Three Ways of DevOps** (Gene Kim et al., cited in ch. 8): (1) systems thinking — optimise for flow across the whole; (2) feedback loops — Dev informed and guided by Ops; (3) culture of continual experimentation. The Team Topologies sensing model is an organisational implementation of Ways 2 and 3.

## Team Topologies is Necessary but Not Sufficient

Team Topologies provides the structure, but effective software delivery also requires (→ [[sources/team-topologies]] conclusion):

- **Healthy organisational culture**: psychological safety, continuous learning, empowerment to speak out
- **Good engineering practices**: test-first design, continuous delivery, operability focus, designing for testability
- **Healthy funding/financial practices**: avoid CapEx/OpEx splits that harm flow; avoid project-based deadlines and large-batch budgeting; allocate training budgets to teams not individuals
- **Clarity of business vision**: non-conflicting direction at human-relevant timescales (3, 6, 12 months) with clear reasoning behind priorities

The garden metaphor from the conclusion: Team Topologies provides the instructions for planting, pruning, and training. Culture, engineering, and financial practices are the soil, water, and fertiliser. Unhealthy culture or poor engineering practices poison the garden regardless of how well the planting patterns are followed.

## Relationship to Conway's Law

Team Topologies is an operationalisation of [[concepts/conways-law]]. The four team types and three interaction modes are the mechanism by which the reverse Conway maneuver is applied: design the team structure to match the desired software architecture, not the other way around.

- Stream-aligned teams → domain-partitioned services with clear ownership
- Platform teams → shared infrastructure without shared-database coupling
- Complicated-subsystem teams → encapsulated specialist components behind clean APIs
- Collaboration mode → temporary coupling during boundary discovery
- X-as-a-Service mode → the target state: loose coupling between teams mirrored in loose coupling between services

## Related Concepts

- [[concepts/conways-law]] — the foundational law that makes team structure and software architecture isomorphic
- [[concepts/cognitive-load]] — team cognitive load as a first-class design constraint; drives software boundary sizing
- [[concepts/fracture-planes]] — the eight fracture plane types for choosing where to split systems to fit stream-aligned team boundaries
- [[concepts/technical-vs-domain-partitioning]] — stream-aligned teams produce domain-partitioned architectures
- [[concepts/bounded-contexts]] — bounded contexts and stream-aligned teams are naturally co-extensive; both should fit within one team's cognitive capacity
- [[styles/microservices-architecture]] — microservices require stream-aligned teams to be effective; platform teams provide the shared infrastructure
- [[concepts/evolutionary-architecture]] — the sensing organisation (ch. 8) is the Team Topologies contribution to evolutionary architecture
