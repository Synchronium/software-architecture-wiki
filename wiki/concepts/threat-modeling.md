---
title: "Threat Modeling"
type: concept
tags: [security, threat-modeling, api, stride, dread, rate-limiting, owasp]
sources: [mastering-api-architecture, release-it]
created: 2026-05-13
updated: 2026-05-19
---

# Threat Modeling

## Definition

Threat modeling is a structured process for identifying, evaluating, and mitigating security threats to a system before they can be exploited. For APIs, it is the practice of systematically analysing the attack surface — the interfaces, data flows, and trust boundaries — and then prioritising defenses based on the severity and likelihood of each threat.

## Why It Matters

APIs are externally accessible endpoints that expose internal data and logic. They are among the highest-value attack targets in any system. Reactive security — patching after an incident — is far more costly than proactive modeling. Threat modeling integrates security thinking into the design phase, where changes are cheap, rather than into the incident response phase, where they are not.

## OWASP API Security Top 10

The OWASP API Security Top 10 (2019) catalogues the most critical API-specific vulnerabilities (→ [[sources/mastering-api-architecture]] Ch 6):

| Rank | Threat |
|------|--------|
| API1 | Broken Object Level Authorization (BOLA) — accessing resources belonging to another user |
| API2 | Broken User Authentication — weak token validation, no expiry, token leakage |
| API3 | Excessive Data Exposure — returning more fields than the consumer needs |
| API4 | Lack of Resources and Rate Limiting — enabling DoS or brute-force |
| API5 | Broken Function Level Authorization — accessing admin endpoints without privilege check |
| API6 | Mass Assignment — auto-binding user-supplied data to internal object properties |
| API7 | Security Misconfiguration — debug endpoints in production, open CORS, verbose errors |
| API8 | Injection — SQL, NoSQL, command injection via API parameters |
| API9 | Improper Assets Management — undocumented, deprecated, or shadow API versions |
| API10 | Insufficient Logging and Monitoring — enabling attacks to persist undetected |

## STRIDE Framework

STRIDE is a threat classification framework developed at Microsoft. Each letter identifies a threat category and a corresponding security property that must be protected (→ [[sources/mastering-api-architecture]] Ch 6):

| Letter | Threat | Property Violated |
|--------|--------|------------------|
| S | Spoofing | Authentication |
| T | Tampering | Integrity |
| R | Repudiation | Non-repudiation |
| I | Information Disclosure | Confidentiality |
| D | Denial of Service | Availability |
| E | Elevation of Privilege | Authorisation |

STRIDE is applied per-element: each node and data flow on the Data Flow Diagram is evaluated against all six threat categories.

## The Six-Step Threat Modeling Process

(→ [[sources/mastering-api-architecture]] Ch 6)

**Step 1 — Define security objectives**: what must be protected, and why. Align with business risk and regulatory requirements (GDPR, PCI-DSS, etc.).

**Step 2 — Gather information**: map the system's components, trust zones, external interfaces, and data classification levels.

**Step 3 — Decompose the system**: produce a Data Flow Diagram (DFD) showing:
- Processes (circles)
- Data stores (parallel lines)
- External entities (rectangles)
- Data flows (arrows, labelled with data type and direction)
- Trust boundaries (dashed lines separating zones of different trust)

**Step 4 — Identify threats**: apply STRIDE to each DFD element systematically. Each external-facing data flow and process is a candidate for every STRIDE category.

**Step 5 — Evaluate and prioritise (DREAD)**: score each identified threat using DREAD:

```
DREAD score = (Damage + Reproducibility + Exploitability + Affected Users + Discoverability) / 5
```

| Dimension | Question | Score |
|-----------|----------|-------|
| Damage | How severe is the impact if exploited? | 1–10 |
| Reproducibility | How easily can the attack be repeated? | 1–10 |
| Exploitability | How much skill and tooling does it require? | 1–10 |
| Affected Users | How many users or systems are impacted? | 1–10 |
| Discoverability | How easy is the vulnerability to find? | 1–10 |

Threats scoring above a defined threshold (e.g. 7) are treated as high priority.

**Step 6 — Validate**: verify that mitigations are in place and that the model is reviewed whenever the system changes significantly.

## API-Specific Threats

Several OWASP categories deserve particular attention in API threat models:

**Payload injection**: API parameters passed to databases, shell commands, or templating engines without sanitisation. Mitigation: parameterised queries, input validation at the API gateway, OAS schema validation.

**Mass assignment**: accepting all fields of a request body and binding them to a domain object — allowing callers to set fields they should not control (e.g. `isAdmin: true`). Mitigation: explicit allowlisting of writable fields; never bind request bodies directly to domain entities.

**Excessive data exposure**: returning full internal objects and relying on the client to filter. Mitigation: define explicit response schemas; use GraphQL projections or dedicated read-model DTOs to return only needed fields.

**Improper assets management**: undocumented or deprecated API versions that are still live and unmonitored. Mitigation: API lifecycle governance ([[concepts/api-gateway]]) with enforced deprecation and retirement; single OAS per version.

## Rate Limiting Strategies

Rate limiting is the primary mitigation for Denial of Service (STRIDE D) and brute-force attacks (→ [[sources/mastering-api-architecture]] Ch 6):

| Strategy | How It Works | Trade-off |
|----------|-------------|-----------|
| **Fixed window** | Count requests per fixed time bucket (e.g. 100 req/min, reset at :00) | Simple; edge case: burst of 200 at :59–:01 |
| **Sliding window** | Count requests in the last N seconds from now (rolling) | Smooth; more expensive to compute |
| **Token bucket** | Bucket holds N tokens; each request consumes one; tokens refill at a fixed rate | Allows short bursts up to bucket capacity |
| **Leaky bucket** | Requests enter a queue; processed at a fixed rate regardless of arrival rate | Smooth output; latency for bursty workloads |

Token bucket is the most common for API rate limiting because it allows short legitimate bursts (e.g. a mobile app syncing on wake) while capping sustained throughput.

Rate limiting should be enforced at the API gateway layer, not inside individual services, so that it applies uniformly before compute resources are consumed.

## Security Hardening at the Gateway

Beyond the logical threat mitigations, several gateway-level hardening controls are worth making explicit (→ [[sources/mastering-api-architecture]] Ch 6):

**TLS version enforcement**: Always require TLS 1.2 or later. Most commercial gateways default to current versions; weaker versions with known vulnerabilities must be explicitly re-enabled if needed (which should require a documented exception).

**CORS configuration**: Cross-Origin Request Sharing (CORS) allows browsers to permit cross-origin HTTP requests. A permissive CORS configuration is a common security misconfiguration — it can allow a malicious site to make authenticated requests on behalf of the user. Configure allowed origins precisely.

**HTTP header allowlisting**: Reject requests with unknown or invalid HTTP headers rather than silently ignoring them. An attacker can include headers like `X-Assert-Role: Admin` hoping they are forwarded unchecked and used internally to grant elevated privileges.

**Trust-but-verify principle**: Input validation at the API gateway (e.g. via OAS schema validation) is the first line of defence, not the only line. The backend service must still sanitise inputs and use parameterised queries. If the gateway check fails or is bypassed, the service must not be the last-to-fail.

## Friendly Fire DoS

Denial of service attacks do not have to come from malicious actors. As systems evolve, it is possible to accidentally introduce circular dependencies between internal services — Service A calls Service B which calls Service A — creating an infinite request loop under certain conditions. This "friendly fire DoS" can overwhelm both services without any external attacker. Mitigations: rate limiting on internal API calls, circuit breakers ([[patterns/circuit-breaker]]), and error monitoring for unexpected internal request spikes.

## DREAD and DREAD-D

The standard DREAD risk calculation includes a Discoverability dimension (how easy is the vulnerability to find?). However, including discoverability can reward security through obscurity — implying that a vulnerability is lower risk simply because it is harder to find. **DREAD-D** (DREAD minus Discoverability) drops this dimension, reducing the formula to:

```
DREAD-D score = (Damage + Reproducibility + Exploitability + Affected Users) / 4
```

DREAD-D is preferred when the team wants to avoid the temptation to lower-rank a threat simply because it is not yet publicly known. The Common Vulnerability Scoring System (CVSS) — used by NIST to evaluate CVEs — provides an alternative standardised scoring approach for tracking against public vulnerability databases.

## Threat Modeling and the SDLC

Threat modeling is most valuable when integrated into the development lifecycle at the design phase, not as a one-time audit. The model should be revisited:
- When new API endpoints are added
- When trust boundaries change (e.g. an internal API becomes external)
- After any security incident
- On a periodic cadence (e.g. annually for low-change systems)

## OWASP Top 10 for Web Applications (Nygard)

Nygard (→ [[sources/release-it]] ch. 11) covers the web application OWASP Top 10 (2017 list) with an architectural emphasis. Key points beyond what the API-security list already covers:

- **Broken Access Control**: never use sequential database IDs in URLs (enables ID enumeration); return identical 404 for "doesn't exist" and "not authorized to see" — never confirm whether a resource exists to unauthorized callers.
- **"Pie Crust" defence (antipattern)**: authenticate at the perimeter but trust all internal calls freely. Internal services must also authenticate callers; encrypt all traffic even on internal networks (→ [[concepts/zero-trust]]).
- **Components with Known Vulnerabilities**: this was the root cause of the Equifax breach (Struts 2 CVE-2017-5638). Automate CVE checking in the CI pipeline; treat container images as perishable (rebuild from upstream base images rather than patching in-place).
- **Session Management**: fresh session ID on every successful authentication (prevents session fixation); use cryptographically secure PRNGs for session IDs; accept session IDs only from cookies, never URL parameters.

## Related Concepts

- [[concepts/zero-trust]] — zero trust removes implicit trust from the network model; threat modeling identifies what must be explicitly verified
- [[concepts/oauth2-and-authn]] — OAuth2 and JWT are the primary mitigations for STRIDE S (Spoofing) and E (Elevation of Privilege)
- [[concepts/api-gateway]] — the gateway is the enforcement point for rate limiting, input validation, and auth at the API perimeter
- [[concepts/api-design]] — OAS schema validation at the gateway is a first-line defence against injection and mass assignment
- [[concepts/adrs]] — threat model decisions (fail-open vs fail-closed; rate limiting thresholds) should be captured in ADRs
