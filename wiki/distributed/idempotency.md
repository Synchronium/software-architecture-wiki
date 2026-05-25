---
title: "Idempotency"
type: concept
tags: [distributed-systems, reliability, apis, messaging, correctness]
sources: [understanding-distributed-systems, foundations-of-scalable-systems]
created: 2026-05-13
updated: 2026-05-19
---

# Idempotency

An operation is **idempotent** if applying it multiple times produces the same result as applying it once. Idempotency is the primary tool for making distributed systems safe to retry.

## Why It Matters

In a distributed system, any request can fail in an ambiguous way: the server might have processed the request before the connection dropped, or might not have. The client cannot know. The only safe response is to retry — but retries are only safe if the operation is idempotent.

Without idempotency: retrying a charge creates duplicate charges; retrying a POST creates duplicate records.

## Idempotency Keys

The standard pattern for making non-idempotent operations safe to retry:

1. **Client generates a unique key** (`Idempotency-Key` header containing a UUID) for each logical operation.
2. **Server stores the key and the result** in the database when it first processes the request.
3. **If the same key arrives again**, the server returns the stored result without re-executing. This is the **principle of least astonishment** — the client receives the same response it would have received had the first request succeeded, not an error.
4. **Keys are purged after a time window** (e.g., 24 hours). After this window, the client should be prepared to handle a non-idempotent re-execution if it retries.

**Atomicity is critical**: storing the idempotency key and executing the operation must happen in the same database transaction. If they are separate steps, a crash between them leaves the system in an inconsistent state — either the key is stored but the operation didn't execute, or the operation executed but the key wasn't stored. (→ [[sources/understanding-distributed-systems]] ch. 5)

Stripe is the canonical public example: every payment API call accepts an `Idempotency-Key` header, enabling safe retries for charge operations that would otherwise create duplicate charges.

HTTP semantics:
- `GET`, `PUT`, `DELETE` are idempotent by HTTP spec.
- `POST` is **not** idempotent by default — make it so via idempotency keys.
- `PATCH` is typically not idempotent (depends on payload).

## Idempotent Messaging

Message brokers deliver at-least-once — duplicates are possible. Consumers must be idempotent or deduplicate:

1. **Message deduplication**: store processed message IDs; skip if already seen.
2. **Idempotent writes**: operations are designed so re-applying has no additional effect (e.g., `SET x = 5` vs. `INCREMENT x`).

The outbox pattern (→ [[patterns/outbox-pattern]]) achieves exactly-once *semantics* (not delivery) by combining at-least-once delivery with idempotent consumer processing.

## Idempotency and Retries

Retry safety requires both:
- Idempotency on the server side.
- Exponential backoff with jitter on the client side to avoid retry storms.

In deep call chains, retry amplification can occur: if each layer retries independently, the bottom service sees exponential load. The recommendation is to retry at **one layer only** — typically the outermost. (→ [[sources/understanding-distributed-systems]] ch. 27)

## Delivery Semantics Spectrum

Three delivery guarantees exist, each with a performance/reliability trade-off (→ [[sources/foundations-of-scalable-systems]] ch. 3):

| Guarantee | How | Trade-off |
|-----------|-----|-----------|
| **At-most-once** | Send and forget; no retries | Fast and lossy — UDP semantics; appropriate for streaming where occasional loss is tolerable |
| **At-least-once** | TCP retransmission; duplicates possible | The default for TCP/IP-based systems; requires idempotent consumers |
| **Exactly-once** | Idempotency key + transactional semantics | The highest reliability guarantee; requires application-level effort; the state mutation AND the idempotency key store must be updated atomically — either both or neither |

Exactly-once does not mean no retries occur — it means the *result* is as if the operation executed exactly once, regardless of how many retries were made. Transactional semantics (→ [[distributed/distributed-transactions]]) ensure atomicity between the application state update and idempotency key persistence.

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 5) — idempotency keys in REST APIs.
- (→ [[sources/understanding-distributed-systems]] ch. 23) — idempotent message processing; exactly-once semantics.
- (→ [[sources/understanding-distributed-systems]] ch. 27) — retry safety and amplification.
- (→ [[sources/foundations-of-scalable-systems]] ch. 3) — six partial failure scenarios; delivery semantics spectrum (at-most-once/at-least-once/exactly-once); idempotency key pattern with transactional atomicity requirement.

## Related Pages

- [[patterns/outbox-pattern]]
- [[patterns/saga]]
- [[distributed/distributed-transactions]]
