---
title: "API Protocol Selection: REST vs gRPC vs GraphQL"
type: comparison
tags: [api, rest, grpc, graphql, design, integration]
sources: [mastering-api-architecture, understanding-distributed-systems, building-event-driven-microservices, foundations-of-scalable-systems]
created: 2026-05-18
updated: 2026-05-18
---

# API Protocol Selection: REST vs gRPC vs GraphQL

Three protocols dominate modern API design. The choice matters early — it shapes client coupling, performance characteristics, caching behaviour, schema governance, and how the API evolves. The good news: the decision space is smaller than it looks.

## Decision Summary

The default rule (→ [[sources/mastering-api-architecture]] ch. 1): **traffic type drives protocol choice**.

| Traffic type | Default protocol | Reason |
|---|---|---|
| North–south (external consumers, third parties) | **REST** | Universal interoperability; stateless; cacheable; no client tooling required |
| East–west (internal services, controlled consumers) | **gRPC** | Binary efficiency; strict schema; generated clients; HTTP/2 multiplexing |
| Client-specific aggregation (mobile, reporting, BFF) | **GraphQL** | Client controls the shape; eliminates over-fetching and under-fetching |

Override with explicit justification captured in an ADR (→ [[concepts/adrs]]).

## Detailed Comparison

| Dimension | REST | gRPC | GraphQL |
|-----------|------|------|---------|
| Protocol | HTTP/1.1 or HTTP/2, text (JSON) | HTTP/2, binary (Protobuf) | HTTP/1.1 or HTTP/2, text (JSON) |
| Schema | Optional (OAS) | Required (.proto) | Required (GraphQL schema) |
| Schema enforcement | Runtime (gateway validation) | Compile time (generated stubs) | Runtime |
| Caching | Excellent (HTTP cache headers, CDN, reverse proxy) | Limited (no standard HTTP caching; request bodies aren't cacheable) | Poor (single POST endpoint; cache headers inapplicable) |
| Browser support | Native | Requires grpc-web (a subset) | Native |
| Streaming | No (HTTP/2 SSE workarounds exist) | Yes — four modes (unary, server-streaming, client-streaming, bidirectional) | Subscriptions (websockets) |
| Over-fetching | Common (server dictates response shape) | Common | Eliminated — client specifies exact fields |
| Under-fetching | Common (multiple round trips for related data) | Common | Eliminated — single query traverses relationships |
| Schema evolution | Non-breaking changes via Postel's Robustness Principle | Additive changes safe; field numbers are permanent identifiers | Additive changes safe; deprecation via schema directives |
| Breaking-change detection | openapi-diff in CI | Protobuf field number discipline | Schema registry tooling |
| Client tooling | Any HTTP client | Generated stubs (strong typing) | Generated or runtime query builders |
| Polyglot support | Universal | Excellent (codegen for every major language) | Good |
| Observability | Standard HTTP logs and metrics | Requires gRPC-aware tooling | Custom parsing of POST body |

## When Each Protocol Fits

### REST

Use REST when:
- Consumers include third parties or unknown clients (you cannot control what they use to call you)
- Caching at the network layer is valuable (CDN, reverse proxy, client-side HTTP cache)
- The API is a product — documentation, discoverability, and wide adoption matter
- Resources map naturally to the data model (CRUD on well-defined entities)
- You want broad ecosystem tooling without a build step

Practical ceiling: REST's loose coupling is a strength for external APIs but a weakness internally — without schema enforcement, field-level type errors and silent missing fields surface only at runtime. Use consumer-driven contract tests (→ [[concepts/api-testing]]) to compensate.

### gRPC

Use gRPC when:
- Both producer and consumer are internal, controlled services
- High call volumes or latency-sensitive paths make binary serialisation and HTTP/2 multiplexing worthwhile
- Polyglot services need generated, strongly-typed clients (the .proto file is the cross-language contract)
- Bidirectional streaming is required (real-time coordination, streaming responses)

gRPC's schema rigidity is a feature, not a constraint, for east–west traffic — type errors are caught at compile time, and the schema is a single source of truth enforced across languages.

**Do not** expose raw gRPC to browser clients without a grpc-web translation layer. For browser-facing internal tools, REST or GraphQL is simpler.

**Schema generation trap**: generating `.proto` from OAS (or vice versa) seems attractive but is fragile. Adding a field that sorts alphabetically before existing ones shifts all subsequent field numbers in the generated `.proto`, silently breaking binary compatibility for all existing clients. Design REST and gRPC interfaces independently; record the decision in an ADR (→ [[sources/mastering-api-architecture]] ch. 1).

### GraphQL

Use GraphQL when:
- A mobile client or BFF (Backend for Frontend) needs to control exactly which fields it receives
- Multiple backends need to be unified behind a single query interface (facade over legacy services)
- The data model has rich relationships that clients traverse in varied ways (graph-shaped domain)
- Over-fetching or under-fetching is a demonstrated performance problem

GraphQL is not a general-purpose replacement for REST. Its weaknesses:
- Caching is fundamentally difficult — all queries are POST to a single endpoint, bypassing HTTP cache semantics
- Schema governance is demanding — without discipline, the schema becomes a large, entangled public contract
- N+1 query problems require DataLoader or equivalent batching to avoid performance degradation
- Security is more complex — query depth and complexity limits must be enforced to prevent abuse (→ [[concepts/threat-modeling]])

GraphQL works best as a **facade** layered over existing REST or gRPC services, not as the foundational API style for a new system.

## Mixing Protocols

A single system can use all three:

```
External clients → REST (north-south)
         ↓
   API Gateway / BFF
         ↓ gRPC (east-west)
   Internal services ──→ GraphQL (mobile BFF layer)
```

This is common and appropriate. The key discipline: don't generate one from the other (they are independent contracts), and don't expose gRPC directly to external consumers.

## The Chatty API Anti-Pattern

Regardless of protocol, a fundamental design mistake is exposing fine-grained getter/setter-style operations (→ [[sources/foundations-of-scalable-systems]] ch. 5). Each round trip incurs network latency; many fine-grained calls compound this. Design resources around client use cases:
- Group related data into coarse-grained resources that can be fetched in one request
- Use `PATCH` for partial updates of known fields — not as a workaround for exposing individual setters
- GraphQL is not exempt: an N+1 query pattern does the same damage at the resolver level

## Evolution and Breaking Changes

All three protocols have the same fundamental rule: **be conservative in what you emit, liberal in what you accept** (Postel's Robustness Principle, →  [[sources/release-it]] ch. 14). The mechanisms differ:

- **REST**: OAS + openapi-diff in CI catches breaking changes; Postel's Principle governs what "breaking" means
- **gRPC**: field numbers are permanent; never remove or renumber a field; add new fields with new numbers only
- **GraphQL**: add fields freely; mark old fields `@deprecated`; removal is a breaking change requiring a major version

In all cases: **the implementation in production is the de facto spec**, not the documentation. Any change that rejects previously accepted input — even malformed input — is a breaking change.

## Related Pages

- [[concepts/api-design]] — full treatment of REST, gRPC, GraphQL design principles and patterns
- [[concepts/api-gateway]] — where protocol translation and enforcement live in the topology
- [[concepts/api-testing]] — consumer-driven contracts and protocol-specific testing strategies
- [[concepts/contracts]] — schema evolution, forward/backward compatibility
- [[concepts/adrs]] — protocol decisions should always be recorded with rationale
- [[distributed/http]] — HTTP/1.1 vs HTTP/2 vs HTTP/3 trade-offs underlying the protocols
