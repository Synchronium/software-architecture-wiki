---
title: "MVC and Web Presentation Patterns"
type: pattern
tags: [web, mvc, presentation, frontend, http]
sources: [patterns-of-enterprise-application-architecture]
created: 2026-05-17
updated: 2026-05-17
---

# MVC and Web Presentation Patterns

## Model View Controller (MVC)

The foundational web presentation pattern. Separates three concerns:

- **Model**: domain logic and data — the real business processing
- **View**: formats the response (HTML, JSON, etc.)
- **Input Controller**: handles the HTTP request; delegates to the model; selects the view

**Flow**: request arrives at the input controller → controller extracts parameters → delegates to the domain model → model processes and returns data → controller selects a view → view renders the response using model data.

The primary reason to apply MVC is to **completely separate the model from the presentation**. This enables: swapping presentation channels without touching the domain; independent testing of domain logic; adding new presentation formats later.

(→ [[sources/patterns-of-enterprise-application-architecture]] ch. 4)

---

## Input Controller Patterns

**Page Controller** — one controller object (or server page) per page or user action. Handles the HTTP request, creates model objects to do work, instantiates the appropriate view. Simple and familiar; works well for straightforward sites. Note: actions (buttons, links) correspond more precisely than pages — one Page Controller per action. Can be mixed with Front Controller (some URLs handled each way).

**Front Controller** — a single object handles all HTTP requests. Interprets the URL to determine the request type, then creates a separate handler (command object) to process it. Centralises HTTP handling and URL interpretation. Better for sites with complex URL schemes, shared pre/post-processing (authentication, logging), or where adding new actions should not require web-server reconfiguration. Each request gets new command objects, so no thread-safety concerns. Cross-cutting behaviour (authentication, i18n, encoding) can be added as decorators without changing the core handler.

| | Page Controller | Front Controller |
|--|----------------|-----------------|
| Granularity | One controller per page/action | One controller for entire site |
| URL dispatch | Web server configuration | Single dispatcher object |
| Shared logic | Duplicated across controllers or superclass | Centralised in front controller |
| Complexity | Lower | Higher |

---

## View Patterns

**Template View** — write the response page in HTML/markup and embed code scriptlets for dynamic content. Examples: JSP, ASP, PHP, Thymeleaf, Jinja2. Natural for developers who think "inside out" (structure-first); easiest for non-programmer designers to work with alongside a programmer helper. Weaknesses: (1) logic easily leaks into templates, producing unmaintainable messes — discipline required to keep templates display-only; (2) most implementations can only be tested inside a web server, making automated testing slow or impossible.

**Transform View** — a program transforms domain data into presentation format. Classic example: XSLT transforming domain XML. Easier to test without a web server; easier to keep rendering logic separate from domain logic; XSLT is portable across J2EE and .NET. Weaknesses: XSLT is hard to learn (functional + XML syntax); tool support weaker than for HTML editors. Good fit when domain data is already in XML, or when Two Step View is needed (easier to implement with XSLT than templates).

**Two Step View** — splits rendering into two phases: (1) convert domain data into a logical presentation structure (screen-independent); (2) convert that logical structure into the final HTML (applying the site's look). **Key benefit**: a site-wide appearance change requires modifying only the one second-stage module, not every page template. One second-stage renderer for the whole application. Best for sites with consistent look-and-feel requirements, or multi-brand sites where multiple organisations want the same functionality with different looks. Limitation: requires a stable logical screen structure across all pages.

---

## Application Controller (optional)

An intermediate layer between presentation and domain that manages **screen flow and navigation logic** — which screens appear in which order, which pages follow which actions.

Holds two collections: (1) domain commands to execute; (2) views to display. Input controllers ask it which command to run and which view to show for a given application state. Can be implemented with Command objects, function references, or string-based reflective dispatch.

**Important**: the Application Controller should have no direct dependency on UI machinery (no HTTP session access, no server page forwarding). This enables testing it without a UI and reusing it across multiple presentation channels (web, rich client, mobile).

Use when the machine controls the flow (wizards, multi-step processes, conditional screen logic). Unnecessary when the user freely controls navigation. Can be implemented as a state machine with metadata-driven control flow.

Not to be confused with the "input controller" in MVC — this is a separate concern.

---

## Relationship to Domain Logic Patterns

MVC enforces the key layering rule from [[styles/layered-architecture]]: domain logic never depends on the presentation. In PEAA's model, the input controller invokes Transaction Scripts or Domain Model methods; the model objects know nothing about HTTP.

The Service Layer pattern (see [[patterns/business-logic-patterns]]) provides a clean API that the input controller can call, keeping web-specific concerns (HTTP request parsing, response serialisation) entirely in the presentation layer.

## Related Pages

- [[styles/layered-architecture]] — MVC is the presentation-layer realisation of layered architecture
- [[patterns/business-logic-patterns]] — the "Model" in MVC; input controllers delegate to these patterns
- [[concepts/api-design]] — REST APIs apply similar concerns: request routing, controller, response formatting
