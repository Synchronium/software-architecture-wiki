---
title: "Michael Keeling"
type: author
tags: [author]
sources: [software-architecture-metrics]
created: 2026-05-22
updated: 2026-05-22
---

# Michael Keeling

**Books in this wiki:** [[sources/software-architecture-metrics]] (ch. 10)

## Background

Software architect and author of *Design It! From Programmer to Software Architect* (Pragmatic Programmers, 2017). Known for practical, workshop-driven approaches to architecture that emphasise collaboration and grounded decision-making over formalism. Contributor to the architecture community through writing and conference speaking.

## Core Positions

- Measurement should flow from goals, not from what tools make convenient to measure — the Goal-Question-Metric (GQM) framework enforces this discipline
- GQM is as valuable as a coaching and alignment tool as it is a measurement tool — the workshop process surfaces stakeholder disagreement about goals before it becomes architectural misalignment
- Metrics with strong, unambiguous signals are preferable to many weak metrics; inexpensive metrics are preferable to expensive ones; metrics that answer multiple questions are more efficient than single-purpose ones
- "A metric by itself can only tell you something is wrong. It can't tell you what to do about it." — measurement must be coupled to architectural action

## Books

### [[sources/software-architecture-metrics]] — *Software Architecture Metrics* (2022)

Ch. 10: "Measure the Unknown with the Goal-Question-Metric Approach." Introduces the GQM framework (Basili & Weiss, 1984) with a practical workshop format. Traces a detailed case study of the Foo Service rate limit incident — from postmortem to GQM tree to architectural decisions (heartbeat component, fail-fast ADR) to validated outcome (second incident detected in 10 minutes before users were affected). Establishes GQM as both an engineering and an organisational alignment tool.
