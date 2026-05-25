---
title: "Westrum Organisational Culture"
type: concept
tags: [culture, devops, organisational-design, information-flow, safety, delivery-performance]
sources: [accelerate]
created: 2026-05-18
updated: 2026-05-18
---

# Westrum Organisational Culture

## Definition

Ron Westrum's typology (1988, revised 2014) classifies organisations by how they process information. Originally developed to predict safety outcomes in high-tempo, high-consequence environments (aviation, healthcare), it has been validated by Forsgren, Humble, and Kim as a predictor of software delivery performance and organisational performance (→ [[sources/accelerate]] ch. 3).

Three types, forming a continuum:

| | Pathological (Power-Oriented) | Bureaucratic (Rule-Oriented) | Generative (Performance-Oriented) |
|--|-------------------------------|-------------------------------|-----------------------------------|
| **Cooperation** | Low | Modest | High |
| **Messengers** | Shot | Neglected | Trained |
| **Responsibility** | Shirked | Narrow | Shared |
| **Bridging** | Discouraged | Tolerated | Encouraged |
| **Failure** | Leads to scapegoating | Leads to justice | Leads to inquiry |
| **Novelty** | Crushed | Leads to problems | Implemented |

## Why Information Flow Is the Core Mechanism

Westrum's insight: organisational culture predicts how information flows. Good information flow has three characteristics:
1. It answers the questions the receiver needs answered
2. It is timely
3. It is presented so the receiver can use it effectively

High-tempo, high-consequence environments (aviation, healthcare, tech organisations) depend on good information flow for safe and effective operation. Pathological and bureaucratic cultures distort information — people hoard it for political reasons, withhold it to protect turf, or massage it to look better. These distortions cause failures.

## Measuring Westrum Culture

Measured using Likert-type questions (1–7 scale, strongly disagree to strongly agree) derived from Westrum's typology. Respondents rate agreement with statements about how information is treated in their organisation. Statistical validation (discriminant validity, convergent validity, internal consistency) confirms the measure is both valid and reliable. (→ [[sources/accelerate]] ch. 3, ch. 13)

Score = mean of responses across all culture questions. Higher = more generative.

2016 State of DevOps data: 31% pathological, 48% bureaucratic, 21% generative.

## What Westrum Culture Predicts

Validated by Accelerate research:
- **Software delivery performance** (lead time, deployment frequency, MTTR) — positively predicted by generative culture
- **Organisational performance** (profitability, productivity, market share; also non-commercial mission outcomes) — predicted via delivery performance
- **Job satisfaction** — directly predicted by generative culture
- **Change failure rate** — strongly correlated (follows the delivery performance construct)

Google's "Project Aristotle" (2-year, 200+ interviews, 180+ teams) found the same pattern independently: team dynamics matter more than individual skills; psychological safety — the right to raise concerns without fear — is the top predictor of team performance. This aligns with Westrum's generative culture.

## How to Improve Culture

Key finding from Accelerate: **culture follows practice.** Implementing continuous delivery and Lean management practices drives culture toward the generative end of the continuum. The causal direction is: practices → culture → performance, not culture → practices.

This parallels John Shook's experience at the NUMMI plant (Lean manufacturing): "The way to change culture is not to first change how people think, but instead to start by changing how people behave—what they do." Behaviour precedes belief. Start with practices, not "culture change programmes."

Drivers of generative culture (empirically validated):
- **Continuous delivery** (→ [[concepts/deployment-pipelines]])
- **Lean management** (visual management, WIP limits, lightweight change approval) (→ [[sources/accelerate]] ch. 7)

## Westrum and Failure

How organisations respond to failure is the most diagnostic signal. Pathological: find a "throat to choke" — blame and punish the person responsible. But in complex adaptive systems, accidents are emergent, not the fault of any individual. Stopping the investigation at "human error" is dangerous. Generative: failure leads to inquiry — what did our information flows fail to deliver? What can we change so that people have better or more timely information?

This maps directly to blameless postmortems and psychological safety — both associated with high-performing engineering organisations.

## Relation to Bureaucracy

Westrum's bureaucratic culture is not inherently bad. As Mark Schwartz notes: bureaucracy's goal is fairness through consistent rules — formulated by domain experts. The problem is a rule-oriented culture where following the rules matters more than achieving the mission. Well-designed rules in a generative culture become automations and guardrails, not blockers.

## Related Concepts

- [[concepts/cognitive-load]] — generative cultures reduce the extraneous cognitive load imposed by fear, politics, and information hiding
- [[concepts/deployment-pipelines]] — CD practices are the primary driver of culture improvement per Accelerate
- [[concepts/four-key-metrics]] — delivery performance metrics that Westrum culture predicts; require generative culture to avoid Goodhart's Law distortion
- [[concepts/team-topologies-model]] — Team Topologies assumes a generative culture as the baseline for its interaction modes to work
- [[concepts/conways-law]] — organisational structure shapes culture; culture shapes architecture; all three are linked
