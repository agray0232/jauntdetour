// Mock the logger so tests don't produce noisy output.
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const TripRepository = require("./TripRepository");

describe("TripRepository", () => {
  let pool;
  let repo;

  const USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const TRIP_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  beforeEach(() => {
    pool = { query: jest.fn() };
    repo = new TripRepository(pool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("throws when no pool is provided", () => {
      expect(() => new TripRepository()).toThrow(
        "TripRepository requires a database pool with a query method"
      );
    });

    it("throws when the pool has no query method", () => {
      expect(() => new TripRepository({})).toThrow(
        "TripRepository requires a database pool with a query method"
      );
    });
  });

  describe("createTrip", () => {
    it("inserts a trip with parameterized values and returns the row", async () => {
      const newTrip = { trip_id: TRIP_ID, user_id: USER_ID };
      pool.query.mockResolvedValue({ rows: [newTrip] });

      const origin = { lat: 1, lng: 2, address: "A" };
      const destination = { lat: 3, lng: 4, address: "B" };
      const result = await repo.createTrip({
        userId: USER_ID,
        tripName: "Road Trip",
        origin,
        destination,
        routePolyline: "poly",
        distanceMeters: 1000,
        durationSeconds: 600,
        departureTime: "2026-07-04T00:00:00Z",
        status: "active",
        metadata: { source: "test" },
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("INSERT INTO trips");
      expect(sql).toContain("$1, $2, $3, $4, $5, $6, $7, $8, $9, $10");
      expect(params).toEqual([
        USER_ID,
        "Road Trip",
        origin,
        destination,
        "poly",
        1000,
        600,
        "2026-07-04T00:00:00Z",
        "active",
        { source: "test" },
      ]);
      expect(result).toBe(newTrip);
    });

    it("applies defaults for optional fields", async () => {
      pool.query.mockResolvedValue({ rows: [{ trip_id: TRIP_ID }] });

      await repo.createTrip({
        userId: USER_ID,
        tripName: "Minimal",
        origin: { lat: 1, lng: 2 },
        destination: { lat: 3, lng: 4 },
      });

      const [, params] = pool.query.mock.calls[0];
      expect(params).toEqual([
        USER_ID,
        "Minimal",
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
        null,
        null,
        null,
        null,
        "planned",
        {},
      ]);
    });

    it("maps a foreign-key violation to an INVALID_USER error", async () => {
      const pgError = new Error("insert or update violates foreign key");
      pgError.code = "23503";
      pgError.constraint = "trips_user_id_fkey";
      pool.query.mockRejectedValue(pgError);

      await expect(
        repo.createTrip({
          userId: "missing",
          tripName: "X",
          origin: {},
          destination: {},
        })
      ).rejects.toMatchObject({ code: "INVALID_USER" });
    });

    it("rethrows non-foreign-key database errors", async () => {
      pool.query.mockRejectedValue(new Error("connection terminated"));

      await expect(
        repo.createTrip({
          userId: USER_ID,
          tripName: "X",
          origin: {},
          destination: {},
        })
      ).rejects.toThrow("connection terminated");
    });
  });

  describe("getTripById", () => {
    it("selects a trip scoped by trip_id and user_id", async () => {
      const trip = { trip_id: TRIP_ID, user_id: USER_ID };
      pool.query.mockResolvedValue({ rows: [trip] });

      const result = await repo.getTripById(TRIP_ID, USER_ID);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("WHERE trip_id = $1 AND user_id = $2");
      expect(params).toEqual([TRIP_ID, USER_ID]);
      expect(result).toBe(trip);
    });

    it("returns null when no trip is found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await repo.getTripById("missing", USER_ID)).toBeNull();
    });

    it("rethrows database errors", async () => {
      pool.query.mockRejectedValue(new Error("DB down"));
      await expect(repo.getTripById(TRIP_ID, USER_ID)).rejects.toThrow(
        "DB down"
      );
    });
  });

  describe("getTripsByUserId", () => {
    it("selects all of a user's trips newest first", async () => {
      const trips = [{ trip_id: TRIP_ID }];
      pool.query.mockResolvedValue({ rows: trips });

      const result = await repo.getTripsByUserId(USER_ID);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("WHERE user_id = $1");
      expect(sql).toContain("AS detour_count");
      expect(sql).toContain("d.trip_id = trips.trip_id");
      expect(sql).toContain("ORDER BY created_at DESC");
      expect(sql).not.toContain("status = $2");
      expect(params).toEqual([USER_ID]);
      expect(result).toBe(trips);
    });

    it("adds a status filter when provided", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repo.getTripsByUserId(USER_ID, { status: "completed" });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("AND status = $2");
      expect(params).toEqual([USER_ID, "completed"]);
    });

    it("appends LIMIT and OFFSET when paginating", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repo.getTripsByUserId(USER_ID, { limit: 10, offset: 20 });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("LIMIT $2");
      expect(sql).toContain("OFFSET $3");
      expect(params).toEqual([USER_ID, 10, 20]);
    });

    it("numbers pagination placeholders after a status filter", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repo.getTripsByUserId(USER_ID, {
        status: "planned",
        limit: 5,
        offset: 5,
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("AND status = $2");
      expect(sql).toContain("LIMIT $3");
      expect(sql).toContain("OFFSET $4");
      expect(params).toEqual([USER_ID, "planned", 5, 5]);
    });

    it("rethrows database errors", async () => {
      pool.query.mockRejectedValue(new Error("DB down"));
      await expect(repo.getTripsByUserId(USER_ID)).rejects.toThrow("DB down");
    });
  });

  describe("countTripsByUserId", () => {
    it("counts a user's trips scoped by user id", async () => {
      pool.query.mockResolvedValue({ rows: [{ total: 7 }] });

      const result = await repo.countTripsByUserId(USER_ID);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("SELECT COUNT(*)::int AS total");
      expect(sql).toContain("WHERE user_id = $1");
      expect(sql).not.toContain("status = $2");
      expect(params).toEqual([USER_ID]);
      expect(result).toBe(7);
    });

    it("adds a status filter when provided", async () => {
      pool.query.mockResolvedValue({ rows: [{ total: 2 }] });

      const result = await repo.countTripsByUserId(USER_ID, {
        status: "completed",
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("AND status = $2");
      expect(params).toEqual([USER_ID, "completed"]);
      expect(result).toBe(2);
    });

    it("rethrows database errors", async () => {
      pool.query.mockRejectedValue(new Error("DB down"));
      await expect(repo.countTripsByUserId(USER_ID)).rejects.toThrow("DB down");
    });
  });

  describe("updateTrip", () => {
    it("builds a dynamic SET clause scoped by trip_id and user_id", async () => {
      const updated = { trip_id: TRIP_ID, trip_name: "Renamed" };
      pool.query.mockResolvedValue({ rows: [updated] });

      const result = await repo.updateTrip(TRIP_ID, USER_ID, {
        tripName: "Renamed",
        status: "completed",
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("UPDATE trips");
      expect(sql).toContain("trip_name = $1");
      expect(sql).toContain("status = $2");
      expect(sql).toContain("WHERE trip_id = $3 AND user_id = $4");
      expect(params).toEqual(["Renamed", "completed", TRIP_ID, USER_ID]);
      expect(result).toBe(updated);
    });

    it("ignores fields that are not in the allow-list", async () => {
      pool.query.mockResolvedValue({ rows: [{ trip_id: TRIP_ID }] });

      await repo.updateTrip(TRIP_ID, USER_ID, {
        tripName: "OK",
        trip_id: "hacked",
        userId: "hacked",
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("trip_name = $1");
      // Only the allow-listed field, plus the trip_id and user_id scope.
      expect(params).toEqual(["OK", TRIP_ID, USER_ID]);
    });

    it("throws when no updatable fields are supplied", async () => {
      await expect(repo.updateTrip(TRIP_ID, USER_ID, {})).rejects.toThrow(
        "updateTrip requires at least one updatable field"
      );
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns null when no trip is updated", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await repo.updateTrip(TRIP_ID, USER_ID, {
        tripName: "X",
      });
      expect(result).toBeNull();
    });

    it("rethrows database errors", async () => {
      pool.query.mockRejectedValue(new Error("DB down"));
      await expect(
        repo.updateTrip(TRIP_ID, USER_ID, { tripName: "X" })
      ).rejects.toThrow("DB down");
    });
  });

  describe("deleteTrip", () => {
    it("deletes a trip scoped by trip_id and user_id", async () => {
      pool.query.mockResolvedValue({ rows: [{ trip_id: TRIP_ID }] });

      const result = await repo.deleteTrip(TRIP_ID, USER_ID);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("DELETE FROM trips");
      expect(sql).toContain("WHERE trip_id = $1 AND user_id = $2");
      expect(params).toEqual([TRIP_ID, USER_ID]);
      expect(result).toEqual({ trip_id: TRIP_ID });
    });

    it("returns null when no trip is deleted", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await repo.deleteTrip("missing", USER_ID)).toBeNull();
    });

    it("rethrows database errors", async () => {
      pool.query.mockRejectedValue(new Error("DB down"));
      await expect(repo.deleteTrip(TRIP_ID, USER_ID)).rejects.toThrow(
        "DB down"
      );
    });
  });
});
