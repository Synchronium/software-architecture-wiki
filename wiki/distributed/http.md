---
title: "HTTP"
type: concept
tags: [networking, protocols, api, distributed-systems, performance]
sources: [understanding-distributed-systems]
created: 2026-05-14
updated: 2026-05-14
---

# HTTP

## Definition

HTTP (Hypertext Transfer Protocol) is an application-layer protocol built on top of TCP (and UDP for HTTP/3). It defines how clients and servers exchange request-response messages and is the primary communication protocol for REST APIs and browser-server traffic. (→ [[sources/understanding-distributed-systems]] ch. 5)

> This page covers HTTP protocol mechanics. For REST API design principles (methods, status codes, resource modeling, versioning), see [[concepts/api-design]].

## Why It Matters

HTTP version and connection management decisions have significant performance implications, especially at scale. Understanding the differences between HTTP/1.1, HTTP/2, and HTTP/3 — and knowing when each matters — is essential for designing low-latency distributed systems.

## HTTP Versions

### HTTP/1.1

- Text-based protocol (headers and body transmitted as ASCII/UTF-8 text).
- Introduced **persistent connections** (keep-alive): reuse a TCP connection across multiple requests instead of opening a new one per request.
- **Head-of-line (HOL) blocking**: requests in a single connection are processed serially. A slow response blocks all subsequent responses on that connection. Browsers work around this by opening multiple parallel connections to the same server (typically 6), which increases resource usage.

### HTTP/2

- **Binary framing**: messages are encoded as binary frames, not text. Smaller and faster to parse.
- **Multiplexing**: multiple requests and responses share a single TCP connection using logical **streams**. Responses can be interleaved — a slow response does not block others.
- Resolves the HOL blocking problem at the HTTP layer.
- **Header compression (HPACK)**: headers are compressed, reducing overhead for repetitive headers (e.g., auth tokens, content-type) across requests.
- **Server push**: server can proactively send resources to the client before they are requested (limited adoption in practice).
- Limitation: HOL blocking can still occur at the TCP layer. If a TCP segment is lost, all streams on that connection stall while TCP retransmits — this is TCP's own HOL blocking.

### HTTP/3

- Uses **QUIC** as its transport protocol instead of TCP. QUIC runs over UDP.
- QUIC implements reliability, ordering, and flow control per-stream at the application layer. A lost packet only stalls the stream it belongs to — other streams are unaffected.
- **Eliminates TCP HOL blocking** entirely.
- **Faster handshake**: QUIC integrates TLS 1.3, combining the transport and security handshake into a single round trip (vs. TCP + TLS which requires separate handshakes).
- **Connection migration**: QUIC connections are identified by a connection ID, not a 4-tuple (src IP/port, dst IP/port). Clients can migrate networks (e.g., wifi → mobile) without losing the connection.
- Adoption is growing but HTTP/2 remains the most widely deployed version.

## Version Comparison

| Property | HTTP/1.1 | HTTP/2 | HTTP/3 |
|----------|----------|--------|--------|
| Transport | TCP | TCP | QUIC (UDP) |
| Format | Text | Binary | Binary |
| Multiplexing | No (per-connection serial) | Yes (streams on one connection) | Yes (independent streams) |
| HTTP HOL blocking | Yes | No | No |
| TCP HOL blocking | Yes | Yes | No (no TCP) |
| TLS integration | Separate | Separate | Integrated (QUIC) |
| Header compression | No | Yes (HPACK) | Yes (QPACK) |

## Connection Management

Opening a new connection is expensive:
- **DNS resolution**: resolves hostname to IP (→ [[distributed/dns]])
- **TCP 3-way handshake**: 1 round trip
- **TLS handshake**: 1–2 additional round trips (→ [[distributed/tls]])

Total cold-start cost can be 2–4 RTTs before the first byte of application data is sent. This makes **connection reuse** (via persistent connections and connection pools) and **geographic proximity** (keeping servers close to clients) critical for latency-sensitive systems.

Connection pools maintain a set of open connections to downstream services and reuse them across requests. Creating a new connection per request is a common performance antipattern.

## Relationship to REST

REST is an architectural style that uses HTTP as its transport. REST's stateless constraint — every request must contain all information needed to process it — maps directly onto HTTP's request-response model. HTTP's caching mechanisms (Cache-Control, ETags) implement REST's cacheability constraint. (→ [[concepts/api-design]])

## Related Concepts

- [[concepts/api-design]] — REST API design: methods, status codes, resource modeling, versioning, idempotency
- [[distributed/tls]] — HTTPS = HTTP over TLS; HTTP/3 integrates TLS into QUIC
- [[distributed/dns]] — DNS resolution precedes every HTTP connection
- [[distributed/idempotency]] — HTTP method semantics (GET idempotent, POST not) and idempotency keys
- [[reference/technology-glossary]] — Tool entries for HTTP clients, proxies, API gateways

## Key Quotes

> "HTTP/3 uses a UDP-based protocol called QUIC ... a packet loss only blocks the stream it belongs to, not all the streams." (→ [[sources/understanding-distributed-systems]] ch. 5)
