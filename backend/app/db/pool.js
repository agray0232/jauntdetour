/**
 * PostgreSQL connection pool.
 *
 * Creates a single shared `pg` Pool for the application. Pooling keeps a set of
 * open connections ready so each request reuses one instead of paying a fresh
 * TCP + TLS + auth handshake. Configuration is read from environment variables
 * (see `.env.example`). Azure Database for PostgreSQL requires SSL.
 */

const { Pool } = require("pg");
const logger = require("../utils/logger");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // from Key Vault in production
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: true }, // Azure requires SSL; disable only for local Postgres
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30s
  connectionTimeoutMillis: 2000, // fail fast if a connection can't be acquired
});

// Surface unexpected errors on idle clients (e.g. a dropped network/DB restart).
pool.on("error", (err) => {
  logger.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

module.exports = {
  /**
   * Run a parameterized query against the pool.
   *
   * @param {string} text - SQL with $1, $2, ... placeholders.
   * @param {Array} [params] - Parameter values.
   * @returns {Promise<import('pg').QueryResult>}
   */
  query: (text, params) => pool.query(text, params),

  /**
   * Acquire a dedicated client (for transactions). Caller must release it.
   *
   * @returns {Promise<import('pg').PoolClient>}
   */
  getClient: () => pool.connect(),

  pool,
};
