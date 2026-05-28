---
title: "Messaging"
type: concept
tags: [distributed-systems, messaging, async, decoupling, queues, events, integration]
sources: [understanding-distributed-systems, enterprise-integration-patterns, release-it, foundations-of-scalable-systems]
created: 2026-05-14
updated: 2026-05-28
---

# Messaging

Messaging is a form of indirect, asynchronous communication in which a **producer** writes a message to a **channel** (message broker), and a **consumer** reads from it. Unlike direct request-response, messaging does not require the producer and consumer to be simultaneously available — the channel acts as a buffer.

Messages have a header (metadata: unique message ID, timestamps, source identifier) and a body (content). A message is either:
- A **command**: specifies an operation to be performed by the consumer.
- An **event**: signals that something has happened; consumers decide what to do with it.

## Why Use Messaging

- **Temporal decoupling**: producer can send even if consumer is temporarily unavailable.
- **Load levelling**: channel absorbs traffic spikes; consumer processes at its own pace.
- **Load balancing**: multiple consumer instances can read from the same channel; work distributes naturally.
- **Batching**: most brokers allow fetching N messages per read; batching trades per-message latency for throughput.

## Message Types (EIP)

Hohpe & Woolf classify messages by the *intent* the sender has for the receiver (→ [[sources/enterprise-integration-patterns]] ch. 5):

| Type | Receiver action | Channel | Example |
|------|----------------|---------|---------|
| **Command Message** | Execute an operation | Point-to-Point | SOAP RPC request |
| **Document Message** | Process data however you like | Usually Point-to-Point | SOAP reply; purchase order |
| **Event Message** | React to a change notification | Usually Publish-Subscribe | Address changed, price updated |

**Document vs Event distinction**: a Document Message's content is important; timing is secondary (use Guaranteed Delivery, not Message Expiration). An Event Message's timing is critical; content may be empty (the message's mere existence signals the change). Message Expiration is useful for events (discard stale events); less so for documents.

## Communication Styles

**One-way messaging**: producer writes to a point-to-point channel; one consumer instance reads and processes it. The consumer deletes the message when done. Fire-and-forget at the producer side, but reliable delivery via the broker.

**Request-response messaging**: producer writes a request with a request ID and a reference to its dedicated response channel. Consumer reads the request, processes it, and writes the response to the producer's response channel tagged with the request ID. Allows async request-response without polling.

EIP identifies two implementation styles for the requestor receiving a reply (→ [[sources/enterprise-integration-patterns]] ch. 5):
- *Synchronous block*: one thread sends the request and blocks as a Polling Consumer awaiting the reply. Simple; fragile on crash (thread state lost). Implies one outstanding request at a time unless using per-thread channels.
- *Asynchronous callback*: request thread sends and registers a callback; separate reply thread invokes the callback with each reply. Enables multiple outstanding requests on a shared reply channel; tolerates requestor crashes (restart the reply thread). Requires a callback mechanism to restore caller context.

**Return Address**: the request message carries the reply channel address in its header (JMS: `JMSReplyTo`; .NET: `ResponseQueue`). Decouples the replier from hard-coding which channel to use — different requestors (or different callback processors within the same requestor) route replies wherever they need them.

**Correlation Identifier**: reply message contains a token matching it to its request (JMS: `JMSCorrelationID`; .NET: `CorrelationId`). Required because async messaging allows multiple outstanding requests with replies arriving out of order. Implementation approaches: (1) copy request's message ID to reply's correlation ID; (2) use a business object ID shared by both request and reply (allows processing the reply without re-reading the request); (3) maintain a requestor-side map of request IDs to business object IDs.

**Broadcast messaging**: producer writes to a publish-subscribe channel; all subscribed consumer instances receive a copy. Used for notifications and event fanout. (Related to the outbox pattern → [[patterns/outbox-pattern]])

## Channel Types

| Type | Delivery | Use case |
|------|----------|----------|
| Point-to-point | One consumer instance receives each message | Task queues, work distribution |
| Publish-subscribe | All consumer instances receive each message | Event notifications, cache invalidation |
| Datatype channel | Single message type per channel | Simplifies consumer code; eliminates type checking |

**Datatype Channel** (Hohpe & Woolf): a channel carries exactly one data type; both producer and consumer agree on the type by virtue of which channel they use. No type-checking required on the consumer side. Variant: *Quality-of-Service Channel* — separate channels for different delivery guarantees (guaranteed-delivery vs. best-effort) on the same logical data type. To demultiplex from a mixed channel into typed channels, use a Content-Based Router; to multiplex from typed channels into one, use a Selective Consumer.

**Publish-Subscribe security:** all subscribers on a pub-sub channel receive all messages. Any authorised subscriber can eavesdrop — relevant when channels carry sensitive data. JMS Topics support *durable* subscriptions (broker stores messages for offline subscribers) and *non-durable* subscriptions (subscriber only receives messages published while connected).

## Publish-Subscribe as Distributed Observer

The Publish-Subscribe Channel implements the Observer pattern in distributed systems, and is significantly simpler than an RPC-based Observer implementation (→ [[sources/enterprise-integration-patterns]] ch. 5-6):

- `Subject.Notify()` becomes "send a message on the channel"
- `Observer.Update()` becomes "receive a message from the channel"
- Attach/detach becomes subscribe/unsubscribe — subject doesn't need `Attach(Observer)` or `Detach(Observer)` methods
- Concurrent notification: subject sends one message; channel delivers copies to all observers concurrently; each observer processes in its own thread — no subject-side threading complexity
- No ORB or remote method infrastructure required
- Reliability: observers that are temporarily unavailable receive queued messages later; Durable Subscriber for observers that must receive even messages published while offline

**Push vs Pull model:**
- *Push*: Event Message carries new state in its body. Subject sends one message; all observers get new state directly. Simple, and often more efficient for distributed notification.
- *Pull*: Event Message body is empty (signals change only). Interested observers follow up with a Request-Reply (Command Message + Document reply via TemporaryQueue) to fetch state. Three messages per notification per interested observer; requires temporary channels. Use when pushing state to all observers (including uninterested ones) is prohibitively expensive.

**Channel design — avoiding channel explosion:** Datatype Channel requires separate channels for different message types. But too many channels is also a problem: low-traffic channels waste resources, confuse subscribers, and require many consumer threads. Strategy: consolidate channels for *related* events going to the *same observers* using a unified message type (e.g., `CustomerChange` with nested `AddressChange` or `CreditRatingChange` elements), and use Selective Consumer for subscribers only interested in specific sub-types. When subscriber populations differ significantly between event types, separate channels make more sense.

## Ordering

Strict message ordering requires coordination — it is not free. Two approaches:

**No ordering guarantee**: simpler broker implementations (e.g., SQS standard queues) make no ordering promise. The broker can scale freely because no coordination is needed between broker nodes.

**Partition-based ordering (Kafka)**: the channel is partitioned by key; each partition is handled by a single broker process and enforces ordering within that partition. Only one consumer process may read from a partition at a time to preserve end-to-end order. Trade-off: a hot partition (too many messages for one consumer) becomes a bottleneck; rebalancing partitions disrupts ordering temporarily.

## Delivery Guarantees and Exactly-Once Processing

Most brokers offer **at-least-once delivery**: a message may be delivered to more than one consumer instance (e.g., if the consumer crashes after processing but before acknowledging, the message is re-delivered). There is no such thing as exactly-once message delivery in a distributed system.

**Simulating exactly-once processing**:
1. Make message processing **idempotent** (→ [[distributed/idempotency]]): processing the same message twice produces the same result as processing it once.
2. Delete the message from the channel **only after processing** is complete.

If the consumer crashes between processing and deletion, the message is re-delivered — but idempotency makes the re-processing harmless.

**Visibility timeout**: while a consumer is processing a message, the message is invisible to other consumer instances for a configured duration. If the consumer crashes, the timeout expires and the message becomes visible again for another instance to pick up.

## Guaranteed Delivery

Persists every message to a durable local datastore (disk) on the sending machine immediately on send — the send operation does not complete until the message is durably stored. The broker then forwards the persisted message to the next hop and only deletes it from the local store after the next store confirms receipt. This continues hop-by-hop through the delivery chain (→ [[sources/enterprise-integration-patterns]] ch. 4).

Trade-offs: reliability vs. throughput (disk I/O on every message); disk space risk under backlogs; should be disabled during testing. Technology: JMS PERSISTENT delivery mode; .NET transactional queues.

## Handling Failures

### Invalid Message Channel vs. Dead Letter Channel

These are distinct — the difference is *who* decides a message is undeliverable and *why* (→ [[sources/enterprise-integration-patterns]] ch. 4):

| | Invalid Message Channel | Dead Letter Channel |
|-|------------------------|---------------------|
| Who decides | The consuming application | The messaging system infrastructure |
| Why | Message cannot be parsed, validated, or processed by this consumer | Message could not be delivered at all (no channel, TTL expired, no matching consumer) |
| Scope | Receiver-context-dependent (same message may be valid for another consumer) | System-level failure, independent of consumer logic |
| Use for | Messaging/parsing errors | Infrastructure failures |
| Not for | Application-level errors (e.g., payment declined) | Application-level errors |

### Dead Letter Channel

When a message consistently fails processing, retrying it indefinitely wastes consumer resources and blocks the queue. Solution:
1. Track delivery count (broker stamps a counter, or consumer maintains it).
2. When delivery count exceeds the maximum retry limit, move the message to a **dead letter channel** instead of deleting it.
3. A human inspects dead letter messages, diagnoses the root cause, fixes it, and requeues the messages for reprocessing.

Dead letter channels prevent poison messages from polluting the main channel while ensuring no data is lost.

### Poison Message Isolation

A single producer emitting consistently-failing messages can degrade the consumer and build up a backlog. If messages are tagged with a source identifier, the consumer can:
- Route messages from the offending source to a low-priority secondary channel.
- Process the secondary channel less frequently (e.g., once per minute vs. continuously).

This limits the blast radius of a single bad producer without dropping its messages.

## Messaging Infrastructure Patterns

**Messaging Bridge** (Hohpe & Woolf): connects two different messaging systems. A Messaging Bridge is a pair of Channel Adapters where the "application" being adapted is itself a messaging system. Necessary because JMS standardises the client API but not interoperability between vendor implementations — two JMS-compliant brokers cannot natively route messages to each other without a bridge (→ [[sources/enterprise-integration-patterns]] ch. 4).

**Message Bus** (Hohpe & Woolf): the architectural pattern that assembles messaging components into a coherent integration backbone. Three required elements:
1. *Common communication infrastructure*: the messaging system with routing.
2. *Adapters*: Channel Adapters that connect each application, plus Service Activators that expose application functions as callable services.
3. *Common command structure*: a Canonical Data Model and shared command vocabulary all applications use.

With a Message Bus, applications can be added or removed without modifying existing participants — the bus is the integration contract. Request channels on the bus serve as a service directory, making the Message Bus the foundation of a service-oriented architecture. The Enterprise Service Bus of the 2000s was an over-engineered realisation of this pattern that centralised too much business logic and became a political bottleneck (→ [[styles/soa-architecture]]).

## Backlogs

A messaging channel has two modes:
- **Steady state**: arrival rate ≤ deletion rate; everything is fine.
- **Backlog mode**: arrival rate > deletion rate; a backlog builds up.

Backlogs compound: the longer the backlog, the more time it takes to drain even after the underlying cause is fixed. Common causes:
- More producer instances come online / producer throughput increases.
- Consumer throughput degrades (slow processing, resource exhaustion).
- Poison messages repeatedly consume consumer capacity before ending up in dead letter.

**Monitoring**: measure the age of the oldest unprocessed message (timestamp at write vs. timestamp at read). This gives a leading indicator of backlog formation before queue depth alone would alert.

## Operational Considerations

- A message broker is another stateful service to operate, monitor, and scale. It is a dependency in the availability chain (→ [[operations/availability]]).
- At-least-once semantics means consumers must be idempotent — this is a design constraint on every consumer.
- Consumer scale-out is easy; broker scale-out (partitioning) requires more care around ordering guarantees.
- Brokers must be sized for peak backlog, not just steady-state throughput.

## Processing Patterns (Hohpe & Woolf — Ch 3)

**Pipes and Filters** is the structural pattern for composing message-processing pipelines: independent *filters* (processing components) connected by *pipes* (channels). Each filter has input and output channels, does one thing, and can be unit-tested in isolation. Benefits:
- *Testability*: inject known inputs on a channel; verify outputs.
- *Pipeline concurrency*: all filters process different messages simultaneously — each is an independent process.
- *Parallel processing*: stateless filters can be scaled horizontally with Competing Consumers on a Point-to-Point Channel.
- *Constraint*: stateful filters (aggregators, deduplicators) cannot be trivially parallelised without partitioning by correlation key.

(→ [[styles/pipeline-architecture]] for the architecture style; EIP treats Pipes and Filters as a messaging composition pattern)

**Message Router**: a filter that consumes from one channel and republishes to another based on conditions — without modifying the message body. Variants:
- *Content-based*: routes by message content (most common; UML activity branch equivalent).
- *Context-based*: routes by system state — load balancing, failover.
- *Stateful*: routing depends on prior message history.
- *Dynamic*: rules updated at runtime via Control Bus; router maintains a preference list updated by feedback channels from recipients.

Excessive Message Routers in a network reduce observability — use Message History to trace message paths. Contrast: a Message Router makes routing decisions proactively; a Message Filter reactively discards non-matching messages from all channels.

**Message Translator**: converts format between producer and consumer — the messaging Adapter pattern (GoF). Four translation layers: (1) data structure (object models), (2) data type (field names, units), (3) data representation (XML vs. fixed-width vs. COBOL), (4) transport (protocol). Specialisations: Envelope Wrapper, Content Enricher, Content Filter, Claim Check, Normalizer, Canonical Data Model.

## Composed Routing Patterns (Hohpe & Woolf — Ch 7)

These patterns operate at a higher level than individual routers — they solve problems of *combining* and *orchestrating* messages across multiple steps or recipients.

**Aggregator**: A stateful filter that collects related messages until a completeness condition is met, then emits one aggregated result. Three design decisions: *Correlation* (how to group incoming messages — typically Correlation Identifier or message type); *Completeness Condition* (Wait for All / Timeout / First Best / Timeout with Override / External Event); *Aggregation Algorithm* (select best answer / condense/average numeric fields / collect all for downstream decision). Two variants: *self-starting* (creates a new aggregate on first message) vs. *initialized* (receives upfront count so it can apply precise completeness logic). Maintains a list of closed aggregates to avoid late-arriving messages spawning spurious new aggregates. Can listen on a control channel for manual aggregate purging.

**Resequencer**: A stateful filter that accepts an out-of-order message stream and re-publishes messages in the correct sequence order. Requires a sequence number field per message (distinct from message IDs and Correlation Identifiers — those need not be ordinal). Buffers out-of-sequence messages and flushes when a consecutive sequence is available. Buffer overrun risk: if a message is lost the Resequencer waits indefinitely; mitigation is active acknowledgement (Resequencer advertises available buffer slots, analogous to TCP sliding window). Generating global sequence numbers is harder than generating UUIDs — needs a centralised counter; best done in the Splitter if messages originate from one.

**Composed Message Processor**: A composite of Splitter + Content-Based Router + Aggregator. Splits a composite message into sub-messages, routes each to the appropriate processor, and reaggregates responses into a single result message. Appears as a single input/output filter to the surrounding pipeline — the internal fan-out is encapsulated.

**Scatter-Gather**: Broadcast variant of Composed Message Processor. Instead of splitting the message, it sends the complete message to multiple recipients via Recipient List (known recipients) or Publish-Subscribe Channel (open bidding — any interested party responds). Aggregates responses. Harder than Composed Message Processor to size the Aggregator's completeness condition because the number of respondents may not be known when using P/S broadcast.

**Routing Slip**: Precomputes the processing route and attaches it to the message as a header field at the start. Each processing component reads the next step from the slip and forwards the message onward — no return to a central router between steps. Efficiency: messages traverse only required steps, not every possible step. Limitation: the route is fixed upfront and linear — cannot branch based on intermediate results. For dynamic branching or parallel steps, use Process Manager. Carries process state in the message (lost if the message is lost). Use cases: (1) binary validation chains; (2) per-partner stateless transformation sequences; (3) sequential data-gathering steps before a decision.

**Process Manager**: A central component that maintains the state of a multi-step distributed process and determines the next step after each intermediate result. Hub-and-spoke architecture: processing units send results back to the Process Manager, which dispatches the next step. Supports branching, forking (parallel steps), joining, and route changes based on intermediate results. Key design points:
- *Process definition vs. instance*: one definition, many concurrent instances (class vs. object).
- *State storage*: each instance stores current step + intermediate data, so processing units don't carry context.
- *Correlation*: Manager includes a Correlation Identifier in outbound messages; units echo it back so the Manager routes responses to the correct instance.
- *Observability*: centralised state enables real-time reporting ("how many orders await approval?") and debugging.
- *Persistence*: state persisted to a database allows a crashed Manager to be replaced — another instance resumes from stored state.
- *Risk*: central hub-and-spoke can become a bottleneck; parallelising stateless instances mitigates this.

Comparison table:

| | Pipes & Filters | Routing Slip | Process Manager |
|-|-----------------|-------------|-----------------|
| Complex flow | Yes | Linear only | Yes |
| Change flow easily | No | Yes | Yes |
| Central failure point | No | Potential | Potential |
| Runtime architecture | Distributed | Mostly distributed | Hub-and-spoke |
| Reporting & admin | None | Admin only | Admin + reporting |

**Message Broker (as architectural pattern)**: Assembles a set of routing components into a coherent integration backbone. Solves "integration spaghetti" — the N×(N-1) direct channels that emerge when every application connects to every other. Internally composed of Content-Based Routers, Recipient Lists, etc. Risk of becoming a single bottleneck; mitigations: multiple stateless instances competing on a P2P input channel; broker hierarchy (local brokers for intra-subnet, central broker for cross-subnet). Typically uses a Canonical Data Model internally to avoid N×(N-1) translators. Contrast with Message Bus (→ above): Message Bus is the architectural pattern assembling infrastructure + adapters + canonical structure; Message Broker is the routing component within it.

## Message Transformation Patterns (Hohpe & Woolf — Ch 8)

Specialisations of the Message Translator pattern. Message transformation is a metadata problem: integration solutions operate on two parallel systems — actual data and the metadata describing its format.

**Envelope Wrapper**: Adapts application messages to comply with messaging infrastructure requirements (required headers, encryption, security credentials). The application payload becomes the body; infrastructure-required fields become the outer envelope. Multiple wrappers are chained symmetrically (wrap on send, unwrap on receipt), analogous to TCP/IP/Ethernet protocol layers. A body field can be "promoted" to the outer header when routers need to inspect it for routing decisions. SOAP is a canonical example of envelope wrapping.

**Content Enricher**: Adds missing data to a message by fetching it from an external source. Three data sources: (1) *computation* from existing fields (ZIP→city+state); (2) *environment* (timestamp from OS); (3) *another system* (customer SSN from CRM). The enricher's interaction with the external source is inherently synchronous — a synchronous protocol (HTTP, ODBC) typically outperforms async messaging here. Pattern for efficiency: pass only reference IDs (customer ID) through intermediate steps; insert a Content Enricher just before the consumer that needs the full record, avoiding carrying large data through all intermediate routers.

**Content Filter**: Removes unneeded or sensitive data. Use cases: (1) *security* — strip fields the requestor is not authorised to see; (2) *simplification* — reduce large industry-standard XML formats (RosettaNet, ebXML) to only the fields needed internally; (3) *flattening* — convert deeply nested tree structures to flat element lists. Multiple Content Filters in parallel act as a static Splitter — each strips everything except one topic area, producing several focused messages from one large message.

**Claim Check**: Stores large or sensitive data in a persistent datastore and replaces it in the message with a reference key. Reduces marshalling overhead for data that only the final consumer needs. Key selection: prefer a dedicated abstract key (not message ID — dual semantics; not business key unless downstream components should know what it represents). Data lifecycle options: read-once delete (highest security), expiry-based GC, or never delete (if the datastore is a business system of record). Security use: send only the Claim Check key to external parties — they cannot access the full data without a valid key; expired or invalid keys are blocked at the Content Enricher. A Process Manager serves as a natural Claim Check, storing per-instance data and sending only relevant subsets to each external step.

**Normalizer**: Routes each incoming message format to a dedicated Message Translator that converts it to a common output format. Composed of a Message Router (detects format; routes) + per-format Message Translators. Format detection: type specifier header (ideal), XML root element name, XPath expressions, filename conventions (for file-based B2B). One Translator can serve multiple partners if formats are compatible or transformations are sufficiently generic (XPath handles variation well).

**Canonical Data Model**: A shared, application-independent data format that all applications translate to and from. Reduces N×(N-1) translators (direct pairwise translation) to 2N (each application needs only two: to-canonical and from-canonical). Adding any new application requires exactly 2 new translators regardless of how many applications already participate. Trade-off: *double translation* overhead increases latency per message; stateless translators can be parallelised to compensate. Design guidance: scope the canonical model to the data that participates in messaging only — it need not cover entire application data models. Application-private messages (between an application and its own translator) must not be consumed by other components — only the canonical-format output is "public." Political value: forces agreement on shared business terminology, resolving semantic dissonance where different applications use different names for the same concept.

## Messaging Endpoints (Hohpe & Woolf — Ch 10)

Endpoint patterns govern how applications connect to and interact with messaging channels. Two central concerns: *throttling* (controlling consumption rate) and *transactional compatibility* (some endpoint types interact poorly with Transactional Clients).

**Messaging Gateway**: Encapsulates the messaging API from application code; exposes a domain-specific interface. Two variants: *blocking* (thread blocks until reply; simple; one outstanding request per thread) and *event-driven* (callback on message arrival; no blocking thread; multiple concurrent requests). ACT (Asynchronous Completion Token) pattern: attach an opaque token to the outbound request; the reply carries it back, restoring caller context without server-side state. Gateways can chain (one wraps another adding capabilities). Use Service Stub for testing in isolation.

**Messaging Mapper**: Separates domain objects from messaging infrastructure code. Neither layer knows about the Mapper. Triggered via Observer/events on domain state changes. Contrast with Message Translator: Translator converts between two message formats; Mapper converts between an in-memory domain object and a message.

**Transactional Client**: Allows the application to control messaging transaction boundaries externally, coordinating messaging operations with other resources (databases, workflow engines) in a single ACID transaction. Four scenarios: (1) Send-Receive pairs (receive + send reply atomically); (2) Message Groups (send/receive a set atomically); (3) Message/Database coordination (receive + update DB); (4) Message/Workflow coordination (acquire work item + send request; receive reply + complete work item). Caveat: works poorly with Event-Driven Consumers — the consumer commits receipt before the application examines the message, blocking rollback.

**Polling Consumer**: Consumer explicitly requests messages when ready; blocks until a message arrives (synchronous receiver). Throttling mechanism: limit polling threads to bound consumption rate. One thread can monitor multiple channels using `receiveNoWait()`. Works well with Transactional Clients; can implement a Message Dispatcher.

**Event-Driven Consumer**: Messaging system invokes a callback when a message arrives (asynchronous receiver). No thread runs between arrivals — efficient when the channel is often empty. Limitation: poor compatibility with Transactional Clients in standard JMS (the callback cannot throw a checked exception, so transaction rollback on error is unreliable).

**Competing Consumers**: Multiple consumer instances on a single Point-to-Point Channel; each in its own thread. Messaging system ensures each message is delivered to exactly one consumer. Enables horizontal scaling without changing sender or channel; can span processes and machines. Only works with Point-to-Point (Pub-Sub would duplicate messages). Transactional Clients can be inefficient if the broker allows multiple consumers to begin consuming the same message — first commit wins, others waste effort.

**Message Dispatcher**: Single consumer (Dispatcher) reads from the channel and distributes each message to a specialised Performer running in the same process. GoF Reactor analogy (POSA2). Enables per-type specialisation and a default/unmatched path (to Invalid Message Channel) without requiring messaging system support for Selective Consumer. Cannot distribute across processes or machines (use Competing Consumers for that). Recommended: Dispatcher as Polling Consumer (Transactional Client-compatible); Performers as event-driven callbacks.

**Selective Consumer**: Consumer filters messages by a selection value set in the message header by the sender. Messages not matching remain on the channel for other consumers. Makes one channel behave like multiple Datatype Channels dynamically. Comparison — vs. Message Filter: Filter prevents unwanted messages from reaching any consumer's channel; Selective Consumer leaves them available to others. Vs. Content-Based Router: CBR is static (new channel per type); Selective Consumer is dynamic (change consumer criteria at runtime). Security caveat: criteria are not enforced by messaging ACLs — a consumer can widen its criteria to read unauthorised messages. Use separate Datatype Channels for true isolation.

**Durable Subscriber**: A Pub-Sub subscriber that retains its subscription while disconnected, so messages published during disconnection are queued and delivered on reconnection. Three states: *active* (connected), *inactive* (disconnected but subscribed), *unsubscribed* (explicitly terminated — no messages saved). Use for subscribers that must not miss any events (databases, audit logs). Risk: an inactive subscription that is never explicitly unsubscribed accumulates messages indefinitely — use Message Expiration to bound storage.

**Idempotent Receiver**: Designs receivers to safely process the same message multiple times — necessary because at-least-once delivery can produce duplicates (lost acknowledgement → retransmit; distributed transaction failure → resend to all recipients). Two approaches: (1) *Explicit de-duplication* — maintain a history of received message IDs; discard duplicates; size the history to the sender's outstanding-message window (TCP sliding window analogy); do not overload business keys as message IDs (dual semantics break when business requirements change). (2) *Idempotent message semantics* — express absolute state ("set balance to $110") not relative operations ("add $10"), so re-processing is harmless.

**Service Activator**: Adapter from messaging to a service-layer operation. Receives a request message, extracts parameters, and invokes the service synchronously — the service has no knowledge of messaging. Enables the same service to be invoked via multiple communication styles without changing the service. Can be one-way or Request-Reply. If the service is transactional, the Activator should be a Transactional Client so message consumption and service execution share the same transaction. Related to Half-Sync/Half-Async (POSA2).

## System Management Patterns (Hohpe & Woolf — Ch 11)

Patterns for monitoring, controlling, and testing distributed messaging solutions. Loose coupling and asynchronicity that make messaging powerful also make it hard to observe and debug ("architect's dream, developer's nightmare" — Fowler). Two monitoring levels: *system management* (header-level: throughput, routing, component health) and *Business Activity Monitoring* (payload-level: business metrics).

**Control Bus**: Separate messaging subsystem for management traffic. Each component connects to both the application message flow and the Control Bus. Control bus message types: (1) *Configuration* — dynamic routing table updates, timeout changes, channel address changes without file deployment; (2) *Heartbeat* — periodic "alive" messages with metrics; (3) *Test Messages* — active synthetic probes (heartbeat = alive; test message = functioning correctly); (4) *Exceptions* — centralised error routing and alerting; (5) *Statistics* — throughput and latency metrics (lower-priority, non-guaranteed channels). A live console aggregates all of these.

**Detour**: Content-Based Router controlled via the Control Bus. In normal state it passes messages directly to the destination; when the Control Bus activates the detour, it routes messages through additional steps (validation, logging, debugging). Analogous to assert statements in debug vs. release builds. Multiple Detours can be activated/deactivated simultaneously via Pub-Sub on the Control Bus.

**Wire Tap**: Fixed Recipient List with two output channels inserted into an existing channel. Publishes the unmodified message to both the primary channel and a secondary "tap" channel for observation/logging. Non-intrusive — does not modify producers or consumers. Caveat: re-publishing creates a new message with a new ID and timestamps, breaking Correlation Identifier schemes that rely on message IDs. Cannot alter messages — use Detour for that.

**Message History**: Each message carries a header field containing a list of all component IDs the message has traversed. Every component appends its own ID before forwarding. Enables path tracing and dependency analysis; also detects infinite loops in Pub-Sub event propagation (a consumer checks whether its own ID is already in the history before processing). Challenge for aggregating components: produces one output from multiple inputs — options are hierarchical tree history (complete) or simple list propagating only the "primary" input's history.

**Message Store**: Persistent central store for message data or key fields (message ID + channel + timestamp), populated via Wire Tap or component-side publishing. Enables cross-message reporting (throughput, end-to-end latency) impossible from short-lived individual messages. Body storage challenge: different message types have different schemas — options are per-type tables (indexed, queryable) or generic XML blob (flexible, less searchable). Requires a purging/archiving mechanism as it grows large.

**Smart Proxy**: Intercepts messages sent to Request-Reply services that use dynamic Return Address routing. Stores the original requestor's Return Address, substitutes its own address, and forwards to the service. When the reply arrives, performs analysis (QoS timing, metrics), restores the original Correlation Identifier and Return Address, and routes the reply to the original requestor. Proxy generates its own Correlation ID to avoid collisions when multiple requestors share the reply channel.

**Test Message**: Injects synthetic messages into the live message stream to actively verify that components process messages correctly. Four components: *Test Data Generator* (creates payloads), *Test Message Injector* (tags messages with a special header field — do not overload business fields), *Test Message Separator* (Content-Based Router that extracts test results from the output stream), *Test Data Verifier* (compares actual to expected output; alerts on discrepancy). Return Address can substitute for a separator if the component supports it — test replies route to a dedicated test channel instead of through the system. Limitation: stateful components may process test data as real data.

**Channel Purger**: Removes leftover or unwanted messages from a channel. Basic variant removes all messages; more advanced variants filter by message ID or field criteria. Disposal options: discard (sufficient for test reset) or store for later replay/editing (useful for production incidents). Use cases: test state reset; removing poison messages that cause a component to fail on every startup; clearing residual messages from a debugging session.

## Messaging as an Integration Style (Hohpe & Woolf)

Hohpe & Woolf make messaging's architectural case from an integration perspective (→ [[sources/enterprise-integration-patterns]] ch. 2). Where Vitillo and Kleppmann assume messaging is already chosen, EIP argues *why* messaging should be chosen over the three alternative integration styles.

**Messaging is "a pragmatic reaction to the problems of distributed systems."** Sending a message does not require both systems to be available simultaneously. Furthermore, the async model forces developers to acknowledge that remote work is slower — which encourages high-cohesion (do lots locally) and low-adhesion (do little remotely) component design.

**The core EIP pattern taxonomy** — patterns detailed in later chapters — covers six categories:
- **Messaging Channels** — the conduits: Point-to-Point Channel, Publish-Subscribe Channel, Datatype Channel, Dead Letter Channel, Invalid Message Channel
- **Message Construction** — message types and structure: Command Message, Document Message, Event Message, Request-Reply, Return Address, Correlation Identifier, Message Sequence, Message Expiration
- **Message Routing** — directing messages: Content-Based Router, Message Filter, Recipient List, Splitter, Aggregator, Resequencer, Composed Message Processor, Scatter-Gather, Process Manager, Message Broker
- **Message Transformation** — format conversion: Message Translator, Envelope Wrapper, Content Enricher, Content Filter, Claim Check, Normalizer, Canonical Data Model
- **Messaging Endpoints** — application connection points: Messaging Gateway, Messaging Mapper, Transactional Client, Polling Consumer, Event-Driven Consumer, Competing Consumers, Channel Adapter, Idempotent Receiver, Service Activator
- **System Management** — operational patterns: Control Bus, Detour, Wire Tap, Message History, Message Store, Smart Proxy, Test Message, Channel Purger

**Canonical Data Model**: when N applications each have their own data format, N×N translators are needed if applications translate to each other directly. A canonical (shared public) format reduces this to N translators — each application translates to/from canonical only. Application-private messages should never be consumed by components outside the owning application.

## Decoupling Middleware and Stability

Nygard (→ [[sources/release-it]] ch. 5) frames the synchronous vs. asynchronous choice as a **stability decision**, not just a coupling decision. Synchronous call-and-response (REST, RPC) propagates back pressure and cascading failures: a slow downstream slows the caller, which slows its callers. Asynchronous messaging decouples in **space** (the caller doesn't need the consumer's address) and **time** (the caller continues immediately; the consumer processes when ready). See [[distributed/backpressure]] for the full treatment of how bounded queues create flow control without thread-blocking, and [[concepts/stability-patterns]] for how this decision composes with other stability patterns.

This is an architectural decision with high switching cost — it cannot easily be retrofitted. Choose asynchronous messaging when: (1) the caller does not legitimately need a synchronous response to proceed; (2) the downstream is prone to slowness or instability; (3) load levelling across time is acceptable.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/understanding-distributed-systems]] | Practical framing: messaging styles (one-way, req-resp, broadcast), broker guarantees, exactly-once processing impossibility, dead letter channels, backlog as bimodal failure mode, poison message isolation (ch. 23) |
| [[sources/designing-data-intensive-applications]] | Deeper treatment of log-based brokers (Kafka), exactly-once fault tolerance via epoch numbers and fencing, stream-stream joins, windowing — emphasises the broker as a durable event log, not just a queue (→ [[streams/stream-processing]]) |
| [[sources/enterprise-integration-patterns]] | Integration-style framing: why messaging beats File Transfer, Shared Database, and RPI on coupling+reliability+timeliness; comprehensive 65+ pattern taxonomy across channels, routing, transformation, endpoints, and management (ch. 1-2) |
| [[sources/release-it]] | Stability framing: synchronous call-and-response amplifies cascading failures; async middleware decouples in space and time; architectural decision with high switching cost (ch. 5) |
| [[sources/foundations-of-scalable-systems]] | Scalability framing: competing consumers as primary scale-out mechanism; push vs pull (push preferred — consumer controls rate via thread pool size); data safety as a three-lever trade-off (publisher confirms + persistent queues + manual ACKs); quorum queues (RAFT) vs mirrored queues for HA; RabbitMQ internals (exchanges, channel pool pattern, 40% memory threshold); DLQ / poison message handling via maxReceiveCount; exactly-once via producer idempotency key + consumer dedup cache (ch. 7) |

> **Contrast:** Vitillo treats messaging as a decoupling mechanism for services; Kleppmann treats it as a durable event log for stream processing; Hohpe & Woolf treat it as the preferred enterprise integration style; Nygard treats the choice as a primary stability lever — four levels of abstraction, all valid.

## Related Concepts

- [[distributed/idempotency]] — required for at-least-once delivery; consumers must handle duplicate messages
- [[patterns/outbox-pattern]] — reliable message publication from within a database transaction
- [[streams/stream-processing]] — log-based brokers (Kafka) as a durable, replayable event store
- [[operations/availability]] — brokers are dependencies; backlog is a form of degraded mode
- [[distributed/partitioning]] — broker channels are partitioned for scale; same trade-offs apply
- [[styles/event-driven-architecture]] — messaging is the backbone of event-driven architectures
- [[concepts/integration-styles]] — messaging as the fourth and preferred integration style

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 23) — one-way/req-resp/broadcast styles; point-to-point vs pub-sub; ordering; at-least-once; visibility timeout; dead letter channel; backlogs; poison message isolation.
- (→ [[sources/understanding-distributed-systems]] ch. 5) — initial introduction of messaging as an API style alongside REST and gRPC.
- (→ [[sources/foundations-of-scalable-systems]] ch. 7) — competing consumers; push vs pull; data safety trade-off (publisher confirms + persistent queues + manual ACKs); quorum queues (RAFT) vs mirrored queues; RabbitMQ internals (exchanges, channel pool, 40% memory threshold); DLQ/poison message isolation; exactly-once via idempotency keys.
