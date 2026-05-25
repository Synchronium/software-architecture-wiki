---
title: "Observability"
type: concept
tags: [observability, logging, tracing, telemetry, distributed-systems, debugging]
sources: [understanding-distributed-systems, monolith-to-microservices, release-it]
created: 2026-05-14
updated: 2026-05-19
---

# Observability

## Definition

Observability is a set of tools that provide granular insights into a distributed system in production, enabling operators to understand emergent behaviours and validate hypotheses about root causes. Monitoring detects that something is wrong; observability explains why. (→ [[sources/understanding-distributed-systems]] ch. 32)

Observability is a superset of monitoring: monitoring focuses on tracking health via aggregated metrics; observability adds event logs and distributed traces for diagnosis and debugging.

## Three Telemetry Sources

| Source | Storage characteristics | Primary use |
|--------|------------------------|-------------|
| **Metrics** | High throughput, low dimensionality; time-series stores | Monitoring, alerting, dashboards |
| **Event logs** | High dimensionality, service-specific; columnar/event stores | Debugging individual requests, long-tail behaviour |
| **Traces** | Assembled from spans across services | End-to-end request flow, bottleneck identification |

**Relationship**: metrics and traces are derived views built from event logs — a metric is event log counters aggregated over time into summary statistics; a trace is spans (individual log events) stitched together by trace ID. Some observability backends derive all three from a single structured event stream.

## Event Logs

A log is an immutable, time-stamped sequence of events. Events can be free-form text or structured (JSON, Protobuf). Structured events are represented as key-value bags:

```json
{
  "requestId": "abc-123",
  "failureCount": 1,
  "serviceRegion": "EastUs2",
  "durationMs": 342,
  "timestamp": 1614438079
}
```

Logs provide the richest context for debugging but have a low signal-to-noise ratio and are expensive to ingest and store at scale.

### Best Practices

**One event per work unit**: collate all data for a single request (or message) into one event rather than emitting many small events. This minimises the need for joins during debugging. Implement by passing a context object through the call chain, accumulating fields as the request progresses.

**Include a request ID**: every event must include the unique identifier of the work unit. Cross-service debugging requires joining the caller's event log with the callee's — the request ID is the join key.

**Instrument every network call**: log response time, status code, and error type for every outbound call. This is critical for diagnosing latency and failure in downstream dependencies.

**Sanitize sensitive data**: strip PII and credentials from events before emission. Logs are accessible to a broader set of engineers than user data access controls typically allow.

### Cost Management

- **Log levels** (debug, info, warning, error): controlled by a dynamic knob; increase verbosity for investigation, reduce under normal load.
- **Sampling**: log every nth event. Failed requests should have a higher sampling frequency than successful ones (higher signal-to-noise).
- **Rate-limiting on log collectors**: a single runaway bug can produce catastrophic log volume; the log collector must be able to shed excess load.
- **Trade-off**: aggregating in-memory into metrics reduces cost but loses the ability to drill down into individual events.

**Infrastructure risks**: logging libraries that write synchronously to disk block the calling thread. A full disk causes log loss at best, service failure at worst. Use asynchronous logging libraries.

## Distributed Traces

Tracing captures the complete lifecycle of a request as it flows through multiple services in a distributed system. A trace is a list of causally-related spans.

**Span**: a time interval representing a logical operation or work unit. Contains a bag of key-value attributes: operation name, service name, start/end timestamps, status code, and arbitrary labels.

**Trace propagation**:
1. When a request begins, it is assigned a unique **trace ID**.
2. The trace ID is propagated to every downstream service call, typically via an HTTP header (e.g., `X-Trace-ID` or `traceparent` in W3C format).
3. At every fork in the local execution flow (thread handoff, async continuation) the trace context is also propagated.
4. When a span ends, it is emitted to a collector.
5. The collector assembles all spans sharing a trace ID into a complete trace.

Popular collectors: OpenZipkin, AWS X-Ray. See also OpenTelemetry in [[reference/technology-glossary]].

### Use Cases for Traces

- Debug failures or latency for a **specific user request** (e.g., a customer support ticket).
- Debug **rare issues** affecting a tiny fraction of requests — surfaced by filtering traces on error status.
- Debug issues affecting a **subset of instances** — identified by filtering on instance label.
- **Identify bottlenecks** in the end-to-end request path — the flame graph view shows where time is spent.
- **Resource attribution**: trace which users drive load to which downstream services — useful for billing and fine-grained rate limiting.

### Retrofitting Tracing

Tracing is harder to add to an existing system than metrics or logs because it requires every component in the request path — including third-party frameworks, libraries, and external services — to propagate the trace context. A [[patterns/sidecar-service-mesh]] can handle trace context propagation transparently at the network layer, reducing the amount of application code that must be modified.

## Transparency (Nygard's Framing)

Nygard (→ [[sources/release-it]] ch. 8) uses "transparency" as a broader term than observability: "the qualities that allow operators, developers, and business sponsors to gain understanding of the system's historical trends, present conditions, instantaneous state, and future projections."

**Transparency must be designed in, not added later.** Adding it late is as effective as "adding quality" — possible, but only at much greater cost. A transparent system matures faster because problems become visible and diagnosable; an opaque system drifts into decay.

**System-level visibility > per-instance visibility.** Local visibility only produces local optimisation. Example 1: a retailer optimised a batch pipeline to finish two hours earlier, yet items still appeared on the site at the same time — a parallel process not visible in per-batch metrics was the actual bottleneck. Example 2: cache flushes looked normal on individual servers, but no single server could see that each display event was causing a cross-server cache invalidation — every server was knocking items out of all other servers' caches. Only a system-wide view revealed the pattern.

**Monitoring as exoskeleton, not woven in.** Alert thresholds, rollup policies, and health status decisions change at a different rate than application code. Keep them in the control plane outside the instance. Tightly coupling monitoring to application internals creates maintenance burden and slows both systems.

## Logging Best Practices (Nygard)

**Log level discipline**: ERROR should mean "operator action required." Not every exception is an error. A user entering a bad credit card number is a WARNING at most. A circuit breaker tripping to OPEN is an ERROR — it should not happen under normal conditions and means action is required on the other end of the connection. Database connection failure is an ERROR. NullPointerException is not automatically an ERROR. (→ [[sources/release-it]] ch. 8)

**No debug logs in production.** Debug-level output creates noise that buries real signals. Add a CI build step that automatically strips configs enabling debug or trace levels.

**Voodoo operations**: ambiguous log messages create false temporal correlations that become operational folklore and cause incorrect remediation. Nygard's example: a debug message reading "Data channel lifetime limit reached. Reset required" — meaning the application was about to rotate its own encryption key — coincidentally preceded a database crash. For six months, operators performed weekly database failovers in response to that message. Root causes: (1) the message said "reset required" without specifying the actor; (2) debug logs were left on in production. Unclear log messages create superstitious operations. Write log messages as a human interface under stress, not as developer notes to self.

**Include request/trace IDs in every log message.** When reading thousands of lines post-incident, a grep key saves hours. (Aligned with the "correlation ID" recommendation from [[sources/monolith-to-microservices]].)

## Health Check Design

A health check is more than "is the process running?" It should expose (→ [[sources/release-it]] ch. 8):
- Host IP address(es)
- Runtime/interpreter version (JVM, Go, Python, etc.)
- Application version or commit ID
- Whether the instance is currently accepting work
- Status of connection pools, caches, and circuit breakers

**Go-live transition**: load balancers use health checks not just for crash detection but for startup readiness. When the health check transitions from failing to passing, the instance signals it is ready for traffic. This is safer than a fixed startup delay.

This connects to Nygard's Handshaking stability pattern (→ [[sources/release-it]] ch. 5): when a service is overloaded, it should fail its health check (return 503) so the load balancer stops routing to it — a server-initiated signal rather than waiting for the caller to time out.

## Observability vs Monitoring

| | Monitoring | Observability |
|--|-----------|---------------|
| **Purpose** | Detect failure symptoms | Understand and diagnose root cause |
| **Data type** | Aggregated metrics (time series) | Events, logs, traces |
| **Storage** | High throughput, low dimensionality | High dimensionality, moderate throughput |
| **Primary tools** | Dashboards, SLO burn rate alerts | Log search, trace flame graphs, hypothesis testing |

## Observability in Microservice Migration (Newman)

Newman provides a practitioner hierarchy of observability investments for microservice architectures, ordered by implementation priority (→ [[sources/monolith-to-microservices]] ch. 5):

**Log aggregation first**: implement a log aggregation system before going to microservices — it is useful from day one and is a litmus test for organisational readiness. "If your organisation struggles to implement a suitable log aggregation system, you might want to reconsider whether you're ready for microservices." Tools: ELK stack (Elasticsearch, Logstash/Fluentd, Kibana), Humio.

**Correlation IDs as the foundation**: generate a correlation ID for every inbound request at the API gateway or service mesh. Propagate it through all downstream calls (HTTP header, message payload field, or other mechanism). Use it as the join key in log aggregation queries, and also for tracking choreographed saga instances across services. This is the prerequisite for distributed tracing.

**Distributed tracing for latency**: distributed tracing tools (Newman recommends Jaeger) assemble the timing of each call in a chain, making it possible to identify where latency is occurring. Existing correlation ID infrastructure makes adopting a tracing tool easier — the tracing integration points are already in place. Service meshes can handle trace context propagation transparently.

**Synthetic transactions for production testing**: script fake user behaviour (create controlled test accounts, execute user flows end-to-end, clean up after each run) on a regular automated schedule. This catches issues with real user flows without impacting real users. The Atomist example: scripted fake customer sign-up (GitHub + Slack OAuth) ran periodically to detect issues in a complex multi-step onboarding process before real customers encountered them.

**Observability as open-ended questioning**: the goal of observability is not just pre-defined alerts for known failure modes but the ability to ask unknown questions after unexpected events. Collect enough data (logs, traces, metrics) to reason about novel failure modes. Tool chains must support ad hoc querying.

> **Contradiction (perspective difference):** Vitillo (→ [[sources/understanding-distributed-systems]]) provides the theoretical grounding — structured events, one event per work unit, sampling — from a distributed systems researcher's perspective. Newman provides the practitioner priority order (log aggregation → correlation IDs → tracing → production testing → observability) from a migration consultant's perspective. Both are compatible; Newman's is more actionable for teams getting started.

## Related Concepts

- [[operations/monitoring]] — monitoring (SLIs, SLOs, alerts, dashboards) is the first-layer tool; observability extends it
- [[concepts/deployment-pipelines]] — deployment events are annotated in dashboards; distributed traces are a key debugging tool after a rollout
- [[operations/manageability]] — manageability completes the operate-understand-control triad: monitoring detects, observability diagnoses, manageability corrects
- [[reference/technology-glossary]] — OpenTelemetry, Prometheus, Grafana, Jaeger/Zipkin, ELK Stack, AWS X-Ray
- [[patterns/sidecar-service-mesh]] — can propagate trace context transparently; also a source of network-level telemetry
