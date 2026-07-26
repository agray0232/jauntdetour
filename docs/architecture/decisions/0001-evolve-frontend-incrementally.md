---
title: ADR 0001 Incremental Frontend Evolution
description: Decision to migrate the JauntDetour frontend incrementally instead of performing a greenfield rewrite
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: concept
---

## Status

Accepted on 2026-07-26.

## Context

JauntDetour has working route, detour, authentication, persistence, saved-Jaunt,
and Google Maps export behavior. The frontend also has substantial legacy UI:
class components, prop threading, custom and Bootstrap-style CSS, jQuery, and
separate desktop and mobile rendering paths.

A greenfield rewrite would delay user-visible improvement and create a broad
feature-parity and regression burden.

## Decision

Use a strangler migration around the running frontend.

* Establish the application shell, routing, theme, and assets first.
* Keep the current planner operational at `/plan`.
* Migrate Build, Discover, My Jaunts, Jaunt Detail, and Account in vertical
  slices.
* Remove legacy components and dependencies only after no active route uses
  them.
* Preserve backend, auth, database, and API contracts during the redesign.

## Consequences

Positive consequences:

* The application remains usable after every phase.
* Existing tests and behavior provide migration safety.
* Visual progress reaches users before full modernization completes.
* Technical modernization can follow real ownership boundaries.

Costs and risks:

* Legacy and new patterns coexist temporarily.
* Transitional adapters may be required.
* Teams must actively remove superseded paths to avoid permanent duplication.

## Alternatives Considered

### Greenfield React Application

Rejected because it duplicates proven behavior and concentrates migration risk
into one release.

### Cosmetic Restyle Only

Rejected because it would preserve the single-page information architecture,
duplicated responsive workflows, and inaccessible interaction gaps.
