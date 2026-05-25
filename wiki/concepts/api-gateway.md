---
title: "API Gateway"
type: concept
tags: [api, gateway, traffic-management, security, microservices, distributed-systems]
sources: [mastering-api-architecture, understanding-distributed-systems]
created: 2026-05-13
updated: 2026-05-14
---

# API Gateway

## Definition

An API gateway is a management tool deployed at the edge of a system — between consumers and backend services — that acts as a single point of entry for external API traffic. It handles cross-cutting concerns that would otherwise need to be implemented in every backend service: authentication, [[distributed/rate-limiting|rate limiting]], routing, observability, and more.

An API gateway is the primary solution for managing **north–south traffic** (external → system). It is not the right tool for internal service-to-service communication — that is the domain of the [[patterns/sidecar-service-mesh]].

## Control Plane and Data Plane

Like a service mesh, an API gateway has two components:
- **Control plane**: where operators define routes, policies, and telemetry configuration. Not on the critical path.
- **Data plane**: where packets are actually routed, policies enforced, and telemetry emitted. On the critical path of every user request.

These can be packaged together (simpler operation) or deployed separately (better isolation and scaling).

## Why Use an API Gateway?

Six capabilities that justify a gateway over a simpler proxy or load balancer (→ [[sources/mastering-api-architecture]] Ch 3):

**1. Reduce coupling** — acts as a facade or adapter between frontends and backends. Consumers call the gateway's stable API; backends can change location, language, or architecture without impacting consumers.

**2. Simplify consumption** — aggregate multiple backend API calls into a single consumer-facing call; translate protocols (SOAP → REST). Warning: aggregation that embeds business logic couples the gateway to the domain.

**3. Protect from abuse** — TLS termination, authentication/authorization, IP allow/deny lists, WAF integration, rate limiting, load shedding.

**4. Observability** — inject correlation IDs into requests; capture top-line ingress metrics (error rate, latency, throughput) at the single point where all traffic flows.

**5. API lifecycle management** — developer portals, API versioning governance, change management, consumer onboarding. The full lifecycle spans 10 stages (→ [[sources/mastering-api-architecture]] Ch 3):

| Stage | Description |
|-------|-------------|
| **Building** | Design and implementation |
| **Testing** | Functional, performance, and security verification |
| **Publishing** | Exposing the API to developers (portal, sandbox, docs) |
| **Securing** | Mitigating threats; applying auth, rate limiting, WAF |
| **Managing** | Ongoing maintenance to keep the API functional and current |
| **Onboarding** | Enabling developers to consume quickly (OAS docs, API keys) |
| **Analysing** | Observability — usage patterns, error rates, latency |
| **Promoting** | Advertising to developers; API marketplace listing |
| **Monetizing** | Charging for usage; billing integration (PayPal, Stripe) |
| **Retirement** | Deprecating and removing APIs; consumer migration |

Enterprise API gateways support this full 10-stage lifecycle. Microservices gateways typically omit monetization and onboarding stages.

**6. Monetization** — account management, billing integration, consumer plan limits.

## Gateway vs Proxy vs Load Balancer

| Feature | Reverse Proxy | Load Balancer | API Gateway |
|---------|--------------|---------------|-------------|
| Single backend | ✓ | ✓ | ✓ |
| TLS / SSL | ✓ | ✓ | ✓ |
| Multiple backends | — | ✓ | ✓ |
| Service discovery | — | ✓ | ✓ |
| API composition | — | — | ✓ |
| Authorization | — | — | ✓ |
| Retry logic | — | — | ✓ |
| Rate limiting | — | — | ✓ |
| Logging and tracing | — | — | ✓ |
| Circuit breaking | — | — | ✓ |

Guideline: use the simplest solution that meets your requirements. A reverse proxy suffices for simple routing; a load balancer adds multi-backend support; an API gateway is warranted when you need advanced cross-functional requirements.

## Taxonomy: Three Gateway Types

(→ [[sources/mastering-api-architecture]] Ch 3)

**Traditional enterprise API gateway**: Full API lifecycle management, monetization, admin UI, developer portal, analytics. Often has a commercial bias (open core model). Requires dependent services (datastores) that must be run with high availability. Examples: Kong (enterprise), Apigee, WSO2, 3Scale.

**Microservices / micro gateway**: Lightweight; Kubernetes-native; self-service configuration via declarative code in the deployment pipeline. Optimised for developer agility, not APIM governance. Examples: Ambassador Edge Stack, Traefik, Tyk, Kong (open source).

**Service mesh gateway**: Designed only to route external traffic into the mesh; minimal feature set; implicitly coupled to the service mesh. Not a replacement for a full API gateway. Examples: Istio Ingress Gateway, Linkerd multicluster gateway.

| Criterion | Enterprise | Microservices | Service Mesh |
|-----------|------------|---------------|--------------|
| Primary purpose | Expose and manage business APIs | Expose and compose internal services | Expose internal mesh services |
| Configuration | Admin UI / API | IaC / CLI | IaC / CLI |
| Monitoring focus | Admin/operations | Developer-focused (RED metrics) | Platform-focused |
| Testing support | Staging environments, versioning | Canary routing, contract testing | Canary routing |

## History

Understanding why the API gateway looks the way it does today requires knowing its evolution (→ [[sources/mastering-api-architecture]] Ch 3):

- **1990s — Hardware load balancers**: F5, Cisco. Infrastructure-team-operated; focused on spreading HTTP load across web servers. Layer 4 (IP/port).
- **Early 2000s — Software load balancers**: HAProxy (2001), NGINX (2002). Cheaper, more flexible than hardware. CDNs and WAFs also emerged.
- **Mid-2000s — Application delivery controllers (ADCs)**: F5, Citrix. Added compression, caching, SSL offload, traffic shaping. Still infrastructure-operated.
- **Early 2010s — First-generation API gateways**: Kong, Apigee, WSO2, 3Scale. First tools targeted at developers, not just ops. Developer portals, API keys, lifecycle management. Layer 7 (HTTP header-based) routing. Reflected the rise of the API economy (Twilio, Stripe).
- **2015 onward — Second-generation (Kubernetes-native)**: Ambassador, Contour, Traefik. Built on Envoy Proxy. Microservices-focused; declarative config; self-service; canary routing built in. "Smart endpoints, dumb pipes" philosophy.

## Common Pitfalls

**API gateway loopback**: routing internal service-to-service traffic back through the public gateway to avoid implementing service discovery. Results in: internally destined traffic leaving the network (security and cost), gateway becoming a bottleneck and single point of failure, operationally complex tracing. Fix: use a service mesh for east–west traffic.

**Gateway as ESB**: embedding business logic in gateway plug-ins (Groovy scripts in Zuul, Lua modules in Kong, Wasm in Envoy). Creates high coupling — service changes require coordinated gateway deployment. Fix: gateways should be facades, not orchestrators. Business logic belongs in services.

**Turtles all the way down**: hierarchical gateways where traffic passes through multiple gateway layers. Increases change coordination cost, adds latency at every hop, creates ownership ambiguity ("which gateway owns tracing?"). Fix: consolidate; separate concerns cleanly.

**Routing on request payloads**: deserialising request bodies to make routing decisions. Expensive (large payloads), tightly couples gateway config to the domain schema. Avoid: route on path, host, or headers only.

## Failure Management

An API gateway is on the critical path of all user requests. Failure model considerations:
- Run multiple instances for high availability; load balancer in front of gateway instances.
- Understand whether security components fail open (allow traffic through on failure) or fail closed (block traffic). Financial systems typically require fail closed.
- Define clear ownership and on-call responsibility.
- Run blameless post-mortems after every gateway incident.
- Test failover regularly — especially leader election and sticky session handling.

## Authentication vs Authorisation Split

A consistent pattern from practice: **the gateway authenticates; individual services authorise**.

- **Authentication** (is this principal who they say they are?) is centralised at the gateway. Centralising authentication allows one place to implement and update different authentication mechanisms (sessions, JWT, API keys, OAuth2) without touching internal services.
- **Authorisation** (is this principal allowed to do this thing?) stays with individual services, because permission decisions are domain logic — a service knows its own resource model and roles.

After authenticating a request, the gateway creates a **security token** and passes it downstream with the request. Internal services validate the token and extract the principal's identity and roles.

**Token types:**
- **Opaque token**: contains no information — validation requires calling an external auth service. Secure (easy to revoke), but adds a network call per request.
- **Transparent token (JWT)**: a signed JSON payload containing expiry, principal identity, and roles. Internal services validate the signature locally — no external call needed. Faster, but hard to revoke: a stolen JWT is valid until expiry.

**API keys**: a separate mechanism commonly used for public APIs (GitHub, Twitter). The gateway identifies the principal and their rate limits from the key without requiring a full OAuth2 flow.

## Composition Caveat

When the gateway composes responses by calling multiple internal services, the **availability of the composed endpoint decreases with each additional upstream call**:

```
composed_availability = A₁ × A₂ × A₃ × ...
```

Three 99.9% services → composed availability ≈ 99.7%. Additionally, the composed response may be internally inconsistent if updates haven't propagated uniformly across all services at query time. The gateway must decide how to handle partial failures (return partial data, degrade gracefully, or fail the whole request).

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/mastering-api-architecture]] | Comprehensive treatment: taxonomy (three types), full history, pitfalls, selection criteria. Central to the book's architecture. |
| [[sources/fundamentals-of-software-architecture]] | Mentions API gateways briefly as part of the microservices pattern; notes that gateways can solve the "service mesh" problem for smaller deployments |
| [[sources/understanding-distributed-systems]] | Practical framing of gateway responsibilities: routing, composition (with availability caveat), translation (REST→gRPC, BFF/GraphQL), and auth/authz split (ch. 21) |

## Related Concepts

- [[patterns/sidecar-service-mesh]] — the east–west complement to the API gateway's north–south role
- [[concepts/api-design]] — the contracts the gateway enforces
- [[concepts/oauth2-and-authn]] — the auth model the gateway enforces at the edge
- [[concepts/threat-modeling]] — the security threats the gateway mitigates
- [[concepts/zero-trust]] — how gateways fit into zero trust architectures
- [[concepts/adrs]] — gateway selection is a Type 1 decision warranting a formal ADR
