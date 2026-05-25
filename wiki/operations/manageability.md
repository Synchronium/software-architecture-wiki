---
title: "Manageability"
type: concept
tags: [manageability, configuration, feature-flags, dynamic-config, canary, a-b-testing]
sources: [understanding-distributed-systems, release-it]
created: 2026-05-14
updated: 2026-05-19
---

# Manageability

## Definition

Manageability is the ability to modify a system's behaviour in production without code changes or redeployments. It completes the operational triad alongside monitoring (detect) and observability (diagnose): manageability provides the knobs to correct and control. (→ [[sources/understanding-distributed-systems]] ch. 33)

## Dynamic Configuration

Applications depend on settings that vary by environment (staging vs production) and may contain secrets (database credentials). These should not be hardcoded.

**Decouple configuration from code** by persisting it in a dedicated configuration store (AWS AppConfig, Azure App Configuration). At deploy time, the CD pipeline reads configuration from the store and passes it to the application via environment variables.

**Limitation**: environment-variable–based configuration cannot be changed without redeploying the application. For the application to react to configuration changes at runtime, it must periodically re-read the configuration store during execution and apply changes — e.g., recreating an HTTP handler when its configuration setting changes.

Configuration and infrastructure-as-code (Terraform, Pulumi) should flow through the same deployment pipeline as application code. Configuration changes are one of the leading causes of production incidents (→ [[operations/common-failure-causes]]).

## Feature Flags

Once dynamic configuration is in place, feature flags become straightforward: a configuration setting that enables or disables a feature. Flags enable:

- **Progressive rollout**: release a feature disabled, then enable it for a fraction of instances or users to build confidence before full rollout. Reduces blast radius of bugs.
- **A/B testing**: route subsets of users to different feature variants; measure behavioural impact before committing to one.
- **Emergency kill switch**: disable a misbehaving feature without a rollback.

Feature flags decouple deployment from release — code reaches production (deployed) before users see it (released). This complements [[concepts/deployment-pipelines]] and [[concepts/evolutionary-architecture]].

**Risk**: flag accumulation creates technical debt. Flags should be cleaned up once migration is complete (the Knight Capital incident is the canonical warning: a legacy flag activated production code unexpectedly).

## Relationship to the Operational Triad

```
Monitor  →  detect that something is wrong (SLIs, SLOs, alerts)
Observe  →  diagnose root cause (logs, traces)
Manage   →  correct behaviour (config changes, flag toggles, rollbacks)
```

See [[operations/monitoring]] and [[operations/observability]].

## Command and Control (Nygard)

Nygard (→ [[sources/release-it]] ch. 10) provides a specific checklist of runtime controls every production service should expose. The need for these controls scales with restart time — containers that start in milliseconds need fewer live controls than JVM services that need minutes to warm up.

**Controls to plan for**:
- Reset circuit breakers (without restarting the process)
- Adjust connection pool sizes and timeouts
- Disable specific outbound integrations (the accidental Bulkhead in the Black Friday case study; → [[sources/release-it]] ch. 6)
- Reload configuration
- Start / stop accepting load (for controlled drain before shutdown)
- Feature toggles

**Do not build**: flush-all-cache (causes cache stampede / dogpile); delete-all-data or schema-reset (hazardous in production; these belong in test tooling, not production code). Their presence indicates a breakdown in trust between development and operations.

**Interface design**: admin API over HTTP on a separate port (not exposed to the public). CLI > GUI for long-term production operations — mice cannot be scripted. At fleet scale, use a command queue (pub/sub) so all instances receive the command concurrently rather than sequentially (but add random jitter to prevent dogpile effects from simultaneous cache flushes or reconnects).

## Related Concepts

- [[concepts/deployment-pipelines]] — pipelines read from config stores at deploy time; feature flags decouple deployment from release
- [[operations/observability]] — observability diagnoses; manageability acts on the diagnosis
- [[operations/monitoring]] — monitoring detects when a feature flag or config change degrades an SLO
- [[operations/common-failure-causes]] — configuration changes are a leading failure cause; dynamic config + pipeline governance mitigates this
- [[reference/technology-glossary]] — AWS AppConfig, Azure App Configuration, LaunchDarkly
