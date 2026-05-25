---
title: "Martin Fowler"
type: author
tags: [author]
sources: [patterns-of-enterprise-application-architecture]
created: 2026-05-17
updated: 2026-05-17
---

# Martin Fowler

**Books in this wiki:** [[sources/patterns-of-enterprise-application-architecture]]

## Background

Martin Fowler is Chief Scientist at ThoughtWorks. One of the most influential figures in software development practice, he is known for his work on refactoring, agile methods, domain-specific languages, enterprise application architecture, and continuous delivery. He coined or popularised many of the patterns that define the vocabulary of OO enterprise software.

## Core Positions

- Domain logic should be isolated in a dedicated layer, free of UI and infrastructure concerns
- The Domain Model pattern is preferable for complex logic; Transaction Script for simple logic — pragmatism over dogma
- The Service Layer should be thin; resist the temptation to put business logic there
- Distribution is expensive and should be avoided unless strictly necessary
- Active Record is a valid and named pattern — not inherently inferior (contra Evans' "anemic domain model" framing)

## Books

### [[sources/patterns-of-enterprise-application-architecture]] — *Patterns of Enterprise Application Architecture* (2002)

The definitive catalogue of enterprise application patterns. Covers layering, domain logic organisation, O/R mapping, web presentation, concurrency, session state, and distribution. Introduced Transaction Script, Domain Model, Table Module, Service Layer, Active Record, Data Mapper, Repository, Unit of Work, and many others. Essential reference for anyone building OO enterprise systems.
