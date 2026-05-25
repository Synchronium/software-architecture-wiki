---
title: "Zero Trust"
type: concept
tags: [security, zero-trust, networking, service-mesh, mtls]
sources: [mastering-api-architecture]
created: 2026-05-13
updated: 2026-05-13
---

# Zero Trust

## Definition

Zero trust is a security model built on the principle of "never trust, always verify." It rejects the assumption that anything inside the network perimeter is safe to trust, and instead requires every request — regardless of source network — to be authenticated, authorised, and encrypted. The model originated with John Kindervag at Forrester Research and is formalised in guidance from NIST (SP 800-207) and the UK's NCSC.

## Why It Matters

Traditional perimeter security is a castle-and-moat model: if you are inside the walls, you are trusted. Cloud environments, remote work, and service mesh architectures make the "inside" increasingly meaningless. An attacker who breaches the perimeter — or a compromised internal service — has lateral movement freedom under the perimeter model. Zero trust eliminates this by requiring verification at every hop regardless of location.

## Zonal Architecture (the Legacy Model)

Before zero trust, enterprise networks used layered zones (→ [[sources/mastering-api-architecture]] Ch 9):

```
Internet
    │
┌───▼───────────────────────────────────────────┐
│ Perimeter Zone (PZ) — firewall, load balancer │
└───┬───────────────────────────────────────────┘
    │
┌───▼───────────────────────────────────────────┐
│ Perimeter Access Zone (PAZ / DMZ)             │
│ — web servers, API gateways, reverse proxies  │
└───┬───────────────────────────────────────────┘
    │
┌───▼───────────────────────────────────────────┐
│ Operational Zone (OZ)                         │
│ — application servers, internal services      │
└───┬───────────────────────────────────────────┘
    │
┌───▼───────────────────────────────────────────┐
│ Restricted Zone                               │
│ — databases, secrets, PII storage             │
└───────────────────────────────────────────────┘
```

Traffic passing through each boundary is inspected; traffic within a zone is implicitly trusted.

**Why this fails in cloud**: cloud workloads run in shared datacenters; network addresses are dynamic; east–west traffic between services does not cross zone boundaries — so a compromised service can freely access other services in the same zone. The zone model provides strong perimeter security but weak lateral containment.

## The Zero Trust Model

Zero trust replaces implicit zone-based trust with explicit, identity-based verification for every request (→ [[sources/mastering-api-architecture]] Ch 9). Core principles (NCSC formulation):

1. **Know your architecture** — map services, devices, and users; you cannot protect what you cannot enumerate
2. **Know your users, services, and devices** — maintain authoritative identity for all entities
3. **Assess your user behaviour, service, and device health** — continuous monitoring, not point-in-time
4. **Use policies to authorise requests** — every access decision driven by policy, not network location
5. **Authenticate and authorise everywhere** — no implicit trust at any hop, including east–west
6. **Focus your monitoring on users, devices, and services** — observability is the verification mechanism at runtime
7. **Don't trust the network** — treat the internal network as hostile as the internet
8. **Choose services designed for zero trust** — select infrastructure that supports mTLS, SPIFFE identities, policy-as-code

## Zero Trust Implementation Stack for APIs

Zero trust for an API platform requires controls at multiple layers (→ [[sources/mastering-api-architecture]] Ch 9):

**Edge layer (north–south):**
- API gateway handles TLS termination and OAuth2 token validation ([[concepts/oauth2-and-authn]])
- Every inbound request carries a verified identity (OAuth2 token or mTLS certificate)
- API gateway enforces rate limiting and scope-based authorisation ([[concepts/api-gateway]])

**Service layer (east–west):**
- Service mesh provides mTLS between every service pair ([[patterns/sidecar-service-mesh]])
- SPIFFE (Secure Production Identity Framework for Everyone) / SPIRE assigns cryptographic identities to workloads; identities are independent of network location
- Consul Intentions or equivalent (OPA, Istio AuthorizationPolicies) enforce service-to-service authorisation by workload identity; default deny-all

**Infrastructure layer:**
- Kubernetes NetworkPolicies restrict which pods can communicate at the network level (defence in depth below the service mesh)
- Secrets management (Vault, AWS Secrets Manager) ensures credentials are not stored in environment variables or config files

**Combined, these layers provide:**
- Authentication: every request carries a verified identity
- Authorisation: every request is checked against a policy before being processed
- Encryption: all traffic encrypted in transit (TLS outbound, mTLS east–west)
- Observability: all requests logged with identity, decision, and outcome ([[concepts/threat-modeling]])

## Multicluster Service Mesh and Hybrid Cloud

When services span on-premises data centers and cloud environments, zero trust must extend across that boundary (→ [[sources/mastering-api-architecture]] Ch 9):

- Service mesh peering connects two clusters under a shared control plane
- mTLS identities are valid across clusters (same certificate authority)
- Services in each cluster are discoverable by services in the other; traffic is encrypted in transit across the WAN link
- This enables incremental cloud migration: on-premises services continue to communicate securely with cloud-resident services without VPN tunnels or perimeter re-architecture

## Zero Trust and Cloud Migration

The six Rs of cloud migration ([[concepts/evolutionary-architecture]]) are more safely executed under a zero trust posture:
- Rehosted or replatformed services retain their SPIFFE identities; authorisation policies travel with the workload
- The strangler fig pattern can be applied at the API gateway level — new cloud services serve traffic while legacy on-premises services still run — without weakening security boundaries

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/mastering-api-architecture]] | Detailed treatment: zonal model critique, NCSC eight principles, implementation stack (service mesh + K8s NetworkPolicies + OAuth2 at gateway), multicluster peering for hybrid cloud. |

## Related Concepts

- [[concepts/oauth2-and-authn]] — application-layer identity and authorisation; the east–west complement is mTLS
- [[concepts/threat-modeling]] — zero trust operationalises the mitigations that threat modeling identifies
- [[concepts/api-gateway]] — the gateway is the zero trust enforcement point for north–south traffic
- [[patterns/sidecar-service-mesh]] — provides mTLS and workload identity for east–west zero trust
- [[concepts/evolutionary-architecture]] — zero trust posture enables safer incremental cloud migration
- [[concepts/adrs]] — zero trust adoption is an irreversible architectural direction warranting a formal ADR
