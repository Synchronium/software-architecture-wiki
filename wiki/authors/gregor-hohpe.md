---
title: "Gregor Hohpe"
type: author
tags: [author]
sources: [enterprise-integration-patterns]
created: 2026-05-15
updated: 2026-05-15
---

# Gregor Hohpe

**Books in this wiki:** [[sources/enterprise-integration-patterns]]

## Background

Gregor Hohpe is an enterprise software architect and technical strategist. He co-authored *Enterprise Integration Patterns* (2003) with Bobby Woolf, which became the definitive reference for messaging-based application integration. He has held senior technical roles at ThoughtWorks, Google, and AWS (as Enterprise Strategist). He maintains the EIP pattern catalogue online at enterpriseintegrationpatterns.com.

## Core Positions

Hohpe's central argument is that integration is an architectural problem that cannot be solved by technology alone — it requires semantic alignment, organisational cooperation, and clear patterns for communication. Messaging is his preferred integration style because it best addresses the full set of integration criteria (coupling, timeliness, reliability, data format flexibility) while making the distributed nature of the problem explicit rather than hiding it behind RPC abstractions.

He is a critic of the "make remote calls look like local calls" approach (RPC) on the grounds that it misleads developers about the real costs of distributed communication. He is equally critical of ESB-heavy SOA implementations that put business logic in the bus and create political and technical bottlenecks.

His later work (not in this wiki) on "architect elevator" thinking — moving between the penthouse (business strategy) and the engine room (implementation) — applies to the observation in EIP that integration is fundamentally a political and semantic problem as much as a technical one.

## Books

### [[sources/enterprise-integration-patterns]] — *Enterprise Integration Patterns* (2003)

The canonical reference for messaging patterns. Hohpe and Woolf document 65+ patterns observed across enterprise integration projects, naming and structuring solutions to recurring problems. The book introduced vocabulary now embedded in messaging middleware (channels, routers, transformers, aggregators, splitters) and is the direct ancestor of modern event streaming system design.
