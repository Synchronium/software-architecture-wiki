---
title: "Anticorruption Layer (ACL)"
type: pattern
tags: [ddd, bounded-contexts, integration, translation, domain-model, legacy, microservices, migration, coupling]
sources: [domain-driven-design, learning-domain-driven-design, monolith-to-microservices, building-evolutionary-architectures]
created: 2026-05-18
updated: 2026-05-18
---

# Anticorruption Layer (ACL)

An anticorruption layer is a translation boundary at the edge of a bounded context that converts an upstream system's model into the downstream context's own model. The downstream's domain concepts, language, and types remain "uncorrupted" — they never directly express the upstream's structures or terminology.

The pattern was named by Eric Evans (→ [[sources/domain-driven-design]] ch. 14) who observed that when integrating with legacy or foreign systems, the path of least resistance is to let the upstream's model bleed into the downstream code — producing a "corrupted" model that is a patchwork of two incompatible languages.

## The Problem It Solves

Without an ACL, every place a downstream service calls an upstream service tends to import that service's language into the downstream's code:

```
// Without ACL — upstream's LegacyCustomer leaks into the domain
LegacyCustomer lc = legacyApi.getCustomer(id);
order.setCustomerId(lc.getCustNo());          // upstream naming
order.setAddress(lc.getAddrLine1() + "...");  // upstream structure
```

After enough of this, the downstream's code is a translation layer masquerading as a domain model. Its own language is obscured by the upstream's.

With an ACL:

```
// With ACL — upstream model translated at the boundary
Customer customer = acl.getCustomer(id);      // downstream's own type
order.setCustomer(customer);                  // downstream's language
```

The ACL owns the translation. Everything inside the bounded context works exclusively with the downstream's model.

## Structure (Evans)

Evans implements the ACL using two classical patterns (→ [[sources/domain-driven-design]] ch. 14):

- **FACADE**: belongs to the upstream system's context; provides access points in the upstream's own terminology and hides the foreign system's complexity. The FACADE is narrow — it exposes only the parts of the upstream that the downstream needs.
- **ADAPTER**: translates between the FACADE's interface (upstream language) and the ACL's interface (downstream language). This is where type mapping, field renaming, structural transformation, and concept alignment occur.

The ACL's public-facing side exposes **domain SERVICES** in the downstream's own language. Callers inside the bounded context see only the downstream's model — they are unaware that any foreign system exists.

The ACL can be **bidirectional**: translating upstream requests into the downstream's model on the way in, and translating the downstream's responses into the upstream's expected format on the way out.

**Classic failure mode**: hiding the ACL inside the UI layer. This makes it invisible to the architecture — other parts of the system may bypass it and access the upstream directly, allowing the upstream's model to corrupt additional areas.

## When to Use

From Khononov (→ [[sources/learning-domain-driven-design]] ch. 4):

1. **The downstream contains a core subdomain.** Core subdomains are competitive assets; their models require maximum care. Polluting a core subdomain's model with a foreign system's concepts is a strategic mistake that compounds with every feature added.
2. **The upstream model is messy, legacy, or inefficient.** The upstream may use technical IDs where the domain needs natural keys, denormalised structures where the domain needs objects, or terminology that conflicts with the downstream's ubiquitous language.
3. **The upstream contract changes frequently.** When the upstream evolves, the ACL contains the impact. Without it, every upstream change propagates directly into the downstream's domain model.

## ACL vs Conformist: The Fundamental Trade-off

The Conformist pattern is the ACL's alternative when the downstream accepts the upstream's model directly with no translation. The choice:

| | Conformist | Anticorruption Layer |
|---|---|---|
| Translation cost | None | One-time build + ongoing maintenance |
| Domain model purity | Upstream model bleeds in | Downstream model stays clean |
| Upstream change impact | Propagates into domain | Contained at the ACL boundary |
| Appropriate when | Upstream model is adequate and the interface is large; upstream is a well-designed generic (e.g., auth provider) | Core subdomain; messy or frequently-changing upstream |

Evans' note: Conformist is "emotionally unappealing" but genuinely appropriate more often than teams admit. When the upstream model is an industry standard, or is adequate for the downstream's needs, the ACL adds cost with little benefit. The key question: **does the upstream's model conflict with or degrade the downstream's ubiquitous language?** If not, Conformist is the right choice.

## ACL vs Open-Host Service: Who Does the Translation?

Both patterns achieve model isolation between bounded contexts. They differ in which side carries the translation cost:

| | Anticorruption Layer | Open-Host Service |
|---|---|---|
| Who translates | The **consumer** (downstream) | The **supplier** (upstream) |
| When to use | Upstream cannot or will not adapt; legacy systems | Upstream serves many consumers; supplier team invests in consumer ergonomics |
| Cost distribution | Each consumer pays separately | Supplier pays once; all consumers benefit |

If multiple consumers all need to translate the same upstream model, Open-Host Service is more efficient — the supplier does the translation once in a published language. If the upstream is a legacy system or has no incentive to adapt, each consumer must build their own ACL.

## Implementation Approaches

**Synchronous (stateless proxy)**: the ACL is a facade service or library that wraps outbound calls to the upstream. Requests from domain code are translated into upstream calls; responses from the upstream are translated into downstream domain objects before returning. No state is accumulated between calls.

**Asynchronous (message translator)**: the ACL is a separate process that subscribes to the upstream's event stream, translates each event into the downstream's event schema, and publishes to a downstream-owned topic. The downstream never sees the upstream's event format. This is the pattern Bellemare calls a *data liberation* transformer (→ [[sources/building-event-driven-microservices]]).

**Dedicated service vs in-process layer**: for complex translation logic (stateful aggregation, joining multiple upstream sources), a dedicated ACL service is appropriate. For simple field mapping, an in-process adapter layer is simpler and avoids the operational overhead of an additional service.

## ACL in Migration Contexts

The ACL is a core mechanism in monolith decomposition. During a Strangler Fig migration (→ [[patterns/strangler-fig]]), an ACL-like facade is placed at the monolith boundary. As the new bounded context grows, traffic redirects from old to new behind the facade. The ACL prevents the new implementation from inheriting the monolith's model — the new bounded context develops its own clean language from the start.

Building evolutionary architectures recommends building ACLs "just in time" — at the point of extracting a capability from a monolith or integrating a third-party service — rather than speculatively (→ [[sources/building-evolutionary-architectures]]).

> The ACL shrinks as migration progresses: as each part of the legacy system is replaced, the ACL's translation for that part is removed. When the legacy system is fully replaced, the ACL disappears entirely.

## What the ACL Does Not Do

The ACL is a translation boundary, not a validation layer or a data transformation pipeline. Concerns it should not absorb:

- **Business logic**: if the translation requires domain decisions ("is this customer active?"), those decisions belong in the domain, not the ACL.
- **Orchestration**: the ACL should not call multiple upstream services and combine results; that is an application service or BFF responsibility.
- **Error handling policy**: the ACL can translate upstream error codes into domain exceptions, but whether to retry, compensate, or fail is the caller's policy.

Keeping the ACL thin prevents it from becoming a "big ball of mud" translation service that accumulates concerns over time.

## Related Pages

- [[patterns/context-map]] — the ACL is one of the six integration patterns in the context map vocabulary; full pattern group descriptions including Open-Host Service and Conformist
- [[concepts/bounded-contexts]] — the unit the ACL protects; core vs generic vs supporting subdomain distinction drives the ACL decision
- [[concepts/ubiquitous-language]] — the ACL prevents a foreign ubiquitous language from bleeding into the local one
- [[patterns/strangler-fig]] — the ACL as a migration facade; the ACL shrinks as the legacy is replaced
- [[concepts/evolutionary-architecture]] — "build anticorruption layers JIT"
- [[patterns/business-logic-patterns]] — anticorruption layers are associated with adapters for external integration of generic subdomains
