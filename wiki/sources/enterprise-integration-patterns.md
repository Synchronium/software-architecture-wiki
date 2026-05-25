---
title: "Enterprise Integration Patterns"
type: source
tags: [integration, messaging, distributed-systems, enterprise]
sources: [enterprise-integration-patterns]
created: 2026-05-15
updated: 2026-05-15
---

# Enterprise Integration Patterns

**Authors:** [[authors/gregor-hohpe]], [[authors/bobby-woolf]]
**Published:** 2003
**Slug:** `enterprise-integration-patterns`

## Overview

Enterprise Integration Patterns (EIP) is the definitive reference for messaging-based integration. Its thesis: enterprise integration is hard not primarily for technical reasons but because of political, semantic, and organisational complexity, and that a shared pattern language allows practitioners to capture and communicate proven solutions to recurring integration problems.

The book is structured as a pattern catalogue with 65+ named patterns organised into categories: integration styles, messaging channels, message construction, message routing, message transformation, messaging endpoints, and system management. The opening chapters establish the problem space and motivation for messaging as the preferred integration approach. The remainder catalogs each pattern with context, problem, solution, consequences, and code examples.

Hohpe and Woolf write from practitioner experience with enterprise middleware, EAI tooling, and messaging-oriented systems. The book predates modern microservices and event streaming but is directly ancestral to both: the patterns it names (Message Broker, Publish-Subscribe Channel, Message Filter, Aggregator, Process Manager, Content-Based Router) appear in contemporary systems under slightly different names but with the same structures.

## Key Claims

- Integration solutions must address eight criteria: application coupling, intrusiveness, technology selection, data format, data timeliness, data vs functionality, remote communication model, and reliability (→ ch. 2)
- Four integration styles exist on a spectrum of sophistication and coupling: File Transfer → Shared Database → Remote Procedure Invocation → Messaging (→ ch. 2)
- Messaging is the preferred integration style because it addresses all eight criteria better than alternatives while acknowledging it is also the most complex (→ ch. 2)
- Loose coupling requires reducing four categories of assumption between parties: platform (internal data representations), location (hardcoded addresses), time (simultaneous availability), and data format (→ ch. 1)
- The enterprise integration problem is fundamentally one of semantic dissonance — different systems represent the same concepts differently — that cannot be solved by XML or common data formats alone (→ ch. 1)
- A Canonical Data Model insulates integration logic from application-specific formats; the trade-off is defining a canonical format that is good enough for all consumers (→ ch. 1)
- Process Managers are the appropriate component for long-running distributed business processes; they store process state and determine next steps (→ ch. 1)
- Smart Proxies enable legacy services to participate in SOA by enhancing them with capabilities they weren't designed for (Return Address, QoS measurement) without modifying the service itself (→ ch. 1)

## Chapter Notes

### Chapter 1 — Solving Integration Problems Using Patterns

Frames the problem space and introduces ~25 patterns via a worked example (WGRUS, an online retailer integrating disparate legacy and packaged applications). The chapter serves as a map to the rest of the book.

**The need for integration:** Enterprises have hundreds of heterogeneous applications because writing large single systems is impractical, best-of-breed vendor selection drives fragmentation, and different teams build things at different times with different technology stacks. Conway's Law is cited explicitly: organisations design systems as copies of their communication structures — integrated systems require cross-functional communication that organisations resist.

**Integration challenges:** (1) corporate politics — integration removes team ownership of a system; (2) business impact — failing integration can cost millions in lost orders; (3) limited control over endpoints — most participants are legacy or packaged apps that cannot be changed; (4) lack of standards — XML and Web Services were hailed as solutions but provide only syntactic, not semantic, interoperability; (5) semantic dissonance — "account" can mean different things across systems, and XML cannot resolve that; (6) operational complexity — monitoring and troubleshooting a distributed integration solution is difficult.

**Six types of integration scenario:** *Information Portals* (aggregate data from multiple sources into one view), *Data Replication* (propagate shared data changes across systems), *Shared Business Functions* (expose functions as services for multi-system reuse), *Service-Oriented Architecture* (service discovery and negotiation via a service directory), *Distributed Business Processes* (a process management component coordinates execution across multiple existing systems), *Business-to-Business Integration* (same as enterprise integration but across organisational boundaries, adding security and standardised data format concerns).

**Loose coupling:** The four categories of assumption that produce tight coupling — and how to remove them:
- *Platform dependency* → use platform-independent data formats (XML, canonical types)
- *Location dependency* → address a logical channel, not a physical machine; DNS gives one level of indirection but is insufficient
- *Temporal dependency* → use a queuing channel so the sender can proceed without receiver availability
- *Data format dependency* → allow transformation inside the channel so format changes require only transformer changes

**Pattern walkthrough (WGRUS):** The chapter introduces the following patterns via the example — enough to serve as a preview before the full catalogue in subsequent chapters:

| Pattern | Role in example |
|---------|----------------|
| Message + Message Channel | Basic transmission unit; channels are logical addresses |
| Channel Adapter | Connects packaged/legacy apps that cannot be modified directly |
| Messaging Gateway | Isolates application code from messaging API details |
| Message Translator | Converts between application-specific and canonical formats |
| Canonical Data Model | Single shared format for the integration bus; reduces N×M translators to N |
| Point-to-Point Channel | One consumer receives each message; channels named WEB_NEW_ORDER, etc. |
| Publish-Subscribe Channel | All consumers receive each message; used for fork (parallel activity) |
| Aggregator | Joins multiple incoming messages into one; implements UML activity join; three decisions: correlation, completeness condition, aggregation algorithm |
| Content-Based Router | Routes message to one of N channels based on message content; equivalent to UML activity branch |
| Splitter | Decomposes one message into N individual messages (order items) |
| Composed Message Processor | Splitter + Content-Based Router + Aggregator combined; common pattern |
| Content Enricher | Adds missing data to a message (adds unique order ID for correlation) |
| Message Filter | Passes only messages matching criteria (billing vs shipping address type) |
| Recipient List + Dynamic Router | Targeted multicast; subscriber-specified routing rules |
| Message Store | Persistent store for message data; enables status tracking without re-carrying data |
| Claim Check | Messages deposit large data in Message Store at intake; retrieve by reference later, reducing payload size |
| Wire Tap | Copies messages from a Point-to-Point Channel to a secondary channel (for Message Store without disrupting primary flow) |
| Process Manager | Central orchestrator for multi-step processes; stores per-process state; drives execution via template; turns individual systems into reusable shared services |
| Return Address | Service consumer specifies reply channel in the request; enables service reuse across different workflow contexts |
| Smart Proxy | Intercepts request+reply to a legacy service to add capabilities it lacks (Return Address support, QoS tracking) |
| Test Message | Injected known-result request to verify service correctness in production |
| Control Bus | Management channel for metrics, health events, and operational data |
| Invalid Message Channel | Dedicated channel for messages that fail validation/routing |
| Datatype Channel | Channel carries exactly one message type; simplifies consumer logic |
| Command Message | Message that instructs receiver to execute an operation |
| Document Message | Message that passes a document for receiver to process as it sees fit (not an instruction) |

**Design observations:** (1) Channel names convey meaning — WEB_NEW_ORDER vs NEW_ORDER vs INVALID_ORDER. (2) Application-private messages should not be consumed by components other than the owning application and its translator. (3) Interface granularity matters: fine-grained interfaces increase coupling (changing one field requires many message changes) but coarse-grained ones reduce flexibility. The right answer is use-case-specific. (4) The choice between propagating data with orders (carry-along) vs. dedicated replication events depends on the packaged application's design constraints, not just performance.

### Chapter 2 — Integration Styles

Formally defines the four integration styles as patterns. Each has the same problem (integrate multiple heterogeneous applications) but different forces and trade-offs. (→ [[concepts/integration-styles]] for the full treatment.)

**File Transfer:** Applications produce files for others to consume at regular intervals. Format transforms handled by integrators. Advantages: universally supported, no extra tooling, strong decoupling. Disadvantages: staleness (data between transfers is out of sync), manual coordination (naming conventions, locks, cleanup), difficulty at high frequency (overhead becomes prohibitive — at which point you effectively have messaging).

**Shared Database:** All applications store shared data in one database with a unified schema. Advantages: consistency, no staleness, SQL is universal. Disadvantages: schema design conflict (meeting needs of all applications is politically and technically very hard), external packages won't share schemas, performance bottleneck under concurrent access, difficult with geographically distributed applications.

**Remote Procedure Invocation:** Each application exposes a procedure interface for others to invoke. Advantages: encapsulation (data stays inside owning application), supports triggering behaviour not just data sharing, familiar semantics. Disadvantages: still tightly coupled (caller knows callee's interface; sequencing creates coupling across systems), synchronous bias (RPCs feel like local calls but behave differently), not resilient to failures. Technologies: CORBA, COM, .NET Remoting, Java RMI, SOAP/WS-*.

**Messaging:** Applications connect to a common messaging system and exchange data and invoke behaviour via messages asynchronously. Advantages: temporal decoupling, location independence, reliable delivery, transformation in transit, supports SOA and data replication scenarios. Disadvantages: async design is less familiar; testing and debugging are harder; lots of glue code; not entirely free of consistency problems (just reduced lag vs. File Transfer).

> The book explicitly advocates Messaging over the other styles for most integration scenarios — not because the others are wrong, but because messaging best addresses the full set of integration criteria. The remaining chapters are dedicated entirely to messaging patterns.

### Chapter 3 — Messaging Systems

Defines the foundational building blocks of any messaging solution: channels, messages, and the structural patterns for chaining components together.

**Message Channel:** The logical address of a destination — a named pipe in the messaging system. Applications connect to channels by name; the messaging system handles routing. Channels are not free (memory/disk per stored message). Most channels are fixed at deployment time; exceptions are reply channels (created dynamically per request) and hierarchical channel namespaces. Channel naming conveys semantics (WEB_NEW_ORDER vs. INVALID_ORDER).

**Message:** The atomic packet of data. Consists of a header (metadata: ID, timestamp, source, destination, priority, expiration, user-defined properties) and a body (the data payload). The message is the unit of transmission across process boundaries — marshalled to bytes before send, unmarshalled on receipt. JMS defines five message types by body type: Text, Bytes, Object (serialised Java), Stream, Map. SOAP uses XML envelope + headers + body.

**Pipes and Filters:** A structural pattern for building message-processing pipelines. A filter is a discrete processing component with input channel(s) and output channel(s). A pipe is the channel connecting two filters. Rationale for this structure:
- *Testability*: each filter can be unit-tested in isolation by providing known inputs and verifying outputs.
- *Pipeline concurrency*: multiple filters process different messages simultaneously because each filter is an independent process/thread.
- *Parallel processing*: stateless filters can be scaled horizontally via Competing Consumers on a Point-to-Point Channel; the filter instances share the load without coordination.
- *Constraint*: stateful filters (e.g., deduplicators, aggregators) cannot be trivially parallelised without partitioning by correlation key.

**Message Router:** A filter that consumes from one channel and republishes to another channel based on the message's content or context — without modifying the message body. Variants:
- *Fixed router*: routing rules hardcoded at deployment.
- *Content-based router*: inspects message content and routes accordingly (most common); equivalent to the UML activity branch.
- *Context-based router*: routes based on system state (load balancing, failover) rather than message content.
- *Stateless router*: each routing decision is independent.
- *Stateful router*: routing depends on prior message history (e.g., prefer previously successful route).
- *Dynamic router*: routing rules can be updated at runtime via Control Bus; the router maintains a preference list and updates it based on feedback channels from recipients.

Predictive routing vs. reactive filtering: a Message Router makes routing decisions proactively; a Message Filter reactively discards non-matching messages from all channels. Excessive Message Routers in a network reduce observability — use Message History to trace message paths.

**Message Translator:** Converts the format of a message from one application's format to another. The messaging-layer Adapter pattern (GoF). EIP identifies four translation layers:
1. *Data structure translation* — different application-level object models (same concept, different fields).
2. *Data type translation* — field names, domains, and units (e.g., currency representation).
3. *Data representation translation* — serialisation format (XML, fixed-width, COBOL-style copybooks).
4. *Transport translation* — protocol differences (HTTP, FTP, SMTP).

Specialisations of Message Translator: Envelope Wrapper, Content Enricher, Content Filter, Claim Check, Normalizer, Canonical Data Model.

**Message Endpoint:** The bridge between an application and the messaging system. The application's code for connecting to, receiving from, and sending to channels. Foundational to the Channel Adapter pattern. Endpoints encapsulate the messaging API so application code can remain ignorant of it.

### Chapter 4 — Messaging Channels

Deep-dives each major channel type, delivery guarantee mechanism, and infrastructure-level integration patterns.

**Point-to-Point Channel:** Exactly one receiver consumes each message. If multiple consumer instances subscribe, they compete for messages (Competing Consumers / load balancing). The producer does not know which consumer will receive the message. Technology: JMS Queue, .NET MessageQueue.

**Publish-Subscribe Channel:** A copy of each message is delivered to all subscribers. Observer pattern at the messaging level. Supports wildcard subscriptions. Security risk: any authorised subscriber can eavesdrop on all messages on the channel — particularly relevant for sensitive data. Technology: JMS Topic. Two subscription modes: *non-durable* (subscriber only receives messages published while connected) vs. *durable* (broker stores messages for offline subscribers).

**Datatype Channel:** A channel carries only one data type — producer and consumers agree on the message type by virtue of the channel they use. Simplifies consumer code (no type-checking needed). Variant: *Quality-of-Service Channel* — separate channels for different persistence levels or priorities (e.g., guaranteed-delivery channel vs. best-effort channel for the same logical data). To demultiplex from a mixed channel to typed channels, use a Content-Based Router. To multiplex from multiple typed channels into one, use a Selective Consumer.

**Invalid Message Channel:** A dedicated channel where a receiver moves messages it cannot process. Distinct from Dead Letter Channel: Invalid Message Channel is receiver-determined (the consumer code decides a message is invalid) whereas Dead Letter Channel is system-determined (the messaging infrastructure could not deliver the message at all). Message validity is receiver-context-dependent — the same message may be valid for one consumer and invalid for another. The Invalid Message Channel is for messaging/parsing errors, not application errors (a payment declining is an application error, not an invalid message).

**Dead Letter Channel:** The messaging system's own "could not deliver" bucket. A message ends up here when: the target channel no longer exists; the message has expired (TTL elapsed); or a Selective Consumer on the receiving channel rejected it and no other consumer accepted it. The infrastructure manages this, records the originating machine, and routes the undeliverable message here. Operators inspect dead letter channels to diagnose infrastructure failures.

**Guaranteed Delivery:** Persists every message to a durable local datastore (disk) on the sending machine immediately upon send — the send operation does not complete until the message is stored. The broker then forwards the persisted message to the next store in the delivery chain, and does not delete it from the local store until the next store has confirmed it. This continues hop-by-hop. Trade-offs: reliability vs. throughput (disk I/O on every message); disk space concern under high-traffic backlogs; should be disabled during testing. Technology: JMS PERSISTENT delivery mode; .NET transactional message queues.

**Channel Adapter:** Connects an application that has no built-in messaging capability to the messaging system. Three integration layers the adapter can hook into:
1. *UI adapter*: screen-scraping the application's user interface (last resort; fragile).
2. *Business Logic adapter*: calling application APIs or exposed components (preferred).
3. *Database adapter*: reading/writing directly to the application's database via SQL triggers or change-data-capture (bypasses business logic — use carefully).

A Channel Adapter alone does not transform data formats; it must be combined with a Message Translator to produce canonical format messages. Variant: *Metadata Adapter* — discovers the message format at runtime from a metadata store, enabling schema-driven integration.

**Messaging Bridge:** Connects two different messaging systems (different vendors, different protocols). A Messaging Bridge is a pair of Channel Adapters where the "application" being connected is another messaging system. JMS standardises the client API but not interoperability between vendor implementations — bridging is necessary when two JMS-compliant brokers cannot natively route messages to each other.

**Message Bus:** The architectural pattern that combines messaging infrastructure into a coherent integration backbone. Three components:
1. *Common communication infrastructure*: the messaging system with routing capabilities.
2. *Adapters*: Channel Adapters that connect each application to the bus, plus Service Activators that expose application functions as services.
3. *Common command structure*: a Canonical Data Model + shared command vocabulary that all applications use.

The Message Bus enables adding or removing applications from the integration without modifying existing participants — the bus is the integration contract. Request channels on the bus act as a service directory, enabling a simple SOA.

> **Connection to SOA failure:** The Enterprise Service Bus of the 2000s was a Message Bus whose scope and complexity grew until political and technical bottlenecks emerged (→ [[styles/soa-architecture]]). EIP's Message Bus is the principled foundation; the ESB was the over-engineered realisation.

### Chapter 5 — Message Construction

Defines patterns for how messages are structured and addressed. Nine patterns covering message intent, large data transfer, time-sensitivity, and format versioning.

**Message intent — three types:**
- *Command Message*: encapsulates a remote procedure call as a message (GoF Command pattern applied to messaging). Receiver should execute the specified operation. Usually sent via Point-to-Point Channel (command should be consumed once). SOAP RPC-style request is an example.
- *Document Message*: passes a data structure to the receiver; the receiver decides what to do with it. Content is important, timing is less so — Guaranteed Delivery usually appropriate, Message Expiration usually not. Usually P2P; P/S creates read-only copies. SOAP document-style message or SOAP reply is an example.
- *Event Message*: announces a state change (Observer pattern via messaging). Usually Publish-Subscribe Channel. Timing is critical, content often minimal (empty body just signals the event). Non-durable subscribers often OK (events are frequent). Message Expiration useful to discard stale events. Push model: event carries new state in message body. Pull model: event body is empty, interested observers follow up with a Command+Reply (Request-Reply) to get state.

**Request-Reply**: two-channel pattern for two-way conversations. Request channel may be P2P or P/S; reply channel is almost always P2P (replies go to the specific requestor, not all subscribers). Two approaches for receiving replies: *synchronous block* (one thread sends and polls as Polling Consumer — simple, but fragile on crash) or *asynchronous callback* (separate reply thread; enables multiple outstanding requests; requires callback mechanism to restore context). Three scenarios: Messaging RPC (Command request + Document reply with return value), Messaging Query (Command request + Message Sequence reply), Notify/Acknowledge (Event request + Document acknowledgment).

**Return Address**: reply channel specified by the requestor in the request message header. Decouples the replier from needing to know which channel to send the reply on — different requestors can route replies to different destinations. Analogous to email reply-to field. JMS: `JMSReplyTo` (type: Destination, not just a string). .NET: `ResponseQueue`. SOAP 1.2: WS-Addressing specification.

**Correlation Identifier**: reply message contains a token that matches it to its corresponding request. Required because messaging is async — requestors may have multiple outstanding requests with replies arriving out of order. Three implementation approaches: (1) copy request's message ID to reply's correlation ID (simplest), (2) use the business object ID from the request (most useful — allows bypassing the request message entirely when processing the reply), (3) maintain a requestor-side map of request IDs to business object IDs (compromise). Stored in the message header (not body). JMS: `JMSCorrelationID`. .NET: `CorrelationId`.

**Message Sequence**: breaks large data too big for a single message into a numbered sequence. Three fields per message: (1) sequence identifier (distinguishes this cluster), (2) position identifier (order within the cluster), (3) size/end indicator (total messages in cluster, or "this is the last message" flag). Use a Transactional Client to send and receive an entire sequence atomically. Incompatible with Competing Consumers (different receivers get different chunks; none can reassemble). Alternative: Claim Check if sender and receiver both have access to shared storage.

**Message Expiration**: TTL specifying when a message is no longer valid. Broker discards or routes unconsumed expired messages to Dead Letter Channel. If a receiver gets a message after its expiration, it should move it to the Invalid Message Channel. Most useful for Event Messages (stale events should be discarded); least useful for Document Messages (content matters more than timing). JMS: `MessageProducer.setTimeToLive()`. .NET: `TimeToBeReceived` and `TimeToReachQueue`.

**Format Indicator**: enables multiple format versions to coexist on the same channel without breaking existing consumers. Three implementations: (1) *Version Number* — a string/number both parties agree on; compact but requires shared knowledge; (2) *Foreign Key* — URL or key pointing to a format schema document in a shared repository; (3) *Format Document* — embedded schema in the message body; self-contained but adds payload overhead. Stored in header for version/key, body for embedded schema.

### Chapter 6 — Interlude: Simple Messaging

A code walkthrough chapter demonstrating patterns from Ch 5 in JMS (Java) and MSMQ (.NET/C#). No new patterns introduced; primary conceptual contribution is the detailed analysis of Observer pattern via Publish-Subscribe and the channel design trade-off.

**Request-Reply in code:** Two classes: Requestor (Polling Consumer — synchronously blocks on `receive()`) and Replier (Event-Driven Consumer — implements `MessageListener`). Requestor sets `JMSReplyTo` (Return Address) on each request; Replier reads the reply destination from the request rather than hard-coding it. Replier sets `JMSCorrelationID` (Correlation Identifier) on reply from request's `JMSMessageID`. Invalid messages moved to the Invalid Message Channel using Correlation Identifier to preserve the original message ID across the resend.

**Publish-Subscribe as distributed Observer:** A Publish-Subscribe Channel implements the Observer pattern. Advantages over RPC-based Observer:
- Notification simplifies to "send a message" / "receive a message"
- Attach/detach simplifies to "subscribe to channel" / "unsubscribe from channel"
- Concurrent notification: one thread publishes; channel delivers copies concurrently; each observer handles its copy in its own thread
- No ORB required; messaging system handles distribution
- Increased reliability: messages queue if observer is unavailable; Durable Subscriber for offline observers

Push vs Pull model in distributed Observer:
- *Push*: subject sends Event Message carrying new state; observer consumes state from message. One message per notification. Simpler.
- *Pull*: subject sends empty Event Message (signals change only); interested observer uses Request-Reply to fetch state (Command request + Document reply via TemporaryQueue). Three messages per notification per interested observer. More complex; requires temporary channels. Use only when push's overhead (sending state to all observers including uninterested ones) is prohibitive.

**Channel design for pub-sub:** Separate channels for unrelated types (Datatype Channel); but channel explosion is a real problem — many low-traffic channels waste resources, confuse subscribers, require many consumer threads. Solution: consolidate related types (AddressChange and CreditRatingChange both fit on a CustomerChange channel using a unified schema with optional nested elements), and use Selective Consumer for subscribers only interested in specific sub-types.

### Chapter 7 — Message Routing

The most extensive chapter in the book. Catalogues all routing patterns in three groups: simple routers, composed routers, and architectural patterns. The chapter introduces an important distinction: *predictive* routing (a router decides proactively) vs. *reactive* filtering (a filter discards non-matching messages).

**Comparison table for routing patterns:**

| Pattern | Inputs→Outputs | State | Key use |
|---------|---------------|-------|---------|
| Content-Based Router | 1→1 | Stateless | Route to one of N consumers |
| Message Filter | 1→0 or 1 | Stateless (or stateful for dedup) | Discard non-matching messages |
| Recipient List | 1→multiple | Stateless | Targeted multicast |
| Splitter | 1→multiple | Stateless | Decompose composite message |
| Aggregator | multiple→1 | **Stateful** | Recombine split/scattered messages |
| Resequencer | multiple→multiple | **Stateful** | Restore ordering after parallel paths |

**Aggregator:** A stateful filter that collects related messages until a completeness condition is met, then emits a single aggregated result. Three design decisions: (1) *Correlation* — how are incoming messages grouped? (typically Correlation Identifier or message type); (2) *Completeness Condition* — when to publish? (Wait for All / Timeout / First Best / Timeout with Override / External Event); (3) *Aggregation Algorithm* — how to distil the collected messages into one? (select best / condense / collect for later evaluation). Two variants: *self-starting* Aggregator (creates a new aggregate on first message arrival) vs. *initialized* Aggregator (receives upfront metadata — e.g., how many sub-messages to expect — enabling smarter completeness conditions). Closed aggregates must be tracked to avoid late-arriving messages starting spurious new aggregates.

**Resequencer:** A stateful filter that accepts an out-of-order stream of messages and re-publishes them in the correct order. Requires a sequence number field per message (distinct from message IDs or Correlation Identifiers). Buffers messages until a consecutive sequence is available to forward. Buffer overrun risk: if a message is lost, the Resequencer waits indefinitely. Mitigation: active acknowledgement (Resequencer tells producer how many buffer slots remain — analogous to TCP sliding window). Alternative: synthesise stand-in messages for gaps (acceptable for lossy data like VoIP).

**Composed Message Processor:** A composite pattern combining Splitter + Content-Based Router + Aggregator. Splits an incoming composite message into individual sub-messages, routes each to the appropriate processor, and reaggregates the responses into a single result. Appears as a single-input/single-output filter to the rest of the system — the internal complexity is encapsulated. EIP notes this as a canonical example of pattern composition.

**Scatter-Gather:** Broadcast version of Composed Message Processor. Instead of splitting a composite message, it broadcasts the entire request message to multiple recipients via either a Recipient List (knows recipients explicitly) or a Publish-Subscribe Channel (open bidding; any interested party responds). Aggregates responses from all respondents. Challenge: unlike Composed Message Processor, the number of expected responses may be unknown when using P/S broadcast.

**Routing Slip:** Precomputes the route for a message at the start of processing and attaches it as a header field. Each processing component reads the next step from the slip and forwards the message — no central router is consulted mid-flight. Compared to Options A–E analysis of alternative designs: avoids both the overhead of passing through every possible step (reactive filtering) and the explosion of hard-wired channels per message type. The router logic in each component is generic (equivalent to Return Address) so components remain composable. Limitations: the route must be known upfront and is linear — cannot change based on intermediate results. When intermediate results must influence routing, use Process Manager instead. Supports Chain of Responsibility implementation (static list; each component accepts or passes on).

**Process Manager:** A central component that maintains the state of a multi-step process and determines the next step after each intermediate result arrives. Hub-and-spoke architecture: all processing units send replies back to the central Process Manager, which then dispatches the next step. Enables branching, forking, joining (parallel steps), and re-routing based on intermediate results — capabilities the Routing Slip lacks. Key design concepts:
- *Process definition vs. process instance*: analogous to class vs. object instance. Multiple instances can execute simultaneously from one definition.
- *State management*: each instance stores its current step and any accumulated intermediate data; this allows the same processing unit to appear at multiple steps without carrying step-tracking logic internally.
- *Correlation*: the Process Manager includes a Correlation Identifier in all outbound messages; processing units echo it back in their replies so the manager can route the response to the correct instance.
- *Observability advantage*: centralised state makes it possible to query the status of any in-flight process instance; useful for reporting (how many orders await approval?) and debugging.
- *Trade-offs vs. Pipes and Filters*: hub-and-spoke can become a bottleneck; parallelising stateless Process Managers is easy (each processes independent instances); state can be persisted in a database and surviving Process Managers can resume from it.
- *Process definition languages*: BPEL4WS was the proposed standard (Microsoft XLANG + IBM WSFL merger); today this role is filled by BPMN engines, Temporal, and similar workflow platforms.

Comparison table (Process Manager vs Routing Slip vs Pipes and Filters):

| | Pipes & Filters | Routing Slip | Process Manager |
|-|-----------------|-------------|-----------------|
| Message flow complexity | Complex supported | Linear only | Complex supported |
| Changing the flow | Hard | Easy (reconfigure table) | Easy (reconfigure process definition) |
| Central point of failure | No | Potential (routing table computation) | Potential |
| Architecture | Distributed | Mostly distributed | Hub-and-spoke |
| Administration & reporting | None | Central admin only | Central admin + reporting |

**Message Broker (architectural pattern):** The pattern that assembles a set of Message Routers into a coherent integration backbone. Distinct from a simple Message Router: the Message Broker is an *architectural* pattern that solves the "integration spaghetti" problem — N×N direct channels between applications. Internally, a Message Broker is composed of many individual routing patterns. Risk: a single central broker can become a bottleneck; mitigations are (a) deploy multiple stateless instances reading from a shared P2P channel, (b) use a broker hierarchy (local brokers handle intra-subnet traffic; a central broker handles cross-subnet routing). Because routing abstraction does not automatically resolve format differences, Message Brokers typically use a Canonical Data Model internally to reduce the N×(N-1) translator problem to 2N translators.

### Chapter 8 — Message Transformation

Detailed treatment of the Translator specialisations introduced in Ch 3. The chapter frames data transformation as a problem of *metadata management* — an integration solution operates on two parallel systems: actual message data and the metadata describing its format. Effective transformation requires both.

**Envelope Wrapper:** Adapts an application message to comply with the requirements of a messaging infrastructure (required headers, encryption, security credentials). The raw application message becomes the payload; infrastructure-required fields form the outer envelope. Multiple Envelope Wrappers can be chained (layered protocol model: analogous to TCP/IP/Ethernet encapsulation). A field from the inner body may be "promoted" to the outer header when routing components need to inspect it. Chained wrappers must be unwrapped symmetrically at the destination.

**Content Enricher:** Adds data to a message that the original sender could not supply, fetching it from an external source. Three data sources: (1) *computation* from existing fields (ZIP code → city+state); (2) *environment* (current timestamp from OS); (3) *another system* (patient SSN from customer care system, customer name from CRM). Because the Content Enricher must wait for the external source to respond, its interaction with that source is inherently synchronous — a synchronous protocol (HTTP, ODBC) typically outperforms async messaging here. Used to resolve references: passing a customer ID in a message is more bandwidth-efficient than carrying all customer fields; the Content Enricher resolves the reference just before the consumer that needs the full record.

**Content Filter:** Removes unneeded or sensitive data from a message. Use cases: (1) *security* — strip fields the requestor is not authorised to see before returning a response; (2) *simplification* — strip irrelevant fields from large industry-standard XML formats (RosettaNet, ebXML) before routing internally; (3) *flattening* — reduce a deep nested tree structure to a simple flat element list. Multiple Content Filters can act as a static Splitter, breaking one large message into several topic-specific messages.

**Claim Check:** Stores large or sensitive data in a persistent datastore and replaces it in the message with a reference key. Subsequent components carry only the key, avoiding unnecessary marshalling/unmarshalling overhead. When the data is needed, a Content Enricher uses the key to retrieve it. Key selection: prefer a dedicated abstract key (not the message ID — dual semantics cause conflicts; not a business key unless you want components to know its meaning). Data lifecycle: read-once (delete on retrieval, highest security), expiry-based garbage collection, or never deleted (if a business system is the datastore). Security use: send only the key to external parties so they cannot access full data without the key; block keys that are invalid, expired, or already used. A Process Manager plays the role of Claim Check naturally — it stores per-instance data and sends only the relevant subset to each external processing step.

**Normalizer:** Routes each incoming message format to a dedicated Message Translator, producing a common output format. Composed of a Message Router (detects message format and routes) + per-format Message Translators. Format detection strategies: type specifier field in header (ideal), XML root element name, XPath expressions, file naming conventions (useful for file-based B2B integration). A single Translator can serve multiple partners if they share the same format or if XPath expressions are generic enough.

**Canonical Data Model:** A shared, application-independent data format that all applications in an integration solution translate to/from. Reduces N×(N-1) translators (direct translation between each pair) to 2N translators (each application translates to/from canonical only). Adding a new application requires only 2 new translators regardless of how many applications already participate. Trade-off: *double translation* overhead (source→canonical→target) increases latency; for high-throughput systems, direct translation may be the only viable option. Design guidance: the canonical model need not cover all data in all applications — only the data that participates in messaging. Keeping the scope narrow dramatically improves feasibility. Application-private messages (between an application and its own translator) must not be consumed by other components — only the canonical-format output is "public." Canonical Data Models also have political value: they force agreement on shared business terminology across applications that may each call the same concept by a different name.

### Chapter 9 — Interlude: Composed Messaging

A code-only interlude demonstrating pattern composition in practice, not introducing new patterns. Implements a Loan Broker system using patterns established in previous chapters.

**Loan Broker design:** A Loan Broker aggregates loan quotes from multiple banks on behalf of a borrower. The system composition: (1) Content Enricher — fetches the borrower's credit score from a credit bureau; (2) Scatter-Gather — broadcasts the enriched request to multiple banks via either Recipient List or Publish-Subscribe Channel; (3) Normalizer — converts each bank's quote format to canonical; (4) Aggregator — collects responses until a completeness condition is met (all replied, or timeout).

Three implementations illustrating how the same abstract design produces radically different concrete implementations:
- **Implementation A** (Synchronous Web Services/Java/Apache Axis): synchronous SOAP calls; simpler but blocks threads and cannot handle bank unavailability gracefully
- **Implementation B** (Async MSMQ/C#/Recipient List): async messaging with a known list of banks; Aggregator waits for all N replies; Correlation Identifier tracks responses
- **Implementation C** (Async TIBCO/Pub-Sub/Process Manager): Publish-Subscribe Channel (open bidding — any bank may respond); Process Manager tracks state; Aggregator uses timeout (not wait-for-all since respondent count is unknown)

Key design decisions illustrated: sequencing (sync vs. async changes threading and failure model); addressing (Recipient List vs. Pub-Sub changes completeness estimation); aggregation (Correlation ID vs. per-call channel changes reply tracking); concurrency (single-threaded event-driven vs. one thread per request).

### Chapter 10 — Messaging Endpoints

Catalogues how applications connect to and interact with messaging channels. The chapter frames endpoints around two key concerns: (1) *throttling* — how to control consumption rate so the application is not overwhelmed; (2) *transactional compatibility* — some endpoint patterns interact poorly with Transactional Clients.

**Messaging Gateway:** Encapsulates messaging infrastructure API from the rest of the application. Two variants: *blocking* (gateway call blocks until reply arrives; one thread per outstanding request) and *event-driven* (callback invoked on message arrival; no blocking thread). Asynchronous Completion Token (ACT) pattern: each outbound request includes an opaque token returned with the reply, restoring caller context without server-side state. Gateways can be chained (each wraps another adding capabilities). Service Stub substitutes for gateway in tests.

**Messaging Mapper:** Separates domain objects from messaging infrastructure. Neither the domain nor the messaging layer knows about the Mapper; only the Mapper knows both. Triggered via Observer/events on domain changes. Contrast with Message Translator: Translator converts between two message formats; Mapper converts between an in-memory domain object and a message.

**Transactional Client:** Allows external control of messaging transaction boundaries, enabling ACID coordination across messaging and other resources. Four scenarios: (1) *Send-Receive Pairs* — receive a request and send a reply atomically (common in routers and translators); (2) *Message Groups* — send/receive a related set atomically; (3) *Message/Database Coordination* — receive a message and update a database in one distributed transaction; (4) *Message/Workflow Coordination* — acquire work item and send request in one transaction; receive reply and complete work in another. Important caveat: Transactional Clients work poorly with Event-Driven Consumers — the consumer must commit the receive transaction before passing the message to the application, preventing rollback.

**Polling Consumer:** Consumer explicitly requests messages when ready; blocks until a message arrives. Also called a synchronous receiver. Throttling mechanism: limit the number of polling threads to control consumption rate. One thread can monitor multiple channels using `receiveNoWait()`. Works well with Transactional Clients; can implement a Message Dispatcher.

**Event-Driven Consumer:** Consumer is invoked by the messaging system when a message arrives (callback model). Also called an asynchronous receiver. No threads consumed while channel is empty. Two parts: initialisation (register consumer with channel once) + consumption (invoked per message). Limitation: poor compatibility with Transactional Clients in standard JMS — the `MessageListener.onMessage` signature cannot throw checked exceptions, so transaction rollback on error is unreliable.

**Competing Consumers:** Multiple consumer instances on a single Point-to-Point Channel; each in its own thread. The messaging system delivers each message to exactly one consumer. Enables horizontal scaling without changing sender or channel; can span processes and machines. Only works with Point-to-Point Channels (Pub-Sub would duplicate messages). Transactional Clients can be inefficient if the broker allows multiple consumers to begin consuming the same message — first commit wins, others waste effort.

**Message Dispatcher:** Single consumer (Dispatcher) reads from the channel and distributes messages to specialised Performers running in the same process. GoF Reactor pattern analogy (POSA2). Enables per-message-type specialisation without requiring the messaging system to support Selective Consumer natively; also handles a default case and can reroute unmatched messages to Invalid Message Channel. Tradeoffs vs. Competing Consumers: specialisation + default case + Transactional Client compatibility; but cannot distribute across processes or machines. Best configuration: Dispatcher as Polling Consumer; Performers as event-driven callbacks.

**Selective Consumer:** Consumer filters incoming messages based on a selection value set in the message header by the sender. Messages not matching the consumer's criteria remain on the channel for other consumers. Makes a single channel behave like multiple Datatype Channels dynamically. Comparison — vs. Message Filter: Filter prevents unwanted messages from reaching any consumer's channel; Selective Consumer leaves them available to others. Vs. Content-Based Router: CBR is static (new channel per type); Selective Consumer is dynamic (just configure consumer criteria). Security caveat: criteria are not enforced by messaging system ACLs — a consumer can widen its criteria to receive unauthorised messages. Use separate Datatype Channels for true isolation.

**Durable Subscriber:** A Pub-Sub subscriber that retains its subscription while disconnected, so the messaging system queues messages published during the disconnection and delivers them on reconnection. Three subscriber states: *active* (connected), *inactive* (disconnected but subscribed), *unsubscribed* (explicitly terminated — no messages saved). Use when the subscriber must not miss any events (databases, audit logs). Nondurable subscriptions are appropriate when only current state matters (GUIs). Risk: an inactive subscription that is never unsubscribed accumulates messages indefinitely — use Message Expiration to bound storage.

**Idempotent Receiver:** Designs message processing so receiving the same message multiple times has the same effect as receiving it once. Required because at-least-once delivery can produce duplicates (lost acknowledgement → retransmit; distributed transaction failure → resend to all recipients). Two approaches: (1) *Explicit de-duplication* — maintain a history of received message IDs; discard duplicates; size the history to the sender's outstanding-message window (TCP sliding window analogy); do not overload business keys as message IDs (dual semantics break when business requirements change). (2) *Idempotent message semantics* — express absolute state ("set balance to $110") not relative operations ("add $10"), so re-processing is harmless.

**Service Activator:** Adapter from messaging to a service-layer operation. Receives the request message, extracts parameters, and invokes the service synchronously — the service has no knowledge of messaging. Enables the same service to be invoked via multiple communication styles (local call, Web Services, JMS, etc.) without changing service code. Can be one-way (fire and forget) or Request-Reply (creates a reply from the return value). If the service is transactional, use Transactional Client so message consumption and service execution share the same transaction. Related to Half-Sync/Half-Async (POSA2).

### Chapter 11 — System Management

Eight patterns for monitoring, controlling, and testing a distributed messaging solution. The chapter opens with Martin Fowler's "architect's dream, developer's nightmare" observation: the loose coupling and asynchronicity that make messaging powerful also make it hard to test and debug.

The chapter distinguishes two monitoring levels: *system management* (header-level: message counts, throughput, routing, component health) and *Business Activity Monitoring* (payload-level: dollar values of orders, customer counts). The chapter covers system management.

**Control Bus:** Uses the same messaging infrastructure as the application but sends control data on separate channels. Components have three interfaces: inbound data channel, outbound data channel, and control interface. Five control bus message types: (1) *Configuration* — dynamically update routing tables, timeouts, channel addresses without file deployment; (2) *Heartbeat* — periodic "I'm alive" with metrics (messages processed, memory available); (3) *Test Messages* — active injection of synthetic data (heartbeat confirms component is alive; test message confirms it processes correctly); (4) *Exceptions* — centralised error routing and alerting; (5) *Statistics* — throughput, average processing time, per-type message counts (typically lower-priority, non-guaranteed channels). A live console aggregates all of these.

**Detour:** A Content-Based Router controlled via the Control Bus. In "normal" state it passes messages directly to the destination. When instructed by the Control Bus, it routes messages through additional steps (logging, validation, debugging). Analogous to assert statements in debug vs. release builds. Controllable across multiple Detours simultaneously via Pub-Sub on the Control Bus.

**Wire Tap:** A fixed Recipient List with two output channels — inserts into an existing channel, publishes the unmodified message to both the primary channel and a secondary "tap" channel. Used to observe message traffic without altering it and without modifying producers or consumers. Important caveat: re-publishing creates a new message with a new message ID and new timestamps — this breaks Correlation Identifier schemes that use message IDs. Controllable (tap on/off) via Control Bus. Cannot alter messages — use Detour for that.

**Message History:** Stores in each message's header a list of all component IDs the message has passed through. Every component appends its ID to the list before forwarding. Enables debugging of message paths and dependency analysis without coupling components. Important use: detect infinite loops in Pub-Sub event propagation (a component checks if its own ID appears in the history before processing). Challenge for aggregating components (Aggregator, Recipient List, Process Manager): these produce one output from multiple inputs. Options: (1) hierarchical tree history (complete but complex); (2) simple list propagating only one incoming message's history (e.g., the "winning" auction reply).

**Message Store:** Persists message data (or key fields) to a central datastore via Wire Tap or component-side publishing to a control bus channel. Enables cross-message reporting (throughput, latency between components) that is impossible when data is only in short-lived individual messages. Granularity trade-off: storing all fields provides rich reporting but high network overhead; storing only key fields (message ID + channel + timestamp) is lightweight. Body storage challenge: different message types have different schemas; options are per-type tables (indexed, queryable) or generic XML blob (flexible but less searchable). Needs a purging/archiving mechanism as it can grow very large.

**Smart Proxy:** Intercepts messages sent to Request-Reply services that use dynamic Return Address routing. Stores the original requestor's Return Address, substitutes its own address in the message, and forwards to the service. When the service replies to the proxy, the proxy performs analysis (timing, QoS metrics), restores the original Correlation Identifier and Return Address, and routes the reply to the original requestor. Two storage options: (1) piggyback a special field in the message (service must copy it to the reply — requires service cooperation); (2) internal proxy storage keyed by a proxy-generated Correlation Identifier (more robust — original IDs may not be globally unique across multiple requestors). The proxy must construct its own correlation ID to avoid collisions from multiple requestors sharing the reply channel.

**Test Message:** Injects synthetic messages into the live message stream to actively verify that components process messages correctly (heartbeat confirms "alive"; Test Message confirms "functioning correctly"). Four components: (1) *Test Data Generator* — creates test payloads (constant, file-driven, or random); (2) *Test Message Injector* — inserts test data with a tagging header field (avoid overloading business fields as discriminators); (3) *Test Message Separator* — Content-Based Router that extracts test results from the output stream (or Return Address acts as the tag if the component supports it, routing test replies to a dedicated test channel instead of through the rest of the system); (4) *Test Data Verifier* — compares actual output to expected output, raises alerts on discrepancy. Limitation: stateful components may process test data as real data.

**Channel Purger:** Removes leftover or unwanted messages from a channel. Basic variant removes all messages; more sophisticated variants filter by message ID or content criteria. Disposal options: discard (sufficient for test reset) or store for later replay/inspection (useful for production incidents where the message content may be needed after the blocking message is removed). Use cases: test state reset; removing poison messages that cause component failures in a loop; clearing residual messages after debugging sessions.

### Chapter 12 — Interlude: System Management Example

A code-only interlude applying the Ch 11 patterns to the MSMQ/C# Loan Broker implementation from Ch 9. No new patterns. Demonstrates composing system management patterns around an existing solution treated as a set of black boxes.

Four management requirements implemented: (1) *Management Console* — a Control Bus with a central console displaying real-time component health; (2) *Loan Broker QoS* — a Smart Proxy intercepts requests between the customer and the loan broker, measuring end-to-end response times and publishing metrics to the Control Bus; (3) *Credit Bureau Verification* — a Wire Tap captures all requests to the credit bureau into a Message Store (for audit); a Test Message periodically probes the credit bureau and routes results to the management console; (4) *Credit Bureau Failover* — a Detour controlled by the Control Bus reroutes credit bureau requests to a backup service if the primary fails.

Key insight: all four capabilities are added externally — the original Loan Broker, credit bureau, and bank components are untouched. The management layer composes entirely from Wire Tap + Detour + Smart Proxy + Test Message + Control Bus + Message Store.

### Chapter 13 — Integration Patterns in Practice

A case study by Jonathan Simon applying the book's pattern catalogue to a real bond trading system at a Wall Street investment bank (approximately 2001–2003). No new patterns — the chapter demonstrates the pattern selection and composition process in a production environment.

**System context:** Market data price feed (C++/TIBCO) → Analytics Engine (C++/TIBCO) → Java gateway (MQSeries/JMS) → Java thick clients (Windows NT / Solaris). Goal: aggregate bond prices across trading venues for multiple traders simultaneously.

**Integration style decision:** Chose Messaging over RPC because the gateway → client direction required multicasting data to an unknown number of simultaneous listeners. RPC would require the gateway to maintain client registries and spawn threads per client per update. Messaging with Pub-Sub naturally decouples this. Client → gateway direction used Point-to-Point (single server instance; direct call semantics appropriate).

**Messaging Bridge:** Connected TIBCO TIB (C++) and IBM MQSeries (Java) via two Channel Adapters communicating over CORBA (company standard). The Channel Adapters implement Message Translation between the two messaging systems without either side knowing about the other. Key observation: one pattern (Channel Adapter) used to implement another pattern (Messaging Bridge) — pattern composition as a first-class design technique.

**Channel structuring trade-off:** Market data feed used one Pub-Sub channel per bond (TIBCO "subjects" make channels cheap). Analytics Engine output was per-trader, per-bond. Two options considered: (1) one channel per trader (fewer channels but forces routing logic into Analytics Engine, contaminating a reusable generic component with system-specific routing); (2) one channel per trader per bond (many channels but keeps Analytics Engine clean). Chose option 2 — the Pricing Gateway acts as a Content-Based Router, subscribing to all trader/bond TIB channels and aggregating into per-trader JMS channels, keeping the channel explosion on the cheaper TIB side and manageable on the JMS side.

**Pattern selection for flashing update rate problem:** GUI thread became overloaded with high-frequency price updates. Considered: (1) Message Filter (time-based discard) — rejected because messages contain partial field updates across 50 fields; discarding would lose data integrity. (2) Aggregator — accepted. The Aggregator merges successive partial updates into a complete record before passing to the client. Completeness condition changed from time-based (Aggregator controls rate) to pull-based: the client becomes a Polling Consumer, sending a Command Message to request an update; the Aggregator responds with a Document Message containing all field changes since the last poll. This inverts control: the client throttles itself rather than the infrastructure throttling the client.

**Production crash from dead letter queue overflow:** Slow consumers caused messages to expire before consumption; expired messages accumulated in the Dead Letter Channel (MQSeries), eventually exhausting resources and crashing the server. Aggregator was considered (already used) but incompatible with the requirement for immediate forwarding of prices to trading venues. Competing Consumers couldn't help because the channels were Pub-Sub (multiple consumers would just duplicate work). Solution: Message Dispatcher — a single dispatcher on the Pub-Sub channel delegating each message to an available Performer thread, enabling parallel processing without changing the channel type.

**Meta-observation:** Patterns are tools for the entire project lifecycle, not just upfront design. The real underlying bottleneck (the client architecture) couldn't be fixed with patterns alone — it required refactoring the message flow architecture.

### Chapter 14 — Concluding Remarks

A forward-looking survey (written 2003) of emerging integration standards, noting that patterns remain stable while implementation strategies evolve as standards emerge. The thesis: when a pattern becomes standardised, its applicability increases rather than decreases — developers can apply it at higher levels of abstraction.

Standards covered: BPEL4WS (Microsoft XLANG + IBM WSFL merger, submitted to OASIS), WS-Reliability (OASIS), WS-I Basic Profile (SOAP 1.1, WSDL 1.1, XML Schema 1.0, UDDI 1.0), W3C Choreography Working Group, JMS/JCA/JAX-RPC (JCP). These are largely historical from the pre-microservices era. BPEL corresponds to what would become BPMN workflow engines and later platforms like Temporal; WS-Reliability maps to what Kafka's log-based delivery semantics provide today.

The enduring insight: "Patterns tend to strengthen but otherwise change little, if at all; but their implementation strategies often evolve rapidly to allow developers to apply them to much broader scales of sophistication." (→ ch. 14)

## Notable Quotes

> "Anyone who claims that integration is easy must be incredibly smart, incredibly ignorant (let's say optimistic), or have a financial interest in making you believe that integration is easy." (ch. 1)

> "Asynchronous messaging is fundamentally a pragmatic reaction to the problems of distributed systems." (ch. 2)

> "The notion of 'account' can have many different semantics, connotations, constraints, and assumptions in each participating system. Resolving semantic differences between systems proves to be a particularly difficult and time-consuming task." (ch. 1)

## Related Pages

- [[concepts/integration-styles]] — the four styles as a decision framework
- [[concepts/messaging]] — messaging as the preferred integration style; Pipes and Filters, Message Router, Message Bus, channel types
- [[styles/soa-architecture]] — EIP treats SOA as a legitimate and desirable integration scenario; Message Bus is the ESB's principled foundation
- [[styles/pipeline-architecture]] — EIP treats Pipes and Filters as a messaging composition pattern
- [[patterns/saga]] — Process Manager pattern is directly ancestral to the Saga orchestrator
- [[concepts/contracts]] — Canonical Data Model as a contract mechanism
- [[operations/observability]] — Control Bus, Smart Proxy QoS tracking, Test Messages as system management patterns
