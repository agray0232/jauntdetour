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

// Validate an inbound detour list (shared by POST create and PUT update).
// Returns an error message string, or null when every detour is well-formed.
function validateDetours(detours) {
  for (const d of detours) {
    if (
      !d ||
      !d.placeName ||
      typeof d.latitude !== "number" ||
      typeof d.longitude !== "number"
    ) {
      return "Each detour requires placeName, latitude, and longitude";
    }
  }
  return null;
}

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
    const detourError = validateDetours(detourList);
    if (detourError) {
      return res.status(400).json({ error: detourError });
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

  // Update an existing trip (and replace its detours) for the signed-in user.
  // The trip row and its detours are rewritten in a single transaction:
  // update the trip, delete all its current detours, then re-insert the ones in
  // the request. Replacing wholesale mirrors the create flow and keeps the
  // persisted detours exactly in sync with the client's list. Scoped by
  // req.userId — updateTrip returns null for a trip the user does not own, which
  // rolls back and 404s. Last-write-wins (no optimistic concurrency check).
  router.put("/:tripId", requireAuth, async (req, res) => {
    if (!UUID_RE.test(req.params.tripId)) {
      return res.status(404).json({ error: "Trip not found" });
    }

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
    const detourError = validateDetours(detourList);
    if (detourError) {
      return res.status(400).json({ error: detourError });
    }

    let client;
    try {
      client = await db.getClient();
    } catch (err) {
      logger.error("PUT /api/trips/:tripId failed to acquire DB client", err);
      return res.status(500).json({ error: "Failed to update trip" });
    }

    try {
      await client.query("BEGIN");

      const txTripRepo = new TripRepository(client);
      const txDetourRepo = new DetourRepository(client);

      const trip = await txTripRepo.updateTrip(req.params.tripId, req.userId, {
        tripName: tripName.trim(),
        origin,
        destination,
        routePolyline: routePolyline || null,
        distanceMeters: distanceMeters ?? null,
        durationSeconds: durationSeconds ?? null,
      });

      // Not found / not owned — nothing was updated, so unwind and 404.
      if (!trip) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Trip not found" });
      }

      // Replace the trip's detours wholesale.
      await txDetourRepo.deleteByTripId(req.params.tripId, req.userId);
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
      return res.json(buildTripView(trip, savedDetours));
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error("PUT /api/trips/:tripId failed", err);
      return res.status(500).json({ error: "Failed to update trip" });
    } finally {
      client.release();
    }
  });

  // Duplicate a trip (and all of its detours) for the signed-in user. The copy
  // is named "Copy of <name>" and is written in a single transaction so a
  // partial failure never leaves a half-copied trip. Scoped by req.userId — the
  // source read returns null for a trip the user does not own, which 404s.
  router.post("/:tripId/duplicate", requireAuth, async (req, res) => {
    if (!UUID_RE.test(req.params.tripId)) {
      return res.status(404).json({ error: "Trip not found" });
    }

    let client;
    try {
      client = await db.getClient();
    } catch (err) {
      logger.error(
        "POST /api/trips/:tripId/duplicate failed to acquire DB client",
        err
      );
      return res.status(500).json({ error: "Failed to duplicate trip" });
    }

    try {
      await client.query("BEGIN");

      const txTripRepo = new TripRepository(client);
      const txDetourRepo = new DetourRepository(client);

      const source = await txTripRepo.getTripById(
        req.params.tripId,
        req.userId
      );
      if (!source) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Trip not found" });
      }

      const sourceDetours = await txDetourRepo.getDetoursByTripId(
        req.params.tripId,
        req.userId
      );

      const copy = await txTripRepo.createTrip({
        userId: req.userId,
        tripName: `Copy of ${source.trip_name}`,
        origin: source.origin,
        destination: source.destination,
        routePolyline: source.route_polyline || null,
        distanceMeters: source.distance_meters ?? null,
        durationSeconds: source.duration_seconds ?? null,
        departureTime: source.departure_time || null,
        status: source.status,
        metadata: source.metadata || {},
      });

      const copiedDetours = [];
      for (const d of sourceDetours) {
        const detour = await txDetourRepo.createDetour({
          tripId: copy.trip_id,
          userId: req.userId,
          placeName: d.place_name,
          // DECIMAL columns come back from pg as strings — coerce to numbers.
          latitude: Number(d.latitude),
          longitude: Number(d.longitude),
          placeId: d.place_id || null,
          placeType: d.place_type || null,
          address: d.address || null,
          positionOnRoute: d.position_on_route ?? null,
          estimatedDetourDurationSeconds:
            d.estimated_detour_duration_seconds ?? null,
          estimatedDetourDistanceMeters:
            d.estimated_detour_distance_meters ?? null,
          rating: d.rating != null ? Number(d.rating) : null,
          priceLevel: d.price_level ?? null,
          stopDurationMinutes: d.stop_duration_minutes ?? 30,
          visitTime: d.visit_time || null,
          notes: d.notes || null,
          metadata: d.metadata || {},
        });
        copiedDetours.push(detour);
      }

      await client.query("COMMIT");
      return res.status(201).json({ trip: copy, detours: copiedDetours });
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error("POST /api/trips/:tripId/duplicate failed", err);
      return res.status(500).json({ error: "Failed to duplicate trip" });
    } finally {
      client.release();
    }
  });

  // Delete a trip (and its detours, via ON DELETE CASCADE) for the signed-in
  // user. Scoped by req.userId — deleteTrip returns null for a trip the user
  // does not own, which 404s.
  router.delete("/:tripId", requireAuth, async (req, res) => {
    if (!UUID_RE.test(req.params.tripId)) {
      return res.status(404).json({ error: "Trip not found" });
    }
    try {
      const deleted = await tripRepository.deleteTrip(
        req.params.tripId,
        req.userId
      );
      if (!deleted) {
        return res.status(404).json({ error: "Trip not found" });
      }
      return res.json({ message: "Trip deleted" });
    } catch (err) {
      logger.error("DELETE /api/trips/:tripId failed", err);
      return res.status(500).json({ error: "Failed to delete trip" });
    }
  });

  return router;
}

module.exports = createTripsRouter;
