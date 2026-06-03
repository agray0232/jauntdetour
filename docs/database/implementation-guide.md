# PostgreSQL Implementation Guide

**Target:** Azure Database for PostgreSQL (Flexible Server), PostgreSQL 14+
**Last Updated:** June 2, 2026

A concise, step-by-step path from provisioning to a working Node.js integration. No PostGIS — all geospatial work stays in the Google Maps APIs.

---

## Prerequisites

- Azure CLI 2.30+, `psql` (PostgreSQL 14+), Node.js 16+
- An active Azure subscription with Contributor/Owner on the target resource group

---

## 1. Provision the server

### Development (free tier)
```bash
az group create --name jauntdetour-rg --location eastus

az postgres flexible-server create \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-dev \
  --location eastus \
  --admin-user dbadmin \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --sku-name Standard_B1ms --tier Burstable \
  --storage-size 32 --version 14 \
  --backup-retention 7 --high-availability Disabled \
  --tags Environment=Development Project=JauntDetour
```

### Production
```bash
az postgres flexible-server create \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-prod \
  --location eastus \
  --admin-user dbadmin \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --sku-name Standard_D2s_v3 --tier GeneralPurpose \
  --storage-size 128 --version 14 \
  --public-access None \
  --backup-retention 14 --geo-redundant-backup Enabled \
  --high-availability ZoneRedundant \
  --tags Environment=Production Project=JauntDetour
```

> Pass `--admin-password` from an environment variable or Azure Key Vault — never hard-code it.

For production, prefer **VNet integration** (`--public-access None` + a delegated subnet) over public firewall rules.

---

## 2. Apply the schema

```bash
# Create the database, then apply the schema (no PostGIS extension required)
psql "host=jauntdetour-db-dev.postgres.database.azure.com port=5432 \
      dbname=jauntdetour user=dbadmin sslmode=require" \
  < docs/database/schema.sql
```

The schema enables only `pgcrypto` (for `gen_random_uuid()`). Verify tables:

```bash
psql "...dbname=jauntdetour..." -c "\dt"
```

---

## 3. Node.js integration

### Install the driver
```bash
cd backend
npm install pg dotenv
```

### Connection module — `backend/config/database.js`
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,        // from Key Vault in production
  ssl: { rejectUnauthorized: true },        // Azure requires SSL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected idle client error', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
```

### Environment variables — `backend/.env.example`
```bash
DB_HOST=jauntdetour-db-dev.postgres.database.azure.com
DB_PORT=5432
DB_NAME=jauntdetour
DB_USER=jauntdetour_app
DB_PASSWORD=            # local dev only; use Key Vault in production
GOOGLE_API_KEY=
NODE_ENV=development
```

Add `.env` to `.gitignore`. In production, inject secrets from **Azure Key Vault**, not files.

---

## 4. Data access layer

User records key off the Entra `external_id` (the token `sub` claim) — there is no password column. See [../authentication/authentication.md](../authentication/authentication.md).

### `backend/app/models/User.js`
```javascript
const db = require('../../config/database');

class User {
  // Create or fetch the user that matches a verified token's subject claim.
  static async upsertByExternalId({ externalId, email, displayName }) {
    const query = `
      INSERT INTO users (external_id, email, display_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (external_id) DO UPDATE
        SET email = EXCLUDED.email,
            last_login = CURRENT_TIMESTAMP
      RETURNING user_id, external_id, email, display_name, preferences
    `;
    const result = await db.query(query, [externalId, email, displayName]);
    return result.rows[0];
  }

  static async findById(userId) {
    const result = await db.query(
      'SELECT * FROM users WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = User;
```

### `backend/app/models/Trip.js`
```javascript
const db = require('../../config/database');

class Trip {
  static async create({ userId, tripName, origin, destination, routePolyline, distanceMeters, durationSeconds, departureTime }) {
    const query = `
      INSERT INTO trips (user_id, trip_name, origin, destination, route_polyline, distance_meters, duration_seconds, departure_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING trip_id, trip_name, origin, destination, distance_meters, duration_seconds, status, created_at
    `;
    const values = [userId, tripName, JSON.stringify(origin), JSON.stringify(destination),
                    routePolyline, distanceMeters, durationSeconds, departureTime];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Always scope by user_id — the authorization boundary.
  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT trip_id, trip_name, origin, destination, distance_meters,
              duration_seconds, status, created_at
       FROM trips WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async findByIdWithDetours(tripId, userId) {
    const query = `
      SELECT t.*,
        COALESCE(json_agg(
          json_build_object(
            'detour_id', d.detour_id, 'place_name', d.place_name,
            'place_type', d.place_type, 'latitude', d.latitude,
            'longitude', d.longitude, 'rating', d.rating,
            'position_on_route', d.position_on_route, 'notes', d.notes
          ) ORDER BY d.position_on_route
        ) FILTER (WHERE d.detour_id IS NOT NULL), '[]') AS detours
      FROM trips t
      LEFT JOIN detours d ON t.trip_id = d.trip_id
      WHERE t.trip_id = $1 AND t.user_id = $2
      GROUP BY t.trip_id
    `;
    const result = await db.query(query, [tripId, userId]);
    return result.rows[0] || null;
  }
}

module.exports = Trip;
```

### `backend/app/models/Detour.js`
```javascript
const db = require('../../config/database');

class Detour {
  static async create({ tripId, placeId, placeName, placeType, latitude, longitude, address, positionOnRoute, rating, priceLevel, stopDurationMinutes, notes }) {
    const query = `
      INSERT INTO detours (trip_id, place_id, place_name, place_type, latitude, longitude,
                           address, position_on_route, rating, price_level, stop_duration_minutes, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING detour_id, place_name, place_type, latitude, longitude, rating, created_at
    `;
    const values = [tripId, placeId, placeName, placeType, latitude, longitude,
                    address, positionOnRoute, rating, priceLevel, stopDurationMinutes, notes];
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = Detour;
```

> Note: there is no `findNearby` / `ST_DWithin` method. Proximity search is performed by the Google Places API in `placesAPI.js`; the database only stores the chosen results.

---

## 5. Testing

```javascript
// backend/app/models/__tests__/Trip.test.js
const db = require('../../../config/database');
jest.mock('../../../config/database');
const Trip = require('../Trip');

test('findByUserId scopes by user and orders by created_at', async () => {
  db.query.mockResolvedValue({ rows: [{ trip_id: 't1' }] });
  const trips = await Trip.findByUserId('u1');
  expect(trips).toHaveLength(1);
  expect(db.query.mock.calls[0][1]).toEqual(['u1']);
});
```

Run with `npm test`.

---

## 6. Production checklist

- [ ] Provision General Purpose tier with zone-redundant HA and geo-redundant backups.
- [ ] VNet integration / private endpoint — no public access.
- [ ] Secrets in **Azure Key Vault**, injected at runtime.
- [ ] Least-privilege `jauntdetour_app` DB user (not `dbadmin`).
- [ ] Parameterized queries everywhere ( `$1, $2` ) — never string concatenation.
- [ ] Azure Monitor alerts on CPU, storage, and connection limits.
- [ ] Quarterly point-in-time restore drill.

---

## Resources

- [Azure PostgreSQL docs](https://docs.microsoft.com/azure/postgresql/)
- [node-postgres (pg)](https://node-postgres.com/)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
