# Database Selection for JauntDetour

**Status:** Decided
**Decision:** Azure Database for PostgreSQL (Flexible Server) — relational, no PostGIS
**Last Updated:** June 2, 2026

---

## Decision

Use **Azure Database for PostgreSQL (Flexible Server)** as the system of record for users, trips, and detours. Start on the free/Burstable tier for development and scale to General Purpose with zone-redundant HA for production.

We deliberately **do not** use PostGIS or any spatial extension. Google Maps APIs perform all routing and place-search work at request time; the database only saves and loads the results.

---

## Why this fits JauntDetour

JauntDetour is fundamentally a **"Google Maps API wrapper + save/load"** application:

- `placesAPI.js` calls Google Places for nearby detours (lat/lng + radius).
- `routeAPI.js` calls Google Directions for routes and distances.
- The database persists user accounts, saved trips, and chosen detours — nothing more.

This makes the data model a straightforward relational one (`users → trips → detours`), with JSON storage for the Google API payloads.

| Requirement | Why PostgreSQL fits |
|-------------|---------------------|
| Store Google API JSON (origin, destination, polyline, places) | `JSONB` is a first-class, indexable binary JSON type |
| "Get my trips" / "get my detours" queries | Simple, indexed foreign-key lookups by `user_id` / `trip_id` |
| Node.js backend | Mature `pg` driver; no .NET dependency to justify Azure SQL |
| Cost | Cheapest option at every tier in our analysis (see cost-comparison.md) |
| Future semantic search for the AI agent | `pgvector` + the `azure_ai` extension add vector search in-place, no second datastore |
| Map rendering | Plain `DECIMAL` lat/lng columns — no spatial index needed |

---

## Options considered

| Option | Verdict |
|--------|---------|
| **Azure PostgreSQL** ✅ | Relational fit, cheapest, best JSON support, clean path to `pgvector` for the agent. **Chosen.** |
| Azure SQL Database | Defensible, but its main edge (deep .NET integration) is unused, and JSON handling is more bolted-on. JSONB and cost favor PostgreSQL. |
| Azure Cosmos DB | Capable but NoSQL — fights our relational shape, loses foreign keys/cascades, and is the most expensive and hardest to cost-predict (RU model). |
| MongoDB Atlas | Third-party, document model mismatch, weaker Azure integration. |

We do **not** choose a database to be a Foundry "knowledge source." Foundry agents reach app data through a **function/OpenAPI tool** doing parameterized, `user_id`-scoped queries — which works identically against any of these databases. PostgreSQL wins on data-shape fit, cost, and the in-place vector path.

---

## Data model

Three entities with simple 1:N relationships:

```
Users (1) ──< (N) Trips (1) ──< (N) Detours
```

Key design points:

- **UUID primary keys** — prevent enumeration, safe for distributed generation.
- **`external_id` instead of `password_hash`** — authentication is delegated to Microsoft Entra External ID (see ../authentication/authentication.md). We store the provider's `sub` claim, not credentials.
- **`JSONB` for Google payloads** — `origin`, `destination`, `metadata`, user `preferences`.
- **Plain `DECIMAL` lat/lng** on detours — sufficient for map display; no spatial index.
- **Cached Google values** — `route_polyline`, `distance_meters`, `duration_seconds` to reduce API calls.
- **B-tree indexes** on foreign keys, status, and created date. No GiST/spatial indexes.

See [schema.sql](schema.sql) for the full definition.

---

## Query patterns

| Pattern | Query | Notes |
|---------|-------|-------|
| User's trip list | `WHERE user_id = $1 ORDER BY created_at DESC` | Most frequent; covered by composite index |
| Trip with detours | `WHERE trip_id = $1` + `json_agg` of detours | Foreign-key lookup |
| Find a user (post-auth) | `WHERE external_id = $1` | Resolves token subject to a row |
| Find nearby places | ❌ Not a DB query | Google Places API handles this |

---

## Backup & disaster recovery

PostgreSQL Flexible Server provides:

- Automated backups, 7–35 day retention, point-in-time restore.
- Optional geo-redundant backup storage for cross-region recovery.
- Zone-redundant HA (automatic failover) in production.

| Tier | Use | RPO / RTO |
|------|-----|-----------|
| Dev (Burstable, 7-day backups, no HA) | development | ~minutes / ~1–2 h |
| Prod (General Purpose, geo-redundant, zone-redundant HA) | production | <5 min / <1 min failover |

---

## Cost summary

| Year | Scale | Monthly | Annual |
|------|-------|---------|--------|
| Year 1 | Dev → small | $0 (free tier) | $0 |
| Year 2 | 10K users, 10 GB | ~$152 | ~$1,824 |
| Year 3 | 50K users, 50 GB | ~$305 | ~$3,660 |

**3-year TCO: ~$5,484** — the lowest of all options evaluated. Full breakdown in [cost-comparison.md](cost-comparison.md).

---

## Next steps

1. Provision free-tier PostgreSQL and apply [schema.sql](schema.sql).
2. Integrate with the Node.js backend (see [implementation-guide.md](implementation-guide.md)).
3. Wire authentication via Entra External ID (see [../authentication/authentication.md](../authentication/authentication.md)).
4. Revisit `pgvector` if/when we add semantic agent features.
