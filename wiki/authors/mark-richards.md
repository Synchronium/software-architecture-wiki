---
title: "Mark Richards"
type: author
tags: [author, architecture, patterns, microservices]
sources: [fundamentals-of-software-architecture, software-architecture-patterns, software-architecture-the-hard-parts]
created: 2026-05-13
updated: 2026-05-14
---

# Mark Richards

**Books in this wiki:** [[sources/fundamentals-of-software-architecture]], [[sources/software-architecture-patterns]], [[sources/software-architecture-the-hard-parts]]

## Background

Mark Richards is a hands-on software architect with over 30 years of industry experience. He is a conference speaker, trainer, and the creator of the DeveloperToArchitect.com education series. He has deep roots in Java enterprise development and has worked extensively with architects at large enterprises, giving him a practitioner's perspective on what works at scale.

## Core Positions

- **Trade-offs over prescriptions**: architecture has no right answers, only trade-offs. The architect's job is to understand and communicate trade-offs, not to prescribe best practices.
- **Domain partitioning**: consistently advocates for organising systems by business capability rather than technical layer.
- **Pragmatism**: favours service-based architecture as a realistic alternative to microservices for teams without strong DevOps maturity — a recognisable pattern in his writing that prefers "least worst" over theoretically ideal.
- **Soft skills are half the job**: approximately 50% of an architect's effectiveness comes from negotiation, leadership, and facilitation skills, not technical knowledge.
- **Business justification required**: every architecture decision must have both a technical and a business justification; decisions without business value should be reconsidered.

## Books

### [[sources/fundamentals-of-software-architecture]] — *Fundamentals of Software Architecture* (2020, with Neal Ford)

Co-authored with Neal Ford. Provides a breadth-first survey of the entire discipline: what architecture is, how to measure it, 8 architecture styles with trade-off ratings, and the soft skills required to operate as an effective architect. Richards's contribution is most visible in the style catalogue chapters (Ch 10–17) and the team/negotiation chapters (Ch 22–23) — reflecting his practitioner background.

### [[sources/software-architecture-patterns]] — *Software Architecture Patterns* (2015)

A concise (~60 page) O'Reilly report covering 5 architecture patterns: layered, event-driven, microkernel, microservices, space-based. Established Richards's characteristic-rating framework (agility, deployability, testability, performance, scalability, ease of development) that was later expanded in FOSA. Notable for naming the three microservices deployment topologies (API REST, Application REST, Centralised Messaging) and the mediator implementation ladder for EDA. Some guidance (shared databases between microservices) was later superseded by FOSA's distributed-monolith analysis, reflecting how the field matured between 2015 and 2020.

### [[sources/software-architecture-the-hard-parts]] — *Software Architecture: The Hard Parts* (2022, with Neal Ford, Pramod Sadalage, Zhamak Dehghani)

Resolves the "hard parts" that FOSA could not. Richards's contribution is most visible in the decomposition patterns, service granularity, and distributed workflow coordination chapters, reflecting his practitioner background with microservices at scale.

