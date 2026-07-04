/**
 * UserRepository — data access layer for the `users` table.
 *
 * Encapsulates all SQL for user records so business logic never touches the
 * database directly. The pool is injected via the constructor, which keeps the
 * class easy to unit test (pass a mock pool) and lets callers supply a different
 * pool per environment.
 *
 * All queries use parameterized placeholders ($1, $2, ...) — prepared statements
 * that prevent SQL injection. There is no password column; identity is keyed off
 * the Entra `external_id` (the token `sub` claim). See
 * ../../../docs/authentication/authentication.md.
 */

const logger = require("../utils/logger");

// PostgreSQL error code for a unique-constraint violation.
const PG_UNIQUE_VIOLATION = "23505";

// Columns a client is allowed to update, mapped to their DB column names.
const UPDATABLE_COLUMNS = {
  email: "email",
  displayName: "display_name",
  preferences: "preferences",
  isActive: "is_active",
  lastLogin: "last_login",
};

class UserRepository {
  /**
   * @param {{ query: Function }} pool - A pg Pool (or compatible) with a `query` method.
   */
  constructor(pool) {
    if (!pool || typeof pool.query !== "function") {
      throw new Error(
        "UserRepository requires a database pool with a query method"
      );
    }
    this.pool = pool;
  }

  /**
   * Create a new user.
   *
   * @param {object} user
   * @param {string} user.externalId - Entra `sub` claim (unique).
   * @param {string} user.email - User email (unique).
   * @param {string} [user.displayName] - Display name.
   * @param {object} [user.preferences] - JSON preferences blob.
   * @returns {Promise<object>} The created user row.
   * @throws {Error} `DUPLICATE_USER` if external_id or email already exists.
   */
  async createUser({
    externalId,
    email,
    displayName = null,
    preferences = {},
  }) {
    const text = `
      INSERT INTO users (external_id, email, display_name, preferences)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, external_id, email, display_name, preferences,
                is_active, created_at, updated_at, last_login
    `;
    const params = [externalId, email, displayName, preferences];

    try {
      const result = await this.pool.query(text, params);
      return result.rows[0];
    } catch (err) {
      if (err.code === PG_UNIQUE_VIOLATION) {
        logger.warn(
          `createUser: duplicate user (${err.constraint || "unique"})`
        );
        const dupErr = new Error(
          "A user with that email or external ID already exists"
        );
        dupErr.code = "DUPLICATE_USER";
        throw dupErr;
      }
      logger.error("createUser failed", err);
      throw err;
    }
  }

  /**
   * Fetch an active user by primary key.
   *
   * @param {string} userId - UUID.
   * @returns {Promise<object|null>} The user row, or null if not found.
   */
  async getUserById(userId) {
    const text = `
      SELECT user_id, external_id, email, display_name, preferences,
             is_active, created_at, updated_at, last_login
      FROM users
      WHERE user_id = $1 AND is_active = true
    `;
    try {
      const result = await this.pool.query(text, [userId]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("getUserById failed", err);
      throw err;
    }
  }

  /**
   * Fetch an active user by email.
   *
   * @param {string} email
   * @returns {Promise<object|null>} The user row, or null if not found.
   */
  async getUserByEmail(email) {
    const text = `
      SELECT user_id, external_id, email, display_name, preferences,
             is_active, created_at, updated_at, last_login
      FROM users
      WHERE email = $1 AND is_active = true
    `;
    try {
      const result = await this.pool.query(text, [email]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("getUserByEmail failed", err);
      throw err;
    }
  }

  /**
   * Fetch a user by Entra external ID (the token `sub` claim).
   *
   * @param {string} externalId
   * @returns {Promise<object|null>} The user row, or null if not found.
   */
  async getUserByExternalId(externalId) {
    const text = `
      SELECT user_id, external_id, email, display_name, preferences,
             is_active, created_at, updated_at, last_login
      FROM users
      WHERE external_id = $1
    `;
    try {
      const result = await this.pool.query(text, [externalId]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("getUserByExternalId failed", err);
      throw err;
    }
  }

  /**
   * Update an allowed subset of a user's columns. `updated_at` is maintained by
   * a database trigger.
   *
   * @param {string} userId - UUID.
   * @param {object} fields - Any of: email, displayName, preferences, isActive, lastLogin.
   * @returns {Promise<object|null>} The updated user row, or null if not found.
   * @throws {Error} If no valid fields are supplied, or `DUPLICATE_USER` on email clash.
   */
  async updateUser(userId, fields = {}) {
    const setClauses = [];
    const params = [];
    let position = 1;

    for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        setClauses.push(`${column} = $${position}`);
        params.push(fields[key]);
        position += 1;
      }
    }

    if (setClauses.length === 0) {
      throw new Error("updateUser requires at least one updatable field");
    }

    params.push(userId);
    const text = `
      UPDATE users
      SET ${setClauses.join(", ")}
      WHERE user_id = $${position} AND is_active = true
      RETURNING user_id, external_id, email, display_name, preferences,
                is_active, created_at, updated_at, last_login
    `;

    try {
      const result = await this.pool.query(text, params);
      return result.rows[0] || null;
    } catch (err) {
      if (err.code === PG_UNIQUE_VIOLATION) {
        logger.warn("updateUser: duplicate email");
        const dupErr = new Error("A user with that email already exists");
        dupErr.code = "DUPLICATE_USER";
        throw dupErr;
      }
      logger.error("updateUser failed", err);
      throw err;
    }
  }

  /**
   * Soft-delete a user by marking the account inactive. Preserves the row (and
   * its trips/detours) for audit and potential reactivation.
   *
   * @param {string} userId - UUID.
   * @returns {Promise<object|null>} The deactivated user row, or null if not found.
   */
  async deleteUser(userId) {
    const text = `
      UPDATE users
      SET is_active = false
      WHERE user_id = $1 AND is_active = true
      RETURNING user_id, external_id, email, is_active
    `;
    try {
      const result = await this.pool.query(text, [userId]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("deleteUser failed", err);
      throw err;
    }
  }

  /**
   * Permanently delete a user row. Cascades to the user's trips and detours via
   * ON DELETE CASCADE. Use for GDPR account erasure, not routine deletes.
   *
   * @param {string} userId - UUID.
   * @returns {Promise<object|null>} The deleted user's id, or null if not found.
   */
  async hardDeleteUser(userId) {
    const text = `
      DELETE FROM users
      WHERE user_id = $1
      RETURNING user_id
    `;
    try {
      const result = await this.pool.query(text, [userId]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("hardDeleteUser failed", err);
      throw err;
    }
  }
}

module.exports = UserRepository;
