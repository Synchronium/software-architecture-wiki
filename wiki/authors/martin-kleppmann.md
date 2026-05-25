---
title: "Martin Kleppmann"
type: author
tags: [author, databases, distributed-systems, streaming]
sources: [designing-data-intensive-applications]
created: 2026-05-13
updated: 2026-05-13
---

# Martin Kleppmann

**Books in this wiki:** [[sources/designing-data-intensive-applications]]

## Background

Martin Kleppmann is a researcher at the University of Cambridge, working on distributed systems, CRDTs, and local-first software. Before academia, he was an engineer and entrepreneur at LinkedIn (where he worked on distributed data infrastructure) and at Rapportive (acquired by LinkedIn). He is also the creator of Apache Avro's schema evolution mechanism and has made contributions to the Kafka ecosystem. He co-authored a foundational paper on CRDTs with Shapiro et al. and maintains an active research program on conflict-free collaborative editing (automerge).

His public engineering writing (at martin.kleppmann.com) predates and informed DDIA. His Strange Loop 2014 talk "Turning the Database Inside-Out with Apache Samza" is the conceptual seed of DDIA's Ch. 12 unbundling thesis.

## Core Positions

- **The log is the unifying abstraction**: the append-only, ordered, immutable log underlies storage engines (LSM-Trees, WAL), replication, CDC, Kafka, and event sourcing. Understanding this unification is the key to reasoning about data systems.
- **Storage engines should be understood from first principles**: the physical constraints of disk I/O explain why LSM-Trees win for writes and B-Trees win for reads. Engineers who understand this can make principled choices rather than following fashion.
- **Most databases lie about their isolation levels**: "Serializable" usually means Snapshot Isolation. Write skew is widely misunderstood. SSI is the correct modern solution.
- **CAP theorem is best avoided**: too narrow, too coarse. PACELC is more useful. Timeliness and integrity are more useful concepts than consistency and availability in the CAP sense.
- **Distributed transactions are overused**: coordination-avoiding approaches — end-to-end operation IDs, idempotency, deterministic derivation — can achieve integrity without the blocking and performance costs of 2PC.
- **Data collection is surveillance**: engineers have an ethical responsibility to consider the impact of the systems they build. Data is a liability, not just an asset. Privacy is a human right.

## Books

### [[sources/designing-data-intensive-applications]] — *Designing Data-Intensive Applications* (2017, O'Reilly)

DDIA is the most recommended book in the software architecture reading list. Its scope is unusual: it covers storage engine internals, distributed consensus theory, batch and stream processing, and data ethics in a single coherent narrative. The through-line is Kleppmann's belief that data systems are best understood as composable primitives — and that understanding the primitives enables principled trade-off analysis.

The book is notable for its intellectual honesty: it names real databases that misrepresent their isolation guarantees (using Jepsen test results), critiques CAP theorem as actively harmful, and ends with a sustained ethical argument about surveillance. This makes it more provocative than most systems books, and arguably more useful.

Kleppmann recommends [[sources/understanding-distributed-systems]] as a companion read (Vitillo recommends DDIA in return). The two books are complementary: DDIA gives more depth on storage internals, isolation, and the data systems layer; Vitillo gives more depth on network protocols, service resilience patterns, and operational concerns.
