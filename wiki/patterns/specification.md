---
title: "Specification Pattern"
type: pattern
tags: [ddd, domain-driven-design, business-logic, value-object, tactical-design]
sources: [domain-driven-design]
created: 2026-05-14
updated: 2026-05-14
---

# Specification Pattern

## Definition

A Specification is a predicate VALUE OBJECT that tests whether another object satisfies stated criteria. It encapsulates a rule as a first-class object, keeping it in the domain layer rather than scattered across conditional logic in entities, application services, or repositories (→ [[sources/domain-driven-design]] ch. 9).

## The Problem It Addresses

Business rules often don't fit the responsibility of any obvious entity or value object. Moving them into the application layer removes them from the domain. Keeping them inside an entity that doesn't own them creates coupling and bloat. Without Specification, the same rule may show up in different forms in validation code, query code, and generation code — each a separate maintenance burden.

## Three Uses of Specification

### Validation
Test whether an individual domain object satisfies a rule:

```java
boolean isSatisfiedBy(Invoice candidate) {
    Date firmDeadline = DateUtility.addDaysToDate(
        candidate.dueDate(), candidate.customer().getPaymentGracePeriod());
    return currentDate.after(firmDeadline);
}
```

### Selection (Querying)
Filter a collection or generate a database query. The repository provides a generic entry point:

```java
// Collection-based (small sets)
Set results = invoiceRepository.selectSatisfying(spec);

// Database-based (large sets): Specification generates SQL or delegates
// to a specialised repository query method
```

Specifications mesh naturally with [[patterns/repository]]: the repository exposes `selectSatisfying(Specification)`, and the Specification controls which query runs. The rule stays in the domain layer; the SQL stays in the infrastructure layer.

### Building to Order (Generation)
Specify what a generator must produce. The same Specification that constrains the generated object can be used in validation role to confirm the result is correct. Decouples the *what* (stated by the Specification) from the *how* (implemented by the generator/factory).

## Composite Specification

Specifications can be combined with AND/OR/NOT, just as predicates are combined with logical operators. This creates a declarative style for expressing complex rules:

```java
Specification ventilated = new ContainerSpecification(VENTILATED);
Specification armored = new ContainerSpecification(ARMORED);
Specification both = ventilated.and(armored);

Specification cheap = ventilated.not().and(armored.not());
```

AND/OR/NOT compose via the COMPOSITE pattern. The operations are closed under the Specification set — combining Specifications produces Specifications, introducing no new concepts.

## Subsumption

A more stringent Specification subsumes a less stringent one: if the new Spec would be satisfied, the old Spec would also be satisfied. Enables requirements comparison — "which chemical types now have more stringent handling rules?" — by directly comparing Specifications rather than running instances.

Subsumption is equivalent to logical implication (A→B). General subsumption proofs are hard; specific parameterised cases (e.g., `MinimumAgeSpecification` subsumes another if its threshold is higher) are tractable.

## Design Notes

- A Specification is a VALUE OBJECT: it carries no identity, should be immutable, and can be shared.
- The Factory can configure a Specification with data from external sources (customer account status, corporate policy database) without coupling that data to the Invoice or other evaluated objects.
- When the full composite feature set (AND/OR/NOT + subsumption) is not needed, implement only what the domain requires. AND alone covers most practical cases and is simpler to implement efficiently.
- Where the ORM framework supports expressing queries in terms of domain objects, the Specification's SQL generation can be pushed down to the infrastructure layer, keeping table structure out of the domain.

## Related Pages

- [[patterns/domain-model]] — Specification is an explicit constraint modelled as a VALUE OBJECT within the domain model
- [[patterns/repository]] — repositories implement `selectSatisfying(Specification)` to push query responsibility to the Specification
- [[concepts/ubiquitous-language]] — Specification names (DelinquentInvoiceSpecification, OverbookingPolicy) must speak the UL
- [[concepts/supple-design]] — composite Specification with AND/OR/NOT exhibits Closure of Operations; using it in client code is a declarative style of design
