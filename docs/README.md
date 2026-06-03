# JauntDetour Documentation

Technical documentation for the JauntDetour road trip planning application.

JauntDetour uses the Google Maps APIs to build routes and find detours along them. The backend persists user accounts and their saved trips and detours so users can save and load their plans.

---

## Architecture Decisions

| Area | Decision |
|------|----------|
| **Database** | Azure Database for PostgreSQL (Flexible Server) — relational, no PostGIS |
| **Authentication** | Microsoft Entra External ID (email/password + social login) |

---

## 📁 database/

Persistence for users, trips, and detours.

1. **[Selection](database/selection.md)** — recommendation and rationale (why PostgreSQL, options considered, data model, query patterns, backup/DR, cost summary).
2. **[Schema](database/schema.sql)** — PostgreSQL schema: `users`, `trips`, `detours`. UUID keys, JSONB for Google payloads, plain `DECIMAL` lat/lng, B-tree indexes, timestamp triggers. **No PostGIS.**
3. **[Cost Comparison](database/cost-comparison.md)** — free-tier and production pricing, 3-year TCO, optimization tips.
4. **[Implementation Guide](database/implementation-guide.md)** — provisioning, schema deployment, and Node.js integration.

## 📁 authentication/

Managed identity for end users.

1. **[Authentication](authentication/authentication.md)** — decision and rationale (why Entra External ID, user experience, how tokens map to the `users` table, setup overview, security essentials).
2. **[Implementation Guide](authentication/implementation-guide.md)** — Node.js login/callback flow, token verification, and per-user route scoping.

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

```
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

| Document | Status | Last Updated |
|----------|--------|--------------|
| database/selection.md | ✅ | Jun 2, 2026 |
| database/schema.sql | ✅ | Jun 2, 2026 |
| database/cost-comparison.md | ✅ | Jun 2, 2026 |
| database/implementation-guide.md | ✅ | Jun 2, 2026 |
| authentication/authentication.md | ✅ | Jun 2, 2026 |
| authentication/implementation-guide.md | ✅ | Jun 2, 2026 |

---

**Document Version:** 2.0
**Last Updated:** June 2, 2026
**Maintained by:** JauntDetour Development Team
