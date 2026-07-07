jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Shared mocks for the transaction-scoped repositories. The POST/PUT/duplicate
// handlers do `new TripRepository(client)` / `new DetourRepository(client)`, so
// we replace the classes with constructors that return these controllable
// instances.
const mockCreateTrip = jest.fn();
const mockCreateDetour = jest.fn();
const mockUpdateTrip = jest.fn();
const mockDeleteByTripId = jest.fn();
const mockTxGetTripById = jest.fn();
const mockTxGetDetoursByTripId = jest.fn();

jest.mock("../repositories/TripRepository", () =>
  jest.fn().mockImplementation(() => ({
    createTrip: mockCreateTrip,
    updateTrip: mockUpdateTrip,
    getTripById: mockTxGetTripById,
  }))
);
jest.mock("../repositories/DetourRepository", () =>
  jest.fn().mockImplementation(() => ({
    createDetour: mockCreateDetour,
    deleteByTripId: mockDeleteByTripId,
    getDetoursByTripId: mockTxGetDetoursByTripId,
  }))
);

const express = require("express");
const request = require("supertest");
const createTripsRouter = require("./trips");

describe("trips routes", () => {
  let tripRepository;
  let detourRepository;
  let db;
  let client;

  // Fake session middleware so we can toggle authentication per test.
  function buildApp(userId) {
    tripRepository = {
      getTripsByUserId: jest.fn(),
      countTripsByUserId: jest.fn(),
      getTripById: jest.fn(),
      deleteTrip: jest.fn(),
    };
    detourRepository = {
      getDetoursByTripId: jest.fn(),
    };
    client = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };
    db = { getClient: jest.fn().mockResolvedValue(client) };

    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = userId ? { userId } : {};
      next();
    });
    app.use(
      "/api/trips",
      createTripsRouter({ tripRepository, detourRepository, db })
    );
    return app;
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("factory", () => {
    it("throws when no tripRepository is provided", () => {
      expect(() => createTripsRouter({ db: { getClient: jest.fn() } })).toThrow(
        "createTripsRouter requires a tripRepository"
      );
    });

    it("throws when no detourRepository is provided", () => {
      expect(() =>
        createTripsRouter({ tripRepository: {}, db: { getClient: jest.fn() } })
      ).toThrow("createTripsRouter requires a detourRepository");
    });

    it("throws when no db with getClient is provided", () => {
      expect(() =>
        createTripsRouter({ tripRepository: {}, detourRepository: {} })
      ).toThrow("createTripsRouter requires a db with a getClient method");
    });
  });

  describe("GET /api/trips", () => {
    it("returns 401 when unauthenticated", async () => {
      const app = buildApp(null);
      const res = await request(app).get("/api/trips");

      expect(res.status).toBe(401);
      expect(tripRepository.getTripsByUserId).not.toHaveBeenCalled();
    });

    it("returns a paginated, user-scoped page of trips (defaults)", async () => {
      const trips = [{ trip_id: "t1", user_id: "user-1" }];
      const app = buildApp("user-1");
      tripRepository.getTripsByUserId.mockResolvedValue(trips);
      tripRepository.countTripsByUserId.mockResolvedValue(1);

      const res = await request(app).get("/api/trips");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ trips, total: 1, page: 1, limit: 10 });
      expect(tripRepository.getTripsByUserId).toHaveBeenCalledWith("user-1", {
        limit: 10,
        offset: 0,
      });
      expect(tripRepository.countTripsByUserId).toHaveBeenCalledWith("user-1");
    });

    it("honors page and limit query params (offset computed)", async () => {
      const app = buildApp("user-1");
      tripRepository.getTripsByUserId.mockResolvedValue([]);
      tripRepository.countTripsByUserId.mockResolvedValue(25);

      const res = await request(app).get("/api/trips?page=3&limit=5");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 25, page: 3, limit: 5 });
      expect(tripRepository.getTripsByUserId).toHaveBeenCalledWith("user-1", {
        limit: 5,
        offset: 10,
      });
    });

    it("clamps limit to the maximum and page to at least 1", async () => {
      const app = buildApp("user-1");
      tripRepository.getTripsByUserId.mockResolvedValue([]);
      tripRepository.countTripsByUserId.mockResolvedValue(0);

      const res = await request(app).get("/api/trips?page=0&limit=999");

      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(50);
      expect(tripRepository.getTripsByUserId).toHaveBeenCalledWith("user-1", {
        limit: 50,
        offset: 0,
      });
    });

    it("returns 500 when the repository throws", async () => {
      const app = buildApp("user-1");
      tripRepository.getTripsByUserId.mockRejectedValue(new Error("DB down"));
      tripRepository.countTripsByUserId.mockResolvedValue(0);

      const res = await request(app).get("/api/trips");

      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/trips", () => {
    const validBody = {
      tripName: "Road trip",
      origin: { address: "A", lat: 1, lng: 2 },
      destination: { address: "B", lat: 3, lng: 4 },
      routePolyline: "abc",
      distanceMeters: 1000,
      durationSeconds: 600,
      detours: [
        { placeName: "Park", latitude: 1.5, longitude: 2.5, placeType: "park" },
      ],
    };

    it("returns 401 when unauthenticated and never opens a transaction", async () => {
      const app = buildApp(null);
      const res = await request(app).post("/api/trips").send(validBody);

      expect(res.status).toBe(401);
      expect(db.getClient).not.toHaveBeenCalled();
    });

    it("returns 400 when tripName is missing", async () => {
      const app = buildApp("user-1");
      const res = await request(app)
        .post("/api/trips")
        .send({ ...validBody, tripName: "  " });

      expect(res.status).toBe(400);
      expect(db.getClient).not.toHaveBeenCalled();
    });

    it("returns 400 when a detour is missing coordinates", async () => {
      const app = buildApp("user-1");
      const res = await request(app)
        .post("/api/trips")
        .send({ ...validBody, detours: [{ placeName: "No coords" }] });

      expect(res.status).toBe(400);
      expect(db.getClient).not.toHaveBeenCalled();
    });

    it("creates the trip and its detours in a committed transaction", async () => {
      const app = buildApp("user-1");
      mockCreateTrip.mockResolvedValue({
        trip_id: "t1",
        trip_name: "Road trip",
      });
      mockCreateDetour.mockResolvedValue({ detour_id: "d1" });

      const res = await request(app).post("/api/trips").send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.trip).toEqual({ trip_id: "t1", trip_name: "Road trip" });
      expect(res.body.detours).toEqual([{ detour_id: "d1" }]);

      // Owner comes from the session, not the body.
      expect(mockCreateTrip).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", tripName: "Road trip" })
      );
      expect(mockCreateDetour).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: "t1",
          userId: "user-1",
          placeName: "Park",
          latitude: 1.5,
          longitude: 2.5,
        })
      );
      expect(client.query).toHaveBeenCalledWith("BEGIN");
      expect(client.query).toHaveBeenCalledWith("COMMIT");
      expect(client.release).toHaveBeenCalled();
    });

    it("rolls back and returns 500 when a detour insert fails", async () => {
      const app = buildApp("user-1");
      mockCreateTrip.mockResolvedValue({ trip_id: "t1" });
      mockCreateDetour.mockRejectedValue(new Error("detour insert failed"));

      const res = await request(app).post("/api/trips").send(validBody);

      expect(res.status).toBe(500);
      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(client.query).not.toHaveBeenCalledWith("COMMIT");
      expect(client.release).toHaveBeenCalled();
    });

    it("saves a trip with no detours", async () => {
      const app = buildApp("user-1");
      mockCreateTrip.mockResolvedValue({ trip_id: "t1" });

      const res = await request(app)
        .post("/api/trips")
        .send({ ...validBody, detours: [] });

      expect(res.status).toBe(201);
      expect(res.body.detours).toEqual([]);
      expect(mockCreateDetour).not.toHaveBeenCalled();
      expect(client.query).toHaveBeenCalledWith("COMMIT");
    });

    it("returns 500 when acquiring a DB client fails", async () => {
      const app = buildApp("user-1");
      db.getClient.mockRejectedValue(new Error("pool exhausted"));

      const res = await request(app).post("/api/trips").send(validBody);

      expect(res.status).toBe(500);
      // No transaction was started and no create was attempted.
      expect(mockCreateTrip).not.toHaveBeenCalled();
    });

    it("preserves a numeric 0 for distance/duration (does not coerce to null)", async () => {
      const app = buildApp("user-1");
      mockCreateTrip.mockResolvedValue({ trip_id: "t1" });

      await request(app)
        .post("/api/trips")
        .send({ ...validBody, distanceMeters: 0, durationSeconds: 0 });

      expect(mockCreateTrip).toHaveBeenCalledWith(
        expect.objectContaining({ distanceMeters: 0, durationSeconds: 0 })
      );
    });
  });

  describe("GET /api/trips/:tripId", () => {
    const TRIP_ID = "11111111-1111-4111-8111-111111111111";
    const tripRow = {
      trip_id: TRIP_ID,
      trip_name: "Coastal drive",
      origin: { address: "SF", lat: 37.77, lng: -122.42 },
      destination: { address: "LA", lat: 34.05, lng: -118.24 },
      route_polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
      distance_meters: 3218.68,
      duration_seconds: 5400,
    };

    it("returns 401 when unauthenticated", async () => {
      const app = buildApp(null);
      const res = await request(app).get(`/api/trips/${TRIP_ID}`);

      expect(res.status).toBe(401);
      expect(tripRepository.getTripById).not.toHaveBeenCalled();
    });

    it("returns 404 for a malformed (non-UUID) tripId without querying", async () => {
      const app = buildApp("user-1");

      const res = await request(app).get("/api/trips/not-a-uuid");

      expect(res.status).toBe(404);
      expect(tripRepository.getTripById).not.toHaveBeenCalled();
    });

    it("returns 404 when the trip is not found / not owned", async () => {
      const app = buildApp("user-1");
      tripRepository.getTripById.mockResolvedValue(null);

      const res = await request(app).get(`/api/trips/${TRIP_ID}`);

      expect(res.status).toBe(404);
      expect(tripRepository.getTripById).toHaveBeenCalledWith(
        TRIP_ID,
        "user-1"
      );
      expect(detourRepository.getDetoursByTripId).not.toHaveBeenCalled();
    });

    it("returns the reconstructed trip view (route + detours) for the owner", async () => {
      const app = buildApp("user-1");
      tripRepository.getTripById.mockResolvedValue(tripRow);
      detourRepository.getDetoursByTripId.mockResolvedValue([
        {
          place_name: "Big Sur",
          place_type: "Landmark",
          latitude: "36.27000000",
          longitude: "-121.80000000",
          place_id: "gp-1",
          rating: "4.8",
          metadata: { addedTime: 45 },
        },
      ]);

      const res = await request(app).get(`/api/trips/${TRIP_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.trip).toMatchObject({
        tripId: TRIP_ID,
        tripName: "Coastal drive",
      });
      expect(res.body.route.overview_polyline.complete_overview).toHaveLength(
        3
      );
      expect(res.body.route.summary).toEqual({
        distance: "2.00",
        time: { hours: 1, min: 30 },
      });
      expect(res.body.detours).toEqual([
        {
          name: "Big Sur",
          type: "Landmark",
          lat: 36.27,
          lng: -121.8,
          id: "gp-1",
          placeId: "gp-1",
          rating: 4.8,
          addedTime: 45,
        },
      ]);
    });

    it("returns 500 when the repository throws", async () => {
      const app = buildApp("user-1");
      tripRepository.getTripById.mockRejectedValue(new Error("DB down"));

      const res = await request(app).get(`/api/trips/${TRIP_ID}`);

      expect(res.status).toBe(500);
    });
  });

  describe("PUT /api/trips/:tripId", () => {
    const TRIP_ID = "11111111-1111-4111-8111-111111111111";
    const validBody = {
      tripName: "Updated trip",
      origin: { address: "A", lat: 1, lng: 2 },
      destination: { address: "B", lat: 3, lng: 4 },
      routePolyline: "abc",
      distanceMeters: 2000,
      durationSeconds: 1200,
      detours: [
        { placeName: "Park", latitude: 1.5, longitude: 2.5, placeType: "park" },
      ],
    };

    it("returns 401 when unauthenticated and never opens a transaction", async () => {
      const app = buildApp(null);
      const res = await request(app)
        .put(`/api/trips/${TRIP_ID}`)
        .send(validBody);

      expect(res.status).toBe(401);
      expect(db.getClient).not.toHaveBeenCalled();
    });

    it("returns 404 for a malformed (non-UUID) tripId without querying", async () => {
      const app = buildApp("user-1");
      const res = await request(app)
        .put("/api/trips/not-a-uuid")
        .send(validBody);

      expect(res.status).toBe(404);
      expect(db.getClient).not.toHaveBeenCalled();
    });

    it("returns 400 when tripName is missing", async () => {
      const app = buildApp("user-1");
      const res = await request(app)
        .put(`/api/trips/${TRIP_ID}`)
        .send({ ...validBody, tripName: "  " });

      expect(res.status).toBe(400);
      expect(db.getClient).not.toHaveBeenCalled();
    });

    it("returns 400 when a detour is missing coordinates", async () => {
      const app = buildApp("user-1");
      const res = await request(app)
        .put(`/api/trips/${TRIP_ID}`)
        .send({ ...validBody, detours: [{ placeName: "No coords" }] });

      expect(res.status).toBe(400);
      expect(db.getClient).not.toHaveBeenCalled();
    });

    it("updates the trip and replaces its detours in a committed transaction", async () => {
      const app = buildApp("user-1");
      mockUpdateTrip.mockResolvedValue({
        trip_id: TRIP_ID,
        trip_name: "Updated trip",
        updated_at: "2026-07-07T12:00:00.000Z",
      });
      mockDeleteByTripId.mockResolvedValue(1);
      mockCreateDetour.mockResolvedValue({
        place_name: "Park",
        place_type: "park",
        latitude: "1.5",
        longitude: "2.5",
        place_id: null,
        rating: null,
      });

      const res = await request(app)
        .put(`/api/trips/${TRIP_ID}`)
        .send(validBody);

      expect(res.status).toBe(200);
      // Response is the reconstructed trip view (includes updatedAt).
      expect(res.body.trip).toMatchObject({
        tripId: TRIP_ID,
        tripName: "Updated trip",
        updatedAt: "2026-07-07T12:00:00.000Z",
      });

      // Owner comes from the session, not the body.
      expect(mockUpdateTrip).toHaveBeenCalledWith(
        TRIP_ID,
        "user-1",
        expect.objectContaining({
          tripName: "Updated trip",
          routePolyline: "abc",
          distanceMeters: 2000,
          durationSeconds: 1200,
        })
      );
      expect(mockDeleteByTripId).toHaveBeenCalledWith(TRIP_ID, "user-1");
      expect(mockCreateDetour).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: TRIP_ID,
          userId: "user-1",
          placeName: "Park",
          latitude: 1.5,
          longitude: 2.5,
        })
      );
      expect(client.query).toHaveBeenCalledWith("BEGIN");
      expect(client.query).toHaveBeenCalledWith("COMMIT");
      expect(client.release).toHaveBeenCalled();
    });

    it("rolls back and returns 404 when the trip is not found / not owned", async () => {
      const app = buildApp("user-1");
      mockUpdateTrip.mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/trips/${TRIP_ID}`)
        .send(validBody);

      expect(res.status).toBe(404);
      expect(mockDeleteByTripId).not.toHaveBeenCalled();
      expect(mockCreateDetour).not.toHaveBeenCalled();
      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(client.query).not.toHaveBeenCalledWith("COMMIT");
      expect(client.release).toHaveBeenCalled();
    });

    it("rolls back and returns 500 when a detour insert fails", async () => {
      const app = buildApp("user-1");
      mockUpdateTrip.mockResolvedValue({ trip_id: TRIP_ID });
      mockDeleteByTripId.mockResolvedValue(1);
      mockCreateDetour.mockRejectedValue(new Error("detour insert failed"));

      const res = await request(app)
        .put(`/api/trips/${TRIP_ID}`)
        .send(validBody);

      expect(res.status).toBe(500);
      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(client.query).not.toHaveBeenCalledWith("COMMIT");
      expect(client.release).toHaveBeenCalled();
    });

    it("updates a trip and clears its detours when none are supplied", async () => {
      const app = buildApp("user-1");
      mockUpdateTrip.mockResolvedValue({ trip_id: TRIP_ID });
      mockDeleteByTripId.mockResolvedValue(2);

      const res = await request(app)
        .put(`/api/trips/${TRIP_ID}`)
        .send({ ...validBody, detours: [] });

      expect(res.status).toBe(200);
      expect(mockDeleteByTripId).toHaveBeenCalledWith(TRIP_ID, "user-1");
      expect(mockCreateDetour).not.toHaveBeenCalled();
      expect(client.query).toHaveBeenCalledWith("COMMIT");
    });
  });

  describe("POST /api/trips/:tripId/duplicate", () => {
    const TRIP_ID = "11111111-1111-4111-8111-111111111111";
    const sourceTrip = {
      trip_id: TRIP_ID,
      trip_name: "Coastal drive",
      origin: { address: "SF" },
      destination: { address: "LA" },
      route_polyline: "abc",
      distance_meters: 3218,
      duration_seconds: 5400,
      status: "planned",
      metadata: {},
    };

    it("returns 401 when unauthenticated and never opens a transaction", async () => {
      const app = buildApp(null);
      const res = await request(app).post(`/api/trips/${TRIP_ID}/duplicate`);

      expect(res.status).toBe(401);
      expect(db.getClient).not.toHaveBeenCalled();
    });

    it("returns 404 for a malformed (non-UUID) tripId without querying", async () => {
      const app = buildApp("user-1");
      const res = await request(app).post("/api/trips/not-a-uuid/duplicate");

      expect(res.status).toBe(404);
      expect(db.getClient).not.toHaveBeenCalled();
    });

    it("rolls back and returns 404 when the source is not found / not owned", async () => {
      const app = buildApp("user-1");
      mockTxGetTripById.mockResolvedValue(null);

      const res = await request(app).post(`/api/trips/${TRIP_ID}/duplicate`);

      expect(res.status).toBe(404);
      expect(mockCreateTrip).not.toHaveBeenCalled();
      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(client.release).toHaveBeenCalled();
    });

    it("copies the trip and its detours in a committed transaction", async () => {
      const app = buildApp("user-1");
      mockTxGetTripById.mockResolvedValue(sourceTrip);
      mockTxGetDetoursByTripId.mockResolvedValue([
        {
          place_name: "Big Sur",
          place_type: "Landmark",
          latitude: "36.27",
          longitude: "-121.8",
          place_id: "gp-1",
          rating: "4.8",
          metadata: {},
        },
      ]);
      mockCreateTrip.mockResolvedValue({ trip_id: "copy-1" });
      mockCreateDetour.mockResolvedValue({ detour_id: "d1" });

      const res = await request(app).post(`/api/trips/${TRIP_ID}/duplicate`);

      expect(res.status).toBe(201);
      expect(res.body.trip).toEqual({ trip_id: "copy-1" });
      // The copy is named "Copy of <name>" and owned by the session user.
      expect(mockCreateTrip).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          tripName: "Copy of Coastal drive",
          routePolyline: "abc",
        })
      );
      // Detours are copied onto the new trip, with numerics coerced.
      expect(mockCreateDetour).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: "copy-1",
          userId: "user-1",
          placeName: "Big Sur",
          latitude: 36.27,
          longitude: -121.8,
          rating: 4.8,
        })
      );
      expect(client.query).toHaveBeenCalledWith("COMMIT");
      expect(client.release).toHaveBeenCalled();
    });

    it("rolls back and returns 500 when a copy insert fails", async () => {
      const app = buildApp("user-1");
      mockTxGetTripById.mockResolvedValue(sourceTrip);
      mockTxGetDetoursByTripId.mockResolvedValue([]);
      mockCreateTrip.mockRejectedValue(new Error("insert failed"));

      const res = await request(app).post(`/api/trips/${TRIP_ID}/duplicate`);

      expect(res.status).toBe(500);
      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(client.query).not.toHaveBeenCalledWith("COMMIT");
      expect(client.release).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/trips/:tripId", () => {
    const TRIP_ID = "11111111-1111-4111-8111-111111111111";

    it("returns 401 when unauthenticated", async () => {
      const app = buildApp(null);
      const res = await request(app).delete(`/api/trips/${TRIP_ID}`);

      expect(res.status).toBe(401);
      expect(tripRepository.deleteTrip).not.toHaveBeenCalled();
    });

    it("returns 404 for a malformed (non-UUID) tripId without querying", async () => {
      const app = buildApp("user-1");
      const res = await request(app).delete("/api/trips/not-a-uuid");

      expect(res.status).toBe(404);
      expect(tripRepository.deleteTrip).not.toHaveBeenCalled();
    });

    it("returns 404 when the trip is not found / not owned", async () => {
      const app = buildApp("user-1");
      tripRepository.deleteTrip.mockResolvedValue(null);

      const res = await request(app).delete(`/api/trips/${TRIP_ID}`);

      expect(res.status).toBe(404);
      expect(tripRepository.deleteTrip).toHaveBeenCalledWith(TRIP_ID, "user-1");
    });

    it("deletes a trip the user owns", async () => {
      const app = buildApp("user-1");
      tripRepository.deleteTrip.mockResolvedValue({ trip_id: TRIP_ID });

      const res = await request(app).delete(`/api/trips/${TRIP_ID}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Trip deleted" });
      expect(tripRepository.deleteTrip).toHaveBeenCalledWith(TRIP_ID, "user-1");
    });

    it("returns 500 when the repository throws", async () => {
      const app = buildApp("user-1");
      tripRepository.deleteTrip.mockRejectedValue(new Error("DB down"));

      const res = await request(app).delete(`/api/trips/${TRIP_ID}`);

      expect(res.status).toBe(500);
    });
  });
});
