---
title: JauntDetour Brand and UI Foundations
description: Human-readable guidance for the JauntDetour visual identity, design tokens, and UI foundations
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: concept
keywords:
  - design system
  - brand
  - visual design
  - color
  - typography
  - design tokens
estimated_reading_time: 12
---

<!-- markdownlint-disable MD013 -->

## Status

These foundations are an **exploratory candidate**, accepted as the starting
direction for the JauntDetour redesign. They reflect stakeholder review of the
clickable UX prototype. They have not received formal brand review or user
validation.

The system should evolve through named tokens and documented component states,
not isolated color or spacing changes in production CSS.

### Selected Direction

| Decision                   | Selection                                                                                      | Recorded   |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| Primary interaction hue    | Pine-teal (`#12664f`)                                                                          | 2026-07-26 |
| Route and discovery accent | Warm heritage orange (`#e36a2e`) with strong companion (`#b84a18`)                             | 2026-07-26 |
| Typography                 | Fraunces for identity and editorial headings; DM Sans for controls, body, and data             | 2026-07-26 |
| Product noun               | Jaunt for user-facing saved and in-progress plans                                              | 2026-07-26 |
| Brand mark                 | Pine route badge with white endpoints and one heritage-orange discovery on the upper-left bend | 2026-07-26 |

The living specimen retains rejected alternatives in its Review Lab so future
changes can be compared against the accepted context rather than reconsidered
from memory.

### Brand Mark Status

The route/discovery badge is **selected for development handoff**. It preserves
the prototype's route geometry inside a pine circular badge, keeps the route and
two endpoints white, and places one heritage-orange discovery directly on the
upper-left bend. The discovery uses the accepted "one deviation or discovery"
grammar without adding a second route branch.

Canonical and generated assets are available in the
[brand asset package](../../design-system/assets/brand/README.md). The SVG is the
editable source; PNG and ICO files are generated derivatives.

The Review Lab retains the original twelve pine-teal and heritage-orange
candidates as exploration history:

- Route J
- Waypoint J
- JD Crossroads
- Scenic Bend
- Compass Turn
- Map Fold
- Detour Loop
- Spark Route
- Mile Marker
- Split Route
- Open Road
- Pin & Path

Evaluate marks in three contexts: standalone at application-icon size, at a
20-pixel navigation lockup size, and beside the JauntDetour wordmark. Prefer a
distinct silhouette, clear two-color behavior, and legibility without relying
on small internal detail. Familiar travel symbolism helps comprehension, but a
generic map pin, compass, or folded map needs a more ownable construction before
selection.

#### Focused Map and Path Round

A second exploration round responds to two preferred directions: Map Fold and
the prototype's S-shaped route. It adds thirteen candidates, M through Y:

- Folded S Route
- Folded Detour Dot
- Folded Detour Loop
- Map Panels Route
- Map Window Find
- Map Spark Detour
- Heritage S Route
- S Route Find
- S Route Rejoin
- S Route Waypoint
- S Route Spark
- S in Map Fold
- Prototype Orange Discovery

The preferred detour grammar is a pine original route plus one heritage-orange
deviation or discovery. Use only one of these ideas in a final mark: an off-route
point, a branch, a leave-and-rejoin loop, a waypoint, or a discovery spark. If
the detour cannot be distinguished in the 20-pixel lockup test, remove detail
rather than adding contrast, labels, or extra symbols.

Prototype Orange Discovery was selected and refined by restoring white
endpoints, moving the orange discovery onto the route's upper-left curve, and
increasing its size until it remained legible at favicon scale.

## Review the System

Run the living design-system specimen from the repository root:

```bash
python3 -m http.server 4174
```

Open <http://localhost:4174/design-system/specimen/>.

The specimen includes rendered colors, contrast pairings, typography, spacing,
shape, controls, status treatments, result cards, itinerary patterns, and map
markers. Its color swatches and spacing scale load from the canonical token
JSON at runtime.

## Source-of-Truth Order

Use this precedence when artifacts differ:

1. [JauntDetour token JSON](../../design-system/tokens/jauntdetour.tokens.json)
   owns foundation values such as color, type, spacing, radius, size, shadow,
   motion, and breakpoints.
2. [Brand and UI foundations](foundations.md) owns semantic usage guidance.
3. [Fluent 2 token mapping](fluent-token-mapping.md) owns translation into the
   production component library.
4. The [living specimen](../../design-system/specimen/index.html) demonstrates
   tokens and approved pattern direction.
5. The [UX redesign prototype](../../spikes/ux-redesign-prototype/README.md)
   demonstrates accepted screen composition and interaction flow.
6. Production components become authoritative for implemented behavior only
   after they satisfy the approved specification and visual review.

The prototype's CSS is not a token source and should not be copied into the
React application.

## Brand Character

### Adventurous

JauntDetour should feel curious and open to discovery without becoming visually
chaotic. Use expressive imagery, the heritage-orange route signal, and occasional warm
highlights. Keep the planning workspace orderly and readable.

### Curated

Present a considered hierarchy rather than an undifferentiated collection of
options. Use whitespace, progressive detail, and persistent list-to-map identity
to help each suggestion earn attention.

### Premium

Premium means confident typography, deliberate composition, complete states,
and restraint. It does not mean ornamental decoration, large gradients, heavy
glass effects, or excessive elevation.

## Color Strategy

Color names in discussion may use familiar pigment names, but implementation
must use semantic token paths.

| Role                    | Candidate                            | Primary use                                                             | Avoid                                                     |
| ----------------------- | ------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| Pine                    | `color.brand.primary.default`        | Primary commands, brand mark, trusted interactive emphasis              | Large monochrome page backgrounds                         |
| Pine dark               | `color.brand.primary.hover`          | Hover, pressed, and strong brand contrast                               | Replacing primary ink throughout the page                 |
| Heritage orange         | `color.brand.accent.default`         | Route line, discoveries, and active navigation                          | Normal-size white text or large filled surfaces           |
| Heritage orange strong  | `color.brand.accent.strong`          | Accessible accent text, selected state, and numbered added-stop markers | Routine primary actions                                   |
| Heritage orange on dark | `color.brand.accent.onDark`          | Small emphasized text on dark media and ink surfaces                    | Light surfaces or filled controls                         |
| Sun                     | `color.brand.highlight.default`      | Focus outline, available-result markers, temporary highlight            | Long-form text backgrounds or success status              |
| Sky                     | `color.support.sky`                  | Informational edge, route-summary emphasis                              | Primary action or decorative page wash                    |
| Ink                     | `color.neutral.foreground.primary`   | Primary text, structural dark surfaces, endpoints                       | Treating it as generic black without semantic intent      |
| Ink soft                | `color.neutral.foreground.secondary` | Secondary text and supporting labels                                    | Essential actions or low-contrast text on tinted surfaces |
| Canvas                  | `color.neutral.background.canvas`    | Controls and primary content surface                                    | Removing surface hierarchy everywhere                     |
| Cloud                   | `color.neutral.background.subtle`    | Page background and alternating content band                            | Nested cards inside cards                                 |
| Mist                    | `color.neutral.background.tinted`    | Grouped content and route summary                                       | Making every section green-tinted                         |

### Contrast Rules

| Pairing                         | Ratio   | Approved use                                    |
| ------------------------------- | ------- | ----------------------------------------------- |
| Ink on canvas                   | 15.28:1 | All text sizes                                  |
| Ink soft on canvas              | 7.61:1  | All text sizes                                  |
| White on pine                   | 6.91:1  | All text sizes and controls                     |
| White on pine dark              | 9.96:1  | All text sizes and controls                     |
| White on heritage orange        | 3.30:1  | Large text and non-text UI only                 |
| White on heritage orange strong | 5.21:1  | All text sizes and controls                     |
| Ink on heritage orange          | 4.63:1  | Normal text when an accent surface is necessary |
| Heritage orange on dark on ink  | 6.79:1  | Small emphasized text on dark surfaces          |
| Ink on sun                      | 8.54:1  | Focus and highlighted content                   |
| Ink on sky                      | 10.73:1 | Informational content                           |
| Ink on mist                     | 13.72:1 | Grouped and summary content                     |
| Danger on canvas                | 6.57:1  | Destructive text and icons                      |

Never use color as the only state distinction. Pair it with marker numbering,
labels, iconography, border treatment, or status text.

## Typography

### Editorial Family

Use `font.family.editorial` (Fraunces with Georgia fallback) for:

- JauntDetour wordmark
- Home-page statement and major page title
- High-value section headings
- Selected editorial moments in empty states

Do not use it for form labels, buttons, result details, itinerary metadata,
navigation, or dense planning information.

### Functional Family

Use `font.family.functional` (DM Sans with Segoe UI fallback) for:

- Navigation and controls
- Inputs and field labels
- Body and supporting copy
- Route metrics and itinerary content
- Status, caption, and map legend text

Production should verify the font-loading and privacy strategy before adopting
Google-hosted font files. Self-hosting is a valid implementation choice.

### Hierarchy Rules

- Use display scale only for true product statements, never in the planning
  panel.
- Use title and title-small roles for pages and task views.
- Keep control labels and itinerary data in the functional family.
- Use uppercase captions sparingly, with positive letter spacing.
- Do not scale font size continuously with viewport width. Use bounded roles and
  explicit responsive adjustments.

## Spacing and Shape

The spacing system uses a four-pixel base and named steps from `space.1` through
`space.9`. Prefer a token rather than an arbitrary value. A component may use a
non-token size only when a documented map or browser integration requires it.

Use `radius.control` (6 pixels) for buttons, inputs, tabs, and compact controls.
Use `radius.surface` (8 pixels) for cards, dialogs, and grouped surfaces. Reserve
`radius.round` for map markers, avatars, status dots, and genuinely circular
controls.

Do not turn page sections into floating rounded cards. Elevation communicates
overlap, such as dialogs, menus, product-preview layers, and map context. Normal
document sections should rely on spacing, borders, and background bands.

## Command Hierarchy

### Primary Command

Use pine background with white text. Each region should normally have one
primary command: Plan Your Jaunt, Create Route, Search This Area, Add to Jaunt,
or Save Jaunt.

The Home hero's Plan Your Jaunt command is the approved exception: heritage
orange with ink text (`4.63:1`) connects the branded entry moment to the route
and discovery signal. Its hover state uses heritage-orange-strong with white
text (`5.21:1`). Planning-workspace primary commands remain pine.

### Secondary Command

Use a canvas surface with a neutral border. Secondary commands support or exit
the primary task, such as Google Maps, Duplicate, Cancel, or Edit.

### Text Command

Use pine foreground without a containing shape for low-emphasis contextual
actions such as Edit Route or Clear Results.

### Icon Command

Use a familiar Fluent icon, visible focus, accessible name, and stable target.
Reserve icon-only controls for widely understood actions or constrained
surfaces. Provide a tooltip when the symbol may be unfamiliar.

## Domain Patterns

### Build and Discover

Build and Discover are task views inside the same planning workspace. Use a tab
pattern with an accent rule, not filled pill buttons. Both views share trip and
map state.

### Detour Result

A result carries a stable number shared with its map marker, place name,
category, rating, and state-specific command. Selected results use border,
background, command text, and marker treatment together.

### Itinerary

The itinerary uses ordered markers and a connecting line to express sequence.
Origin and destination use ink endpoints; added stops use the heritage-orange route
signal. Reorder and remove actions remain keyboard operable and do not depend on
dragging.

### Route Summary

Use a mist surface and sky edge to group distance, drive time, and change. Keep
the values typographically prominent without turning them into dashboard cards.

### Jaunt Save Status

Status chips communicate saved, unsaved, pending, success, warning, or failure.
They use semantic foreground, subtle background, border, and explicit text.
Status must never be represented by color alone.

## Map Language

| State                  | Token                  | Shape and label                                                  |
| ---------------------- | ---------------------- | ---------------------------------------------------------------- |
| Route                  | `color.map.route`      | Heritage-orange line with sufficient contrast against tiles      |
| Origin and destination | `color.map.endpoint`   | Ink circular marker labeled A and B                              |
| Available result       | `color.map.result`     | Sun circular marker with stable result number                    |
| Selected result        | `color.map.selected`   | Heritage-orange-strong numbered marker with outer selection ring |
| Added stop             | `color.map.stop`       | Heritage-orange-strong numbered marker matching itinerary order  |
| Search area            | `color.map.searchArea` | Pine stroke with translucent fill                                |

The list must provide a complete alternative to direct map interaction. Focus,
selection, and hover synchronize between list and marker without moving focus
unexpectedly.

## Imagery

Use real travel landscapes, routes, destinations, or real product states. Hero
imagery should establish a sense of movement and possibility while preserving
clear text contrast. Product demonstrations should show readable route,
discovery, and itinerary content rather than decorative browser chrome.

Avoid generic lifestyle photography that does not show travel context, heavily
blurred scenery, decorative illustration in place of the real product, or
unsupported social-proof imagery.

## Governance

When changing a foundation:

1. Update the canonical token JSON.
2. Update semantic guidance when the intended usage changes.
3. Update the Fluent mapping if the production token changes.
4. Confirm the living specimen renders the new value.
5. Recalculate affected contrast pairings.
6. Review representative Home, Plan, My Jaunts, and Jaunt Detail states at desktop
   and narrow widths.
7. Record material visual changes in the relevant decision or pull request.

Do not edit the fallback values in the specimen CSS as a substitute for changing
the JSON token. The fallback exists only to prevent an unreadable loading flash.

## Open Decisions

- Final font hosting and licensing approach
- Final Fluent brand ramp derived from pine
- Whether heritage orange needs additional tonal steps for charts or future states
- Dark-theme demand and timing; no dark theme is approved yet
- Final image licensing and production asset strategy
- Formal accessibility review of all component and map states
