---
title: "Zhamak Dehghani"
type: author
tags: [author, data, data-mesh, analytical-data, distributed-systems]
sources: [software-architecture-the-hard-parts]
created: 2026-05-14
updated: 2026-05-14
---

# Zhamak Dehghani

**Books in this wiki:** [[sources/software-architecture-the-hard-parts]]

## Background

Zhamak Dehghani is the creator of the **Data Mesh** architectural paradigm and was Director of Emerging Technologies at ThoughtWorks. She joined the SATH author team to ensure the analytical data dimension was fully incorporated into architecture trade-off analysis — a perspective absent from most architecture books.

## Core Positions

- **Data Mesh**: large-scale analytical data should be treated as a product owned by domain teams (not a central data platform team), following domain-driven design principles applied to data. The four pillars: domain ownership, data as a product, self-serve data infrastructure, federated computational governance.
- **Analytical vs operational data are architecturally distinct**: the separation between OLTP (operational) and OLAP (analytical) data has architectural implications that cascade into service design decisions.
- **Centralised data platforms create bottlenecks**: a single data warehouse or data lake creates the same organisational and technical coupling problems as a monolith does for services.

## Books

### [[sources/software-architecture-the-hard-parts]] — *Software Architecture: The Hard Parts* (2022, with Neal Ford, Mark Richards, Pramod Sadalage)

Dehghani's contribution is most visible in the analytical data chapter (Ch 14: Managing Analytical Data), where the data mesh approach is presented as an alternative to centralised data warehouses and data lakes for organisations with complex analytical data needs across distributed services.
