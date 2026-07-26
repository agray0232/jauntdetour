---
title: JauntDetour UX Redesign Prototype
description: Run and review the disposable clickable prototype for the JauntDetour design spike
author: JauntDetour Development Team
ms.date: 2026-07-25
ms.topic: concept
---

## Purpose

This standalone prototype makes the selected map-first UX direction clickable.
It is disposable design-spike code, not the foundation for the production
frontend.

The prototype uses **Jaunt** as the user-facing noun. Internal prototype IDs and
the production API remain trip-based so this language exploration does not imply
a backend or data-model rename.

The prototype uses static Atlanta-to-Charlotte data. It does not call the
JauntDetour backend, Google APIs, Entra, or the production Redux store. Leaflet
and OpenStreetMap provide map context for design review only.

## Run the Prototype

From the repository root:

```bash
cd spikes/ux-redesign-prototype
python3 -m http.server 4173
```

Open <http://localhost:4173>.

Internet access is required for the Google Fonts, Lucide, Leaflet, OpenStreetMap
tiles, and the home-page photograph loaded by the prototype.

## Suggested Review Path

1. Review the branded Home page and select **Plan your jaunt**.
2. Select **Use Atlanta to Charlotte**, then create the route.
3. Open **Discover**, adjust the route position and radius, and search the area.
4. Select Paris Mountain State Park, then select it again to add it to the jaunt.
5. Remove the detour or return to Discover to explore the state transition.
6. Save the jaunt and continue as the demo user when prompted.
7. Open **My Jaunts**, inspect the saved library, and open Carolinas weekend.
8. Resume planning from Jaunt Detail.
9. Open the signed-in account menu, review Account Info, and return to My Jaunts.
10. Repeat the flow at a narrow browser width to review the map-and-sheet model.

## Implemented Prototype States

* Branded Home, About, Account Info, and persistent navigation
* Empty, route-ready, Discover, results, selected-result, and added-detour states
* Mock route creation, search, add, remove, save, and export feedback
* Demo sign-in with automatic save resumption
* Signed-in account menu with Profile, My Jaunts, and Sign Out
* My Jaunts list, duplicate feedback, delete confirmation, and Jaunt Detail
* Resume Planning with visible loaded and saved context
* Responsive desktop and narrow-screen planner using one component tree
* Loading, status, toast, and dialog treatments representative of production
  requirements

## Deliberate Limitations

* The route geometry and place results are mock data
* Category changes do not produce different place names
* The second saved trip is illustrative rather than fully wired
* Export displays feedback instead of opening Google Maps
* State resets when the browser reloads
* The accepted visual choices are tokenized, but the prototype remains
  non-production reference code
* Accessibility semantics are representative but have not received a formal
  audit with assistive technology

## Source of Truth

Durable decisions belong in
[concept-directions.md](../../docs/ux/concept-directions.md), not in this
prototype. Follow-up implementation work should reproduce accepted behavior
using the production architecture and Fluent 2 rather than copying this static
HTML, CSS, or JavaScript directly.

Review candidate colors, typography, controls, travel patterns, and map language
in the [living design-system specimen](../../design-system/specimen/index.html).
