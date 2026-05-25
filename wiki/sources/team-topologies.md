---
title: "Team Topologies: Organising Business and Technology Teams for Fast Flow"
type: source
tags: [teams, organisational-design, conways-law, cognitive-load, flow]
sources: [team-topologies]
created: 2026-05-14
updated: 2026-05-14
---

# Team Topologies: Organising Business and Technology Teams for Fast Flow

**Authors:** [[authors/matthew-skelton]], [[authors/manuel-pais]]
**Published:** 2019
**Slug:** `team-topologies`

## Overview

Team Topologies argues that software architecture and team organisation are not separate concerns — they are two sides of the same coin, bound together by Conway's law. The book's core thesis is that most delivery problems attributed to technology or process are actually organisational: wrong team shapes, too much cognitive load on individual teams, or poorly defined interaction modes between teams. Rather than prescribing a fixed org chart, Team Topologies provides a dynamic model: four fundamental team types and three interaction modes that can evolve as technical and organisational maturity changes.

The book is grounded in a humanistic premise — teams are the fundamental unit of delivery, not individuals — and makes cognitive load a first-class architectural concern. An organisation that ignores team cognitive load will produce delivery bottlenecks, poor quality, and low motivation regardless of its technical choices.

It draws heavily on Conway's law and the reverse Conway maneuver, treating organisation design as a technical activity that must involve architects and engineers, not just HR and management.

## Key Claims

- Team structure is the first draft of the software architecture (Nygard); architecture cannot be designed in isolation from team design (→ ch. 2)
- Four fundamental team types — stream-aligned, platform, enabling, complicated-subsystem — cover all necessary organisational patterns (→ ch. 5)
- Three interaction modes — collaboration, X-as-a-Service, facilitating — define how teams should relate at any given point (→ ch. 7)
- Cognitive load on teams must be explicitly bounded; teams spread across too many domains produce bottlenecks and low motivation (→ ch. 3)
- Not all communication is good; unexpected inter-team communication signals an architectural problem, not a collaboration opportunity (→ ch. 2)
- Platform teams must treat the internal developer platform as a product with explicit consumers, SLAs, and a compelling developer experience (→ ch. 5)
- Team interaction modes should evolve over time as discovery gives way to execution: collaboration → X-as-a-Service is a natural trajectory (→ ch. 7, ch. 8)
- Awkward or excessive inter-team communication is a diagnostic signal, not a feature; it indicates a badly designed team boundary or API (→ ch. 7)
- Stable, well-defined teams with well-defined interaction modes make the organisation a reliable sensing apparatus; unstable team structures are literally "senseless" (→ ch. 8)
- Separating "new-service" teams from "BAU/maintenance" teams breaks the feedback loop from operations to development; single stream-aligned teams should own both (→ ch. 8)
- The reverse Conway maneuver should be applied before software is built, not after (→ ch. 2)
- Reorganisations driven by management convenience or headcount reduction actively destroy software delivery capability (→ ch. 2)

## Chapter Notes

### Chapter 7 — Team Interaction Modes

Detailed treatment of the three interaction modes, each with explicit advantages, disadvantages, and appropriate constraints:

**Collaboration**: two teams work closely together with overlapping boundaries. Advantages: rapid learning, innovation at boundaries, useful when correct API boundary is unknown. Disadvantages: high cognitive load overhead ("collaboration tax"), blurs responsibility, slows delivery if prolonged. Constraint: each team should be in close collaboration with *at most one* other team at a time. When collaboration no longer brings learning benefits, transition to X-as-a-Service.

**X-as-a-Service**: one team provides; the other consumes with minimal interaction. Advantages: clear ownership, predictable delivery, scales to many simultaneous consumers, enables autonomy. Disadvantages: can slow innovation at the boundary; requires strong DevEx and product management from the providing team. Based on **promise theory** (Mark Burgess): semantic versioning is a promise not to break consumers — inter-team relationships are voluntary promises, not contractual obligations. Provides deeper alignment than contracts because teams *choose* to uphold them.

**Facilitating**: an enabling team helps another team adopt a new approach. The enabling team's primary mode. Constraint: a small number of teams can be facilitated simultaneously. Time-limited; goal is capability transfer, not permanent assistance.

**Interaction mode matrix** (which modes are Typical vs Occasional by team type):

| Team type | Collaboration | X-as-a-Service | Facilitating |
|-----------|--------------|----------------|--------------|
| Stream-aligned | Typical | Typical | Occasional |
| Enabling | Occasional | — | Typical |
| Complicated-subsystem | Occasional | Typical | — |
| Platform | Occasional | Typical | — |

**Awkward interactions as diagnostic signal**: if a team using X-as-a-Service mode must constantly escalate to the providing team, the API or service is poorly designed. If two teams in collaboration mode barely communicate, the wrong teams have been placed together or the boundary is too ambitious. Awkward interaction → fix the API or team boundary, not the people.

**Architect role in Team Topologies**: architects should primarily act as designers of team APIs and shapers of team-to-team interactions with Conway's law in mind. Requires both social and technical skills, and a broader organisational remit than is traditionally given.

**Intermittent collaboration** (Bernstein et al. research): groups that collaborated intermittently achieved nearly identical average quality to constantly-collaborating groups, while preserving solution variation that helped find best outcomes. Supports Team Topologies' prescription for time-bounded, purposeful collaboration over permanent open collaboration.

### Chapter 8 — Evolve Team Structures with Organizational Sensing

Picks up from Ch 7 to describe *when* and *why* to change team topology, and how well-structured teams create organisational intelligence.

**Discovery-to-establish pattern**: the natural trajectory for a pair of teams is close collaboration (high uncertainty, learning) → limited collaboration → X-as-a-Service (established patterns, predictable delivery). This transition is expected to happen simultaneously across the organisation at different stages for different team pairs.

**Three triggers for topology evolution**:
1. *Software grown too large*: team exceeds Dunbar limits; key-person dependencies emerge; onboarding and documentation suffer; the team can no longer hold the system in collective working memory
2. *Delivery cadence slowing*: team feels slower than it once was; WIP increases; hard dependencies on other teams block delivery; team loses confidence in its output
3. *Multiple business services relying on a large set of underlying services*: solution is to "platformize" the lower layer — wrap it as a platform team and let stream-aligned teams own their own telemetry and diagnostics above it

**Organisational sensing**: stable, well-defined teams with well-defined interaction modes create reliable communication pathways — the organisation can reliably "sense" its environment (customers, markets, technology changes). Unstable team structures with constantly shifting membership and boundaries are literally senseless — signals are lost in the noise of reorganisation.

**Cybernetic feedback loop**: the book draws on Stafford Beer's cybernetics — organisations must have feedback from operational reality back into development decisions. Teams are the sensors. IT operations as high-value sensory input: Ops teams provide high-fidelity signals about operability, reliability, security, and usability. The DevOps Handbook's Three Ways of DevOps are cited:
1. Systems thinking — optimise for fast flow across the whole
2. Feedback loops — development informed and guided by operations
3. Culture of continual experimentation and learning

**BAU/maintenance team anti-pattern**: separating "new-service" teams from "business as usual" maintenance teams breaks the feedback loop from Ops to Dev entirely. The new-service team implements new approaches without seeing consequences; the BAU team has no incentive or authority to improve things. Better model: a single stream-aligned team owns both the new service and existing systems side-by-side, retrofits telemetry from newer systems to older ones, and learns from the full range of operational behaviour.

**Senior engineers in operations**: contrary to historical practice, IT operations requires the most experienced engineers — not the most junior — to provide accurate, useful triage and high-fidelity signal to development teams.

**Team Topologies is necessary but not sufficient** (conclusion): Team Topologies provides the model, but effective organisations also require:
- Healthy organisational culture: psychological safety, continuous learning, empowerment
- Good engineering practices: test-first, continuous delivery, operability focus, designing for testability
- Healthy funding/financial practices: avoid CapEx/OpEx splits that harm flow; avoid project-based deadlines and large-batch budgeting
- Clarity of business vision: non-conflicting direction at human-relevant timescales

### Chapter 1 — The Problem with Org Charts

Every organisation has three simultaneous structures (Pflaeging): the formal org chart (compliance), the informal influence network, and the value creation structure (how work actually happens). Org charts only capture the first. Decisions based solely on the org chart optimise locally and miss systemic bottlenecks.

Team Topologies introduces four team types and three interaction modes as its core model. Cognitive load is introduced as the key constraint: teams spread too thin lose mastery, suffer context switching, and become delivery bottlenecks. Systems thinking — optimise for the whole flow — is the recommended alternative to local optimisation.

### Chapter 2 — Conway's Law and Why It Matters

Conway's law is empirically well-supported beyond software (vehicle manufacturing, aircraft engine design, open-source studies by MacCormack et al.). Ruth Malan's modern formulation: *"If the architecture of the system and the architecture of the organisation are at odds, the architecture of the organisation wins."*

Key extensions beyond the existing wiki treatment:
- Tool choices drive communication patterns (shared tools = collaboration signal; separate tools = independence signal)
- Unexpected inter-team communication is a diagnostic signal: something is wrong with the API, platform, or component boundary
- Organisation design is inherently technical work; architects need a say in team structure
- Reorganisations for management convenience destroy software delivery capability

### Chapter 5 — The Four Fundamental Team Topologies

Detailed treatment of each team type with expected behaviours. Stream-aligned teams: primary type; no dedicated Ops handoff; SRE is a special kind of stream-aligned team. Enabling teams: temporary, servant-like, avoid ivory tower, plan for their own extinction. Complicated-subsystem teams: only when specialist knowledge *drives* the need (not when sharing is convenient). Platform teams: self-service product with TVP principle; DevEx focus; fractal internally (composed of four team types at scale).

Architecture team: most effective as a part-time enabling team. Ratio: 6:1 to 9:1 stream-aligned to other. Conversion guide: infrastructure → platform; component → platform/enabling/complicated-subsystem; DBA → enabling or platform; tooling → enabling or platform; support → stream-aligned with dynamic swarming.

### Chapter 6 — Choose Team-First Boundaries

Fracture planes: natural seams where systems can be split to produce autonomous, cognitively bounded team ownership. Eight types: (1) business domain bounded context (primary); (2) regulatory compliance; (3) change cadence; (4) team location; (5) risk; (6) performance isolation; (7) technology (use sparingly); (8) user personas. Litmus test: "Could we, as a team, effectively consume or provide this subsystem as a service?"

Six forms of monolith: application, joined-at-the-database, monolithic build, monolithic release, monolithic model, monolithic thinking. Distributed monolith: microservices with end-to-end batch testing before release.

### Chapter 3 — Team-First Thinking

The team is the fundamental unit of delivery. Effective teams are small (5–9), stable, and long-lived — work flows to teams, not people to projects. Team size limits derive from Dunbar's number (deep trust limit ~15; mutual trust ~50; capability recognition ~150); organisations should scale via Dunbar-compatible groupings.

Every software component must be owned by exactly one team. Shared ownership is no ownership.

Cognitive load (Sweller): intrinsic (domain fundamentals — minimise), extraneous (environment overhead — eliminate), germane (value-add thinking — maximise). Software boundaries should be sized to team cognitive capacity, not vice versa. Domain complexity heuristics: 2–3 simple domains; max 1 complicated; max 1 complex (with no others). The Team API is the primary inter-team interface: code + versioning + docs + practices + communication + work visibility.

### Chapter 4 — Static Team Topologies

Anti-patterns: ad hoc team design and shuffling team members (project-based staffing). Design for flow: cross-functional teams owning build, test, deploy, and operate — eliminating handoffs. DevOps emerged ~2009 to address dev/ops separation ("wall of confusion").

DevOps Topologies: no one-size-fits-all; context-dependent on technical maturity, org size, software scale, and engineering discipline. Feature teams require high engineering maturity and trust. Product teams need non-blocking self-service dependencies. SRE is a specialised pattern suited to high scale with a dynamic error-budget relationship between SRE and dev teams. The DevOps team anti-pattern: a permanent execution DevOps team becomes a hard dependency; should instead be a temporary enabling team that makes itself obsolete.

## Notable Quotes

> "Team assignments are the first draft of the architecture." — Michael Nygard (cited ch. 2)

> "If the architecture of the system and the architecture of the organisation are at odds, the architecture of the organisation wins." — Ruth Malan (cited ch. 2)

> "Requiring everyone to communicate with everyone else is a recipe for a mess." (ch. 2)

## Related Pages

- [[concepts/conways-law]] — primary concept page; extensively enriched by this source
- [[concepts/team-topologies-model]] — the four team types and three interaction modes
- [[concepts/cognitive-load]] — team cognitive load as a first-class architectural concern
