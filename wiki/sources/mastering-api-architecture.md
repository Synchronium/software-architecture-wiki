---
title: "Mastering API Architecture"
type: source
tags: [api, gateway, service-mesh, security, microservices, distributed-systems]
sources: [mastering-api-architecture]
created: 2026-05-13
updated: 2026-05-13
---

# Mastering API Architecture

**Authors:** [[authors/james-gough]], [[authors/daniel-bryant]], [[authors/matthew-auburn]]
**Published:** 2022
**Slug:** `mastering-api-architecture`

## Overview

*Mastering API Architecture* addresses the full lifecycle of API systems: how to design APIs, test them, expose them via gateways, secure internal service traffic with a service mesh, release them safely, secure them against threats, and evolve them toward cloud-native architectures. It is explicitly practical — each chapter is driven by a running conference system case study and includes ADR Guidelines to help readers make the key decisions.

The book's central organising principle is the **north–south / east–west traffic split**: external ingress (north–south) is managed by an API gateway; internal service-to-service communication (east–west) is managed by a service mesh. These are treated as distinct architectural domains requiring distinct technologies, ownership models, and security postures. This clean separation is the book's strongest architectural contribution relative to other sources in the wiki.

The authors are practitioners with experience at Thoughtworks, Red Hat, and in the API consultancy space. The tone is pragmatic and opinionated: they recommend OAuth2, OAS, and sidecar-based service meshes explicitly, and warn against building your own implementations of any of these.

## Key Claims

- The fundamental architectural question for any internet-facing system is how to manage traffic: north–south (external → API gateway) vs east–west (internal → service mesh). (→ Intro, Ch 3, Ch 4)
- REST is the right default for external (north–south) APIs due to broad interoperability; gRPC is preferable for internal (east–west) APIs in high-traffic, controlled environments. (→ Ch 1)
- The OpenAPI Specification (OAS) is the foundation of a well-governed API: it enables code generation, contract testing, change detection, and input validation at the gateway. (→ Ch 1)
- Contract testing (consumer-driven, via Pact) is the most important testing investment for distributed API systems; it catches integration failures without requiring running systems. (→ Ch 2)
- An API gateway should never contain business logic; the moment it does, it becomes an ESB — a historical failure mode. (→ Ch 3)
- A service mesh should be chosen, not built; the operational cost of a custom implementation far exceeds the cost of adopting an open source solution. (→ Ch 4)
- Deployment and release must be decoupled: code should be deployed to production before it is visible to users, using feature flags or traffic routing strategies. (→ Ch 5)
- Security must be designed architecturally using threat modeling (STRIDE/DREAD), not bolted on as a checklist. (→ Ch 6)
- OAuth2 (with JWT) is the industry standard for API authentication and authorization; no other standard should be preferred for new systems. (→ Ch 7)
- APIs are natural seams for evolving monolithic systems; the strangler fig pattern via an API gateway is the lowest-risk migration approach. (→ Ch 8)
- The industry is moving from zonal security architectures to zero trust; service mesh + network policies provide the technical foundation. (→ Ch 9)

## Chapter Notes

### Introduction — The Conference System Case Study

Introduces the running example: a legacy monolithic conference management system being evolved toward a microservices architecture. Establishes the C4 modelling approach (system context, container, component, code diagrams) and ADRs as the primary decision documentation tool.

Key concept: **north–south vs east–west traffic**:
- *North–south*: external clients → system over the internet. Requires strong identity checks, TLS, rate limiting. Managed by API gateway.
- *East–west*: service-to-service within the infrastructure. Can use trusted identity (mTLS), managed by service mesh.

### Chapter 1 — API Design: Modeling Exchanges

The API design chapter covers the major exchange formats and when to use each:

**REST** and the Richardson Maturity Model (RMM):
- Level 0: single URI (RPC over HTTP)
- Level 1: resource URIs
- Level 2: correct HTTP verbs on resources — the practical target
- Level 3: HATEOAS (hypermedia) — rarely used, not recommended in practice

**OpenAPI Specification (OAS)**: JSON/YAML API description; enables code generation, validation, mocking, change detection (openapi-diff), and gateway-level input validation. Swagger was the original reference implementation.

**Semantic versioning**: Major.Minor.Patch. Breaking changes require a major version bump. The book recommends openapi-diff in CI to fail builds when backward compatibility is accidentally broken.

**gRPC**: Protocol Buffers (.proto) schema compiled to client/server stubs; HTTP/2 binary; strict compatibility rules. Preferred for east–west high-traffic services.

**GraphQL**: Query language for client-driven data fetching; ideal for mobile UIs, reporting, and as a facade over legacy systems.

**Exchange format decision rule**: REST for north–south (broad consumers, loose coupling required); gRPC for east–west (controlled consumers, performance critical). GraphQL for client-specific aggregation use cases.

**API-first design**: Define the OAS contract before implementing. Enables parallel work by consumer and producer teams.

> See [[concepts/api-design]]

### Chapter 2 — Testing APIs

**Test quadrant** (Marick/Crispin): 2×2 grid of technology-facing vs business-facing, automated vs exploratory. Q1: automated unit tests. Q2: automated acceptance tests. Q3: exploratory manual tests. Q4: performance/security tests (tools-assisted).

**Test pyramid**: Unit tests (most, cheapest) → contract/service tests (middle) → end-to-end tests (fewest, most expensive). Violations ("ice-cream cone" anti-pattern) lead to slow, brittle test suites.

**Contract testing**: The definition of a valid interaction between consumer and producer.
- *Producer contracts*: producer defines the contract; consumers must conform. Better for external public APIs.
- *Consumer-driven contracts (CDC)*: consumers define the interactions they need; producers verify they honour all of them. Better for internal APIs.
- Pact is the de facto CDC framework; generates an intermediate representation (pact file); Pact Broker provides centralised storage and network visualisation.

**Component testing**: Multiple units together; verifies behaviour beyond schema shape — status codes, auth responses, empty datasets.

**Integration testing**: Across service boundaries; stub servers (hand-rolled, WireMock); Testcontainers for real dependency instances in CI.

**End-to-end testing**: Real services; scope defined per test (acceptable to stub external third parties); scenario tests for core user journeys; performance tests require production-like environments.

> See [[concepts/api-testing]]

### Chapter 3 — API Gateways: Ingress Traffic Management

An API gateway sits at the network edge between consumers and backend services. It has:
- A **control plane** (routing rules, policies, telemetry configuration — operated by humans)
- A **data plane** (the actual packet routing, policy enforcement, telemetry emission — on the critical path)

**Gateway capabilities** (what distinguishes it from a load balancer or reverse proxy):
- API composition and aggregation
- Authentication / authorization enforcement
- Rate limiting and load shedding
- Circuit breaking
- Logging and distributed tracing correlation IDs
- API lifecycle management and developer portal
- Monetization

**Gateway taxonomy** (three types):
1. *Traditional enterprise*: full API lifecycle management, monetization, admin UI, developer portal. Strong APIM features. Kong, Apigee, WSO2.
2. *Microservices / micro gateway*: lightweight, Kubernetes-native, self-service config via IaC. Ambassador Edge Stack, Traefik, Tyk.
3. *Service mesh gateway*: limited features; designed only to route external traffic into the mesh. Istio Ingress, Linkerd gateway.

**History**: Hardware LBs (1990s) → Software LBs / HAProxy / NGINX (early 2000s) → ADCs (mid-2000s) → First-gen API gateways (Kong, Apigee, 3Scale, 2010s) → Second-gen Kubernetes-native gateways (Envoy-based, post-2015).

**Pitfalls**:
- *API gateway loopback*: routing internal service traffic back through the public gateway. Creates performance, security, and cost problems.
- *Gateway as ESB*: adding business logic to gateway plug-ins. Creates high coupling; changes require gateway + service deployment coordination.
- *Turtles all the way down*: hierarchical gateways where all traffic traverses multiple layers. High change coordination cost, understandability problems, latency overhead.

**Key guideline**: Use the simplest solution for your requirements — proxy → load balancer → API gateway. Prefer buy over build.

> See [[concepts/api-gateway]]

### Chapter 4 — Service Mesh: East–West Traffic Management

A service mesh manages all service-to-service communication: routing, reliability, observability, and security.

**Control plane / data plane** same as API gateway. Data plane is typically sidecar proxies (one per service instance).

**Service mesh implementations have three generations**:
1. *Library-based*: (Finagle, Netflix OSS). Language-specific; no polyglot support; deprecated.
2. *Sidecar-proxy-based*: (Linkerd, Istio/Envoy, Consul). Current standard. Language-agnostic; higher resource overhead.
3. *Proxyless gRPC libraries / eBPF-based*: (Google Traffic Director, Cilium). Emerging; eBPF pushes mesh into OS kernel, eliminating sidecar resource overhead.

**Why service mesh rather than API gateway for east–west**:
- No single point of failure from centralised gateway
- Granular per-service traffic control without deploying API gateway per service
- mTLS between every service pair without code changes
- Consistent cross-language policy enforcement

**Pitfalls** mirror the gateway pitfalls: mesh as ESB (adding business logic to Wasm filters), mesh as gateway (using only the ingress gateway while paying full mesh operational cost), too many networking layers (duplicate circuit breaking in both mesh and lower-level stack).

> See [[patterns/sidecar-service-mesh]]

### Chapter 5 — Deploying and Releasing APIs

**Deployment ≠ release**: Deployment puts code in production as an idle process. Release activates it for users. Separating them enables risk reduction.

**Feature flags**: Code-level toggle (e.g., LaunchDarkly) enables deployment without activation. Warning: feature flags must be cleaned up; the Knight Capital incident ($460M loss) was partly caused by a reused flag.

**API lifecycle**: planned → beta → live → deprecated → retired. Consumers only need to track major version changes (minor and patch are backward-compatible).

**Release strategies**:
- *Canary*: route small percentage of traffic to new version; monitor KPIs and SLIs; expand or rollback. Only one new instance needed (vs blue-green).
- *Traffic mirroring / dark launch*: duplicate traffic to new version; responses not returned to users. Observability-only experiment.
- *Blue-green*: two complete environments; switch gateway routing at release; quick rollback available. Requires double resources.

**Observability — three pillars**: metrics (detect symptoms), logs (explain causes), traces (causally ordered cross-service view). OpenTelemetry as the open standard for all three.

**RED metrics**: Rate, Error, Duration — the standard signal set for API services. SLOs and SLIs replace naive alerting; alert on burn rate, not raw thresholds.

> See [[concepts/api-testing]] for testing in production; [[concepts/fitness-functions]] for fitness function categories

### Chapter 6 — Operational Security: Threat Modeling

**Threat modeling** is the architectural process for identifying, prioritising, and mitigating security threats before they reach production.

**6-step process**: (1) identify objectives, (2) gather information, (3) decompose the system (→ data flow diagram), (4) identify threats (STRIDE), (5) evaluate risk (DREAD), (6) validate.

**STRIDE** (threat categories):
- *Spoofing* — impersonating a valid identity
- *Tampering* — modifying data without authorization (payload injection, mass assignment)
- *Repudiation* — actions that cannot be traced (insufficient logging)
- *Information disclosure* — exposing private data (excessive data exposure, improper asset management)
- *Denial of service* — overwhelming the system (rate limiting and load shedding as mitigations)
- *Elevation of privilege* — gaining unauthorized access (BOLA, broken function-level authorization)

**DREAD** (risk scoring, 1–10 per dimension, average): Damage + Reproducibility + Exploitability + Affected Users + Discoverability.

**OWASP API Security Top 10**: primary threat reference; mapped onto STRIDE categories by the book.

**API gateway as the security perimeter**: TLS termination, input validation via OAS contract, rate limiting, CORS, header allowlisting. Not a substitute for defence-in-depth in the service implementation.

> See [[concepts/threat-modeling]]

### Chapter 7 — Authentication and Authorization

**OAuth2**: token-based authorization framework (2012). Roles: resource owner, authorization server, client, resource server.

**JWT (JSON Web Token)**: RFC standard token format. JWS (signed, readable claims) vs JWE (encrypted claims). Key claims: iss, sub, aud, exp, nbf, iat, jti. Short-lived tokens (1–60 min) recommended.

**OAuth2 grants**:
- *Authorization Code Grant*: for confidential clients (server-backed web apps). Redirects user to authorization server; returns authorization code; exchanged for access token.
- *Authorization Code + PKCE*: for public clients (SPAs, mobile). Adds code_verifier/code_challenge to prevent interception attacks. Recommended for all public clients.
- *Client Credentials Grant*: machine-to-machine. No user involvement; client authenticates directly to authorization server.
- *Device Authorization Grant*: IoT / limited-input devices.

**Scopes**: coarse-grained authorization; visible to users on consent screen; enforced by API gateway. Fine-grained authorization is RBAC within the service.

**OIDC**: identity layer on top of OAuth2; provides ID tokens with user claims (profile, email, address, phone). Distinct from OAuth2 — ID tokens are not access tokens and must not be used as such.

**SAML 2.0**: enterprise SSO standard; an OAuth2 extension (SAML 2.0 Profile) allows using SAML assertions to obtain OAuth2 access tokens.

> See [[concepts/oauth2-and-authn]]

### Chapter 8 — Redesigning Applications to API-Driven Architectures

APIs are natural seams (Michael Feathers' term from *Working Effectively with Legacy Code*) — points where functionality is stitched together and where loosely coupled substitution is possible. This makes them ideal leverage points for evolving systems.

**Strangler fig**: introduce new API-backed services alongside the legacy application; gradually route traffic from legacy to new via the API gateway. The gateway provides location transparency — consumers are unaware of the migration happening behind it.

**Facade vs adapter**: Facade routes without transformation. Adapter transforms protocols (SOAP → REST). API gateways should remain facades; crossing into adapter territory couples the gateway to business logic.

**API layer cake (anti-pattern)**: layered API tiers (SoE/SoD/SoR, Gartner Pace-Layered). Encourages shortcuts that bypass layers and duplicate functionality. Generally avoid.

**Managing evolution**: fitness functions as guardrails (see [[concepts/fitness-functions]]); ADRs for documenting irreversible decisions; continuous delivery for validating changes.

**End-state options**: monolith (valid starting point) → SOA (service boundaries, avoid heavy middleware) → microservices (bounded contexts, smart endpoints / dumb pipes) → functions (event-driven, careful with coupling).

> See [[concepts/evolutionary-architecture]]

### Chapter 9 — Using API Infrastructure to Evolve Toward Cloud Platforms

**Six Rs of cloud migration** (AWS framework):
- *Retain*: do nothing now; communicate known EOL dates.
- *Rehost* (lift-and-shift): move without re-architecting; watch for hardware-assumption failures.
- *Replatform* (lift-tinker-and-shift): minor changes to take advantage of cloud services (e.g., managed databases).
- *Repurchase*: replace with SaaS product.
- *Refactor/re-architect*: reimagine using cloud-native patterns; highest cost, highest benefit.
- *Retire*: decommission unused systems.

**Zonal architecture**: traditional perimeter security — public zone → public access zone (DMZ) → operations zone → restricted zone. Traffic inside the perimeter is trusted. Vulnerable to supply chain attacks and cloud's abstract infrastructure.

**Zero trust**: "never trust, always verify" — mutual authentication everywhere, including internal traffic. Eight NCSC principles. API gateway enforces OAuth2 at ingress; service mesh enforces mTLS internally; Kubernetes NetworkPolicies restrict pod-level traffic.

**Multicluster service mesh peering**: bridge on-premises and cloud data planes under a unified control plane; enables incremental cloud migration without big-bang cutover.

> See [[concepts/zero-trust]]

### Chapter 10 — Wrap-up

Conway's Law applied to APIs: organisational communication structures mirror API design. "If you have four groups working on a microservice system, you'll get four layers of APIs." Organisational design is as important as technical design.

**Type 1 vs Type 2 decisions** (Bezos): API gateway and service mesh selection are Type 1 (hard to reverse). Apply appropriate deliberation.

**Emerging topics**: AsyncAPI specification (standardising async API description), HTTP/3 over QUIC (addressing head-of-line blocking), platform-based mesh (service mesh integrated into cloud vendor's Kubernetes offering; watch Service Mesh Interface standard).

## Notable Quotes

> "APIs are quick to build, tricky to design for future compatibility, and even harder to secure." (Ch 6)

> "Never trust, always verify." (Ch 9 — zero trust principle)

> "If you have four groups working on a microservice system, you'll get four layers of APIs." (Ch 10 — Conway's Law)

> "Feature flags are a good way of creating this separation [between deployment and release]. Once the migration is complete, the feature flag code should be removed completely." (Ch 5)

## Related Pages

- [[concepts/api-design]]
- [[concepts/api-gateway]]
- [[concepts/api-testing]]
- [[concepts/threat-modeling]]
- [[concepts/oauth2-and-authn]]
- [[concepts/zero-trust]]
- [[concepts/evolutionary-architecture]]
- [[patterns/sidecar-service-mesh]]
- [[concepts/fitness-functions]]
- [[concepts/adrs]]
- [[comparisons/architecture-styles-comparison]]
