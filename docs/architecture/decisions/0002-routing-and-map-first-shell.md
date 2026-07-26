---
title: ADR 0002 Routing and Map-First Application Shell
description: Decision to adopt route-based destinations and a map-first planning workspace
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: concept
---

## Status

Accepted on 2026-07-26.

## Context

The current frontend is one map page with overlay controls. It cannot give Home,
My Jaunts, Jaunt Detail, About, or Account stable destinations. Drawers also
compete with the planning panel and toolbar.

Route-aware discovery is inherently spatial, so reducing the map to a secondary
preview would weaken the product's distinguishing task.

## Decision

Adopt React Router and a persistent application shell with these destinations:

- `/` for Home
- `/plan` for the map-first Build and Discover workspace
- `/trips` for My Jaunts
- `/trips/:tripId` for Jaunt Detail
- `/about` for About
- `/account` for Account Info

The map remains the spatial anchor in `/plan`. Build and Discover are task views
inside the same planner state. My Jaunts is a route, not a planner tab or drawer.

## Consequences

Positive consequences:

- Public, planning, saved, and account concerns have stable URLs.
- The map remains available during spatial decisions.
- Saved Jaunts can be previewed without replacing in-progress work.
- The shell can grow toward broader road-trip planning.

Costs and risks:

- Auth redirects must preserve requested destinations.
- Browser history and direct-link behavior require explicit testing.
- Existing overlay behavior needs temporary routing adapters.

## Alternatives Considered

### Persistent Map Behind Every Destination

Rejected because My Jaunts, About, Account, and future pages do not all benefit
from a full map and would compete for overlay space.

### Guided Wizard as the Primary Planner

Rejected for the current product because it reduces spatial context. Guided
task-state patterns remain useful on compact screens and for future complexity.
