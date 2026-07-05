jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const createTripsRouter = require("./trips");

describe("trips routes", () => {
  let tripRepository;

  // Fake session middleware so we can toggle authentication per test.
  function buildApp(userId) {
    tripRepository = {
      getTripsByUserId: jest.fn(),
    };
    const app = express();
    app.use((req, res, next) => {
      req.session = userId ? { userId } : {};
      next();
    });
    app.use("/api/trips", createTripsRouter({ tripRepository }));
    return app;
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("throws when no tripRepository is provided", () => {
    expect(() => createTripsRouter({})).toThrow(
      "createTripsRouter requires a tripRepository"
    );
  });

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
