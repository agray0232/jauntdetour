---
title: ADR 0004 State, TypeScript, and Build Tooling Sequence
description: Decision to modernize component state incrementally while deferring TypeScript and Vite migrations
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: concept
---

## Status

Accepted on 2026-07-26.

## Context

The current frontend uses React 19, class components, connected containers,
plain Redux, CRA, and JavaScript. The redesign introduces new route, shell,
planner-task, async-state, and design-token boundaries.

Changing component architecture, state library, type system, build system, and
visual structure simultaneously would make regressions difficult to isolate.

## Decision

* Write new and substantially migrated UI as function components with hooks.
* Keep shared planning state in Redux while component-local presentation state
  remains local.
* Introduce Redux Toolkit incrementally when migrating an owning state slice,
  not as a prerequisite for the shell.
* Preserve session-storage shape or provide an explicit migration so login
  redirects do not lose in-progress work.
* Defer broad TypeScript adoption. A new token, theme, or isolated component
  boundary may evaluate TypeScript separately.
* Defer CRA-to-Vite migration to a dedicated decision and change set.

## Consequences

Positive consequences:

* UI migration can begin without build-system churn.
* State modernization follows tested domain boundaries.
* Failures remain attributable to smaller changes.
* TypeScript and Vite can be evaluated using measured costs and benefits.

Costs and risks:

* JavaScript and TypeScript may coexist if incremental typing begins.
* Plain Redux and Toolkit may coexist temporarily.
* CRA limitations remain until a separate migration is approved.

## Alternatives Considered

### Redux Toolkit, TypeScript, and Vite Before UI Work

Rejected because it front-loads technical migration without validating the new
experience and increases the first release's blast radius.

### Keep All Existing Component and State Patterns

Rejected because class components and broad prop threading would make the new
shell and responsive planner harder to maintain and test.
