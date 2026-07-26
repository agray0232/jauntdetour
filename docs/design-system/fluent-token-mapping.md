---
title: JauntDetour Fluent 2 Token Mapping
description: Translation guidance from JauntDetour design tokens to Fluent 2 themes and React components
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: reference
keywords:
  - fluent ui
  - design tokens
  - react
  - theme
  - implementation handoff
estimated_reading_time: 9
---

<!-- markdownlint-disable MD013 -->

## Purpose

This mapping translates the tool-neutral
[JauntDetour tokens](../../design-system/tokens/jauntdetour.tokens.json) into a
Fluent 2 implementation direction. The JSON remains the source of truth for
brand intent. Fluent tokens provide accessible control behavior and library
consistency in the React application.

The current frontend uses `@fluentui/react-components` version `^9.74.3` and
`@fluentui/react-icons` version `^2.0.331`.

## Theme Strategy

1. Generate a full Fluent `BrandVariants` ramp from
   `color.brand.primary.default` (pine).
2. Create a light theme with Fluent's supported theme factory.
3. Override semantic tokens where JauntDetour intent is more specific than the
   generated ramp.
4. Set the functional font as Fluent's base family.
5. Expose the editorial family separately; do not replace the base family with
   Fraunces.
6. Keep heritage orange, sun, sky, map, and domain-state colors as JauntDetour semantic
   tokens consumed through styles or custom theme extensions.

The brand ramp is not yet final. Do not invent ramp steps independently in each
feature. Generate and approve one ramp before production theme implementation.

## Core Theme Mapping

| JauntDetour token | Fluent theme target | Notes |
| --- | --- | --- |
| `color.brand.primary.default` | `colorBrandBackground`, `colorBrandStroke1`, generated ramp anchor | Primary commands and brand emphasis |
| `color.brand.primary.hover` | `colorBrandBackgroundHover`, `colorBrandBackgroundPressed` | Confirm pressed contrast separately |
| `color.brand.primary.subtle` | `colorBrandBackground2` or component-level selected background | Use for quiet selection, not every brand surface |
| `color.neutral.foreground.primary` | `colorNeutralForeground1` | Main text and control foreground |
| `color.neutral.foreground.secondary` | `colorNeutralForeground2` | Supporting text and labels |
| `color.neutral.foreground.onDark` | `colorNeutralForegroundOnBrand` | White text on pine controls |
| `color.neutral.background.canvas` | `colorNeutralBackground1` | Controls and primary surfaces |
| `color.neutral.background.subtle` | `colorNeutralBackground2` | Page and application background |
| `color.neutral.background.tinted` | Component style token | Route summary and grouped content |
| `color.neutral.stroke.default` | `colorNeutralStroke1` | Borders and separators |
| `color.semantic.focus` | `colorStrokeFocus2` | Three-pixel outer focus treatment remains a component rule |
| `color.semantic.danger.foreground` | `colorPaletteRedForeground1` override only if required | Prefer Fluent semantic danger behavior when equivalent |
| `font.family.functional` | `fontFamilyBase` | DM Sans with Segoe UI fallback |
| `radius.control` | `borderRadiusMedium` candidate | Verify local Fluent token scale before override |
| `radius.surface` | Component-level card and dialog styling | Keep maximum approved surface radius at 8 pixels |

## JauntDetour Extension Tokens

Not every brand semantic belongs in Fluent's global theme. Keep these in a typed
JauntDetour token module or Griffel style constants:

| JauntDetour token | Production consumer |
| --- | --- |
| `color.brand.accent.default` | Active navigation rule, route, added stop, accent decoration |
| `color.brand.accent.strong` | Selected result, added-stop marker, accessible accent foreground |
| `color.brand.accent.onDark` | Home eyebrow and small accent text on dark media surfaces |
| `color.brand.accent.subtle` | Selected result surface |
| `color.brand.highlight.default` | Focus outline and available-result marker |
| `color.support.sky` | Route summary and informational emphasis |
| `color.map.*` | Google Maps marker and polyline factories |
| `font.family.editorial` | Wordmark and explicit display typography styles |
| `size.plannerPanel` | Responsive planner layout |
| `breakpoint.compact` | Layout query or shared responsive constant |

Do not overload Fluent's brand token with heritage orange. Pine is the product's
interaction brand; heritage orange is the spatial discovery signal.

## Component Translation

| Specimen pattern | Fluent 2 foundation | JauntDetour composition |
| --- | --- | --- |
| App header | `Button`, `Menu`, `MenuTrigger`, `MenuPopover`, router links | `AppHeader` owns identity, primary destinations, and account action |
| Build and Discover | `TabList`, `Tab` | `PlannerTaskTabs` shares planner and map state |
| Route form | `Field`, `Input`, `Button` | `RouteForm` owns labels, validation, loading, and errors |
| Category selection | `RadioGroup` and `Radio`, or single-select toggle composition | Choose the semantic primitive based on final interaction behavior |
| Range controls | Fluent `Slider` with associated `Field` and visible output | `DetourCriteria` displays route-position and radius values |
| Detour result | `Card` or semantic list item plus `Button` | `DetourResult` owns number, place data, selected state, and add action |
| Itinerary | Fluent buttons and tooltips inside semantic ordered list | `TripItinerary` owns order, stop state, reorder, and remove |
| Status chip | `Badge` where semantics fit | `TripSaveStatus` always includes explicit text |
| Save/sign-in | `Dialog`, `DialogSurface`, `DialogActions` | Preserve save intent through authentication |
| Feedback | `Toaster`, `Toast`, `ToastTitle` | Announce route, search, save, and destructive outcomes |
| My Trips actions | `Menu`, `MenuItem`, `Dialog` | Duplicate and confirmed delete |
| Pending work | `Spinner`, disabled Fluent command | Pending state belongs to the affected action or item |
| Map | Google Maps integration | Custom markers and non-map list alternative use `color.map.*` |

## Styling Boundaries

Use Fluent for:

* Accessible control primitives and interaction states
* Dialog, menu, tooltip, toast, input, tab, slider, and badge behavior
* Base semantic theme values
* Fluent iconography

Use JauntDetour compositions and styles for:

* Responsive application shell and map workspace
* Home-page editorial composition
* Result-to-marker identity
* Trip itinerary and route summary
* Map markers, route lines, and search areas
* Product imagery and brand wordmark

Do not force domain components into a generic Fluent card layout when semantic
HTML and a small composition are clearer.

## Suggested Production Modules

```text
frontend/src/
  design-system/
    jauntDetourTheme.js
    tokens.js
    typography.js
    useResponsiveLayout.js
  components/
    shell/AppHeader.jsx
    planner/PlannerWorkspace.jsx
    planner/PlannerTaskTabs.jsx
    planner/RouteForm.jsx
    planner/DetourCriteria.jsx
    planner/DetourResult.jsx
    planner/TripItinerary.jsx
    planner/TripSaveStatus.jsx
    map/TripMap.jsx
    map/TripMarker.jsx
```

Final names should follow the implementation plan and repository conventions.
This structure communicates ownership; it is not authorization for a broad
rewrite.

## Agent Handoff Rules

An implementation agent should receive:

* The target screen and accepted prototype state
* Applicable token paths, not copied hex values
* Fluent primitive and domain-component mapping
* Keyboard, focus, loading, empty, error, and responsive requirements
* Current feature-parity behavior to preserve
* Desktop and compact screenshot checks
* Explicit non-goals for the phase

Reject implementations that:

* Copy the prototype CSS wholesale
* Add raw brand hex values inside feature components
* Replace semantic elements with clickable generic containers
* Create separate desktop and mobile component trees
* Use heritage orange as the Fluent primary brand color
* Depend on map interaction for task completion
* Introduce unapproved functionality to match a mock visual

## Validation Requirements

Before approving the production theme or component:

1. Verify theme compilation against the installed Fluent version.
2. Run automated and manual contrast checks for all component states.
3. Compare the implementation with the living specimen and target prototype
   state.
4. Test keyboard navigation, visible focus, 200% zoom, and reduced motion.
5. Capture desktop and compact screenshots with the same route scenario.
6. Confirm no raw JauntDetour palette values appear outside the token/theme and
   map-style modules.
7. Confirm current route, save, load, export, and authentication behavior remains
   intact for the implemented slice.

## Open Implementation Decisions

* Tool and process for generating the Fluent pine brand ramp
* JavaScript versus TypeScript for the first token and theme modules
* Griffel `makeStyles` versus existing stylesheet boundaries during migration
* Self-hosted versus external font assets
* Whether the living component catalog begins as a development route or
  Storybook
