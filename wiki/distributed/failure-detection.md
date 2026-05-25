---
title: "Failure Detection"
type: concept
tags: [distributed-systems, fault-tolerance, timeouts, heartbeats, resiliency]
sources: [understanding-distributed-systems]
created: 2026-05-14
updated: 2026-05-14
---

# Failure Detection

## Definition

Failure detection is the mechanism by which a distributed process determines that another process has become unavailable. In a distributed system, a process that receives no response cannot distinguish between a slow peer, a crashed peer, and a dropped message — making perfect failure detection impossible. (→ [[sources/understanding-distributed-systems]] ch. 7)

## Why It Matters

Distributed algorithms depend on detecting failures to take corrective action — electing a new leader, routing around a failed node, or returning an error to the client. The quality of failure detection (accuracy and speed) directly affects system availability and correctness.

## The Fundamental Limitation

When a client sends a request and receives no response, it faces genuine ambiguity: the server may be:
- Slow (still processing).
- Crashed.
- Unreachable (network partition).
- Has processed the request but the response is lost.

**No mechanism can distinguish these cases with certainty.** This is a fundamental result of distributed systems theory. The best a process can do is make a probabilistic judgment based on elapsed time.

## Timeouts

A **timeout** is the universal tool for failure detection. After waiting a configured period without a response, the process declares the peer unavailable.

**The timeout trade-off**:

| Short timeout | Long timeout |
|---------------|--------------|
| Faster failure detection | Slower failure detection |
| More false positives (declares healthy processes dead) | Fewer false positives |
| More unnecessary retries / elections | Slower recovery from actual failures |

There is no universally correct timeout value. It depends on expected network latency, variance, and the cost of false positives vs. false negatives in the specific system.

## Pings

A **ping** is a mechanism where process A periodically sends a request to process B asking if it is alive, and expects a response within a timeout window.

- If the response arrives: B is alive.
- If the timeout fires: B is declared unavailable.
- A continues pinging to detect when B recovers.

Direction: A (observer) → B (observed). A drives the liveness check.

## Heartbeats

A **heartbeat** inverts the direction: process A periodically sends a "I am alive" message to process B. If B does not receive a heartbeat within a window, it declares A unavailable.

- If A recovers and resumes sending heartbeats, B will eventually consider A available again.

Direction: A (observed) → B (observer). A asserts its own liveness.

**Pings vs. heartbeats**: the core difference is who initiates the check. Heartbeats are more common for leader liveness detection (the leader heartbeats its followers — if followers don't hear from the leader, they trigger an election). Pings are more common for general health checking (a load balancer pings backend servers).

## When to Use Active Failure Detection

Pings and heartbeats impose overhead and are not always necessary. The choice:

- **Use active detection (pings/heartbeats)** when: processes interact frequently, and an action must be taken as soon as a process becomes unavailable (e.g., leader election, service mesh health checks).
- **Detect at communication time (timeout on request)** when: interaction is infrequent and the cost of false positives from active detection exceeds the benefit.

## Connection to System Design

Failure detection interacts with several other distributed systems concerns:

- **Leader election** (→ [[distributed/leader-election]]): Raft followers use heartbeat timeouts to detect leader failure and trigger elections.
- **Circuit breakers** (→ [[patterns/circuit-breaker]]): use consecutive failure counts and response times to detect downstream unavailability and open the circuit.
- **Service meshes** (→ [[patterns/sidecar-service-mesh]]): implement health checks and automatically remove unhealthy instances from load balancing pools.
- **System models** (→ [[distributed/system-models]]): the partially synchronous timing model explains why perfect failure detection is impossible — bounds on message delivery are not guaranteed.

## Related Concepts

- [[distributed/leader-election]] — heartbeat timeout is the trigger for leader re-election in Raft
- [[operations/availability]] — failure detection speed determines how quickly a system recovers availability
- [[distributed/system-models]] — partial synchrony makes perfect failure detection theoretically impossible
- [[patterns/circuit-breaker]] — applies failure detection at the service call level
- [[patterns/bulkhead]] — isolates failure domains so that failure detection in one partition doesn't affect others
