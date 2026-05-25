---
title: "Build vs Buy vs Adopt (Open-Source)"
type: comparison
tags: [architecture, strategy, ddd, bounded-contexts, subdomains, make-or-buy, vendor, open-source]
sources: [learning-domain-driven-design, domain-driven-design, software-architecture-the-hard-parts, building-evolutionary-architectures, team-topologies]
created: 2026-05-19
updated: 2026-05-19
---

# Build vs Buy vs Adopt (Open-Source)

## The Strategic Question

The build-vs-buy decision is fundamentally a strategic question, not a technical one: **does this capability create competitive advantage?** The answer determines not just the procurement route but the engineering investment, team assignment, and long-term ownership model.

The Khononov subdomain taxonomy (→ [[concepts/bounded-contexts]]) provides the primary framework. Subdomain type maps directly to the sourcing decision:

| Subdomain type | Competitive advantage? | Complexity | Default sourcing decision |
|----------------|----------------------|------------|--------------------------|
| **Core** | Yes | High | Build in-house; assign best engineers |
| **Generic** | No | High | Buy or adopt open-source |
| **Supporting** | No | Low | Build simple in-house, or outsource |

This taxonomy makes the decision tractable: the question is not "can we build it?" (almost always yes) but "should we invest our best engineers in building it?" The answer is yes only for core subdomains — capabilities where superior execution is genuinely differentiated.

## Build In-House (Core Subdomains)

Core subdomains are where the company does something *differently* from its competitors. They are:
- **Emergent** — never finished; continuously evolving with the business
- **Hard to copy** — competitive advantage requires high entry barriers
- **Worth sustained investment** — cost of mediocrity is measured in lost market share

In-house implementation is the only viable option for a core subdomain. No off-the-shelf solution can provide competitive differentiation — if a generic solution existed, every competitor would adopt it, eliminating the advantage. Core subdomains require:
- The organisation's best engineers
- Advanced implementation techniques (domain model, event-sourced domain model)
- Direct collaboration between domain experts and developers (ubiquitous language)

> **The in-house imperative is not about pride.** It is about the fact that a competitor who buys the same solution you use cannot be outcompeted on that dimension.

**Signals that a subdomain is core**: the business is still discovering what it wants to optimise; the domain logic is complex and full of business invariants; it changes frequently in ways that reflect market learning.

## Buy or Adopt (Generic Subdomains)

Generic subdomains are problems that are genuinely complex but already solved. Authentication, authorisation, encryption, billing, accounting, payroll, email delivery, SMS — these are hard problems with excellent existing solutions.

Khononov's argument (→ [[sources/learning-domain-driven-design]] ch. 1): the existing solution is almost always **more reliable, more secure, and cheaper** than a bespoke implementation. A specialist vendor or open-source project has invested years of accumulated expertise, security audits, and edge-case handling that a bespoke implementation must replicate from scratch.

**Buy** (commercial SaaS/vendor): appropriate when the problem requires ongoing specialist investment the organisation cannot sustain — compliance, security tooling, payment processing. Operational burden offloaded to the vendor.

**Adopt open-source**: appropriate when the problem is well-understood, the open-source solution has sufficient community and maturity, and the organisation has the capability to operate it. Lower licensing cost but carries operational and upgrade responsibility.

**Heuristic**: "Is it simpler to hack a quick implementation than to integrate an external solution?" If yes, it is probably a **supporting** subdomain (not generic) — genuinely generic problems have mature external solutions that are worth the integration cost.

### Hidden costs of buying

Buying is not free:

- **Integration complexity**: every external system requires an integration point, usually an [[patterns/anti-corruption-layer]] (ACL) to protect the internal domain model from the vendor's data model.
- **Vendor lock-in**: the extent to which the vendor's API, data model, or contract has bled into internal code determines how costly a future switch is.
- **Customisation ceiling**: vendor solutions are optimised for the common case. Business requirements that deviate from the common case require workarounds, integrations, or compromise.
- **Upgrade risk**: vendor upgrades can break integrations; maintaining compatibility is a recurring cost.
- **Loss of control**: outages, pricing changes, and product discontinuations are outside the organisation's control.

The ACL pattern is the primary mitigant for vendor lock-in: translating the vendor's model at the boundary keeps the vendor's concepts out of the internal domain. If the ACL is well-maintained, switching vendors requires rewriting the ACL — not the domain.

## Build Simple (Supporting Subdomains)

Supporting subdomains have simple logic — typically CRUD operations, ETL transformations, or basic data management — that supports the core but provides no competitive advantage. No mature off-the-shelf solution exists (otherwise they'd be generic subdomains), but the simplicity means the build cost is low.

Supporting subdomains:
- Can be implemented with simple patterns (transaction script, active record)
- Can be assigned to junior engineers or outsourced
- Do not require advanced architectural techniques (DDD domain model, event sourcing)
- Should not receive the same investment as core subdomains

**Anti-pattern**: applying domain model and full DDD tactical patterns to a supporting subdomain. Over-engineering supporting subdomains diverts engineering capacity from the core and produces unnecessary complexity (→ [[patterns/business-logic-patterns]]).

## Evaluating the Options: A Framework

| Factor | Favours build | Favours buy | Favours open-source |
|--------|--------------|-------------|---------------------|
| Competitive differentiation | Yes | No | No |
| Existing mature solutions | No | Yes | Yes |
| Customisation requirements | High | Low | Medium |
| Security/compliance criticality | Depends | Yes (specialist) | Varies by project |
| Organisational capability to operate | Yes | Low ops burden desired | Yes |
| Long-term cost sensitivity | Depends | Licensing cost | Operational cost |
| Vendor lock-in tolerance | — | Low tolerance → avoid | Medium |
| Time to market pressure | Slow (build takes time) | Fast | Medium |

## The Platform Team as "Build Once, Buy Internally"

Team Topologies (→ [[sources/team-topologies]]) introduces the **platform team** as a third option alongside vendor buy and pure in-house build: build a capability once internally as a self-service platform product, then make it available to all stream-aligned teams.

This is "buy internally" — stream-aligned teams consume a platform service rather than building their own. The platform team invests in operational concerns (provisioning, scaling, monitoring) so that consuming teams can treat them as commodity capabilities.

Platform teams are the appropriate home for generic and some supporting capabilities that are:
- Too sensitive or strategic to outsource to a vendor
- Too expensive for every team to build independently
- Stable enough to be productised for internal self-service

The critical constraint: the platform must be genuinely self-service. A platform that requires the platform team's involvement for every use is a bottleneck, not a platform.

## Subdomain Type Evolution and Sourcing Reversals

Subdomain types are not permanent. All six transitions are possible (→ [[concepts/bounded-contexts]]). Each transition has direct sourcing implications:

| Transition | Sourcing consequence |
|------------|---------------------|
| **Core → Generic** | Competitor or SaaS commoditises the differentiator. Replace bespoke build with off-the-shelf; retire the in-house investment |
| **Generic → Core** | Organisation decides to invest for strategic advantage (Amazon's infrastructure → AWS). Pull capability in-house; apply core-subdomain investment |
| **Supporting → Generic** | Open-source or vendor solution appears for what was bespoke. Switch to the external solution; retire the bespoke implementation |
| **Supporting → Core** | Business logic grows to create competitive advantage. Upgrade engineering investment; apply domain model patterns |
| **Core → Supporting** | Previously complex logic simplified; investment no longer justified. Reduce team allocation; switch to simpler implementation |
| **Generic → Supporting** | Integration cost of external solution exceeds building simple in-house version. Replace vendor with minimal bespoke implementation |

**Evolutionary implication**: sourcing decisions must be revisited as business strategy changes. Building evolutionary architectures (→ [[sources/building-evolutionary-architectures]]) recommends designing for replaceability — particularly at vendor integration points — so that a sourcing reversal does not require rewriting the entire domain. The ACL pattern is the mechanism: a well-placed ACL makes vendor replacement a bounded change.

## Intra-Organisation: Build vs Reuse vs Share

Within an organisation, the same build-vs-buy logic applies to code sharing decisions (→ [[concepts/reuse-patterns]]):

| Reuse mechanism | When appropriate | Analogy |
|-----------------|-----------------|---------|
| Code replication | Tiny, stable utilities | "Free" — low integration cost |
| Shared library | Stable domain code, single language | Internal open-source |
| Shared service | Volatile code, polyglot, high-volume | Internal SaaS |
| Sidecar | Operational concerns only | Platform capability |

The same principle applies: **reuse = abstraction + slow rate of change**. Code that changes frequently should not be shared — the coordination cost exceeds the benefit. Only stable, well-abstracted code is safe to share.

## Related Concepts

- [[concepts/bounded-contexts]] — core/generic/supporting subdomain taxonomy is the primary analytical tool for the build-vs-buy decision
- [[patterns/business-logic-patterns]] — subdomain type determines implementation pattern; generic and supporting subdomains do not need domain model complexity
- [[patterns/anti-corruption-layer]] — the primary mechanism for protecting the internal domain from vendor model leakage; enables vendor replaceability
- [[concepts/reuse-patterns]] — the intra-organisation version of the same decision: shared library vs shared service vs sidecar
- [[concepts/team-topologies-model]] — platform team as the "build once internally" model for generic and operational capabilities
- [[concepts/evolutionary-architecture]] — designing for replaceability at vendor integration points; the six Rs (replace, retire, retain, etc.)
- [[concepts/service-granularity]] — shared code is a granularity integrator; reuse decisions and granularity decisions are coupled
