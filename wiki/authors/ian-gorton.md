---
title: "Ian Gorton"
type: author
tags: [author]
sources: [foundations-of-scalable-systems]
created: 2026-05-19
updated: 2026-05-19
---

# Ian Gorton

**Books in this wiki:** [[sources/foundations-of-scalable-systems]]

## Background

Ian Gorton is a distributed systems architect and researcher with decades of experience spanning academia and industry. He is a Principal Scientist at the Pacific Northwest National Laboratory (PNNL) and has held research positions at Carnegie Mellon University's Software Engineering Institute. His work focuses on scalable architectures, data-intensive systems, and software architecture quality attributes.

## Core Positions

- Scalability must be designed in from the start — retrofitting it is architecturally expensive and sometimes impossible without a rewrite.
- Two universal strategies cover virtually all scalability problems: **replication** (add capacity) and **optimisation** (use capacity more efficiently).
- Architecture choices about components, databases, and messaging systems are more consequential than application business logic — most production code runs in off-the-shelf infrastructure, not in your code.
- Distributed technology should not be introduced before there is a clear need — premature distribution creates complexity without benefit.
- Measurement and experimentation are essential: hardware upgrades and configuration changes must be validated empirically, not assumed.

## Books

### [[sources/foundations-of-scalable-systems]] — *Foundations of Scalable Systems* (2022)

A practitioner-oriented guide to building large-scale distributed systems. Gorton's approach is systematically empirical: he grounds architectural recommendations in benchmarks, concrete system examples (Facebook, Netflix, Google), and Amdahl's Law. The book is notably honest about complexity costs and the conditions under which distributed infrastructure is and isn't warranted. A useful complement to Kleppmann's data-focused *Designing Data-Intensive Applications* and Vitillo's more theoretical *Understanding Distributed Systems*.
