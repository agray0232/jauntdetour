---
title: JauntDetour Frontend Redesign Implementation Session Plan
description: Agent-ready implementation briefs for every phase of the JauntDetour frontend redesign
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: concept
keywords:
  - implementation plan
  - development agent
  - frontend redesign
  - react
  - fluent ui
  - migration
estimated_reading_time: 24
---

<!-- markdownlint-disable MD013 MD024 -->

## Purpose

Use this document to scope development-agent sessions. The
[development handoff](development-handoff.md) explains the accepted destination;
the [migration backlog](migration-backlog.md) defines product stories; this plan
defines bounded implementation sessions with explicit stopping points.

Do not ask one agent to implement the entire redesign. Each session should
produce a reviewable branch or pull request with the application runnable and
the existing test suite green.

## Session Operating Rules

Every session prompt should:

1. Name one session from this plan.
2. Require the agent to inspect current code and tests before editing.
3. Include the listed source-of-truth artifacts.
4. Preserve the listed behavior contracts.
5. Repeat the session's non-goals.
6. Require focused tests, regression tests, lint, and build.
7. Require desktop and compact browser checks when UI changes.
8. Stop at the stated completion boundary.

Agents must follow [.github/copilot-instructions.md](../../.github/copilot-instructions.md)
and use Jaunt in visible copy while preserving internal trip contracts.

## Phase and Session Map

| Migration phase                       | Recommended sessions               | Pull request guidance                               |
| ------------------------------------- | ---------------------------------- | --------------------------------------------------- |
| Phase 1: Foundation and Shell         | Sessions 1–3                       | Three pull requests                                 |
| Phase 2: Unified Build Workspace      | Sessions 4–5                       | At least two pull requests                          |
| Phase 3: Discover Workspace           | Session 6                          | One or two pull requests based on map coupling      |
| Phase 4: Saved Jaunt and Account      | Sessions 7–8                       | Two pull requests                                   |
| Phase 5: Retirement and Modernization | Session 9 plus separate follow-ups | Cleanup PR plus independent modernization decisions |

## Session 1: Production Design-System Foundation

### Goal

Create production-consumable JauntDetour tokens, Fluent theme, typography, brand
mark, and a small development-only component catalog without changing the
current planner layout.

### Read Before Editing

- [Development handoff](development-handoff.md)
- [Brand and UI foundations](../design-system/foundations.md)
- [Fluent 2 mapping](../design-system/fluent-token-mapping.md)
- [Canonical tokens](../../design-system/tokens/jauntdetour.tokens.json)
- [Brand assets](../../design-system/assets/brand/README.md)
- [ADR 0003](../architecture/decisions/0003-fluent-design-system-and-responsive-tree.md)
- [ADR 0004](../architecture/decisions/0004-state-typescript-and-build-tooling.md)

### Likely Ownership Surfaces

- `frontend/src/index.js`
- New `frontend/src/design-system/` modules
- New development-only catalog component or route boundary
- `frontend/public/` icon files
- `frontend/public/manifest.json`
- `frontend/public/index.html`

### Implementation Scope

- Translate canonical JSON values into centralized JavaScript token exports.
- Generate and document one complete Fluent `BrandVariants` ramp anchored on
  pine `#12664f`.
- Create the JauntDetour light theme and replace `webLightTheme` at the provider.
- Keep heritage orange, map colors, editorial type, and layout values as
  JauntDetour extension tokens rather than overloading Fluent brand semantics.
- Add Fraunces and DM Sans through an approved production font-loading strategy.
- Add a reusable brand-mark component sourced from the canonical SVG.
- Adopt favicon, Apple, 192, 512, and maskable assets in public metadata.
- Add a small development-only catalog that renders theme colors, typography,
  buttons, inputs, tabs, badges, dialog, toast, and focus states.

### Preserve

- Existing app startup and Redux provider behavior
- Existing route planner rendering
- Existing auth and session behavior
- Existing frontend public URL behavior

### Non-Goals

- No React Router
- No new Home page
- No planner restyling
- No Redux, TypeScript, Vite, backend, API, or database migration
- No copying CSS from the static specimen or prototype

### Validation

- Add focused token and theme tests where stable assertions are valuable.
- Verify approved contrast pairings.
- Render the catalog at 1440 × 900 and 390 × 844.
- Run frontend lint, full tests, and production build.
- Verify favicon, manifest, font, and SVG requests in the production build.

### Stop When

Production has a centralized, tested design-system foundation and selected brand
assets, while the current planner looks and behaves substantially unchanged.

## Session 2: Router and Shared Application Shell

### Goal

Add stable destinations and a persistent responsive header while mounting the
current planner unchanged at `/plan`.

### Dependencies

Session 1 is merged.

### Read Before Editing

- [Development handoff](development-handoff.md)
- [Concept directions](concept-directions.md)
- [Responsive strategy](responsive-strategy.md)
- [ADR 0002](../architecture/decisions/0002-routing-and-map-first-shell.md)
- [ADR 0003](../architecture/decisions/0003-fluent-design-system-and-responsive-tree.md)

### Likely Ownership Surfaces

- `frontend/package.json`
- `frontend/src/index.js`
- `frontend/src/App.js`
- New `frontend/src/components/shell/`
- New placeholder page components
- `frontend/src/components/header/AuthButton.jsx`
- `frontend/src/scripts/AuthRequester.js`

### Implementation Scope

- Add the supported React Router package and configure browser routing.
- Create routes for `/`, `/plan`, `/trips`, `/trips/:tripId`, `/about`, and
  `/account`.
- Mount `MainContainer` unchanged at `/plan`.
- Add `AppHeader` with the brand mark, Plan a Jaunt, My Jaunts, About, and
  account control.
- Add lightweight placeholders for routes not implemented yet. Do not imply
  unsupported functionality.
- Preserve requested destinations through sign-in redirects where feasible with
  the current auth flow; document any required follow-up.
- Ensure direct `/plan` navigation and refresh work in local and production-like
  hosting.

### Preserve

- Session-storage planning state and logout clearing
- Anonymous planner access
- Entra redirect and return behavior
- Existing My Trips drawer until Session 7
- Existing toolbar actions until routed replacements are complete

### Non-Goals

- No planner shell redesign
- No full Home, My Jaunts, Jaunt Detail, or Account Info implementation
- No removal of legacy header, drawer, sidebar, or footer paths

### Validation

- Add route and header tests for signed-out and signed-in states.
- Test direct navigation, refresh, back, forward, and unknown routes.
- Test the header at 1440, 1024, 768, 390, and 320 CSS pixels.
- Run frontend lint, full tests, and production build.

### Stop When

The application has stable routes and a shared header, and every existing
planner workflow still functions at `/plan` without relying on later page work.

## Session 3: Product-Led Home and About

### Goal

Implement the accepted public Home experience and a truthful About destination
using production React, Fluent commands, canonical tokens, and reviewed media.

### Dependencies

Sessions 1 and 2 are merged.

### Read Before Editing

- [Shared Home direction](concept-directions.md#shared-home-direction)
- [Brand and UI foundations](../design-system/foundations.md)
- [Responsive strategy](responsive-strategy.md)
- [Clickable prototype](../../spikes/ux-redesign-prototype/README.md)

### Likely Ownership Surfaces

- New `frontend/src/pages/HomePage.jsx`
- New `frontend/src/pages/AboutPage.jsx`
- Home-specific styles
- Reviewed production image assets
- Router configuration from Session 2

### Implementation Scope

- Implement the editorial hero, product preview composition, Plan Your Jaunt
  entry, three-value sequence, walkthrough, and footer.
- Keep all route-entry fields and map interactions out of Home.
- Use the approved orange Home CTA exception and on-dark accent token.
- Use real product states or reviewed assets, with loading and unavailable-media
  behavior.
- Implement About using current product capabilities and no unsupported claims.
- Ensure content remains coherent without imagery.

### Preserve

- Direct `/plan` access
- Anonymous planning
- Current sign-in behavior

### Non-Goals

- No planner changes
- No testimonials, press claims, usage counts, subscriptions, or app-download
  claims
- No sharing, collaboration, live navigation, or recommendation claims

### Validation

- Add page and navigation tests.
- Verify landmarks, heading order, alt text, keyboard access, media failure, and
  reduced motion.
- Verify desktop and compact first viewports retain a hint of the next section.
- Run frontend lint, full tests, and production build.

### Stop When

Home and About establish the accepted identity and lead naturally into the
unchanged `/plan` planner.

## Session 4: One Responsive Planner Shell

### Goal

Replace separate desktop and mobile planner containers with one responsive
workspace while retaining existing child behavior.

### Dependencies

Sessions 1 and 2 are merged. Session 3 is recommended but not structurally
required.

### Read Before Editing

- [Development handoff](development-handoff.md)
- [Responsive strategy](responsive-strategy.md)
- [Concept A](concept-directions.md#concept-a-map-first-workspace)
- [Current-state audit](current-state-audit.md)
- [ADR 0003](../architecture/decisions/0003-fluent-design-system-and-responsive-tree.md)

### Likely Ownership Surfaces

- `frontend/src/components/Main.jsx`
- `frontend/src/containers/MainContainer.js`
- `frontend/src/components/sidebar/Sidebar.jsx`
- `frontend/src/components/footer-menu/FooterMenu.jsx`
- `frontend/src/components/header/Header.jsx`
- `frontend/src/components/MapContainer.jsx`
- `frontend/src/styles/App.css`
- New planner-shell and task-tab components

### Implementation Scope

- Create `PlannerWorkspace` with one map region and one tool region.
- Create Build and Discover tabs without migrating child controls yet.
- Host existing route, summary, and itinerary controls in Build and existing
  detour controls and results in Discover through temporary adapters.
- Render each workflow component exactly once.
- Implement wide panel/map and compact map/tool composition.
- Preserve the map instance and Redux state across responsive changes and tabs.
- Implement explicit scroll ownership and compact Show Map behavior.

### Preserve

- Every current route, detour, save, export, and map behavior
- Existing Redux action and requester contracts
- Existing My Trips drawer until Session 7
- Current session-storage shape

### Non-Goals

- No detailed Build or Discover control redesign
- No My Jaunts route implementation
- No broad state or requester rewrite
- Do not delete legacy containers before parity is proven

### Validation

- Prove only one route form, summary, detour form, result list, and itinerary
  instance render.
- Exercise route creation, search, add, remove, reorder, save, load, and export
  before and after resizing.
- Validate the full responsive viewport matrix, 200% zoom, keyboard traversal,
  reduced motion, and map resize behavior.
- Run frontend lint, full tests, and production build.

### Stop When

One component tree owns the planner at every viewport and all existing child
workflows operate, even if some controls retain legacy styling.

## Session 5: Build Workflow Migration

### Goal

Replace the Build task's legacy controls with accessible Fluent compositions and
complete asynchronous feedback while preserving current business behavior.

### Dependencies

Session 4 is merged.

### Read Before Editing

- [Component handoff](development-handoff.md#component-handoff)
- [Establish the Drive](planning-journey.md#stage-2-establish-the-drive)
- [Brand and UI foundations](../design-system/foundations.md)
- [Fluent 2 mapping](../design-system/fluent-token-mapping.md)

### Likely Ownership Surfaces

- `frontend/src/components/sidebar/UserInput.jsx`
- `frontend/src/components/sidebar/TripSummary.jsx`
- `frontend/src/components/sidebar/TripTimeline.jsx`
- `frontend/src/components/sidebar/TimelineItem.jsx`
- `frontend/src/components/sidebar/TripNameField.jsx`
- `frontend/src/components/sidebar/SaveTrip.jsx`
- `frontend/src/scripts/RouteRequester.js`
- `frontend/src/utils/googleMapsExport.js`
- `frontend/src/reducers/main-reducer.js`

### Implementation Scope

- Replace route inputs with labeled Fluent fields and validation.
- Add route loading, no-route, request error, and retry states.
- Implement route summary and itinerary with semantic domain patterns.
- Preserve add, remove, reorder, and route recalculation behavior.
- Add localized recalculation pending/error and removal recovery.
- Make Jaunt name and saved, unsaved, dirty, and update context explicit.
- Preserve save-intent sign-in, resumed save, and Google Maps export.
- Convert touched owners to function components where practical.

### Preserve

- Route and detour payloads
- Redux and session-storage compatibility
- Save versus update behavior for a loaded Jaunt
- Backend endpoints and authorization behavior
- Discover behavior through its temporary adapter

### Non-Goals

- No detour criteria or result redesign
- No My Jaunts or Jaunt Detail migration
- No broad Redux Toolkit conversion
- No backend changes

### Validation

- Test validation, loading/error/retry, itinerary mutation, recalculation, save,
  auth resumption, and export.
- Verify keyboard reorder, removal recovery, and status announcements.
- Run the responsive matrix, 200% zoom, lint, full tests, and build.

### Stop When

Build is production-quality and legacy Build components and styles can be
removed without changing Discover or saved-Jaunt behavior.

## Session 6: Discover Workflow Migration

### Goal

Replace legacy detour criteria and results with accessible Fluent controls and
synchronized numbered map identity.

### Dependencies

Sessions 4 and 5 are merged.

### Read Before Editing

- [Development handoff](development-handoff.md)
- [Describe a Worthwhile Detour](planning-journey.md#stage-3-describe-a-worthwhile-detour)
- [Domain patterns](../design-system/foundations.md#domain-patterns)
- [Map language](../design-system/foundations.md#map-language)

### Likely Ownership Surfaces

- `frontend/src/components/detour/DetourForm.jsx`
- `frontend/src/components/detour/DetourSettings.jsx`
- `frontend/src/components/detour/LocationSlider.jsx`
- `frontend/src/components/detour/RadiusSlider.jsx`
- `frontend/src/components/detour/DetourOptionsList.jsx`
- `frontend/src/components/detour/DetourOption.jsx`
- `frontend/src/components/MapContainer.jsx`
- `frontend/src/scripts/DetourRequester.js`
- `frontend/src/scripts/RouteRequester.js`

### Implementation Scope

- Use explicit single-selection semantics for category.
- Use Fluent sliders with labels, values, units, keyboard support, and adequate
  target size.
- Preserve route percentage and radius request semantics.
- Add search pending, empty, error, retry, and success states.
- Implement result rows using current fields only: number, name, category,
  rating, selection, and add action.
- Synchronize list focus and selection with custom Google Maps markers.
- Distinguish available, selected, adding, and added states without color alone.
- Return useful focus and route-change feedback after Add to Jaunt.

### Preserve

- Current requester and category contracts
- Current route percentage and radius behavior
- Existing added-time calculation after recalculation
- Build itinerary and save behavior

### Non-Goals

- No recommendation, editorial, image, ranking, or precomputed-time APIs
- No server-side search changes
- No direct-map-only workflow

### Validation

- Test criteria, search states, keyboard selection, map/list synchronization,
  add pending/error, and empty results.
- Test touch without hover, marker contrast, compact Show Map, lint, full tests,
  and build.

### Stop When

Discover uses one accessible result and map state model and legacy detour-form
and result-list paths can be removed.

## Session 7: My Jaunts and Jaunt Detail

### Goal

Replace the My Trips overlay with routed My Jaunts and Jaunt Detail, then make
Resume Planning the explicit bridge into `/plan`.

### Dependencies

Sessions 2 and 4–6 are merged.

### Read Before Editing

- [My Jaunts direction](concept-directions.md#shared-my-trips-direction)
- [Jaunt Detail direction](concept-directions.md#shared-trip-detail-direction)
- [Development handoff](development-handoff.md)
- [Phase 4 backlog](migration-backlog.md#phase-4-saved-jaunt-and-account-destinations)

### Likely Ownership Surfaces

- `frontend/src/components/sidebar/MyTrips.jsx`
- `frontend/src/scripts/TripRequester.js`
- Router and page modules
- Planner-state application logic currently inside My Trips
- New `MyJauntsPage` and `JauntDetailPage`

### Implementation Scope

- Extract fetch and planner-application behavior from drawer-specific UI.
- Implement `/trips` with loading, empty, error, pagination, open, duplicate,
  and confirmed delete.
- Implement `/trips/:tripId` with route, metrics, detours, export, duplicate,
  delete, and recovery.
- Implement Resume Planning and explicitly resolve in-progress work.
- Make loaded and update context visible in `/plan`.
- Preserve auth return to requested saved routes.
- Remove the drawer only after routed parity passes.

### Preserve

- List, load, duplicate, delete, and pagination API behavior
- Latest-request-wins race protection
- Loaded-route update snapshots
- Session and authorization contracts

### Non-Goals

- No sharing, folders, search, sorting, thumbnails, or collaboration
- No backend redesign
- No internal contract rename from Trip to Jaunt

### Validation

- Test loading, empty, error, pagination, duplicate, delete, detail, missing
  Jaunt, and Resume Planning.
- Test rapid opens, stale responses, direct links, auth redirects, refresh,
  history, planner state, save/update, lint, full tests, and build.

### Stop When

My Jaunts and Jaunt Detail have parity, Resume Planning is explicit, and the
legacy drawer is removed.

## Session 8: Account Menu and Account Info

### Goal

Complete the signed-in account experience using current Entra identity and
session capabilities without inventing profile editing.

### Dependencies

Sessions 2 and 7 are merged.

### Read Before Editing

- [Account direction](concept-directions.md#shared-account-direction)
- [Development handoff](development-handoff.md)
- Authentication documentation under `docs/authentication/`

### Likely Ownership Surfaces

- `frontend/src/components/header/AuthButton.jsx`
- `frontend/src/scripts/AuthRequester.js`
- `AppHeader` from Session 2
- New `AccountMenu` and `AccountPage`

### Implementation Scope

- Implement a Fluent account menu with View Profile, My Jaunts, and Sign Out.
- Support pointer, touch, arrows, Home, End, Escape, outside click, and focus
  restoration through Fluent behavior.
- Implement read-only Account Info with display name, email, provider, My
  Jaunts, and Sign Out.
- Identify fields as managed by the sign-in provider.
- Preserve requested route and planner state through sign in.
- Preserve secure sign-out and app-owned storage clearing.

### Preserve

- Backend session-cookie behavior
- `GET /auth/me` as auth source of truth
- Entra login/logout redirects
- Authorization boundaries

### Non-Goals

- No local profile editing
- No password, billing, notification, sharing, data export, or support settings
- No auth protocol change unless separately scoped

### Validation

- Test menu keyboard/focus, signed-out/signed-in behavior, auth return, sign out,
  direct Account links, and 320-pixel fit.
- Run frontend lint, full tests, and build.

### Stop When

Identity and account actions have a complete routed experience and no duplicate
sign-out controls remain.

## Session 9: Legacy Retirement

### Goal

Remove superseded paths and dependencies after parity is proven, without
combining cleanup with speculative state, type, or build migrations.

### Dependencies

Sessions 4–8 are merged and their parity checks pass.

### Read Before Editing

- [ADR 0001](../architecture/decisions/0001-evolve-frontend-incrementally.md)
- [ADR 0004](../architecture/decisions/0004-state-typescript-and-build-tooling.md)
- [Current-state audit](current-state-audit.md)
- [Phase 5 backlog](migration-backlog.md#phase-5-legacy-retirement-and-modernization)

### Likely Ownership Surfaces

- `frontend/src/components/footer-menu/FooterMenu.jsx`
- Superseded sidebar and header wrappers
- `frontend/src/styles/App.css`
- `frontend/src/styles/TripTimeline.css`
- `frontend/public/index.html` legacy scripts and styles
- `frontend/package.json`
- Remaining class components and adapters

### Implementation Scope

- Prove no active route imports superseded planner paths, then remove them.
- Remove jQuery after its last interaction consumer is gone.
- Remove Bootstrap and Font Awesome after all consumers migrate.
- Delete obsolete CSS and duplicate responsive rules.
- Convert remaining touched wrappers to functions where low risk.
- Verify bundles and console no longer include removed libraries or warnings.

### Preserve

- Every feature-parity behavior
- API, auth, database, storage, and route contracts
- Production browser support

### Non-Goals

- No Redux Toolkit conversion unless required to remove an adapter
- No TypeScript adoption
- No CRA-to-Vite migration
- No unrelated visual redesign or feature

### Validation

- Search imports, selectors, globals, and package references before deletion.
- Run the complete suite and production build.
- Review console and network behavior on every route.
- Repeat route, Discover, save, My Jaunts, Resume Planning, account, responsive,
  and auth smoke tests.

### Stop When

Only the routed, responsive, tokenized frontend remains, with no hidden legacy
fallback implementation.

## Separate Follow-Up Sessions

These do not belong to the redesign critical path and must not be bundled into
Sessions 1–9.

### Redux Toolkit Evaluation

Choose one domain slice, document current complexity, migrate it with
compatibility tests, and decide whether broader adoption is justified.

### TypeScript Evaluation

Pilot TypeScript at a new token/theme or isolated component boundary. Measure
configuration, testing, editor, and interoperability cost before a broad
decision.

### Vite Evaluation

Measure startup, build output, environment handling, service-worker behavior,
tests, CI, and deployment compatibility in a separate branch and ADR.

## Reusable Development-Agent Prompt

Copy this template and include one session only.

```markdown
Implement [Session number and name] from
docs/ux/implementation-session-plan.md.

Read and follow:

- .github/copilot-instructions.md
- docs/ux/development-handoff.md
- docs/ux/implementation-session-plan.md ([session anchor])
- [session-specific artifacts listed in the brief]

Goal:
[Copy the session Goal.]

Scope:
[Copy the session Implementation Scope.]

Preserve:
[Copy the session Preserve list.]

Non-goals:
[Copy the session Non-Goals list.]

Execution requirements:

- Inspect current owning code and tests before editing.
- Implement the smallest complete vertical slice in this session.
- Keep the application runnable and contracts compatible.
- Add or update focused tests.
- Run session validation, full frontend tests, lint, and build.
- Perform documented desktop and compact browser checks.
- Stop at the completion boundary; do not begin later sessions.

Report:

- Files and behavior changed
- Tests and browser checks run
- Intentional deviations from the handoff
- Remaining blockers or follow-up work
```

## Session Review Checklist

- Scope matches one session and dependencies are merged.
- Existing owned behavior remains covered and green.
- New UI consumes canonical tokens and Fluent foundations.
- Visible language uses Jaunt; internal contracts remain trip-based.
- Loading, empty, error, focus, keyboard, responsive, and reduced-motion states
  are addressed for the slice.
- No later-phase placeholder quietly becomes permanent.
- Removed legacy code has no remaining imports or runtime consumers.
- The pull request records accepted deviations from the artifacts.
