---
title: JauntDetour Frontend Redesign Migration Backlog
description: Phased strangler backlog for evolving the current frontend into the accepted design direction
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: concept
keywords:
  - migration plan
  - backlog
  - frontend redesign
  - strangler pattern
  - fluent ui
estimated_reading_time: 12
---

<!-- markdownlint-disable MD013 -->

## Migration Strategy

Evolve the current application incrementally. Every phase leaves a runnable,
feature-complete frontend and removes legacy code only after its replacement is
active.

The earlier concept of a combined Build/My Trips tabbed drawer is **superseded**
by the accepted structure:

* Build and Discover are task views inside `/plan`.
* My Jaunts is a stable `/trips` destination.
* Jaunt Detail is a stable `/trips/:tripId` destination.
* Existing saved-Jaunt loading remains a preserved capability and moves behind
  the new routes when those surfaces are implemented.

## Phase 1: Foundation and Shell

Phase 1 establishes the new product identity without rewriting planner logic.

### Story 1.1: Add the JauntDetour theme foundation

Outcome: the production frontend can consume approved tokens through a Fluent 2
theme and typed or centralized extension tokens.

Acceptance criteria:

* Pine Fluent brand ramp is generated and reviewed.
* Canonical color, type, radius, spacing, map, and focus values are available
  from central modules.
* Fraunces and DM Sans load through an approved hosting strategy.
* A development-only specimen or component catalog renders core Fluent states.
* Feature components do not contain raw JauntDetour palette values.

### Story 1.2: Add routing and the application header

Outcome: Home, Plan a Jaunt, My Jaunts, About, and Account have stable routes and
a shared header.

Acceptance criteria:

* React Router is installed and configured.
* The current planner renders at `/plan` without behavior changes.
* Direct URLs, refresh, browser back, and browser forward work.
* Signed-out and signed-in account controls preserve auth behavior.
* The header collapses without overlap at documented compact widths.

### Story 1.3: Add the product-led Home route

Outcome: visitors understand JauntDetour before entering the planner.

Acceptance criteria:

* Home contains no interactive route planner or map.
* Plan Your Jaunt enters `/plan`.
* Product copy reflects implemented capabilities only.
* Real product-state imagery or a reviewed equivalent is used.
* The next section remains visible within common first viewports.

### Story 1.4: Adopt selected application icons

Outcome: favicon, Apple, installable-app, and header identity use the selected
mark.

Acceptance criteria:

* Public assets derive from the canonical SVG.
* Manifest includes 192, 512, and maskable icons.
* HTML and manifest theme colors use pine.
* Favicon requests succeed in the production build.
* The mark remains legible at 16 and 32 pixels.

## Phase 2: Unified Build Workspace

### Story 2.1: Create one responsive planner shell

Outcome: desktop and compact layouts share one component tree.

Acceptance criteria:

* Map and panel use the documented wide and compact compositions.
* Panel and map stay contained within the viewport.
* Scroll ownership is explicit.
* Current `Sidebar` and `FooterMenu` are no longer rendered simultaneously.
* Route state survives responsive layout changes.

### Story 2.2: Migrate route entry and route summary

Outcome: route creation uses Fluent fields, commands, status, and errors.

Acceptance criteria:

* Origin and destination have persistent labels.
* Route loading, empty, invalid, error, retry, and ready states exist.
* Distance, duration, edit, clear, and export behavior remain intact.
* Route changes are announced to assistive technology.

### Story 2.3: Migrate itinerary and save context

Outcome: Build shows a clear Jaunt itinerary and saved/unsaved state.

Acceptance criteria:

* Add, remove, and reorder behavior remains intact.
* Recalculation has localized pending and error states.
* Removing a stop provides recovery.
* Jaunt name, create, update, sign-in prompt, and resumed save remain intact.
* Loaded Jaunts clearly indicate update context.

## Phase 3: Discover Workspace

### Story 3.1: Migrate detour criteria

Outcome: category, route position, and radius are understandable and accessible.

Acceptance criteria:

* Controls display current values and units.
* Route percentage and radius preserve current API behavior.
* Sliders have keyboard support and adequate target size.
* Search location and radius remain synchronized with the map.

### Story 3.2: Migrate result selection and map identity

Outcome: users can compare and select detours without hover or direct map use.

Acceptance criteria:

* List rows and markers share stable numbers.
* Focus, selected, adding, added, and error states are distinct without color
  alone.
* Keyboard and touch selection work.
* Empty and failed searches explain recovery.
* Adding a result returns useful focus and route-change feedback.

## Phase 4: Saved Jaunt and Account Destinations

### Story 4.1: Replace the My Trips drawer with My Jaunts

Outcome: saved plans have a stable, browseable route.

Acceptance criteria:

* Pagination, loading, empty, error, duplicate, and confirmed delete remain.
* Opening a Jaunt goes to `/trips/:tripId`.
* Authentication returns the user to the requested destination.
* The legacy overlay drawer is removed after route parity is proven.

### Story 4.2: Add Jaunt Detail and Resume Planning

Outcome: selecting a saved Jaunt does not immediately replace in-progress work.

Acceptance criteria:

* Detail shows current saved origin, destination, route, metrics, and detours.
* Resume Planning explicitly loads the Jaunt into `/plan`.
* Duplicate, delete, and Google Maps export remain available.
* Missing or deleted Jaunts have recovery behavior.

### Story 4.3: Add account menu and Account Info

Outcome: signed-in identity and current account actions have a predictable home.

Acceptance criteria:

* Menu provides View Profile, My Jaunts, and Sign Out.
* Menu supports pointer, touch, arrow keys, Home, End, and Escape.
* Account Info is read-only and identifies Entra as the profile owner.
* Sign out preserves current security and session-clearing behavior.

## Phase 5: Legacy Retirement and Modernization

### Story 5.1: Retire duplicate and legacy UI dependencies

* Remove `FooterMenu`, legacy sidebar-only layout, and jQuery interactions once
  no route depends on them.
* Remove Bootstrap and Font Awesome usage only after all consumers migrate.
* Delete superseded CSS rather than leaving hidden fallback paths.

### Story 5.2: Modernize state incrementally

* Move touched slices to function components and hooks.
* Introduce Redux Toolkit around clear domain slices if it reduces action and
  reducer complexity.
* Preserve session-storage compatibility during migration.
* Do not combine state modernization with unrelated feature work.

### Story 5.3: Evaluate TypeScript and Vite separately

* Prototype TypeScript at a new component or token boundary.
* Measure CRA-to-Vite migration benefit and CI impact independently.
* Adopt either only through a separate ADR and implementation plan.

## Sequencing Rules

* Do not begin Phase 3 before the unified planner shell and Build route are
  stable.
* My Jaunts routing can start after Phase 1, but legacy drawer removal waits for
  Phase 4 parity.
* Use vertical slices with tests rather than building every visual component
  before behavior.
* Keep backend and API changes out of this migration unless a separately scoped
  feature requires them.
* Verify current frontend tests after every phase and add focused tests for each
  migrated behavior.

## Completion Signal

The redesign migration is complete when the selected routes and component
states are implemented, feature parity is preserved, one responsive component
tree serves all viewports, the design system is the sole source for new visual
values, and the superseded sidebar/footer/drawer paths are removed.
