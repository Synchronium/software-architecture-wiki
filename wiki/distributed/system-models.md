---
title: "System Models"
type: concept
tags: [distributed-systems, fault-tolerance, correctness, consensus, replication]
sources: [understanding-distributed-systems, foundations-of-scalable-systems]
created: 2026-05-14
updated: 2026-05-19
---

# System Models

## Definition

A system model is a set of assumptions about what can and cannot happen in a distributed system — about how links behave, how processes fail, and how timing works. Models allow us to reason about algorithm correctness without getting lost in the complexity of real hardware and networks. (→ [[sources/understanding-distributed-systems]] ch. 6)

## Why It Matters

Every distributed algorithm makes implicit or explicit assumptions about the environment it runs in. Making those assumptions explicit — choosing a system model — determines which algorithms are applicable, what guarantees they can provide, and how they behave under failure. An algorithm proven correct under one model may fail catastrophically under another.

## Communication Link Models

| Model | Assumptions |
|-------|-------------|
| **Fair-loss** | Messages may be lost or duplicated; if the sender keeps retransmitting, the message will eventually be delivered |
| **Reliable** | Every message is delivered exactly once, without loss or duplication |
| **Authenticated reliable** | Reliable delivery, plus the receiver can verify the sender's identity |

These models stack: a reliable link can be built on top of a fair-loss link (by deduplicating at the receiver); an authenticated reliable link adds authentication on top of that. TCP implements reliable transmission; TLS adds authentication and integrity. (→ [[distributed/tls]])

## Process Failure Models

| Model | Assumptions | Use case |
|-------|-------------|----------|
| **Arbitrary / Byzantine** | A process can deviate from its algorithm in any way — crashes, bugs, or malicious behaviour | Safety-critical systems (aircraft, nuclear), blockchains |
| **Crash-recovery** | A process follows its algorithm correctly but may crash and restart at any time, losing in-memory state | Distributed services (this book's default) |
| **Crash-stop** | A process follows its algorithm but never comes back online after a crash | Models unrecoverable hardware faults; simplifies algorithm design |

**Byzantine tolerance**: a system using the Byzantine model can tolerate up to ⌊(N-1)/3⌋ faulty processes and still operate correctly. This bound is a theoretical limit — Byzantine fault tolerance requires significantly more complexity and message overhead than crash-recovery algorithms.

Byzantine models are outside the scope of standard distributed services. For software systems where a single organisation controls all nodes, crash-recovery is the appropriate model.

## Timing Models

| Model | Assumptions | Problem |
|-------|-------------|---------|
| **Synchronous** | Sending a message or executing an operation completes within a known bounded time | Unrealistic — GC pauses, page faults, network congestion can all violate bounds |
| **Asynchronous** | Messages and operations can take an unbounded amount of time | Too weak — the FLP result proves that consensus is impossible under pure asynchrony (→ [[distributed/consensus-algorithms]]) |
| **Partially synchronous** | The system behaves synchronously most of the time, with occasional unbounded delays | Realistic model of real networks and processes |

The partially synchronous model is the standard for practical distributed algorithm design. Algorithms designed for this model assume that timing bounds eventually hold, even if they can be violated temporarily.

## This Book's Default Model

*Understanding Distributed Systems* designs algorithms for:
- **Fair-loss links** (messages may be lost; retransmission eventually delivers)
- **Crash-recovery processes** (processes can crash and restart; in-memory state is lost)
- **Partial synchrony** (timing bounds hold most of the time)

This combination matches the real-world conditions of commodity cloud infrastructure: links can lose packets, servers crash and restart, and the network is usually fast but occasionally slow.

## Relationship to Real Protocols

| Layer | Protocol | Model it implements |
|-------|----------|---------------------|
| TCP | Reliable link | Fair-loss → reliable |
| TLS | Authenticated reliable link | Reliable → authenticated reliable |
| Raft | Crash-recovery consensus | Crash-recovery + partial synchrony |
| Bitcoin | Byzantine consensus | Byzantine fault tolerance |

## Partial Failure Scenarios (Gorton's Taxonomy)

When a client sends a request to a server, the following outcomes can occur (→ [[sources/foundations-of-scalable-systems]] ch. 3). Only the first two are easy to detect:

| Scenario | Client experience | Detectable? |
|----------|-------------------|-------------|
| Request succeeds, response received | Result returned | Yes — success |
| DNS lookup fails | Immediate error | Yes — fast failure |
| Server crashed before processing | Timeout | No — indistinguishable from others |
| Server crashed while processing | Timeout | No |
| Server slow (overloaded) | Timeout | No |
| Response lost in transit | Timeout | No |

The last four scenarios look identical to the client: a timeout expires and there is no response. This is the core of the crash fault problem — the client cannot know whether the operation succeeded. The correct response (retry or not) depends entirely on whether the operation is idempotent (→ [[distributed/idempotency]]).

## Related Concepts

- [[distributed/failure-detection]] — how processes detect failures in crash-recovery models
- [[distributed/consensus-algorithms]] — FLP result; algorithms assuming partial synchrony; Two Generals' Problem
- [[distributed/leader-election]] — Raft election assumes crash-recovery + partial synchrony
- [[distributed/logical-clocks]] — timing models motivate logical clocks (physical clocks unreliable across nodes)
- [[distributed/tls]] — implements the authenticated reliable link model
- [[distributed/idempotency]] — the correct client response to an undetectable partial failure
