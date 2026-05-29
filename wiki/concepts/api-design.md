---
title: "API Design"
type: concept
tags: [api, rest, grpc, graphql, oas, versioning]
sources: [mastering-api-architecture, understanding-distributed-systems, building-event-driven-microservices]
created: 2026-05-13
updated: 2026-05-29
---

# API Design

## Key Claims

- **The exchange format decision is architectural.** REST for north-south (external, broad interoperability), gRPC for east-west (internal, controlled, polyglot), GraphQL for client-driven aggregation. Default to those mappings; override only with explicit ADR justification.
- **The implementation is the de facto spec.** Once a service is live, its actual behaviour — including undocumented edge cases and bugs — is the real contract. Postel's Robustness Principle leaves no choice: keep accepting what you previously accepted.
- **Non-breaking changes are well-defined.** Require a subset of previously required inputs, accept a superset, return a superset. Anything else is breaking and requires a major version bump.
- **API-first beats implementation-first.** Design and agree the OAS contract before implementing either producer or consumer. Consumer teams use generated mocks; producer teams implement against the spec. Feedback at the contract stage is orders of magnitude cheaper than at implementation.
- **Never return bare arrays.** Wrap collection responses in an object (`{ "value": [...], "@nextLink": "..." }`) from day one so pagination, metadata, and cursors can be added later without breaking consumers.
- **Combining REST and gRPC specs from one source is a trap.** Auto-generating `.proto` from OAS assigns field numbers alphabetically — adding a new field reorders existing numbers and breaks binary compatibility. Design the two APIs independently and accept the duplication.
- **Status codes are the contract too.** 401 ≠ 403; 4xx ≠ 5xx; never wrap an error inside a 200. Wrong status codes cause clients to retry the unretryable and not retry the retryable.

## Definition

API design is the process of defining the contract between a producer (service) and its consumers: the resources exposed, the operations available, the data formats used, the versioning strategy, and the error model. Getting the contract right matters disproportionately because APIs are harder to change than implementations — consumers build against the contract, and breaking it forces coordinated migration.

## The Core Exchange Format Decision

The most consequential API design decision is which exchange format to use. The book recommends a simple rule based on traffic type (→ [[sources/mastering-api-architecture]] Ch 1):

| Traffic | Format | Reason |
|---------|--------|--------|
| North–south (external consumers) | REST | Broad interoperability; loose coupling; stateless; cacheable |
| East–west (internal services, controlled consumers) | gRPC | HTTP/2 binary; high throughput; strict schema; excellent for polyglot |
| Client-specific aggregation (mobile, reporting) | GraphQL | Client drives the query; reduces over-fetching; ideal as a facade |

This is not a hard rule — it is a default that should be overridden only with explicit justification in an ADR ([[concepts/adrs]]).

## REST

REST (Representational State Transfer) is an architectural style, not a protocol. Its constraints: stateless interactions, uniform interface, cacheable responses, layered system. The **stateless** constraint means every request must carry all context needed to process it — no session state is stored server-side between requests. (→ [[sources/understanding-distributed-systems]] ch. 5)

### URL Resource Modeling

REST resources map to URL paths. The hierarchy should reflect the domain model:

- `/products` — collection of products
- `/products/42` — a specific product
- `/products/42/reviews` — reviews belonging to a product

Nesting is a balancing act: deep nesting makes URLs reflect relationships clearly but can make them brittle when relationships change. Keep nesting to 2–3 levels maximum. (→ [[sources/understanding-distributed-systems]] ch. 5)

### HTTP Methods: Safe and Idempotent

| Method | Safe | Idempotent | Typical use |
|--------|------|-----------|-------------|
| GET | Yes | Yes | Read a resource |
| HEAD | Yes | Yes | Read headers only |
| PUT | No | Yes | Full replace of a resource |
| DELETE | No | Yes | Remove a resource |
| POST | No | No | Create, or operations without natural idempotency |
| PATCH | No | No (usually) | Partial update |

**Safe**: does not modify server state. Safe implies idempotent, but not vice versa.
**Idempotent**: applying multiple times has the same effect as applying once. `PUT /products/42` with the same body is idempotent; `POST /products` to create a product is not. For non-idempotent POST operations, use idempotency keys (→ [[distributed/idempotency]]).

### Status Codes

| Range | Meaning | Common codes |
|-------|---------|-------------|
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirect | 301 Moved Permanently, 304 Not Modified |
| 4xx | Client error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests |
| 5xx | Server error | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable |

Key distinction: **401** means the request is unauthenticated (send credentials); **403** means the request is authenticated but the principal lacks permission. Using these correctly reduces client-side debugging friction. (→ [[sources/understanding-distributed-systems]] ch. 5)

### Content Negotiation

Clients advertise accepted formats via `Accept` header; servers declare the actual format via `Content-Type`. This allows a single endpoint to serve JSON, XML, or other formats to different clients without URL changes.

**Richardson Maturity Model (RMM)** describes levels of REST adoption:

| Level | Characteristic | Example |
|-------|---------------|---------|
| 0 | Single URI, HTTP as transport (RPC style) | `POST /rpcEndpoint` |
| 1 | Multiple resource URIs | `GET /attendees/123` |
| 2 | Correct HTTP verbs + status codes | `PUT /attendees/123`, `404` for missing |
| 3 | HATEOAS — hypermedia links in responses | Rarely used in practice |

Level 2 is the practical target. Level 3 (HATEOAS) adds discoverability but significant complexity; the book does not recommend it for most APIs.

### Practical REST Design Guidelines

**Adopt an API standard early.** REST is loose; a standard (e.g., Microsoft REST API Guidelines) provides rulings on pagination, filtering, naming, and errors before you build. Retrofitting consistency after multiple APIs are live is much more expensive.

**Pagination**: never return bare arrays for collection endpoints. A bare array (`[...]`) cannot be extended without a breaking change. Wrap in an object from the start:
```json
{ "value": [...], "@nextLink": "{opaqueUrl}" }
```
This allows adding pagination, metadata, or cursors later without breaking consumers.

**PII in URLs**: do not put personally identifiable information in URL paths or query parameters. URLs can be logged in server logs, CDN access logs, and browser history. Use an opaque ID and return PII in the response body only. (→ [[sources/mastering-api-architecture]] Ch 1)

**Error handling**: return accurate status codes — never wrap errors inside a 200 response. Do not expose stack traces or internal error details to external consumers; these aid attackers. Use an `InnerError` field or similar for internal/debug detail, stripped before reaching the external consumer. Returning the wrong range (e.g., 4xx for a server fault) causes consumer code to behave incorrectly — clients may not retry a 400 but will retry a 503.

**Semantic versioning**: API versions follow Major.Minor.Patch.
- *Patch*: bug fixes; no schema change; transparent to consumers.
- *Minor*: backward-compatible additions (new optional fields); consumers can ignore.
- *Major*: breaking changes; consumers must actively migrate; old and new versions run simultaneously during the transition.

**Versioning strategies**: version in the URL (`/v1/attendees`) is practical and visible; version in a header (`Version: v1`) is more RESTful but less discoverable. The book recommends the URL approach for external APIs.

**Detecting breaking changes**: run `openapi-diff` in CI; fail the build if the new OAS is not backward-compatible with the previous version. Prevents accidental breaking changes from reaching production without a conscious version bump.

**Chatty API antipattern (Gorton):** Exposing fine-grained getter/setter-style operations as HTTP APIs causes multiple round trips for a single logical operation, each incurring network latency. Use coarse-grained resources — `GET` the whole resource, `PUT` the updated resource. Use `PATCH` only for partial modifications of specific fields, not as a workaround for fine-grained exposure. In practice: design resources around client use cases, not server data models (→ [[sources/foundations-of-scalable-systems]] ch. 5).

**Payload compression:** HTTP `Accept-Encoding`/`Content-Encoding` headers enable gzip compression of request and response bodies. Compression can reduce bandwidth and latency by 50%+. The trade-off: CPU cycles for compression/decompression, typically small relative to the savings in transit time for large payloads (→ [[sources/foundations-of-scalable-systems]] ch. 5).

## Non-Breaking vs Breaking Changes (Nygard)

Nygard (→ [[sources/release-it]] ch. 14) frames API compatibility as a stack of layered agreements. A breaking change is any *unilateral* departure from a prior agreement. **Postel's Robustness Principle** — "be conservative in what you do, be liberal in what you accept" — defines the safe direction of change:

**Always safe (non-breaking)**:
- Require a *subset* of the previously required parameters
- Accept a *superset* of the previously accepted parameters
- Return a *superset* of the previously returned values
- Enforce a *subset* of the previously required constraints

**Breaking** (triggers a major version):
- Rejecting a protocol, encoding, or request syntax that previously worked
- Adding required fields to the request
- Forbidding optional input that was previously allowed
- Removing previously guaranteed response fields
- Requiring a higher level of authorization

**The implementation is the de facto spec**: once a service is live, its actual behaviour — including undocumented edge cases and bugs — is the real contract. Adding validation that starts rejecting previously-accepted input (even malformed input) is a breaking change regardless of what the documentation said. Postel's Principle leaves no choice: keep accepting it.

**Bump all routes together**: when introducing a major version, bump all routes at the same time — even if only one changed. Forcing consumers to track which version number applies to which route fragment is an integration hazard.

**Version translation in controllers**: methods for the old API convert old objects to the current domain model on the way in and convert current objects back to the old format on the way out. Keeps business logic deduplicated; only the controller layer does translation.

**Inbound + outbound contract testing**: *inbound* tests exercise your own API against your understanding of the spec; *outbound* tests exercise your dependencies using *their* spec but *your* interpretation. Consumer-owned contract tests (written by the consuming team, not the implementing team) are more effective — the consumer discovers misunderstood edge cases the implementing team would miss. (→ [[concepts/contracts]])

## OpenAPI Specification (OAS)

OAS (formerly Swagger) is a JSON/YAML format for describing REST APIs. It enables:
- **Code generation**: generate client SDKs and server stubs from the spec.
- **Documentation**: Swagger UI, Redoc.
- **Contract validation**: validate requests against the spec at the API gateway (input validation without service involvement).
- **Mock servers**: generate stub responses from the spec for consumer testing.
- **Change detection**: openapi-diff compares two OAS files and classifies changes as breaking or backward-compatible.

The OAS should be the single source of truth for the API contract, written before implementation (API-first) and kept in sync with the implementation via generated or verified tooling.

> **Open question:** How does OAS versioning integrate with the API lifecycle (planned → beta → live → deprecated → retired)? The book implies a 1:1 relationship between major version and lifecycle stage, but doesn't make this explicit.

## gRPC

gRPC is a high-performance RPC framework using Protocol Buffers (.proto) as its interface definition language. Key properties:
- **Binary protocol over HTTP/2**: lower overhead than JSON/HTTP/1.1; supports multiplexing and server push.
- **Strict schema**: the `.proto` file is the contract; breaking changes are caught at compile time.
- **Compatibility rules**: field numbers are permanent; adding new fields is backward-compatible; removing or renumbering fields is not.
- **Code generation**: client and server stubs generated from `.proto` in any supported language.
- **Bidirectional streaming**: supports unary, server-streaming, client-streaming, and bidirectional RPC patterns.

gRPC is appropriate for east–west traffic because: both producer and consumer are controlled, the schema rigidity is an asset (not a constraint), and the performance advantage matters at high call volumes. It is less appropriate for external APIs because: browser support requires grpc-web (a subset), and it is harder for third parties to adopt.

### Combining REST and gRPC Specifications

A tempting approach is to generate `.proto` from an OAS (or vice versa) so a single service exposes both REST and gRPC from one source of truth. This is problematic:

- Generating `.proto` from OAS assigns field numbers alphabetically. Adding a new field that sorts before existing ones **changes all subsequent field numbers**, breaking binary compatibility for all existing clients.
- `grpc-gateway` can generate a REST reverse proxy from `.proto` annotations, but it couples REST URL design to the RPC method structure, creating a lowest-common-denominator API in both directions.
- The two models have fundamentally different semantic contracts: REST exposes a resource model with loose coupling; gRPC exposes a method interface with tight coupling. Converting between them is semantically lossy.

The recommended approach: **design the REST API and the gRPC interface independently**, allowing each to evolve on its own terms. Record the decision in an ADR. (→ [[sources/mastering-api-architecture]] Ch 1)

## GraphQL

GraphQL is a query language for APIs where the client specifies exactly the data it needs. Key properties:
- **Client-driven queries**: no over-fetching (fields not requested are not returned); no under-fetching (a single query can traverse multiple resources).
- **Schema as contract**: the GraphQL schema defines types and resolvers.
- **Single endpoint**: all queries and mutations go to one endpoint (contrast with REST's resource-based routing).

Best uses: mobile UIs (bandwidth-constrained; need exactly the right data), reporting/analytics (variable projections over the same data), and as a facade over multiple legacy services (hide backend complexity behind a clean query interface). Not recommended as a general-purpose API style — the caching story is weaker than REST, and schema governance requires discipline.

## API-First Design

API-first means designing and agreeing on the API contract (OAS document) before implementing either the producer or consumer. Benefits:
- Consumer and producer teams can work in parallel (consumer uses mocked server from OAS).
- Design feedback is cheaper at contract stage than at implementation stage.
- The contract becomes the source of truth for contract tests and gateway validation.

## Serving State from Event-Driven Microservices

Event-driven microservices often expose a request-response API alongside their event-processing logic (→ [[sources/building-event-driven-microservices]] ch. 13).

### Internal state stores

State is sharded by key across instances. The correct instance is found by applying the partitioner logic to the request key → partition ID → cross-reference consumer group partition assignments → target instance. A round-robin load balancer hits the right instance only `1/instanceCount` of the time; all other requests need a redirect.

A **smart load balancer** pre-routes using partition assignments (derived from changelog or repartition streams), eliminating most redirects. Trade-off: the LB is coupled to the topology — renaming state stores or changing topology breaks routing. Deploy the smart LB as part of the microservice's deployable unit.

### External state stores

Any instance can serve the full domain (no partition sharding constraint). Instances can scale beyond partition count — extras don't process events but serve requests and act as failover standby. Two sub-patterns:

| Pattern | Description | Trade-off |
|---------|-------------|-----------|
| All-in-one | Same executable processes events and serves REST API | Simple deployment; no coordination overhead |
| Separate microservice | API server is a distinct executable in the same bounded context; same repo, built and deployed together | Language independence; failure isolation; but coordinating schema changes across two executables is risky |

### Event-first request handling

Instead of processing a request synchronously and writing to a database, convert the request to an event → publish to stream → let the event-driven pipeline process it → materialize to state.

**Benefits**: creates a durable, replayable record of every request; any service can consume the data independently.

**Trade-offs**: read-after-write is eventually consistent (the event must materialize before joins or queries against it can succeed). Mitigation: cache the just-written value in memory for immediate non-join use cases.

**Async UI**: when user input becomes an event, the UI must communicate the asynchronous nature of the operation — disable input, show a "please wait" state, and push the update when the event has been materialized. Duplicate events from retries must be handled idempotently (→ [[distributed/idempotency]]).

## Related Concepts

- [[comparisons/api-protocol-selection]] — decision guide: REST vs gRPC vs GraphQL by scenario; trade-off table; mixing protocols
- [[concepts/api-gateway]] — enforces contracts at the edge (input validation, rate limiting, auth)
- [[concepts/api-testing]] — contract testing validates the OAS-defined contract across producer/consumer pairs
- [[concepts/adrs]] — exchange format decisions should be captured in ADRs
- [[streams/stream-processing]] — state stores that back request-response APIs
- [[patterns/sidecar-service-mesh]] — handles east–west gRPC traffic management
