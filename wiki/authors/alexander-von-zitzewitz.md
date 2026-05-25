---
title: "Alexander von Zitzewitz"
type: author
tags: [author]
sources: [software-architecture-metrics]
created: 2026-05-22
updated: 2026-05-22
---

# Alexander von Zitzewitz

**Books in this wiki:** [[sources/software-architecture-metrics]] (ch. 9)

## Background

Creator of the Sonargraph tool suite and researcher in software structure and maintainability. Brings an empirical, metrics-heavy perspective rooted in long-term study of real codebases. His work focuses on preventing structural erosion in large systems through measurable feedback loops.

## Core Positions

- Cyclic dependencies are the most toxic structural antipattern — they make codebases equivalent to a Big Ball of Mud and must be eliminated with zero tolerance at the package/namespace level
- 80% of nontrivial software systems exceeding 100,000 LoC end as Big Balls of Mud without active structural discipline — structural erosion is the default outcome, not the exception
- Structural metrics (Propagation Cost, Relative Cyclicity, Maintainability Level) provide objective fitness function thresholds that can be enforced in CI/CD; without them, architectural decline is invisible until too late
- Change history metrics (Code Churn, Number of Changes, Number of Authors) identify hotspots where structural investment yields the highest return

## Books

### [[sources/software-architecture-metrics]] — *Software Architecture Metrics* (2022)

Ch. 9: "Using Software Metrics to Ensure Maintainability." Provides a comprehensive framework of structural metrics — ACD/CCD/Propagation Cost, Relative Cyclicity, Structural Debt Index, Maintainability Level — with concrete fitness function thresholds. Introduces LCOM4 and Component Rank (PageRank for classes). Six golden rules for structural governance. Grounded in data from large-scale real-world system analysis.
