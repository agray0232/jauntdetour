/**
 * Trip routes — the proof-of-chain protected resource.
 *
 * Every route is behind `requireAuth`, so `req.userId` is always the signed-in
 * user. All data access is scoped by that id via the TripRepository, which is
 * the authorization boundary: a user can only ever see their own trips.
 *
 * Exported as a factory so the TripRepository can be injected (keeps the routes
 * unit-testable with a mock repository).
 */

const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const logger = require("../utils/logger");
const TripRepository = require("../repositories/TripRepository");
const DetourRepository = require("../repositories/DetourRepository");
const { buildTripView } = require("../modules/tripView");

// Pagination defaults for GET /api/trips.
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// trip_id is a uuid column, so reject malformed ids up front (otherwise
// Postgres throws 22P02 and the request surfaces as a 500).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @param {object} deps
 * @param {import('../repositories/TripRepository')} deps.tripRepository
 * @param {import('../repositories/DetourRepository')} deps.detourRepository
 * @param {{ getClient: Function }} deps.db - Pool with getClient() for transactions.
 * @returns {import('express').Router}
 */
function createTripsRouter({ tripRepository, detourRepository, db }) {
  if (!tripRepository) {
    throw new Error("createTripsRouter requires a tripRepository");
  }
  if (!detourRepository) {
    throw new Error("createTripsRouter requires a detourRepository");
  }
  if (!db || typeof db.getClient !== "function") {
    throw new Error("createTripsRouter requires a db with a getClient method");
  }

  const router = express.Router();

  // List the signed-in user's trips, newest first, paginated.
  router.get("/", requireAuth, async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const requestedLimit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
    const limit = Math.min(MAX_LIMIT, Math.max(1, requestedLimit));
    const offset = (page - 1) * limit;

    try {
      const [trips, total] = await Promise.all([
        tripRepository.getTripsByUserId(req.userId, { limit, offset }),
        tripRepository.countTripsByUserId(req.userId),
      ]);
      return res.json({ trips, total, page, limit });
    } catch (err) {
      logger.error("GET /api/trips failed", err);
      return res.status(500).json({ error: "Failed to load trips" });
    }
  });

  // Load a single trip (with its detours) for the signed-in user, reconstructed
  // into a render-ready view (decoded route + bounds + summary). Scoped by
  // req.userId — getTripById returns null for a trip the user does not own.
  router.get("/:tripId", requireAuth, async (req, res) => {
    if (!UUID_RE.test(req.params.tripId)) {
      return res.status(404).json({ error: "Trip not found" });
    }
    try {
      const trip = await tripRepository.getTripById(
        req.params.tripId,
        req.userId
      );
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      const detours = await detourRepository.getDetoursByTripId(
        req.params.tripId,
        req.userId
      );
      return res.json(buildTripView(trip, detours));
    } catch (err) {
      logger.error("GET /api/trips/:tripId failed", err);
      return res.status(500).json({ error: "Failed to load trip" });
    }
  });

  // Save a new trip (with its detours) for the signed-in user. The trip and all
  // its detours are written in a single transaction so a partial failure never
  // leaves an orphan trip. The owner is always req.userId — never trusted from
  // the request body.
  router.post("/", requireAuth, async (req, res) => {
    const {
      tripName,
      origin,
      destination,
      routePolyline,
      distanceMeters,
      durationSeconds,
      detours,
    } = req.body || {};

    if (!tripName || typeof tripName !== "string" || !tripName.trim()) {
      return res.status(400).json({ error: "tripName is required" });
    }
    if (!origin || !destination) {
      return res
        .status(400)
        .json({ error: "origin and destination are required" });
    }

    const detourList = Array.isArray(detours) ? detours : [];
    for (const d of detourList) {
      if (
        !d ||
        !d.placeName ||
        typeof d.latitude !== "number" ||
        typeof d.longitude !== "number"
      ) {
        return res.status(400).json({
          error: "Each detour requires placeName, latitude, and longitude",
        });
      }
    }

    let client;
    try {
      client = await db.getClient();
    } catch (err) {
      logger.error("POST /api/trips failed to acquire DB client", err);
      return res.status(500).json({ error: "Failed to save trip" });
    }

    try {
      await client.query("BEGIN");

      // Client-scoped repositories so every write runs on the same transaction.
      const txTripRepo = new TripRepository(client);
      const txDetourRepo = new DetourRepository(client);

      const trip = await txTripRepo.createTrip({
        userId: req.userId,
        tripName: tripName.trim(),
        origin,
        destination,
        routePolyline: routePolyline || null,
        distanceMeters: distanceMeters ?? null,
        durationSeconds: durationSeconds ?? null,
      });

      const savedDetours = [];
      for (const d of detourList) {
        const detour = await txDetourRepo.createDetour({
          tripId: trip.trip_id,
          userId: req.userId,
          placeName: d.placeName,
          latitude: d.latitude,
          longitude: d.longitude,
          placeId: d.placeId || null,
          placeType: d.placeType || null,
          address: d.address || null,
          rating: d.rating || null,
          metadata: d.metadata || {},
        });
        savedDetours.push(detour);
      }

      await client.query("COMMIT");
      return res.status(201).json({ trip, detours: savedDetours });
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error("POST /api/trips failed", err);
      if (err.code === "INVALID_USER") {
        return res.status(400).json({ error: "Invalid user" });
      }
      return res.status(500).json({ error: "Failed to save trip" });
    } finally {
      client.release();
    }
  });

  return router;
}

module.exports = createTripsRouter;
