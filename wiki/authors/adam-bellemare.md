---
title: "Adam Bellemare"
type: author
tags: [author]
sources: [building-event-driven-microservices]
created: 2026-05-14
updated: 2026-05-14
---

# Adam Bellemare

**Books in this wiki:** [[sources/building-event-driven-microservices]]

## Background

Staff engineer for the data platform at Shopify (since 2020), previously staff engineer at Flipp (2014–2020), and before that a software developer at BlackBerry where he first worked on event-driven systems. His expertise covers DevOps for event-driven infrastructure (Kafka, Spark, Mesos, Kubernetes, Elasticsearch), technical leadership in EDM adoption, software development in Java and Scala using Beam, Flink, Spark, and Kafka Streams, and data engineering for behavioural event collection at scale.

*Building Event-Driven Microservices* (O'Reilly, 2020) was written as the book Bellemare wished had existed when he started. Technical reviewers: Ben Stopford (lead technologist, Confluent Office of the CTO) and Scott Morrison (CTO, PHEMI Systems).

## Core Positions

- The data communication structure is the historically missing layer in distributed architectures; EDM formalises it
- Explicit, evolvable schemas (Avro, Protobuf) are non-negotiable for inter-service event contracts
- Events are the single source of truth — they must carry the complete description of what happened, not just a signal
- CDC frameworks (Kafka Connect, Debezium) are a migration bootstrap tool; the end goal is teams owning their own event production
- Bounded contexts should be aligned on business requirements, not technical layers — technical alignment creates distributed monoliths

## Books

### [[sources/building-event-driven-microservices]] — *Building Event-Driven Microservices* (2020)

A comprehensive, end-to-end treatment of EDM architectures covering the full lifecycle: event design, schema evolution, data liberation from legacy systems, stream processing, stateful processing, testing, and deployment. Practically oriented with real tooling (Kafka, Avro, Debezium, Kafka Connect). The most thorough single-volume treatment of EDM in the wiki.
