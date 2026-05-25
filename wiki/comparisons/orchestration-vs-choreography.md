---
title: "Orchestration vs Choreography"
type: comparison
tags: [distributed-systems, sagas, coordination, microservices, workflow]
sources: [understanding-distributed-systems, software-architecture-the-hard-parts, building-event-driven-microservices, learning-domain-driven-design, monolith-to-microservices, fundamentals-of-software-architecture]
created: 2026-05-18
updated: 2026-05-18
---

# Orchestration vs Choreography

Both patterns coordinate work across multiple services. The choice is one of the most consequential in distributed system design — it affects coupling, debuggability, scalability, and which team owns the workflow.

## The Core Distinction

**Orchestration**: a central coordinator (the orchestrator) drives the workflow. It issues commands to participants, receives results, tracks state, and triggers compensations on failure. Participants are passive — they do what they're told.

**Choreography**: there is no central coordinator. Each service reacts to events from other services and publishes its own events when its local work is done. The workflow emerges from the interactions.

## Decision Summary

| Use orchestration when | Use choreography when |
|------------------------|----------------------|
| One team owns the entire workflow | Multiple teams each own a step |
| Workflow has many steps or complex error paths | Workflow is simple (2–4 steps, stable ordering) |
| You need to query current workflow state easily | Services are already event-driven |
| Compensations must be centrally coordinated | Strong coupling to a coordinator is unacceptable |
| Complex conditional branching across steps | Low coupling between services matters more than debuggability |

## Trade-off Analysis

### Orchestration

**Strengths:**
- Workflow state is explicit and in one place — easy to answer "where is order #12345 right now?"
- Error handling is centralised — the orchestrator detects failures and coordinates compensations
- Simpler to reason about — the workflow is a readable state machine in one service
- Managed options exist (AWS Step Functions, Azure Durable Functions) that handle durability and restarts

**Weaknesses:**
- All participants depend on the orchestrator's availability — it is a coupling point and potential bottleneck
- Business logic can migrate into the orchestrator over time, creating a distributed monolith (→ the God Orchestrator anti-pattern)
- Every step passes through the orchestrator, adding latency

**God Orchestrator anti-pattern** (Bellemare): the orchestrator sends granular commands to minion services rather than coordinating between bounded contexts. A true orchestrator coordinates between domain services; it doesn't micromanage their internal operations (→ [[sources/building-event-driven-microservices]] ch. 8).

### Choreography

**Strengths:**
- No central bottleneck — each service reacts to events and scales independently
- Services are coupled only by event schema, not by direct dependency on a coordinator
- Each team owns their service's event handling independently

**Weaknesses:**
- "What is the current state of this workflow?" requires querying multiple services or reconstructing from event history
- Compensation logic is distributed — coordinating rollback across services is significantly harder
- Harder to debug — the workflow is implicit in the event interactions, not visible in one place
- Complexity does not decrease with choreography: it increases (→ SATH saga type table)

## What the Sources Disagree On

**Newman's team-ownership heuristic** (→ [[sources/monolith-to-microservices]] ch. 4) is the most actionable single rule: if one team owns the entire workflow, use orchestration — they can reason about the state machine and change it. If multiple teams each own a step, use choreography — no team has full visibility anyway, and each team should own their event handling independently.

**Bellemare** (→ [[sources/building-event-driven-microservices]] ch. 8) leans toward orchestration for complex multi-step workflows and limits choreography to simple 2–3 service transactions with stable event ordering. His reasoning: choreographed compensation is practically unworkable for complex failures.

**SATH's 8-type taxonomy** (→ [[sources/software-architecture-the-hard-parts]] ch. 11–12) reframes the question. Rather than a binary choice, coordination is one of three independent dimensions (communication × consistency × coordination). Choreography consistently adds complexity regardless of the other choices — in the 8-type table, choreographed variants always score higher complexity than their orchestrated equivalents. The recommended patterns (Fairy Tale Saga and Parallel Saga) are both orchestrated.

> **Verdict from SATH**: choreography's coupling advantages are real, but they come at a complexity cost that is underestimated in most teams' intuitions.

**Vitillo** (→ [[sources/understanding-distributed-systems]] ch. 13) presents both as straightforward options but notes that orchestrated sagas are easier to implement correctly because state is durable and checkpointed — an orchestrator that crashes and restarts can resume from the last checkpoint. Choreography has no equivalent durability mechanism without additional infrastructure (e.g., the outbox pattern on every participant).

## Workflow State in Choreography

When choreography is chosen but workflow state visibility is still needed, three approaches exist (→ [[sources/software-architecture-the-hard-parts]] ch. 11):

1. **Front controller**: the first service in the choreography owns and tracks overall workflow state. Simple but creates awkward coupling — the first service must know about all downstream participants.

2. **Stateless reconstruction**: to answer "what is the current state?", query all participating services and reconstruct. No persistent workflow state, but expensive at query time.

3. **Stamp coupling**: include the full workflow state in every message. Each service reads it, updates its portion, and passes the updated state forward. Pragmatic when the state is small. Preferred approach when the trade-off is acceptable.

## The DDD Refinement (Khononov)

Khononov (→ [[sources/learning-domain-driven-design]] ch. 9) distinguishes two patterns that are often conflated with "orchestration":

**Saga** (event-driven coordinator): listens to domain events, issues commands to aggregates. No branching logic. Can be stateless (simple event → command mapping) or stateful (event-sourced aggregate with outbox relay). Does *not* handle compensation — the happy path only.

**Process Manager** (conditional coordinator): a saga with `if-else` logic. Always stateful, always implemented as an aggregate. Required when the workflow branches based on intermediate results (e.g., "if hotel booking fails, cancel the flight that already succeeded").

> Warning: if you feel compelled to use a saga to coordinate two aggregates that always interact, this usually signals that the aggregate boundary is wrong — they should be one aggregate (→ [[concepts/bounded-contexts]]).

## Summary Recommendation

Default to **orchestration** unless:
- Multiple independent teams own different steps in the workflow, or
- The services are already event-driven and the workflow is simple with no error-path branching

When using choreography, plan explicitly for how you will answer "what is the current state of this workflow?" before you build — not after.

## Related Pages

- [[patterns/saga]] — full coverage of saga types, trade-offs, and implementation approaches
- [[distributed/distributed-transactions]] — why 2PC is not the alternative
- [[patterns/outbox-pattern]] — how to guarantee reliable event publication in choreography
- [[distributed/idempotency]] — prerequisite for both patterns under retries
- [[concepts/architecture-quantum]] — orchestrator coupling affects quantum boundaries
