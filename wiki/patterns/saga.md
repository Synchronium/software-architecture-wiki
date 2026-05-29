---
title: "Saga Pattern"
type: pattern
tags: [distributed-systems, transactions, microservices, consistency, coordination]
sources: [understanding-distributed-systems, fundamentals-of-software-architecture, software-architecture-the-hard-parts, building-event-driven-microservices, learning-domain-driven-design, monolith-to-microservices]
created: 2026-05-13
updated: 2026-05-29
---

# Saga Pattern

A Saga is a sequence of local transactions used to implement a long-running distributed transaction without 2PC. Each local transaction T₁…Tₙ is followed by a compensating transaction C₁…Cₙ that can undo its effects. On failure at step i, the saga executes the compensating chain Cᵢ₋₁ → ... → C₁ to restore consistency.

## Key Claims

- **Sagas trade isolation for availability.** Unlike 2PC, intermediate state is visible to concurrent operations — there is no atomic boundary. "Apology" semantics (compensations) replace strict atomicity.
- **Orchestration vs choreography is the central decision.** Orchestration centralises workflow state and error handling but couples participants to the coordinator. Choreography decouples but distributes state and complicates debugging. Team ownership decides: one team owns the whole saga → orchestrate; multiple teams own different steps → choreograph.
- **The "saga or fix granularity?" question comes first.** Richards & Ford's position: distributed transactions are usually a service-boundary problem. Don't reach for saga until you've checked that the services genuinely need to be separate.
- **Compensations must be idempotent and may not be perfect inverses.** "Refund a charge" is not the same as "reverse a charge" — the customer sees both. Some failures need business-level workarounds (credits, apologies) rather than technical rollback.
- **"Saga" is broader than the original definition.** *Software Architecture: The Hard Parts* uses it for any distributed workflow pattern, deriving 8 named types from three binary dimensions (sync/async × atomic/eventual × orchestrated/choreographed). The traditional compensating-transaction saga is one cell in that taxonomy.
- **State machines beat compensating chains.** Model each saga as an FSM with explicit states and durable checkpoints. Current state is immediately queryable; compensations are FSM transitions toward terminal failure states, not a separate rollback path.
- **Process Manager ≠ Saga.** DDD's distinction: a saga maps events to commands with no branching; a process manager has conditional logic and tracks explicit state. Trip booking is the canonical process manager; payment-after-order is a saga.

## Structure

```
SUCCESS:  T₁ → T₂ → T₃ → ... → Tₙ ✓

FAILURE at T₃:
          T₁ → T₂ → T₃(fail)
                        ↓
                   C₂ → C₁ (compensate)
```

## The "Apology" Model

Vitillo's framing (→ [[sources/understanding-distributed-systems]] ch. 13): each local transaction Tᵢ *assumes* all other local transactions will succeed — it is an optimistic guess. When the guess is wrong, a mistake has been made, and the compensating transactions are the system's "apology" for the inconsistency caused. This is analogous to airline overbooking: the airline assumes every booking is good; when it's not, it compensates passengers rather than preventing the situation in advance.

This framing clarifies why sagas cannot provide isolation: the "apology" can only come *after* the intermediate state has been visible.

## Orchestration vs. Choreography

**Orchestrator (centralised)**:
- A single coordinator process drives the saga: issues commands to participants, tracks state, triggers compensations on failure.
- The orchestrator models the saga as a **state machine** and durably checkpoints each state transition to storage. If the orchestrator crashes and restarts (or a new process is elected), it reads the last checkpoint and resumes from where it left off — no saga state is lost.
- **Participants must be idempotent**: the orchestrator may crash after sending a request but before checkpointing. On restart it will resend the request. Participants that receive duplicate requests must deduplicate (→ [[distributed/idempotency]]).
- Easier to reason about; state is explicit and queryable.
- Managed orchestration: AWS Step Functions, Azure Durable Functions provide this infrastructure out of the box.

**Choreography (decentralized)**:
- Each service subscribes to events and publishes its own events when its local transaction completes.
- No central coordinator; each participant knows what to do next based on events received.
- More loosely coupled; harder to track overall saga state; harder to debug.

## The Isolation Problem

**Sagas do not provide isolation** — unlike 2PC, intermediate state is visible to concurrent transactions between T₁ committing and Tₙ committing.

Example: In a flight booking saga, seats are marked "reserved" (T₁), payment charged (T₂), reservation confirmed (T₃). Between T₁ and T₃, another user might see a seat as taken that hasn't been fully committed.

Mitigations:
- **Semantic locks**: T₁ marks a resource as "pending"; other transactions must handle the pending state.
- **Commutative updates**: design operations so order doesn't matter.
- **Pivot transactions**: designate a point of no return; compensations only go backwards from before the pivot.
- **Accept the anomaly**: for many use cases, brief inconsistency is acceptable (e.g., "reservation pending").

## Compensating Transactions

Compensations must be:
- **Idempotent**: the orchestrator may retry compensations if they fail.
- **Semantically undone**: compensation is not always a logical inverse. "Refund a charge" is not the same as "reverse a charge" — the customer sees both on their statement.

Not all operations can be compensated perfectly. Some sagas require business-level workarounds (e.g., issuing a credit rather than reversing a charge).

## When to Use

Sagas are the right choice when:
- A business process spans multiple services or databases.
- 2PC is not available (services don't support XA, or 2PC latency is unacceptable).
- The process can tolerate eventual consistency (not instantaneous atomicity).

Sagas are not suitable for:
- Operations that require strict isolation (financial systems requiring serializability across services).
- Cases where compensations are impossible or semantically unacceptable.

## Relationship to Outbox Pattern

The [[patterns/outbox-pattern]] is typically used *within* a saga to guarantee that each local transaction reliably publishes its event/command to the next participant. Without the outbox, message publication can be lost on crash, leaving the saga in a stuck state.

## Semantic vs Implementation Coupling

Two coupling layers operate in any distributed workflow (→ [[sources/software-architecture-the-hard-parts]] ch. 11):

- **Semantic coupling** is domain-mandated. If payment must confirm before shipping, that temporal dependency is semantic. Architects cannot remove it; it's inherent to the problem.
- **Implementation coupling** is architect-chosen. Sync vs async, atomic vs eventual, orchestrated vs choreographed. These are the knobs.

The architect's job is to minimise *implementation* coupling without falling below what semantic coupling actually requires. Choosing async over sync, eventual over atomic, and choreography over orchestration all reduce implementation coupling — but if the domain mandates atomicity, no implementation choice removes it.

## Orchestration vs Choreography: Extended Trade-offs

Beyond the basic centralised-vs-decentralised dimension, the trade-offs are richer (→ [[sources/software-architecture-the-hard-parts]] ch. 11):

**Orchestration advantages**:
- Centralised error handling — the orchestrator knows when any step fails and can trigger compensations
- Explicit, queryable workflow state — current saga state is always visible in one place
- Simpler reasoning — the workflow is a single readable state machine
- Good for complex, multi-step workflows with many error paths

**Orchestration disadvantages**:
- Coupling to orchestrator — all participants depend on the orchestrator being available
- Performance bottleneck — every step passes through the orchestrator
- Can become a distributed monolith if business logic accumulates in the orchestrator

**Choreography advantages**:
- Responsiveness — no central coordination overhead; services react immediately to events
- Scalability — no orchestrator bottleneck; each service scales independently
- Decoupling — services are only aware of events, not of each other

**Choreography disadvantages**:
- Distributed workflow state — no single place knows the overall workflow status
- Hard to track — "what is the current state of order #12345?" requires querying multiple services or event logs
- Complex error handling — compensation logic is distributed; coordinating rollback is hard

### Workflow state management for choreography

Choreography gives up centralised workflow state. When state visibility is needed anyway, three approaches exist (→ [[sources/software-architecture-the-hard-parts]] ch. 11):

**1. Front controller**: designate the first service in the choreography as the state owner. It tracks which downstream events it has received and infers overall workflow state. Simple but creates awkward coupling: the first service must know about all downstream services.

**2. Stateless choreography**: rely solely on events and queries; no persistent workflow state. To answer "what is the current state of this workflow?", execute a saga state machine query — reconstruct the current state by querying all participating services. Can be expensive at query time but avoids persistent state coupling.

**3. Stamp coupling**: include the entire workflow state in each message or event (the "stamp"). The next service reads the workflow state from the message, updates its portion, and passes the updated state forward. Simple to implement and avoids external state queries. Drawback: increases message size; all workflow state travels with every message.

**Stamp coupling** is the preferred pragmatic approach for workflows where the overall state is small and message size is not a constraint.

## Saga Types: the Eight-Cell Taxonomy

The traditional saga (compensating transactions) is one cell in a broader space. Three interlocking dimensions of dynamic coupling generate 2³ = 8 distinct distributed-workflow patterns (→ [[sources/software-architecture-the-hard-parts]] chs. 2, 12):

1. **Communication**: synchronous vs asynchronous
2. **Consistency**: atomic vs eventual
3. **Coordination**: orchestrated vs choreographed

The 2³ = 8 combinations produce named types. Ch 12 provides full trade-off ratings across four dimensions (→ [[sources/software-architecture-the-hard-parts]] ch. 12):

| Type | Comm | Consistency | Coordination | Coupling | Complexity | Responsiveness | Scale |
|------|------|-------------|-------------|---------|-----------|----------------|-------|
| Epic Saga | sync | atomic | orchestrated | very high | low | low | very low |
| Phone Tag Saga | sync | atomic | choreographed | high | high | low | low |
| Fairy Tale Saga | sync | eventual | orchestrated | high | very low | medium | high |
| Time Travel Saga | sync | eventual | choreographed | medium | low | medium | high |
| Fantasy Fiction Saga | async | atomic | orchestrated | high | high | high | very low |
| Horror Story | async | atomic | choreographed | medium | very high | high | low |
| Parallel Saga | async | eventual | orchestrated | low | low | high | high |
| Anthology Saga | async | eventual | choreographed | very low | high | high | very high |

**Reading the table**: coupling decreases as you move toward async + eventual + choreographed. Responsiveness and scale increase along the same axis. Complexity does not follow a monotone trend — choreography adds complexity regardless of the other dimensions (compare Epic vs Phone Tag: phone tag has higher complexity despite lower coupling).

**Recommended patterns**: Fairy Tale and Parallel Saga are the most attractive for most use cases — they avoid atomic consistency (which is hard to achieve distributed) while offering either low complexity (Fairy Tale) or high scalability (Parallel Saga).

**Patterns to avoid**: Fantasy Fiction and Horror Story both combine asynchronous communication with atomic consistency — a combination that is extremely difficult to implement correctly (async + atomic requires distributed locking or distributed 2PC, which defeats the benefit of async). If you need async + atomic, use Parallel Saga (eventual) instead.

The coupling level is a direct function of position in the 3D space: synchronous + atomic + orchestrated → very high coupling (Epic Saga); asynchronous + eventual + choreographed → very low coupling (Anthology Saga).

The traditional saga (compensating transactions) maps most closely to the **Epic Saga** or **Parallel Saga** types depending on synchrony.

## Epic Saga Pitfalls

The Epic Saga (sync + atomic + orchestrated) is the most commonly used type and carries the most operational risk (→ [[sources/software-architecture-the-hard-parts]] ch. 12):

**No transaction isolation**: between each local transaction step, intermediate state is visible to other operations. A saga that reserves inventory (step 1), charges a card (step 2), and confirms the order (step 3) will expose "inventory reserved, payment pending" as observable state. Concurrent requests may see this partial state.

**Side effects during compensation**: if a confirmation email was sent at step 3 and the saga must compensate at step 4, the email has already left the building. Compensation cannot undo side effects. Business-level workarounds (cancellation email, credit note) are required.

**Compensation failures**: compensating transactions can themselves fail. What happens when the compensating transaction for step 2 times out? The system must handle compensation failures idempotently, often by queueing retry attempts.

## State Machine Implementation

A finite state machine (FSM) approach beats simple compensating transaction chains (→ [[sources/software-architecture-the-hard-parts]] ch. 12). Each saga type is modelled as an FSM with explicit states (OrderInitiated, PaymentPending, PaymentFailed, OrderConfirmed, OrderCancelled) and transitions triggered by events or outcomes. The orchestrator checkpoints state to durable storage at each transition. Current state is immediately known without replaying history; compensations become FSM transitions toward terminal failure states rather than a separate rollback chain.

## Annotation-Based Governance

In Java and C# ecosystems, custom annotations on service classes can declare which saga types a service participates in (→ [[sources/software-architecture-the-hard-parts]] ch. 12):

```java
@SagaOrchestrator(sagaType = "OrderFulfillment")
@SagaParticipant(sagaType = "OrderFulfillment")
public class PaymentService { ... }
```

This serves as documentation and governance: it makes traceability explicit (which services participate in which sagas), enables impact analysis (which services are affected by a saga change), and can be used by tooling to generate saga dependency maps. It is an architectural governance mechanism, not a runtime mechanism.

## Compensation Workflows (Bellemare)

Not all failure cases require strict rollback — sometimes a **compensation workflow** is more appropriate than a formal saga rollback (→ [[sources/building-event-driven-microservices]] ch. 8).

A compensation workflow accepts that a transaction cannot be cleanly reversed and instead applies a business-level remedy. Examples:
- An e-commerce site that over-sold inventory cannot retroactively block those purchases; instead it orders new stock, notifies customers of delays, and offers discount codes
- Airlines and venues routinely oversell; compensation (upgrades, vouchers, alternative arrangements) is more practical than technical reversal

When to prefer compensation over strict rollback:
- The system cannot guarantee coordinated failure detection before side effects are visible to customers
- Technical rollback would produce a worse customer experience than a proactive apology
- The business already has operational processes for handling the failure case

> Compensation workflows blur the technical/business boundary of distributed transactions. The architect must explicitly decide which failures are handled technically (saga rollback) and which are delegated to business operations (compensation workflow). Leaving this implicit leads to silent partial failures.

## Saga and Process Manager (DDD Perspective)

Khononov (→ [[sources/learning-domain-driven-design]] ch. 9) gives a DDD-centric treatment that distinguishes between two closely related patterns:

### Saga (Simple)

In the DDD context, a saga is an event-driven coordinator for a **long-running business process spanning multiple aggregates**. It listens to domain events from participating aggregates and issues commands to other aggregates in response. It does not initiate itself — it is triggered by a domain event.

Two implementations:
- **Stateless saga**: a simple event-matching function with no persistent state. Appropriate when the coordination logic is a straightforward one-to-one event → command mapping with no branching.
- **Stateful saga**: implemented as an event-sourced aggregate using the outbox relay for command execution. The saga persists its own state and emits commands as domain events. Appropriate when the coordination logic requires tracking intermediate state across multiple steps.

A saga in this sense does **not** handle compensation. It coordinates the happy path. Compensation is a business concern handled separately.

> **Don't use sagas to compensate for wrong aggregate boundaries.** If two aggregates are so frequently coordinated that a saga seems necessary, this is usually a sign the aggregate boundary is wrong — they should be merged into one aggregate.

### Process Manager (Complex)

A **process manager** is a saga that contains conditional branching logic (`if-else` statements). The distinction:

| | Saga | Process Manager |
|-|------|-----------------|
| Logic | No branching — simple event → command mapping | Conditional branching based on current state |
| Instantiation | Triggered by a specific domain event | Explicitly instantiated by a command |
| State | Stateless or simple | Always maintains explicit state |
| Implementation | Simple function or event-sourced aggregate | Aggregate (state-based or event-sourced) |

**Example — trip booking**: A trip booking process manager coordinates flights, hotels, and car rental. It is instantiated by a "book trip" command, not triggered by a single domain event. It tracks which bookings succeeded and applies different logic depending on which step failed (e.g., if the hotel fails after the flight succeeds, it must cancel the flight).

The process manager is implemented as an aggregate — it has an ID, manages its own state transitions, and uses the outbox pattern to issue commands reliably.

---

## How Different Sources Treat It

| Source | Angle |
|--------|-------|
| [[sources/understanding-distributed-systems]] | Foundational treatment: structure, orchestration vs choreography, compensation, isolation problem, semantic locks (ch. 13). |
| [[sources/fundamentals-of-software-architecture]] | "Last resort" framing — sagas are a signal that service granularity is wrong (ch. 17). |
| [[sources/software-architecture-the-hard-parts]] | Broadens "saga" to all distributed workflows; eight-cell taxonomy; semantic vs implementation coupling; FSM implementation; annotation governance (chs. 2, 11, 12). |
| [[sources/building-event-driven-microservices]] | EDM workflow perspective: choreography only for 2–3 service transactions; God orchestrator anti-pattern; compensation workflows as business-level remedy (ch. 8). |
| [[sources/learning-domain-driven-design]] | DDD distinction between saga (no branching) and process manager (conditional, stateful, command-instantiated); both as aggregates using outbox; warning against sagas papering over wrong aggregate boundaries (ch. 9). |
| [[sources/monolith-to-microservices]] | Migration-focused: backward vs forward recovery; team-ownership heuristic (one team → orchestrate, many teams → choreograph); step reordering to minimise compensation cost (ch. 4). |

> **Contradiction:** Vitillo treats saga as a standard tool for cross-service transactions; Richards & Ford treat it as a red flag. The underlying advice converges — both agree saga adds complexity — but FOSA is more emphatic that it should be avoided by design.

> **Vocabulary difference:** SATH uses "saga" more broadly than the original 1987 Garcia-Molina/Salem definition (compensating transactions). The traditional saga is one cell in SATH's eight-cell taxonomy; the taxonomy as a whole covers all distributed-workflow coordination patterns.

## Key Takeaways

- **Don't reach for saga first.** A cross-service transaction is usually a signal that the service boundary is wrong. Fix granularity first; reach for saga only if the services genuinely need to be separate.
- **Choose orchestration vs choreography by team ownership.** One team owns the whole workflow → orchestrate (central state, easier to debug). Multiple teams own different steps → choreograph (no single coordinator, decentralised ownership).
- **Sagas don't provide isolation.** Intermediate state is visible to concurrent operations. Use semantic locks, pivot transactions, or accept the anomaly as a business decision — don't pretend sagas behave like 2PC.
- **Compensations are not always perfect inverses.** "Refund a charge" leaves both transactions visible. Business-level workarounds (credits, apologies, alternative arrangements) are often cleaner than technical rollback.
- **Sagas don't fix bad aggregate boundaries.** If two aggregates are so frequently coordinated that a saga seems necessary, they probably should be one aggregate.

## Related Pages

- [[comparisons/orchestration-vs-choreography]] — decision guide: when to use orchestration vs choreography; team-ownership heuristic; workflow state options
- [[patterns/outbox-pattern]]
- [[distributed/distributed-transactions]]
- [[distributed/idempotency]]
- [[distributed/consistency-models]]
- [[concepts/reuse-patterns]] — stamp coupling as a workflow state management technique
