---
title: "feat: overhaul JauntDetour user experience"
description: Pull request description for the routed Fluent 2 UI overhaul
---

## Summary

This PR replaced the legacy single-page planner with a routed, responsive Fluent 2 experience. It established the production design system, rebuilt the complete planning workflow, added saved Jaunt and account destinations, expanded accessibility and browser coverage, and retired the superseded Bootstrap/jQuery implementation.

## Changes

### Design system and application shell

* Added centralized JauntDetour color, typography, spacing, radius, size, motion, and breakpoint tokens
* Added a branded Fluent theme, production mark, self-hosted DM Sans and Fraunces fonts, favicons, and manifest assets
* Added a responsive `AppShell` and `AppHeader` with Home, Plan, My Jaunts, About, and Account navigation
* Added protected-route handling and safe post-authentication return paths without changing the backend OAuth/session contract

### Public pages and homepage

* Added production Home and About routes with responsive editorial layouts and explicit product boundaries
* Added real Build and Discover screenshots to demonstrate the current planner and map workflows
* Added responsive homepage behavior from ultra-compact mobile through wide desktop layouts

### Planner workflows

* Replaced viewport-specific legacy UI with one responsive `PlannerWorkspace` and a persistent map
* Added Fluent Build, Discover, and Export tabs with route-aware availability and compact map expansion
* Added route creation and editing, generated Jaunt names, save-state fingerprints, saved/dirty/loading feedback, and explicit Clear behavior
* Added detour-preservation controls and confirmation before incompatible route edits remove existing stops
* Added transactional itinerary reorder/remove behavior, focus management, and consistent category icons across lists and map markers
* Added Discover category cards, continuous route-position and radius controls, numbered results, synchronized map markers, retries, and add feedback
* Added the Export workflow and Google Maps handoff while removing irrelevant fullscreen and Street View controls from the embedded map

### My Jaunts and account

* Replaced the legacy My Trips drawer with protected `/trips` and `/trips/:tripId` routes
* Added pagination, loading/empty/error recovery, duplicate, confirmed delete, detour counts, route metrics, itinerary/map previews, and Google Maps export
* Added explicit Resume Planning behavior with confirmation before replacing different in-progress work
* Added a protected Account Info route and Fluent account menu with identity confirmation, My Jaunts navigation, sign out, keyboard dismissal, and focus restoration
* Added a user-scoped detour-count aggregate to the existing trip repository query

### Legacy retirement and validation

* Removed superseded sidebar, header, footer-menu, detour-form, timeline, service-worker, and global legacy CSS paths
* Removed jQuery, Bootstrap, and Font Awesome dependencies and migrated remaining detour icons
* Added React Router, Playwright, Testing Library, `jest-axe`, and local static-server tooling
* Added desktop and compact Playwright coverage to the frontend CI job on `ubuntu-22.04`

## Implementation areas

* `frontend/src/design-system/` and `frontend/src/assets/`: theme, tokens, branding, fonts, and homepage imagery
* `frontend/src/components/shell/` and `frontend/src/auth/`: routed shell, navigation, auth context, and protected routes
* `frontend/src/components/planner/`: Build, Discover, Export, responsive workspace, route mutations, and save-state logic
* `frontend/src/pages/`: Home, About, Planner, My Jaunts, Jaunt Detail, Account Info, and route fallbacks
* `frontend/e2e/` and frontend tests: route, workflow, responsive, and accessibility coverage
* `backend/app/repositories/TripRepository.js`: saved-Jaunt detour-count aggregate
* `.github/workflows/lint-and-test.yml`: development-branch and Playwright CI coverage

## Testing

* [x] `cd frontend && npx eslint src`
* [x] `cd frontend && CI=true npm test -- --watchAll=false --runInBand` (23 suites, 159 tests)
* [x] `cd frontend && npm run build`
* [x] `cd frontend && npx playwright test --list` (8 desktop/compact tests discovered)
* [x] `cd backend && npm test -- --runInBand` (9 suites, 149 tests)
* [x] Manual browser smoke checks across Home, Plan, My Jaunts, Jaunt Detail, About, and Account at desktop and compact widths

## Related issues

Related to #97

## Assumptions and notes

* Visible product copy uses **Jaunt**, while API, Redux, repository, route, and database contracts retain existing trip terminology
* Browser E2E execution is configured in CI with `playwright install --with-deps chromium`; local validation used test discovery plus integrated browser smoke checks because the Debian 11 dev container lacks Playwright Chromium libraries
* Account profile editing, account deletion, activity statistics, and a persistent multi-instance session store remain outside this UI overhaul

## Follow-up tasks

* Add an External ID profile-edit flow before exposing a Manage Profile action on `AccountPage`
* Add a protected account-deletion workflow if product requirements include self-service data removal
* Replace the default Express `MemoryStore` before scaling the backend beyond one instance
