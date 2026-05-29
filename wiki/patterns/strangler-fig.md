---
title: "Strangler Fig Pattern"
type: pattern
tags: [migration, decomposition, monolith, microservices, incremental, proxy, ui-composition]
sources: [monolith-to-microservices]
created: 2026-05-15
updated: 2026-05-29
---

# Strangler Fig Pattern

## Definition

The **Strangler Fig** (Martin Fowler) is an incremental migration pattern where a new system grows around an existing one, gradually taking over its behaviour until the old system can be removed — analogous to the strangler fig tree that wraps a host tree and eventually replaces it. (→ [[sources/monolith-to-microservices]])

The pattern is the primary vehicle for safe, incremental microservice extraction. Its defining property: the old system continues to run throughout the migration; there is no moment where everything switches at once.

## The Three Steps

1. **Identify** — choose a behaviour to migrate. Map it in the existing system; understand its inputs, outputs, and dependencies.
2. **Implement** — build the behaviour in the new service. Do not modify the monolith during this phase. The new service is developed independently and reaches production readiness before any traffic is redirected.
3. **Redirect** — move traffic to the new service. This is a deployment decision, not an implementation decision. Deployment ≠ release: the new service can be deployed (reachable in production) long before any traffic is sent its way.

Return to step 1 for the next behaviour. The monolith shrinks one capability at a time.

## HTTP Proxy Implementation

The most common implementation: an **HTTP reverse proxy** (NGINX, HAProxy, API gateway) sits in front of both the monolith and the new service. All inbound requests hit the proxy.

- Initially: proxy forwards all requests to the monolith
- After extraction: proxy forwards the extracted path(s) to the new service; everything else still goes to the monolith
- Eventually: once all paths are extracted, the proxy points entirely at new services and the monolith can be retired

The proxy is a **seam**: the monolith and the new service are never aware of each other; the routing decision lives outside both. This makes the migration reversible — redirect traffic back to the monolith simply by updating the proxy config.

The proxy also separates **deployment from release**: the new service is deployed and tested in production at low traffic (or zero) before the redirect is applied.

## Non-HTTP Transports

The proxy concept generalises beyond HTTP:

**FTP example (Homegate)**: content delivery to the monolith came via FTP drops. Newman describes extracting this by intercepting at the FTP level — the new service subscribes to the same FTP drops and handles its own files, while the monolith continues handling the rest. The proxy is the FTP routing logic.

**Message/event interception**: for monoliths that consume from message queues or event streams, two approaches work:
- **Content-based router**: a routing intermediary inspects each message and directs it to either the monolith or the new service based on message properties (type, topic, payload)
- **Selective consumption**: the new service subscribes alongside the monolith but only processes messages relevant to the migrated capability; both services see all messages but act on different subsets

## UI Composition

When a monolith renders a full-page UI, a pure proxy-level redirect is not always possible — a user's page may contain widgets from both the monolith and new services simultaneously. Three decomposition approaches:

**Page composition (vertical slices)**: entire pages are redirected to either the monolith or a new service. The simplest form — routes map directly to services. Works when the UI can be decomposed along page boundaries without sharing layout.

**Widget/component composition (micro frontends)**: individual page components are served by different services. Requires an assembly layer (the page shell) that aggregates components from multiple services. ESI (Edge Side Includes) is one mechanism; JavaScript module federation is another. This approach enables teams to own their widget end-to-end without coordinating on full-page ownership.

**Mobile (Spotify server-side configuration)**: native mobile clients cannot be easily patched; the server tells the client what to render. Spotify used server-driven UI configuration to enable gradual feature migration without synchronised app releases.

## Key Principles

**Deployment ≠ release** (→ [[sources/monolith-to-microservices]]): a new service that is deployed to production but receiving no traffic has not been released. The rollout decision (redirect traffic) is separate from and later than the deployment decision. This separation is what makes the strangler fig safe.

**Feature freeze during migration**: while a behaviour is being migrated, adding new features to that behaviour in the monolith complicates the migration — the new service must keep pace with moving targets. Establish a feature freeze on migrating capabilities in the monolith while the new service is under development.

**Reversibility**: because the monolith continues to handle all other requests and because traffic is redirected via a proxy, the migration is reversible at any point. If the new service has problems, redirect traffic back to the monolith.

## Limitations

- Requires an interception layer (proxy, router, gateway) at the boundary — this is additional infrastructure
- Works well at the perimeter (public-facing HTTP, external message producers) but is harder to apply to deeply embedded internal behaviour with no clean inbound seam — for those, use [[patterns/branch-by-abstraction]] instead
- UI composition can be complex when shared layout, session state, or authentication spans old and new systems

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/monolith-to-microservices]] | Defining treatment (ch. 3): three-step process, HTTP proxy as primary mechanism, FTP and message-interception variants, UI composition options, deployment ≠ release distinction, feature freeze caution |
| [[sources/building-evolutionary-architectures]] | Mentions strangler fig as the primary pattern for safe incremental replacement of existing systems; positions it within the broader context of evolutionary architecture as a technique for guided change |

## Related Concepts

- [[patterns/branch-by-abstraction]] — for extracting deeply embedded functionality with no clean external seam
- [[concepts/evolutionary-architecture]] — strangler fig as a tool for guided, incremental change
- [[styles/microservices-architecture]] — the target state strangler fig migrations move toward
- [[concepts/fracture-planes]] — where to split; strangler fig is how to execute the split
- [[concepts/bounded-contexts]] — the bounded context is the unit of extraction in a strangler fig migration
- [[comparisons/migration-pattern-selection]] — decision guide: strangler fig vs branch by abstraction vs parallel run vs feature flag
