jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Shared mocks for the transaction-scoped repositories. The POST handler does
// `new TripRepository(client)` / `new DetourRepository(client)`, so we replace
// the classes with constructors that return these controllable instances.
const mockCreateTrip = jest.fn();
const mockCreateDetour = jest.fn();

jest.mock("../repositories/TripRepository", () =>
  jest.fn().mockImplementation(() => ({ createTrip: mockCreateTrip }))
);
jest.mock("../repositories/DetourRepository", () =>
  jest.fn().mockImplementation(() => ({ createDetour: mockCreateDetour }))
);

const express = require("express");
const request = require("supertest");
const createTripsRouter = require("./trips");

describe("trips routes", () => {
  let tripRepository;
  let db;
  let client;

  // Fake session middleware so we can toggle authentication per test.
  function buildApp(userId) {
    tripRepository = { getTripsByUserId: jest.fn() };
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
    app.use("/api/trips", createTripsRouter({ tripRepository, db }));
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

    it("throws when no db with getClient is provided", () => {
      expect(() => createTripsRouter({ tripRepository: {} })).toThrow(
        "createTripsRouter requires a db with a getClient method"
      );
    });
  });

  describe("GET /api/trips", () => {
    it("returns 401 when unauthenticated", async () => {
      const app = buildApp(null);
      const res = await request(app).get("/api/trips");

      expect(res.status).toBe(401);
      expect(tripRepository.getTripsByUserId).not.toHaveBeenCalled();
    });

    it("returns the authenticated user's trips scoped by user id", async () => {
      const trips = [{ trip_id: "t1", user_id: "user-1" }];
      const app = buildApp("user-1");
      tripRepository.getTripsByUserId.mockResolvedValue(trips);

      const res = await request(app).get("/api/trips");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ trips });
      expect(tripRepository.getTripsByUserId).toHaveBeenCalledWith("user-1");
    });

    it("returns 500 when the repository throws", async () => {
      const app = buildApp("user-1");
      tripRepository.getTripsByUserId.mockRejectedValue(new Error("DB down"));

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
  });
});
