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

/**
 * @param {object} deps
 * @param {import('../repositories/TripRepository')} deps.tripRepository
 * @returns {import('express').Router}
 */
function createTripsRouter({ tripRepository }) {
  if (!tripRepository) {
    throw new Error("createTripsRouter requires a tripRepository");
  }

  const router = express.Router();

  // List the signed-in user's trips, newest first.
  router.get("/", requireAuth, async (req, res) => {
    try {
      const trips = await tripRepository.getTripsByUserId(req.userId);
      return res.json({ trips });
    } catch (err) {
      logger.error("GET /api/trips failed", err);
      return res.status(500).json({ error: "Failed to load trips" });
    }
  });

  return router;
}

module.exports = createTripsRouter;
