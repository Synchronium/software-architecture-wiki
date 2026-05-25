---
title: "Encoding and Evolution"
type: database
tags: [databases, encoding, serialisation, schema-evolution, compatibility, avro, protobuf]
sources: [designing-data-intensive-applications]
created: 2026-05-13
updated: 2026-05-14
---

# Encoding and Evolution

Data needs to be encoded to cross process boundaries — written to disk, sent over a network, or passed between services. The choice of encoding format determines how much data you can evolve over time without breaking things. This matters because **data outlives code**: a database may contain records written years ago by a version of the code that no longer exists.

## Language-Specific Serialisation

Most languages provide built-in serialisation (Java's `Serializable`, Ruby's `Marshal`, Python's `pickle`). These are convenient for transient use, but have deep problems for cross-system or long-lived data:

- **Language-locked**: reading data in another language is very difficult.
- **Security risk**: decoding instantiates arbitrary classes, enabling remote code execution if an attacker controls the byte stream.
- **No versioning**: forward/backward compatibility are afterthoughts.
- **Poor performance**: Java's built-in serialisation is notoriously slow and bloated.

**Rule**: never use language-specific serialisation for data stored durably or exchanged across processes.

## Human-Readable Formats

### JSON and XML

Ubiquitous, human-readable, language-independent. Used for REST APIs, config files, event logs.

**Limitations**:
- Ambiguous number types: JSON has no integer/float distinction (problems with numbers > 2⁵³ in JavaScript).
- No binary string support — base64 encoding adds ~33% overhead.
- No schema validation by default — applications must handle missing/unexpected fields.
- Verbose — significant space overhead for key names on every record.

**CSV**: even simpler but deeply ambiguous (commas in values, escaping rules, no types).

JSON with schema validation (JSON Schema, OpenAPI) addresses the schema concern but not the binary or space concerns.

## Binary Encodings

### MessagePack

Binary encoding of JSON. Same data model, smaller encoding — saves ~20% vs JSON. No schema required. Rarely used; JSON's tooling ubiquity usually wins.

### Apache Thrift (Facebook)

Uses **field tags** (integers) instead of field names in the binary encoding. Three formats:
- **BinaryProtocol**: straightforward binary, moderately compact.
- **CompactProtocol**: variable-length integers, more compact.
- **DenseProtocol**: experimental.

Schema defined in an IDL (Interface Definition Language). Code generation produces typed readers/writers in each language.

### Protocol Buffers (Protobuf, Google)

Very similar to Thrift CompactProtocol. Field tags are the primary schema mechanism. More widely adopted outside Facebook. Used by Google internally and as gRPC's wire format.

**Field tags for evolution**:
- **Never change a field tag** — it is the field's identity in the binary.
- **Add new fields**: assign a new tag, make optional — old code ignores unknown tags (forward compat); new code handles missing optional fields with defaults (backward compat).
- **Remove fields**: mark deprecated, never reuse the tag number.
- **Required fields**: can never be safely removed — avoid required.

### Apache Avro

Avro is the most compact binary encoding because it **has no field tags** in the encoded data. Instead, schema resolution happens by matching the **writer's schema** against the **reader's schema** at decode time.

- The encoding is just values, in the order defined by the writer's schema.
- The reader uses its own schema to interpret the values, with schema resolution rules to handle differences.
- For schema evolution: added fields get defaults from the reader's schema; removed fields are ignored.

**Schema registry**: since the writer's schema is required to decode, Avro encoders embed a schema version ID (fingerprint) in the file/message. A schema registry stores schema versions; decoders fetch the writer's schema on demand.

Used in: Hadoop ecosystem (Avro files), Kafka (with Confluent Schema Registry), Parquet (uses Avro schemas).

## Schema Evolution Rules

The two compatibility directions every encoding format must handle:

| Direction | Meaning | Rule |
|-----------|---------|------|
| **Backward compatibility** | New code reads old data | Old fields still decodable; new optional fields absent in old data get defaults |
| **Forward compatibility** | Old code reads new data | Old code must tolerate unknown/new fields (typically: ignore them) |

For rolling deployments (new and old code running simultaneously), you need **both** directions simultaneously. Thrift and Protobuf achieve this via optional fields + ignoring unknown tags. Avro achieves it via reader/writer schema resolution with defaults.

**What you can safely do**:
- Add an optional field with a default value.
- Remove an optional field (it will be absent in new data; old code ignores unknown fields).
- Rename a field (in Avro: add an alias; in Thrift/Protobuf: field name is not in the wire format).

**What breaks compatibility**:
- Remove a required field (old readers expect it).
- Change a field's data type in an incompatible way.
- Change a field tag (Thrift/Protobuf only — breaks field identity).

## Dataflow Modes

The same compatibility concerns arise differently depending on how data flows between systems.

### Through Databases

The database is a long-lived store: a value written today may be read by code five years from now. This is the most demanding evolution scenario.

- **Schema migrations** (`ALTER TABLE`) are often slow and risky on large tables — some require zero-downtime strategies (expand-contract pattern).
- **Schema-on-read alternative**: add new columns as nullable; old code writes null, new code handles both null and values.
- Data written by old code may be read by new code (backward compat) and vice versa during rolling deploys (forward compat).

See: [[concepts/evolutionary-database-design]] for the expand/contract pattern.

### REST vs SOAP vs RPC

**REST** is not a protocol but a design philosophy building on HTTP: simple data formats, URLs as resource identifiers, HTTP features (caching, authentication, content negotiation). Associated with microservices. RESTful APIs use OpenAPI/Swagger for description. No code generation required.

**SOAP** is an XML-based protocol designed to be independent of HTTP (unlike REST, which leverages HTTP). Comes with WS-* standards for features, WSDL for description, code generation tooling. Vendor interoperability is poor. Falling out of favour except in large enterprises.

**RPC fundamental problem**: RPC tries to make a network call look like a local function call (location transparency). This abstraction is fundamentally flawed — a network call is not like a local call:
- Network calls can time out; a local call either succeeds or throws an exception.
- A failed request may have been received and acted on (at-least-once problem) — you need idempotency for safe retry.
- Return values must be encoded/decoded (cannot pass pointers).
- Cannot pass large objects by reference (must copy).
- Different programming language types must translate.

Modern RPC frameworks (gRPC/Protobuf, Thrift, Finagle) acknowledge these differences rather than hiding them. They provide futures/promises for async calls and explicit retry policies.

### Through Services (REST/gRPC)

Services exchange data via API calls. Multiple versions of client and server code coexist:

- **REST**: versioning via URL (`/v1/`, `/v2/`) or `Accept` header. JSON is common — liberal in what you accept (ignore unknown fields), conservative in what you send.
- **gRPC**: Protocol Buffers enforces schema. Forward and backward compatibility rules of Protobuf apply. Server can add new optional fields; clients ignore unknown fields.

**Service versioning policy**: maintain n-1 backward compatibility — new server must serve old clients. Deprecation window for removing old fields.

### Through Async Message Passing

Events in a message broker (Kafka, RabbitMQ) can be consumed long after they were produced. The encoding is chosen once at produce time and must remain decodable by all future consumers.

This makes Avro + schema registry a natural choice for Kafka: the schema version is recorded with each message; consumers fetch the writer's schema by version ID.

**Key concern**: if an event represents a business fact (order placed, payment made), it may be replayed years later for audit or reprocessing. The encoding must survive schema evolution over that period. Using field tags (Protobuf) or reader/writer schema resolution (Avro) is safer than JSON for long-lived event stores.

## Format Selection Guide

| Use case | Recommended format | Reason |
|----------|--------------------|--------|
| Public REST APIs | JSON | Interoperability, human-readable, tooling |
| Internal gRPC services | Protobuf | Type-safe, compact, fast, schema enforcement |
| Kafka/event streaming | Avro + schema registry | Most compact, schema evolution, no field tag collision |
| Config files | YAML/JSON | Human-editable |
| Long-lived data lake | Parquet (columnar) or Avro | Schema evolution, efficient analytics reads |

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Definitive treatment — explains encoding formats from binary layout up; introduces the forward/backward compatibility framework (ch. 4) |
| [[sources/mastering-api-architecture]] | API-focused: OpenAPI Specification (OAS) for REST, Protobuf for gRPC, schema-first design; compatibility as API governance concern |

## Related Concepts

- [[databases/data-models]] — the data model determines what needs to be encoded
- [[concepts/api-design]] — encoding and versioning are central API design decisions
- [[streams/event-sourcing-cqrs]] — long-lived event logs make encoding evolution critical
- [[concepts/evolutionary-database-design]] — database schema evolution strategies
