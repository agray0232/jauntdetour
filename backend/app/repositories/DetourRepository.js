/**
 * DetourRepository — data access layer for the `detours` table.
 *
 * Encapsulates all SQL for detour records so business logic never touches the
 * database directly. The pool is injected via the constructor, which keeps the
 * class easy to unit test (pass a mock pool) and lets callers supply a different
 * pool per environment.
 *
 * Detours belong to a user only transitively, through their parent trip. Every
 * operation is therefore scoped by `user_id` — the authorization boundary — by
 * verifying ownership via the `trips` table. A user can only read or modify
 * detours on trips they own. All queries use parameterized placeholders
 * ($1, $2, ...) — prepared statements that prevent SQL injection.
 */

const logger = require("../utils/logger");

// Columns a client is allowed to update, mapped to their DB column names.
const UPDATABLE_COLUMNS = {
  placeId: "place_id",
  placeName: "place_name",
  placeType: "place_type",
  latitude: "latitude",
  longitude: "longitude",
  address: "address",
  positionOnRoute: "position_on_route",
  estimatedDetourDurationSeconds: "estimated_detour_duration_seconds",
  estimatedDetourDistanceMeters: "estimated_detour_distance_meters",
  rating: "rating",
  priceLevel: "price_level",
  stopDurationMinutes: "stop_duration_minutes",
  visitTime: "visit_time",
  notes: "notes",
  metadata: "metadata",
};

// Columns returned to callers. Shared by every query that returns a full row.
// Prefixed with `d.` so it can be reused inside JOIN queries against trips.
const RETURNING_COLUMNS = `
      detour_id, trip_id, place_id, place_name, place_type, latitude, longitude,
      address, position_on_route, estimated_detour_duration_seconds,
      estimated_detour_distance_meters, rating, price_level, stop_duration_minutes,
      visit_time, notes, created_at, updated_at, metadata
`;
const RETURNING_COLUMNS_PREFIXED = RETURNING_COLUMNS.replace(/(\w+)/g, "d.$1");

class DetourRepository {
  /**
   * @param {{ query: Function }} pool - A pg Pool (or compatible) with a `query` method.
   */
  constructor(pool) {
    if (!pool || typeof pool.query !== "function") {
      throw new Error(
        "DetourRepository requires a database pool with a query method"
      );
    }
    this.pool = pool;
  }

  /**
   * Create a detour on a trip the user owns. The insert only succeeds if the
   * parent trip exists and belongs to the given user; otherwise it is a no-op
   * and null is returned (trip not found or not owned).
   *
   * @param {object} detour
   * @param {string} detour.tripId - Parent trip UUID.
   * @param {string} detour.userId - Owning user's UUID (authorization scope).
   * @param {string} detour.placeName - Name of the place.
   * @param {number} detour.latitude - Latitude (-90..90).
   * @param {number} detour.longitude - Longitude (-180..180).
   * @param {string} [detour.placeId] - Google Places ID.
   * @param {string} [detour.placeType] - e.g. restaurant, park.
   * @param {string} [detour.address] - Formatted address.
   * @param {number} [detour.positionOnRoute] - Normalized 0.0-1.0.
   * @param {number} [detour.estimatedDetourDurationSeconds]
   * @param {number} [detour.estimatedDetourDistanceMeters]
   * @param {number} [detour.rating] - Google rating 0.0-5.0.
   * @param {number} [detour.priceLevel] - 1-4.
   * @param {number} [detour.stopDurationMinutes] - Defaults to 30.
   * @param {string|Date} [detour.visitTime]
   * @param {string} [detour.notes]
   * @param {object} [detour.metadata] - Arbitrary JSON blob.
   * @returns {Promise<object|null>} The created detour row, or null if the trip
   *   was not found / not owned by the user.
   */
  async createDetour({
    tripId,
    userId,
    placeName,
    latitude,
    longitude,
    placeId = null,
    placeType = null,
    address = null,
    positionOnRoute = null,
    estimatedDetourDurationSeconds = null,
    estimatedDetourDistanceMeters = null,
    rating = null,
    priceLevel = null,
    stopDurationMinutes = 30,
    visitTime = null,
    notes = null,
    metadata = {},
  }) {
    // INSERT ... SELECT ... WHERE EXISTS enforces trip ownership atomically:
    // no row is inserted unless the parent trip belongs to the user.
    const text = `
      INSERT INTO detours (trip_id, place_id, place_name, place_type, latitude,
                           longitude, address, position_on_route,
                           estimated_detour_duration_seconds,
                           estimated_detour_distance_meters, rating, price_level,
                           stop_duration_minutes, visit_time, notes, metadata)
      SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      WHERE EXISTS (
        SELECT 1 FROM trips WHERE trip_id = $1 AND user_id = $17
      )
      RETURNING ${RETURNING_COLUMNS}
    `;
    const params = [
      tripId,
      placeId,
      placeName,
      placeType,
      latitude,
      longitude,
      address,
      positionOnRoute,
      estimatedDetourDurationSeconds,
      estimatedDetourDistanceMeters,
      rating,
      priceLevel,
      stopDurationMinutes,
      visitTime,
      notes,
      metadata,
      userId,
    ];

    try {
      const result = await this.pool.query(text, params);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("createDetour failed", err);
      throw err;
    }
  }

  /**
   * Fetch a single detour, scoped to the owning user via its parent trip.
   *
   * @param {string} detourId - UUID.
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @returns {Promise<object|null>} The detour row, or null if not found / not owned.
   */
  async getDetourById(detourId, userId) {
    const text = `
      SELECT ${RETURNING_COLUMNS_PREFIXED}
      FROM detours d
      JOIN trips t ON d.trip_id = t.trip_id
      WHERE d.detour_id = $1 AND t.user_id = $2
    `;
    try {
      const result = await this.pool.query(text, [detourId, userId]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("getDetourById failed", err);
      throw err;
    }
  }

  /**
   * List all detours on a trip, ordered by position along the route. Scoped to
   * the owning user via the parent trip, so passing a trip the user does not own
   * returns an empty array.
   *
   * @param {string} tripId - Parent trip UUID.
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @returns {Promise<object[]>} Array of detour rows (empty if none / not owned).
   */
  async getDetoursByTripId(tripId, userId) {
    const text = `
      SELECT ${RETURNING_COLUMNS_PREFIXED}
      FROM detours d
      JOIN trips t ON d.trip_id = t.trip_id
      WHERE d.trip_id = $1 AND t.user_id = $2
      ORDER BY d.position_on_route ASC NULLS LAST
    `;
    try {
      const result = await this.pool.query(text, [tripId, userId]);
      return result.rows;
    } catch (err) {
      logger.error("getDetoursByTripId failed", err);
      throw err;
    }
  }

  /**
   * Update an allowed subset of a detour's columns. `updated_at` is maintained
   * by a database trigger. Scoped by user_id via the parent trip so a user
   * cannot modify detours on another user's trips.
   *
   * @param {string} detourId - UUID.
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @param {object} fields - Any of the updatable detour columns.
   * @returns {Promise<object|null>} The updated detour row, or null if not found / not owned.
   * @throws {Error} If no valid fields are supplied.
   */
  async updateDetour(detourId, userId, fields = {}) {
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
      throw new Error("updateDetour requires at least one updatable field");
    }

    params.push(detourId);
    const detourPosition = position;
    position += 1;
    params.push(userId);
    const text = `
      UPDATE detours
      SET ${setClauses.join(", ")}
      WHERE detour_id = $${detourPosition}
        AND trip_id IN (SELECT trip_id FROM trips WHERE user_id = $${position})
      RETURNING ${RETURNING_COLUMNS}
    `;

    try {
      const result = await this.pool.query(text, params);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("updateDetour failed", err);
      throw err;
    }
  }

  /**
   * Permanently delete a detour. Scoped by user_id via the parent trip.
   *
   * @param {string} detourId - UUID.
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @returns {Promise<object|null>} The deleted detour's id, or null if not found / not owned.
   */
  async deleteDetour(detourId, userId) {
    const text = `
      DELETE FROM detours
      WHERE detour_id = $1
        AND trip_id IN (SELECT trip_id FROM trips WHERE user_id = $2)
      RETURNING detour_id
    `;
    try {
      const result = await this.pool.query(text, [detourId, userId]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error("deleteDetour failed", err);
      throw err;
    }
  }

  /**
   * Delete every detour on a trip. Used by "update trip" to replace the trip's
   * detours wholesale (delete-all then re-insert) inside a transaction. Scoped
   * by user_id via the parent trip, so a user cannot clear detours on a trip
   * they do not own (the subquery matches no trip and nothing is deleted).
   *
   * @param {string} tripId - Parent trip UUID.
   * @param {string} userId - Owning user's UUID (authorization scope).
   * @returns {Promise<number>} The number of detours deleted.
   */
  async deleteByTripId(tripId, userId) {
    const text = `
      DELETE FROM detours
      WHERE trip_id = $1
        AND trip_id IN (SELECT trip_id FROM trips WHERE user_id = $2)
    `;
    try {
      const result = await this.pool.query(text, [tripId, userId]);
      return result.rowCount;
    } catch (err) {
      logger.error("deleteByTripId failed", err);
      throw err;
    }
  }
}

module.exports = DetourRepository;
