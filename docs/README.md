---
title: JauntDetour Documentation
description: Technical, architecture, UX, design-system, authentication, and database documentation for JauntDetour
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: overview
---

<!-- markdownlint-disable MD013 MD060 -->

Technical documentation for the JauntDetour road trip planning application.

JauntDetour uses the Google Maps APIs to build routes and find detours along them. The backend persists user accounts and their saved trips and detours so users can save and load their plans.

---

## Architecture Decisions

| Area               | Decision                                                                      |
| ------------------ | ----------------------------------------------------------------------------- |
| **Database**       | Azure Database for PostgreSQL (Flexible Server) — relational, no PostGIS      |
| **Authentication** | Microsoft Entra External ID (email/password + social login)                   |
| **Frontend UI**    | Fluent 2 (`@fluentui/react-components`) for new UI (dialogs, drawers, toasts) |
| **Frontend UX**    | Incremental map-first redesign with route-based destinations                  |

---

## Frontend Design and UX

Start with the development handoff, then follow the linked source-of-truth
artifacts for a specific implementation slice.

1. **[Development Handoff](ux/development-handoff.md)** — operational contract
    for React and Fluent 2 implementation.
2. **[Migration Backlog](ux/migration-backlog.md)** — phased strangler backlog
    from shell and tokens through legacy retirement.
3. **[Concept Directions](ux/concept-directions.md)** — selected map-first
    workspace, Home, My Jaunts, Jaunt Detail, and Account structure.
4. **[Responsive Strategy](ux/responsive-strategy.md)** — layout modes,
    validated viewport matrix, and production checks.
5. **[Current-State Audit](ux/current-state-audit.md)** — existing behavior,
    strengths, and ranked UX/accessibility findings.
6. **[Planning Journey](ux/planning-journey.md)** — JTBD, journey stages, and
    evidence-tagged assumptions.
7. **[Brand and UI Foundations](design-system/foundations.md)** — human-readable
    color, typography, spacing, map, and component guidance.
8. **[Fluent 2 Mapping](design-system/fluent-token-mapping.md)** — production
    theme and component translation.
9. **[Canonical Tokens](../design-system/tokens/jauntdetour.tokens.json)** —
    machine-readable visual source of truth.
10. **[Living Specimen](../design-system/specimen/index.html)** — rendered
     foundations and component examples.
11. **[Clickable Prototype](../spikes/ux-redesign-prototype/README.md)** —
     disposable interaction and composition reference.
12. **[Brand Assets](../design-system/assets/brand/README.md)** — selected SVG,
     favicon, Apple, Android, and maskable exports.

## Frontend Architecture Decisions

1. **[ADR 0001](architecture/decisions/0001-evolve-frontend-incrementally.md)** —
    evolve incrementally rather than rewrite.
2. **[ADR 0002](architecture/decisions/0002-routing-and-map-first-shell.md)** —
    route-based shell and map-first planner.
3. **[ADR 0003](architecture/decisions/0003-fluent-design-system-and-responsive-tree.md)** —
    Fluent 2, JauntDetour tokens, and one responsive component tree.
4. **[ADR 0004](architecture/decisions/0004-state-typescript-and-build-tooling.md)** —
    incremental state modernization with TypeScript and Vite deferred.

## 📁 database/

Persistence for users, trips, and detours.

1. **[Selection](database/selection.md)** — recommendation and rationale (why PostgreSQL, options considered, data model, query patterns, backup/DR, cost summary).
2. **[Schema](database/schema.sql)** — PostgreSQL schema: `users`, `trips`, `detours`. UUID keys, JSONB for Google payloads, plain `DECIMAL` lat/lng, B-tree indexes, timestamp triggers. **No PostGIS.**
3. **[Cost Comparison](database/cost-comparison.md)** — free-tier and production pricing, 3-year TCO, optimization tips.
4. **[Implementation Guide](database/implementation-guide.md)** — provisioning, schema deployment, and Node.js integration.

## 📁 authentication/

Managed identity for end users.

1. **[Authentication](authentication/authentication.md)** — decision and rationale (why Entra External ID, options compared, cost, user experience, how tokens map to the `users` table, setup overview).
2. **[Implementation Guide](authentication/implementation-guide.md)** — Node.js login/callback flow, token verification, and per-user route scoping.
3. **[Security](authentication/security.md)** — token storage, validation, CSRF, CORS, rate limiting, MFA, secrets, logging.
4. **[Session Management](authentication/session-management.md)** — token lifetimes, logout/revocation, timeouts (lean IdP-managed default, optional Redis store).
5. **[Compliance](authentication/compliance.md)** — GDPR data-subject rights, retention, cookie policy, data residency.

---

## Key Findings

### Database — Azure Database for PostgreSQL

- **Right fit:** Google APIs handle all geospatial work, so the data model is plainly relational (`users → trips → detours`) with JSONB for API responses — no spatial extension needed.
- **Cost-effective:** lowest 3-year TCO of all options (~$5,484 vs ~$21,624 for Cosmos DB). Free for the first 12 months (B1ms, 32 GB).
- **Future-ready:** `pgvector` + the `azure_ai` extension add semantic search in-place if the AI agent needs it later — no second datastore.

### Authentication — Microsoft Entra External ID

- **Managed and secure:** Microsoft hosts sign-up/sign-in and handles password storage, MFA, lockout, and reset. We never store credentials.
- **Flexible login:** email/password **and** Google (plus Apple/Facebook/Microsoft) in one hosted, brandable flow.
- **Clean DB tie-in:** the token's `sub` claim is stored as `users.external_id` — no `password_hash`. The resolved `user_id` is the authorization boundary for both the API and a future Foundry agent tool.

---

## Data Model

```text
┌──────────────┐
│    Users     │
│ - user_id    │──┐
│ - external_id│  │   (Entra "sub" claim — no password stored)
│ - email      │  │
└──────────────┘  │ 1:N
                  ▼
┌───────────────────────┐
│        Trips          │
│ - trip_id             │──┐
│ - user_id (FK)        │  │
│ - origin (JSONB)      │  │
│ - destination (JSONB) │  │
│ - route_polyline      │  │
└───────────────────────┘  │ 1:N
                           ▼
┌──────────────────────────────┐
│         Detours              │
│ - detour_id                  │
│ - trip_id (FK)               │
│ - place_name                 │
│ - latitude / longitude       │   (plain DECIMAL — no spatial index)
│ - rating                     │
└──────────────────────────────┘
```

---

## Document Status

| Document                               | Status | Last Updated |
| -------------------------------------- | ------ | ------------ |
| database/selection.md                  | ✅     | Jun 2, 2026  |
| database/schema.sql                    | ✅     | Jun 2, 2026  |
| database/cost-comparison.md            | ✅     | Jun 2, 2026  |
| database/implementation-guide.md       | ✅     | Jun 2, 2026  |
| authentication/authentication.md       | ✅     | Jun 2, 2026  |
| authentication/implementation-guide.md | ✅     | Jun 2, 2026  |
| authentication/security.md             | ✅     | Jun 2, 2026  |
| authentication/session-management.md   | ✅     | Jun 2, 2026  |
| authentication/compliance.md           | ✅     | Jun 2, 2026  |
| ux/development-handoff.md               | Candidate | Jul 26, 2026 |
| ux/migration-backlog.md                 | Candidate | Jul 26, 2026 |
| design-system/foundations.md            | Candidate | Jul 26, 2026 |
| design-system/fluent-token-mapping.md   | Candidate | Jul 26, 2026 |

---

**Document Version:** 3.0
**Last Updated:** July 26, 2026
**Maintained by:** JauntDetour Development Team
