---
title: JauntDetour Responsive Experience Strategy
description: Responsive layout contract, viewport findings, and implementation guidance for the JauntDetour redesign
author: JauntDetour Development Team
ms.date: 2026-08-17
ms.topic: concept
keywords:
  - responsive design
  - mobile
  - tablet
  - accessibility
  - map interface
  - design spike
estimated_reading_time: 10
---

<!-- markdownlint-disable MD013 -->

## Status

This strategy records the responsive behavior validated in the disposable UX
prototype. It is an expert design and browser-layout assessment, not real-device
usability research. Production implementation must repeat these checks with the
actual React, Fluent 2, and Google Maps surfaces.

## Responsive Principle

JauntDetour uses **one planning workflow and one component tree** across screen
sizes. Layout changes by available space; task state, labels, validation, and
data ownership do not fork into desktop and mobile versions.

Desktop remains the primary pre-trip planning environment. Narrow screens are a
complete planning experience, not an on-road navigation mode. Driver-facing
navigation remains out of scope.

## Layout Modes

### Wide Workspace

Above the compact breakpoint, the planner uses a fixed tool panel beside a map
that fills the remaining width.

- Map remains the persistent spatial anchor
- Tool panel owns Build and Discover task views
- Panel content scrolls independently inside the fixed viewport
- Map never becomes the page's vertical scroll owner
- Small-laptop refinements reduce the panel from 410 to 380 pixels

### Compact Workspace

At 780 CSS pixels and below, the planner uses a persistent map with a nonmodal
tool sheet layered above it.

- The map fills the planner viewport and supports one-finger pan and pinch zoom
- Map type, camera, and zoom controls are removed to preserve map space
- The tool sheet initially rests at the balanced anchor, occupying roughly the
  lower two-fifths of the planner viewport
- The sheet can rest at any bounded height during the current planner visit
- Peek, balanced, and expanded positions act as magnetic anchors
- The sheet body owns its internal scroll; dragging starts from the handle
- The same Build and Discover components and map remain mounted once
- Header navigation remains visible above the expanded sheet

The handle provides keyboard alternatives to dragging. Arrow keys move between
adjacent magnetic anchors, Home moves to peek, and End moves to expanded. Motion
is removed when the user requests reduced motion.

At high text zoom, the compact composition is also the expected fallback even
on physically large screens because the effective CSS viewport becomes narrow.

## Validated Viewport Matrix

The browser prototype was checked on 2026-07-26 with Home, Plan, My Trips, Trip
Detail, About, and Account routes. Route-ready Discover was also checked with
the Atlanta-to-Charlotte mock scenario.

| Viewport   | Representative context  | Planner composition                     | Result                                     |
| ---------- | ----------------------- | --------------------------------------- | ------------------------------------------ |
| 1440 × 900 | Desktop                 | 410-pixel panel and 1030-pixel map      | No horizontal overflow or header collision |
| 1024 × 768 | Small laptop            | 380-pixel panel and 644-pixel map       | No horizontal overflow or workspace escape |
| 768 × 1024 | Tablet portrait         | Full map with balanced tool sheet       | Requires production validation             |
| 430 × 932  | Large phone portrait    | Full map with magnetic tool sheet       | Requires production validation             |
| 390 × 844  | Common phone portrait   | Full map with magnetic tool sheet       | Automated compact coverage active          |
| 360 × 800  | Small phone portrait    | Full map with magnetic tool sheet       | Requires production validation             |
| 320 × 568  | Minimum supported width | Full map with clamped tool sheet        | Requires production validation             |
| 844 × 390  | Large phone landscape   | Full map with height-clamped tool sheet | Requires production validation             |
| 667 × 375  | Small phone landscape   | Full map with height-clamped tool sheet | Requires production validation             |

The two discovery sliders expose 32-pixel interaction boxes at every tested
width. Buttons and icon controls use 40- to 50-pixel targets in the prototype.

## Web and Phone Best Practices

### Design by Capability and Space

Use breakpoints where the content stops fitting, not device brand names. Support
pointer, touch, keyboard, and screen-reader operation independently of viewport
width. A tablet with a keyboard may behave more like a desktop than a phone.

### Preserve One Task Model

Do not recreate the current `Sidebar` and `FooterMenu` split. Build, Discover,
results, itinerary, save, and errors use the same components and state. Change
their containing layout only.

### Avoid Hover Dependencies

Hover may enhance a result-to-marker connection, but selection, preview, add,
remove, reorder, and map synchronization must work through focus, click, and
touch. The list remains a complete alternative to map interaction.

### Protect Interaction Targets

WCAG 2.2 requires targets of at least 24 by 24 CSS pixels in most cases.
JauntDetour should normally use 40- to 44-pixel controls for touch comfort.
Sliders need a larger pointer box than their visible track.

### Manage Scroll Ownership

On desktop, the app shell owns viewport height, the map fills its region, and
the tool panel scrolls internally. On compact screens, the sheet body scrolls
while its handle owns vertical dragging and the map owns gestures outside the
sheet. Avoid nested scroll areas inside result cards or itinerary items.

### Handle Mobile Viewport Behavior

Use modern dynamic viewport units where supported and account for browser
chrome. Respect `env(safe-area-inset-*)` for installed or full-screen contexts.
Test that the virtual keyboard does not cover the focused origin, destination,
trip-name, or search control.

### Keep Map Work Optional

Direct map manipulation must not be required to plan a trip. Every marker state
has a corresponding list or itinerary item. On compact screens, moving the tool
sheet toward peek exposes more spatial detail without unmounting either surface.

### Budget for Network and Rendering Cost

Lazy-load non-critical Home imagery and avoid loading multiple map instances.
Preserve planner state while map tiles or place results load. Use skeletons or
localized pending states rather than blocking the whole screen.

### Test Zoom and Text Growth

Verify layouts at 200% browser zoom and with increased browser text size. Allow
headings, buttons, and tabs to wrap. Do not truncate trip names, result names, or
errors that the user needs to distinguish.

### Respect Motion Preferences

Use motion to explain panel and selection transitions, not decorate routine
actions. Honor `prefers-reduced-motion` and preserve immediate state feedback
without animation.

## Production Acceptance Checks

For every migrated screen or task state:

1. Test at 1440 × 900, 1024 × 768, 768 × 1024, 390 × 844, and 320 × 568 CSS
   pixels.
2. Test at least one phone landscape viewport.
3. Confirm no document-level horizontal overflow.
4. Confirm the header, account menu, map controls, and primary action do not
   overlap.
5. Confirm map and panel remain inside the visible planner workspace.
6. Confirm the affected panel or page owns scrolling intentionally.
7. Confirm all actions are keyboard reachable with visible focus.
8. Confirm touch targets meet WCAG minimums and common commands approach 44
   pixels.
9. Confirm list and map states synchronize without hover.
10. Test 200% zoom, reduced motion, slow network, empty, loading, and error
    states.
11. Capture desktop and compact screenshots for visual comparison.

## Limitations and Required Follow-Up

The current validation does not replace:

- Real iOS Safari and Android Chrome testing
- Device safe-area and browser-toolbar testing
- Virtual-keyboard testing
- Screen-reader testing with VoiceOver, TalkBack, NVDA, or JAWS
- Formal 200% zoom and text-spacing conformance checks
- Low-bandwidth and lower-powered-device performance profiling
- Usability testing with travelers

These checks should be scheduled as the corresponding production slices become
real, rather than treated as a single final accessibility pass.
