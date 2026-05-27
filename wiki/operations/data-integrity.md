---
title: "Data Integrity"
type: concept
tags: [reliability, operations, data-integrity, backup, recovery, sre]
sources: [site-reliability-engineering]
created: 2026-05-27
updated: 2026-05-27
---

# Data Integrity

Data integrity means that users can access their data and that the data is correct. These are two distinct properties: data can be perfectly preserved but inaccessible (an extended outage), or corrupted but accessible (silent data loss). Both are failures from the user's perspective.

> **Key framing**: uptime and data integrity have independent requirements. A service with 99.99% uptime tolerates ~1 hour of downtime per year. But a service with 99.99% data integrity means up to 200KB of every 2GB dataset is corrupted — catastrophic for databases, executables, and documents. The two SLOs are orthogonal and must be defined separately.

## Replication ≠ Recoverability

A classic misconception: "We have something better than backups — replication!" Replication is not a substitute for backups. Datastores that automatically sync multiple replicas guarantee that a corrupt row or an errant delete is propagated to every copy, likely before the problem is detected.

Replication protects against hardware failure and site disasters. Backups protect against application bugs, operator error, and user errors — the dominant causes of data loss in practice. Both are needed. (→ [[sources/site-reliability-engineering]] ch. 26)

## Failure Mode Matrix

Data integrity failures occur across three independent dimensions:

| Dimension | Variations |
|-----------|-----------|
| **Root cause** | User action, operator error, application bug, infrastructure bug, hardware fault, site catastrophe |
| **Scope** | Widespread (many users) vs. narrow (specific subset) |
| **Rate** | Big-bang (sudden, large loss) vs. creeping (slow, gradual, discovered late) |

An effective recovery plan must account for any combination. The most challenging variant is **creeping corruption at narrow scope**: a bug that silently deletes or corrupts a small fraction of data over weeks or months. This variant is typically discovered long after the bug shipped — making point-in-time recovery essential.

Google's study of 19 recovery events found that software bugs causing deletion or referential integrity loss were the most common cause. The most insidious were low-grade losses discovered weeks to months after the bug first ran.

## Defence in Depth: Three Layers

No single strategy covers all 24 combinations of failure modes. Multiple complementary, uncoupled defences are required.

### Layer 1: Soft Deletion

**Soft deletion**: when a user deletes data, mark it as deleted but do not destroy it immediately. Only administrative code paths can access soft-deleted data. Provide a user-support tool to undelete. Typical window: 30–60 days (Google's experience: most account hijacking and accidental deletion is reported within 60 days).

**Lazy deletion** (for cloud/developer APIs): the storage provider preserves deleted data for weeks before actual destruction, invisible to the application layer. The primary defence against internal developer error when working with deletion-related code paths.

**Hard truth about batch pipelines**: the most devastating acute deletion events at Google were caused by developers unfamiliar with existing code, working on deletion-related batch pipelines (e.g., MapReduce jobs). Design API interfaces to prevent such code from circumventing soft deletion. Require explicit opt-out, not implicit bypass.

Soft deletion is the primary defence against user error and developer error. It cannot protect against persistent bugs that run continuously — those require backups.

### Layer 2: Tiered Backups

Backups exist for recovery. The scenarios in which you need to recover should drive backup decisions — not the other way around.

> "No one really wants to make backups; what people really want are restores."

**Tiered strategy**:
- **Tier 1** (hours to days retention): frequent, fast-restore, co-located with live data (same or adjacent storage technology). Minutes to restore. Protects against software bugs and developer errors caught quickly.
- **Tier 2** (single to low double-digit days): local distributed filesystem within the same site. Hours to restore. Covers bugs that survive past Tier 1 retention. Minimum: retain long enough to span two release cycles.
- **Tier 3+** (weeks to months): nearline or offline storage (tape, offsite disks). Protects against site-level failures and zero-day attacks on disk device drivers that would compromise all online copies.

**Media diversity is essential**: a filesystem bug or driver vulnerability may affect all online copies. Tape and disk are affected by different bugs. At exabyte scale, storing copies on diverse media is non-negotiable.

**Retention depth**: low-grade creeping bugs may not be noticed for 30–90 days. Google draws the line at 30–90 days of backup retention, depending on service velocity and investment in early detection.

### Layer 3: Out-of-Band Data Validation

Periodic batch jobs that traverse the live datastore and check invariants that must hold between data entities. Examples: that every email metadata record has a corresponding message body; that every audio file reference points to an existing audio object; that referential integrity holds between a blob store and its metadata store.

**Why this is needed**: storage APIs — even consensus-based ones like Paxos — have bugs in their implementations. "Trust storage systems, but verify."

**Calibration is critical**: validators that are too strict fire on legitimate changes and get abandoned. Validators that are too loose miss real corruption. Only validate invariants that cause user-visible catastrophe when violated.

**At Google scale**: Gmail runs validators daily that have caught actual production data integrity problems. The validators have given developers confidence to make production changes weekly. One validator was decomposed into 10–14 daily shards to stay within a 24-hour window.

**Infrastructure requirements**: out-of-band validation requires validation job management, monitoring/alerts/dashboards, rate-limiting knobs, troubleshooting tooling, and production playbooks. Most small teams cannot afford to build this themselves — a shared infrastructure team should provide the framework; product teams provide the business logic.

## "Backups Don't Matter; Recovery Does"

A backup that cannot be restored is worthless. Recovery failures are latent — they are invisible until the moment they are needed, which is exactly the worst time to discover them.

**Continuously test end-to-end restore**. Only an actual end-to-end restore proves that recovery works. Test for: validity and completeness of backup data; sufficient resources to run restore; restore completion within acceptable wall time; monitoring of restore progress; independence from external resources not available 24/7.

Gmail's 2011 data recovery (the largest use of the GTape offline backup system) succeeded within hours of the estimated time because the team had simulated the recovery many times before the real event. Google Music's 2012 tape recovery (1.5 petabytes, 7 days) succeeded because DiRT (Disaster Recovery Testing) exercises conducted weeks earlier had validated the tape system and trained the team.

**Automate recovery testing**: if tests are manual, they won't be done frequently or deeply enough.

## Point-in-Time Recovery

For creeping corruption scenarios, recovering to a single snapshot is insufficient — different subsets of data may have been corrupted at different times and must be recovered to different timestamps. This is "time-travel" in Google's terminology; point-in-time recovery in industry parlance.

Point-in-time recovery demands:
- Sufficient backup retention depth (30–90 days)
- Incremental backups between full backups (reducing the chain of dependence)
- The ability to apply restored data selectively alongside live data
- Tooling to handle the complexity of mixing restored and live data across multiple datastores

At exabyte scale: establish *trust points* (verified, immutable data segments); make incremental backups of only data modified since the last backup; parallelise validation and copying by sharding across independent data ranges. Without these techniques, a serial full-backup/restore cycle at petabyte scale takes decades.

## Case Studies

**Gmail, February 2011**: a combination of internal system failures caused data loss for a significant number of users — the first large-scale use of the GTape offline backup system. Recovery succeeded because the team had repeatedly rehearsed the same scenario. The backup media: tape. Public reaction was surprise, but tape provided exactly the media-diversity layer that online failures could not compromise.

**Google Music, March 2012**: a refactored data deletion pipeline introduced a race condition between stages. As data volume had grown, pipeline stages took longer than their original design assumed, violating a timing invariant. ~600K audio references were deleted over a month before detection. Recovery required recalling 5,337 tapes from offsite storage; 1.5 petabytes of data restored in 5 of 7 days. 161K audio files pre-dating backups required a separate recovery path (redownload from original stores or re-upload from users). Root fix: redesign the pipeline to eliminate the race condition; add production monitoring on global deletion rate anomalies.

## SRE Principles Applied to Data Integrity

- **Beginner's mind**: large-scale systems have inherent bugs. Never assume you understand a system well enough to say it won't fail in a given way. Trust but verify.
- **Defence in depth**: every strategy eventually fails. Multiple complementary, uncoupled strategies together address a broad swath of scenarios.
- **Hope is not a strategy**: components not continuously exercised fail when needed. Automate recovery testing and run it continuously.
- **Revisit and reexamine**: a system whose data could previously be reconstructed from scratch (e.g., an index built from original data) becomes a different system when users can contribute data. Reassess data integrity requirements whenever the nature of the data changes.

## Related Concepts

- [[operations/availability]] — data availability as a component of overall service availability
- [[operations/chaos-engineering]] — Disaster Recovery Testing (DiRT) as a structured rehearsal of recovery
- [[operations/testing-for-reliability]] — production tests and validation pipelines
- [[operations/common-failure-causes]] — software bugs as the dominant cause of data loss
- [[distributed/replication]] — why replication is not a substitute for backups
- [[databases/transactions]] — ACID guarantees for consistency within a single storage system; does not protect against application-layer bugs
