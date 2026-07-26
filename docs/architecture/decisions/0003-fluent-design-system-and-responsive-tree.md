---
title: ADR 0003 Fluent Design System and One Responsive Component Tree
description: Decision to use Fluent 2 with JauntDetour tokens and one responsive UI implementation
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: concept
---

## Status

Accepted on 2026-07-26.

## Context

The frontend mixes custom CSS, Bootstrap-style markup, Font Awesome, jQuery, and
new Fluent 2 components. Desktop and mobile planning surfaces render duplicated
component instances and can diverge in behavior and accessibility.

Fluent provides accessible interaction primitives but does not by itself express
the adventurous, curated, and premium JauntDetour identity.

## Decision

* Use Fluent 2 for accessible controls, dialogs, menus, tabs, fields, sliders,
  toasts, badges, and tooltips.
* Use the canonical JauntDetour token JSON as the visual source of truth.
* Use pine as the Fluent interaction brand and heritage orange as the route and
  discovery signal.
* Use custom domain compositions for the map, result identity, itinerary, route
  summary, and editorial Home layout.
* Render one component tree across viewports. CSS changes layout; JavaScript
  manages behavior and state.
* Do not copy static prototype CSS into production.

## Consequences

Positive consequences:

* Controls inherit tested Fluent behavior.
* Brand values stay centralized and reviewable.
* Desktop and mobile behavior cannot silently fork by component duplication.
* Domain patterns remain visually distinctive.

Costs and risks:

* A reviewed Fluent pine brand ramp must be generated.
* Custom map and itinerary patterns require focused accessibility work.
* Legacy and tokenized styles coexist during migration.

## Alternatives Considered

### Fully Custom Production Component Library

Rejected because it would recreate common accessible control behavior and expand
maintenance cost.

### Unmodified Fluent Theme and Generic Layouts

Rejected because it would produce an interchangeable enterprise interface and
lose JauntDetour's consumer travel character.

### Separate Desktop and Mobile Components

Rejected because the current duplication already causes maintenance and semantic
risks.
