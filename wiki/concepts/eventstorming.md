---
title: "EventStorming"
type: concept
tags: [ddd, domain-driven-design, workshop, modeling, ubiquitous-language, bounded-contexts, collaboration, metrics, kpi]
sources: [learning-domain-driven-design, monolith-to-microservices, software-architecture-metrics]
created: 2026-05-14
updated: 2026-05-22
---

# EventStorming

## Definition

EventStorming is a low-tech, collaborative workshop for rapidly modeling a business process. A group of participants — ideally mixing engineers, domain experts, product owners, testers, UX designers, and support staff — brainstorm and organise domain events on a large paper surface, progressively enriching the model with commands, actors, policies, aggregates, and bounded context candidates.

Created by Alberto Brandolini. (→ [[sources/learning-domain-driven-design]] ch. 12)

**The real value is the process, not the output**: knowledge sharing, alignment of mental models, discovery of conflicts, and formulation of the ubiquitous language. The physical model is a useful artefact, but secondary.

---

## When to Use

| Purpose | Description |
|---------|-------------|
| Build a ubiquitous language | Participants synchronise terminology as they co-build the model |
| Model a business process | DDD-oriented building blocks reveal aggregate and bounded context boundaries |
| Explore new business requirements | Uncovers edge cases; aligns all participants before implementation |
| Recover domain knowledge | Especially valuable for legacy systems and brownfield projects where documentation is stale |
| Improve an existing process | End-to-end visibility reveals bottlenecks and automation opportunities |
| Onboard new team members | Active participation builds domain knowledge faster than documentation |

**Not suitable for**: simple, sequential processes with no meaningful business logic or complexity — the collaboration overhead outweighs the benefit.

---

## Prerequisites

- **Modeling space**: a wall covered with butcher paper (preferred) or a large whiteboard
- **Sticky notes**: multiple colours — orange (domain events), light blue (commands), small yellow (actors), purple (policies), green (read models), pink (external systems / pain points), large yellow (aggregates)
- **Markers**: enough for all participants
- **Room**: spacious; no large central table; no chairs (participation requires movement)
- **Snacks**: sessions run 2–4 hours

**Group size**: max 10 for in-person; max 5 for remote (remote reduces collaboration effectiveness — Brandolini recommends in-person only when circumstances permit). Tools: Miro for remote sessions.

---

## The 10-Step Process

### Step 1 — Unstructured Exploration

All participants write domain events (things that have *happened* in the business domain) on orange sticky notes and add them to the surface. No ordering; duplicates allowed. Continue until the rate of new events slows significantly.

Domain events are phrased in the past tense: "Order Placed", "Payment Confirmed", "Shipment Dispatched".

### Step 2 — Timelines

Organise events chronologically. Start with the happy path (successful scenario); add alternative paths (error cases, decision branches) as branches or parallel flows. Remove duplicates; fix incorrect events; add missing ones.

### Step 3 — Pain Points

Identify bottlenecks, manual steps requiring automation, missing documentation, or gaps in domain knowledge. Mark with rotated (diamond-shaped) pink sticky notes. These are tracked throughout the session — as a facilitator, listen for concerns raised at any step and capture them as pain points.

### Step 4 — Pivotal Events

Identify domain events that signal a significant change of context or phase. Mark with a vertical bar dividing the timeline. Pivotal events are **potential bounded context boundaries**.

Example: "Shopping Cart Initialized" → "Order Placed" → "Order Shipped" → "Order Delivered" each represent a context change.

### Step 5 — Commands

Add commands — the *causes* of domain events. Commands are phrased in the imperative: "Submit Order", "Approve Shipment". Write on light blue sticky notes; place before the events they trigger.

If a command is executed by a specific actor (user persona), add a small yellow sticky with the actor's name to the command.

### Step 6 — Policies

Identify automation policies: rules that automatically trigger a command when a domain event occurs. Write on purple sticky notes connecting events to commands. Include decision criteria when relevant (e.g., "only for VIP customers").

This step accounts for commands that have no human actor — they are triggered by the system reacting to events.

### Step 7 — Read Models

For each command with an actor, identify the read model the actor uses to make their decision. A read model is data the actor views before issuing the command: a screen, a report, a notification. Write on green sticky notes; place before the commands.

### Step 8 — External Systems

Add external systems: systems outside the domain being explored that either execute commands (input) or are notified of events (output). Write on pink sticky notes. By the end of this step, all commands should be attributed to either an actor, a policy, or an external system.

### Step 9 — Aggregates

Group related commands and the events they produce. An aggregate receives commands and produces events. Represented as large yellow sticky notes with commands on the left and events on the right. This step reveals transactional and consistency boundaries.

### Step 10 — Bounded Contexts

Group related aggregates (those coupled through policies or representing closely related functionality) into bounded context candidates. These groupings form the starting point for bounded context boundary design.

---

## Two-Phase Facilitation

Khononov's preferred facilitation approach:

**Phase 1 — Big Picture** (steps 1–4 only): explore the full business domain at high level. Produces: a wide-angle view of the domain, a foundation for the ubiquitous language, and candidate bounded context boundaries.

**Phase 2 — Process-Specific Sessions** (all 10 steps): for each significant business process identified in phase 1, run a dedicated session. Produces: complete models (aggregates, commands, policies, bounded context candidates) for each process.

---

## Facilitation Tips

- Begin with a brief overview of the process, the business domain, and the colour legend — post the legend visibly for the duration
- Track group energy; ask questions to reignite slowing sessions; advance to the next step when a step stalls
- Ensure all participants contribute — actively involve quieter participants by asking direct questions
- Take breaks with all participants before resuming
- For remote sessions: use Miro; reduce group size to ~5; consider running multiple parallel sessions and merging results

---

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/learning-domain-driven-design]] | Defining treatment: full 10-step process; facilitation guidance; when to use and not use; two-phase facilitation approach; remote considerations; positions EventStorming as a tool for both knowledge discovery and model output (ch. 12) |
| [[sources/monolith-to-microservices]] | Treats EventStorming as a near-essential first step in microservice migration planning (ch. 2). Newman endorses Brandolini's approach but summarises it at a higher level: participants define domain events bottom-up, group into aggregates, then into bounded context candidates. Key insight: the output is a shared understanding as much as a model — "for this process to work, you need to get the right stakeholders in the room, and often that is the biggest challenge." Newman explicitly notes EventStorming does not require building an event-driven system; it is a domain modelling technique, not an architectural commitment. |
| [[sources/software-architecture-metrics]] | Rosa (ch. 6) extends EventStorming beyond DDD into organisational/architectural strategy. **Big Picture EventStorming** reveals the flow of work across the whole organisation, maps current software components onto emergent business domains, and exposes ownership mismatches that cause high cognitive load. Adding KPI mapping to the Big Picture session surfaces domain metrics and creates shared understanding across business and engineering. **Process Modeling EventStorming** goes one level deeper into a specific operational value stream: maps KPIs, hotspots, and waste (Lean lens). Outputs feed a **KPI Value Tree** (organisational KPIs → domain KPIs → technical metrics). Key framing: "enticing knowledge" — visualising collective knowledge that currently exists only implicitly; catching problems (legal conflicts, flawed assumptions) that document-based processes miss. |

---

## Related Concepts

- [[concepts/ubiquitous-language]] — EventStorming is the primary practical tool for building and validating the ubiquitous language
- [[concepts/bounded-contexts]] — pivotal events reveal bounded context candidates; aggregates group into context candidates at step 10
- [[patterns/domain-model]] — EventStorming output (aggregates + domain events) is a direct blueprint for the domain model or event-sourced domain model
- [[streams/event-sourcing-cqrs]] — the EventStorming model is a natural starting point for an event-sourced domain model implementation
- [[concepts/evolutionary-architecture]] — EventStorming is particularly valuable for recovering domain knowledge in brownfield/legacy modernisation projects
