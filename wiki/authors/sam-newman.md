---
title: "Sam Newman"
type: author
tags: [author]
sources: [monolith-to-microservices]
created: 2026-05-15
updated: 2026-05-15
---

# Sam Newman

**Books in this wiki:** [[sources/monolith-to-microservices]]

## Background

Independent consultant and author specialising in microservices, cloud-native architecture, and software delivery. Best known for *Building Microservices* (O'Reilly, 2015; 2nd ed. 2021), the canonical reference on microservice architecture, and *Monolith to Microservices* (O'Reilly, 2019), its practical companion on migration. Worked at ThoughtWorks for many years; has advised organisations globally on service decomposition and delivery practices.

## Core Positions

- **Independent deployability first**: the single most important property of a microservice; everything else — no shared databases, outside-in interface design, loose coupling — is derived from it
- **Microservices are not the goal**: they are a means to achieve specific business outcomes; adopting them without a clear rationale is a failure mode
- **Incremental migration over big-bang rewrite**: extract one service at a time, get it to production, learn, adjust; the extraction is not done until it is live
- **Domain-driven design as the boundary tool**: bounded contexts are the primary unit of decomposition; domain modelling (including Event Storming) is a near-essential first step
- **Monolith advantages are real**: simpler deployment, developer workflow, and code reuse — microservices are appropriate only when these advantages are outweighed by growth constraints
- **Startups should default to monoliths**: microservices solve scale-up problems, not startup problems

## Books

### [[sources/monolith-to-microservices]] — *Monolith to Microservices* (2019)

A practical, opinionated guide to decomposing existing monolithic systems into microservices. Distinguishes itself from general microservices literature by focusing entirely on the migration challenge rather than the target state. Provides a decision framework (three key questions, reversible/irreversible spectrum, two-axis prioritisation quadrant), a taxonomy of monolith types and coupling types, and a preview of the decomposition patterns covered in later chapters (strangler fig, branch by abstraction, database decomposition strategies).
