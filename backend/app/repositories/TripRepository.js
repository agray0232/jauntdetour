/**
 * TripRepository — data access layer for the `trips` table.
 *
 * Encapsulates all SQL for trip records so business logic never touches the
 * database directly. The pool is injected via the constructor, which keeps the
 * class easy to unit test (pass a mock pool) and lets callers supply a different
 * pool per environment.
 *
 * Every operation is scoped by `user_id` — the authorization boundary. A user
 * can only read or modify their own trips. All queries use parameterized
 * placeholders ($1, $2, ...) — prepared statements that prevent SQL injection.
 */

const logger = require("../utils/logger");

// PostgreSQL error code for a foreign-key-constraint violation.
const PG_FK_VIOLATION = "23503";

// Columns a client is allowed to update, mapped to their DB column names.
const UPDATABLE_COLUMNS = {
  tripName: "trip_name",
  origin: "origin",
  destination: "destination",
  routePolyline: "route_polyline",
  distanceMeters: "distance_meters",
  durationSeconds: "duration_seconds",
  departureTime: "departure_time",
  status: "status",
  metadata: "metadata",
};

// Columns returned to callers. Shared by every query that returns a full row.
const RETURNING_COLUMNS = `
      trip_id, user_id, trip_name, origin, destination, route_polyline,
      distance_meters, duration_seconds, departure_time, status,
      created_at, updated_at, metadata
`;

class TripRepository {
  /**
   * @param {{ query: Function }} pool - A pg Pool (or compatible) with a `query` method.
   */
  constructor(pool) {
    if (!pool || typeof pool.query !== "function") {
      throw new Error(
        "TripRepository requires a database pool with a query method"
      );
    }
    this.pool = pool;
  }

  /**
   * Create a new trip for a user.
   *
   * @param {object} trip
   * @param {string} trip.userId - Owning user's UUID.
   * @param {string} trip.tripName - Human-readable trip name.
   * @param {object} trip.origin - JSON { lat, lng, address }.
   * @param {object} trip.destination - JSON { lat, lng, address }.
   * @param {string} [trip.routePolyline] - Google encoded polyline.
   * @param {number} [trip.distanceMeters] - Cached distance.
   * @param {number} [trip.durationSeconds] - Cached duration.
   * @param {string|Date} [trip.departureTime] - Planned departure.
   * @param {string} [trip.status] - One of planned|active|completed|cancelled.
   * @param {object} [trip.metadata] - Arbitrary JSON blob.
   * @returns {Promise<object>} The created trip row.
   * @throws {Error} `INVALID_USER` if the user_id does not reference a user.
   */
  async createTrip({
    userId,
    tripName,
    origin,
    destination,
    routePolyline = null,
    distanceMeters = null,
    durationSeconds = null,
    departureTime = null,
    status = "planned",
    metadata = {},
  }) {
    const text = `
      INSERT INTO trips (user_id, trip_name, origin, destination, route_polyline,
                         distance_meters, duration_seconds, departure_time, status, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING ${RETURNING_COLUMNS}
    `;
    const params = [
      userId,
      tripName,
      origin,
      destination,
      routePolyline,
      distanceMeters,
      durationSeconds,
      departureTime,
      status,
      metadata,
    ];

    try {
      const result = await this.pool.query(text, params);
      return result.rows[0];
    } catch (err) {
      if (err.code === PG_FK_VIOLATION) {
        logger.warn(`createTrip: invalid user_id (${err.constraint || "fk"})`);
        const fkErr = new Error("The specified user does not exist");
        fkErr.code = "INVALID_USER";
        throw fkErr;
      }
      logger.error("createTrip failed", err);
      throw err;
    }
  }

  /**
   * Fetch a single trip owned by the given user.
   *
   * @param {string} tripId - UUID.
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @returns {Promise<object|null>} The trip row, or null if not found / not owned.
   */
  async getTripById(tripId, userId) {
    const text = `
      SELECT ${RETURNING_COLUMNS}
      FROM trips
      WHERE trip_id = $1 AND user_id = $2
    `;
    try {
      const result = await this.pool.query(text, [tripId, userId]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("getTripById failed", err);
      throw err;
    }
  }

  /**
   * List a user's trips, newest first. Optionally filter by status and
   * paginate with limit/offset.
   *
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @param {object} [options]
   * @param {string} [options.status] - Filter to a single status value.
   * @param {number} [options.limit] - Max rows to return (pagination).
   * @param {number} [options.offset] - Rows to skip (pagination).
   * @returns {Promise<object[]>} Array of trip rows (empty if none).
   */
  async getTripsByUserId(userId, { status, limit, offset } = {}) {
    const params = [userId];
    let position = 1;
    let text = `
      SELECT ${RETURNING_COLUMNS},
        (SELECT COUNT(*)::int FROM detours d WHERE d.trip_id = trips.trip_id) AS detour_count
      FROM trips
      WHERE user_id = $1
    `;
    if (status !== undefined) {
      position += 1;
      params.push(status);
      text += ` AND status = $${position}`;
    }
    text += ` ORDER BY created_at DESC`;
    if (limit !== undefined) {
      position += 1;
      params.push(limit);
      text += ` LIMIT $${position}`;
    }
    if (offset !== undefined) {
      position += 1;
      params.push(offset);
      text += ` OFFSET $${position}`;
    }

    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (err) {
      logger.error("getTripsByUserId failed", err);
      throw err;
    }
  }

  /**
   * Count a user's trips (for pagination). Optionally filter by status.
   *
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @param {object} [options]
   * @param {string} [options.status] - Filter to a single status value.
   * @returns {Promise<number>} Total matching trips.
   */
  async countTripsByUserId(userId, { status } = {}) {
    const params = [userId];
    let text = `
      SELECT COUNT(*)::int AS total
      FROM trips
      WHERE user_id = $1
    `;
    if (status !== undefined) {
      params.push(status);
      text += ` AND status = $2`;
    }

    try {
      const result = await this.pool.query(text, params);
      return result.rows[0].total;
    } catch (err) {
      logger.error("countTripsByUserId failed", err);
      throw err;
    }
  }

  /**
   * Update an allowed subset of a trip's columns. `updated_at` is maintained by
   * a database trigger. Scoped by user_id so a user cannot modify another user's
   * trips.
   *
   * @param {string} tripId - UUID.
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @param {object} fields - Any of the updatable trip columns.
   * @returns {Promise<object|null>} The updated trip row, or null if not found / not owned.
   * @throws {Error} If no valid fields are supplied.
   */
  async updateTrip(tripId, userId, fields = {}) {
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
      throw new Error("updateTrip requires at least one updatable field");
    }

    params.push(tripId);
    const tripPosition = position;
    position += 1;
    params.push(userId);
    const text = `
      UPDATE trips
      SET ${setClauses.join(", ")}
      WHERE trip_id = $${tripPosition} AND user_id = $${position}
      RETURNING ${RETURNING_COLUMNS}
    `;

    try {
      const result = await this.pool.query(text, params);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("updateTrip failed", err);
      throw err;
    }
  }

  /**
   * Permanently delete a trip. Cascades to the trip's detours via
   * ON DELETE CASCADE. Scoped by user_id. To "cancel" a trip without deleting
   * it, use updateTrip with status = 'cancelled'.
   *
   * @param {string} tripId - UUID.
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @returns {Promise<object|null>} The deleted trip's id, or null if not found / not owned.
   */
  async deleteTrip(tripId, userId) {
    const text = `
      DELETE FROM trips
      WHERE trip_id = $1 AND user_id = $2
      RETURNING trip_id
    `;
    try {
      const result = await this.pool.query(text, [tripId, userId]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("deleteTrip failed", err);
      throw err;
    }
  }
}

module.exports = TripRepository;
