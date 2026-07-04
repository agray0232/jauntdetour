# PostgreSQL Implementation Guide

**Target:** Azure Database for PostgreSQL (Flexible Server), PostgreSQL 14+
**Last Updated:** June 2, 2026

A concise, step-by-step path from provisioning to a working Node.js integration. No PostGIS — all geospatial work stays in the Google Maps APIs.

---

## Prerequisites

- Azure CLI 2.30+, `psql` (PostgreSQL 14+), Node.js 16+
- Terraform 1.5+ (for the Infrastructure-as-Code path below)
- An active Azure subscription with Contributor/Owner on the target resource group

---

## 1. Provision the server

Two paths are documented: the **Terraform path (recommended)** for repeatable
Infrastructure-as-Code, and the **manual Azure CLI path** as a fallback or for
one-off experimentation.

### Option A — Terraform (recommended)

The Terraform configuration lives in [`/infra`](../../infra/README.md) and
provisions the resource group, the Flexible Server (dev free tier), the database,
firewall rules, and enforced TLS.

```pwsh
az login
az account set --subscription "<your-subscription-id>"

cd infra
Copy-Item terraform.tfvars.example terraform.tfvars   # then edit values
$env:TF_VAR_admin_password = "<strong-password>"      # keep secrets out of files

terraform init
terraform validate
terraform plan
terraform apply        # type "yes" to confirm
```

Read the connection details back out:

```pwsh
terraform output server_fqdn      # -> DB_HOST
terraform output database_name    # -> DB_NAME
```

### Option B — Manual Azure CLI

#### Development (free tier)
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

#### Production
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
npm install   # pg and dotenv are declared in package.json
```

### Connection pool — `backend/app/db/pool.js`

A single shared `pg` Pool is created from environment variables. Pooling keeps a
set of open connections ready so each request reuses one instead of paying a fresh
TCP + TLS + auth handshake. Azure requires SSL.

```javascript
const { Pool } = require("pg");
const logger = require("../utils/logger");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // from Key Vault in production
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: true },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
```

### Environment variables — root `.env`

Copy `.env.example` to `.env` and fill in the values from the Terraform outputs:

```bash
DB_HOST=jauntdetour-db-dev.postgres.database.azure.com
DB_PORT=5432
DB_NAME=jauntdetour
DB_USER=jauntdetour_app
DB_PASSWORD=            # local dev only; use Key Vault in production
```

`.env` is gitignored. In production, inject secrets from **Azure Key Vault**, not files.

---

## 4. Data access layer

User records key off the Entra `external_id` (the token `sub` claim) — there is no
password column. See [../authentication/authentication.md](../authentication/authentication.md).

Repositories are ES classes with a **constructor-injected pool**, which keeps them
trivial to unit test (pass a mock pool). All queries use parameterized placeholders
(`$1, $2, ...`) to prevent SQL injection.

### `backend/app/repositories/UserRepository.js`
```javascript
const logger = require("../utils/logger");

class UserRepository {
  constructor(pool) {
    if (!pool || typeof pool.query !== "function") {
      throw new Error("UserRepository requires a database pool with a query method");
    }
    this.pool = pool;
  }

  async createUser({ externalId, email, displayName = null, preferences = {} }) {
    const text = `
      INSERT INTO users (external_id, email, display_name, preferences)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, external_id, email, display_name, preferences,
                is_active, created_at, updated_at, last_login
    `;
    const result = await this.pool.query(text, [externalId, email, displayName, preferences]);
    return result.rows[0];
  }

  async getUserByExternalId(externalId) {
    const result = await this.pool.query(
      "SELECT * FROM users WHERE external_id = $1",
      [externalId]
    );
    return result.rows[0] || null;
  }

  // getUserById, getUserByEmail, updateUser,
  // deleteUser (soft: is_active = false), hardDeleteUser (cascade) ...
}

module.exports = UserRepository;
```

Wire it up with the shared pool:

```javascript
const pool = require("../db/pool");
const UserRepository = require("../repositories/UserRepository");
const users = new UserRepository(pool);
```

`deleteUser` performs a **soft delete** (`is_active = false`) for routine
deactivation; `hardDeleteUser` performs a permanent `DELETE` that cascades to the
user's trips and detours, intended for GDPR account erasure. Trip and detour
repositories follow the same pattern and are always scoped by `user_id` — the
authorization boundary.

---

## 5. Testing

Unit tests inject a mock pool, so no live database is needed. Assert on the SQL
text and parameter array captured in `pool.query.mock.calls`.

```javascript
// backend/app/repositories/UserRepository.test.js
const UserRepository = require("./UserRepository");

test("createUser inserts with parameterized values", async () => {
  const pool = { query: jest.fn().mockResolvedValue({ rows: [{ user_id: "u1" }] }) };
  const repo = new UserRepository(pool);

  await repo.createUser({ externalId: "x", email: "a@example.com" });

  const [sql, params] = pool.query.mock.calls[0];
  expect(sql).toContain("INSERT INTO users");
  expect(params).toEqual(["x", "a@example.com", null, {}]);
});
```

Run with `npm test` (from `backend/`).

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
