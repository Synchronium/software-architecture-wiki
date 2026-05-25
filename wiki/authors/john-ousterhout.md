---
title: "John Ousterhout"
type: author
tags: [author]
sources: [a-philosophy-of-software-design]
created: 2026-05-18
updated: 2026-05-18
---

# John Ousterhout

**Books in this wiki:** [[sources/a-philosophy-of-software-design]]

## Background

Professor of Computer Science at Stanford University. Creator of the Tcl scripting language and the Raft consensus algorithm (with Diego Ongaro). Has written approximately 250,000 lines of code across operating systems, file systems, debuggers, build systems, GUI toolkits, and editors. Teaches CS 190 at Stanford — a software design course conducted in the style of an English writing class, with iterative code reviews as the primary learning mechanism.

## Core Positions

- Complexity is the root cause of nearly all difficulty in software development — managing it is the central discipline of software design
- Modules should be *deep*: the best modules have simple interfaces and hide substantial complexity; most programming languages and environments push developers toward *shallow* modules (many small, simple classes), which is a mistake
- Information hiding (Parnas 1971) is the most important principle of module design
- Design is a continuous, strategic investment throughout the lifecycle — not a front-loaded phase; "tactical programming" (patch-and-move-on) is the enemy of good design
- Comments are not an afterthought — they are part of the design, and "write comments first" is a useful design discipline
- Consistency in code conventions reduces cognitive load substantially

## Books

### [[sources/a-philosophy-of-software-design]] — *A Philosophy of Software Design* (2018, 2nd ed. 2021)

A practitioner's philosophy of software design at the code level (classes, modules, interfaces), grounded in 20+ years of writing and reviewing code and refined through repeated delivery of CS 190 at Stanford. Unusually opinionated and direct; explicitly framed as an opinion piece open to disagreement. The deepest treatment in the wiki of complexity management at the intra-service level, complementing the architectural-level treatments in [[sources/fundamentals-of-software-architecture]] and the tactical DDD patterns in [[sources/learning-domain-driven-design]].
