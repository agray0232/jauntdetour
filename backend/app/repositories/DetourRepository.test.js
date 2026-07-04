// Mock the logger so tests don't produce noisy output.
jest.mock("../utils/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

const DetourRepository = require("./DetourRepository");

describe("DetourRepository", () => {
    let pool;
    let repo;

    const USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const TRIP_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const DETOUR_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

    beforeEach(() => {
        pool = { query: jest.fn() };
        repo = new DetourRepository(pool);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("throws when no pool is provided", () => {
            expect(() => new DetourRepository()).toThrow(
                "DetourRepository requires a database pool with a query method"
            );
        });

        it("throws when the pool has no query method", () => {
            expect(() => new DetourRepository({})).toThrow(
                "DetourRepository requires a database pool with a query method"
            );
        });
    });

    describe("createDetour", () => {
        it("inserts only when the parent trip is owned, with parameterized values", async () => {
            const newDetour = { detour_id: DETOUR_ID, trip_id: TRIP_ID };
            pool.query.mockResolvedValue({ rows: [newDetour] });

            const result = await repo.createDetour({
                tripId: TRIP_ID,
                userId: USER_ID,
                placeName: "Yosemite Falls",
                latitude: 37.7455,
                longitude: -119.5967,
                placeId: "gp1",
                placeType: "park",
                address: "Yosemite Valley, CA",
                positionOnRoute: 0.85,
                estimatedDetourDurationSeconds: 300,
                estimatedDetourDistanceMeters: 500,
                rating: 4.8,
                priceLevel: 2,
                stopDurationMinutes: 120,
                visitTime: "2026-07-04T12:00:00Z",
                notes: "Bring water",
                metadata: { source: "test" },
            });

            expect(pool.query).toHaveBeenCalledTimes(1);
            const [sql, params] = pool.query.mock.calls[0];
            expect(sql).toContain("INSERT INTO detours");
            // Ownership enforced atomically via EXISTS against trips.
            expect(sql).toContain("WHERE EXISTS");
            expect(sql).toContain("FROM trips WHERE trip_id = $1 AND user_id = $17");
            expect(params).toEqual([
                TRIP_ID,
                "gp1",
                "Yosemite Falls",
                "park",
                37.7455,
                -119.5967,
                "Yosemite Valley, CA",
                0.85,
                300,
                500,
                4.8,
                2,
                120,
                "2026-07-04T12:00:00Z",
                "Bring water",
                { source: "test" },
                USER_ID,
            ]);
            expect(result).toBe(newDetour);
        });

        it("applies defaults for optional fields", async () => {
            pool.query.mockResolvedValue({ rows: [{ detour_id: DETOUR_ID }] });

            await repo.createDetour({
                tripId: TRIP_ID,
                userId: USER_ID,
                placeName: "Rest Stop",
                latitude: 40,
                longitude: -100,
            });

            const [, params] = pool.query.mock.calls[0];
            expect(params).toEqual([
                TRIP_ID,
                null, // placeId
                "Rest Stop",
                null, // placeType
                40,
                -100,
                null, // address
                null, // positionOnRoute
                null, // estimatedDetourDurationSeconds
                null, // estimatedDetourDistanceMeters
                null, // rating
                null, // priceLevel
                30, // stopDurationMinutes default
                null, // visitTime
                null, // notes
                {}, // metadata default
                USER_ID,
            ]);
        });

        it("returns null when the trip is not found or not owned", async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const result = await repo.createDetour({
                tripId: TRIP_ID,
                userId: "not-the-owner",
                placeName: "X",
                latitude: 1,
                longitude: 2,
            });

            expect(result).toBeNull();
        });

        it("rethrows database errors", async () => {
            pool.query.mockRejectedValue(new Error("connection terminated"));

            await expect(
                repo.createDetour({
                    tripId: TRIP_ID,
                    userId: USER_ID,
                    placeName: "X",
                    latitude: 1,
                    longitude: 2,
                })
            ).rejects.toThrow("connection terminated");
        });
    });

    describe("getDetourById", () => {
        it("joins trips and scopes by detour_id and user_id", async () => {
            const detour = { detour_id: DETOUR_ID };
            pool.query.mockResolvedValue({ rows: [detour] });

            const result = await repo.getDetourById(DETOUR_ID, USER_ID);

            const [sql, params] = pool.query.mock.calls[0];
            expect(sql).toContain("JOIN trips t ON d.trip_id = t.trip_id");
            expect(sql).toContain("WHERE d.detour_id = $1 AND t.user_id = $2");
            expect(params).toEqual([DETOUR_ID, USER_ID]);
            expect(result).toBe(detour);
        });

        it("returns null when no detour is found", async () => {
            pool.query.mockResolvedValue({ rows: [] });
            expect(await repo.getDetourById("missing", USER_ID)).toBeNull();
        });

        it("rethrows database errors", async () => {
            pool.query.mockRejectedValue(new Error("DB down"));
            await expect(repo.getDetourById(DETOUR_ID, USER_ID)).rejects.toThrow(
                "DB down"
            );
        });
    });

    describe("getDetoursByTripId", () => {
        it("joins trips, scopes by trip_id and user_id, ordered by position", async () => {
            const detours = [{ detour_id: DETOUR_ID }];
            pool.query.mockResolvedValue({ rows: detours });

            const result = await repo.getDetoursByTripId(TRIP_ID, USER_ID);

            const [sql, params] = pool.query.mock.calls[0];
            expect(sql).toContain("JOIN trips t ON d.trip_id = t.trip_id");
            expect(sql).toContain("WHERE d.trip_id = $1 AND t.user_id = $2");
            expect(sql).toContain("ORDER BY d.position_on_route ASC NULLS LAST");
            expect(params).toEqual([TRIP_ID, USER_ID]);
            expect(result).toBe(detours);
        });

        it("rethrows database errors", async () => {
            pool.query.mockRejectedValue(new Error("DB down"));
            await expect(repo.getDetoursByTripId(TRIP_ID, USER_ID)).rejects.toThrow(
                "DB down"
            );
        });
    });

    describe("updateDetour", () => {
        it("builds a dynamic SET clause scoped via the parent trip", async () => {
            const updated = { detour_id: DETOUR_ID, notes: "Updated" };
            pool.query.mockResolvedValue({ rows: [updated] });

            const result = await repo.updateDetour(DETOUR_ID, USER_ID, {
                notes: "Updated",
                stopDurationMinutes: 45,
            });

            const [sql, params] = pool.query.mock.calls[0];
            expect(sql).toContain("UPDATE detours");
            // SET columns follow the allow-list declaration order, not input order:
            // stopDurationMinutes precedes notes in UPDATABLE_COLUMNS.
            expect(sql).toContain("stop_duration_minutes = $1");
            expect(sql).toContain("notes = $2");
            expect(sql).toContain("WHERE detour_id = $3");
            expect(sql).toContain(
                "trip_id IN (SELECT trip_id FROM trips WHERE user_id = $4)"
            );
            expect(params).toEqual([45, "Updated", DETOUR_ID, USER_ID]);
            expect(result).toBe(updated);
        });

        it("ignores fields that are not in the allow-list", async () => {
            pool.query.mockResolvedValue({ rows: [{ detour_id: DETOUR_ID }] });

            await repo.updateDetour(DETOUR_ID, USER_ID, {
                notes: "OK",
                detour_id: "hacked",
                trip_id: "hacked",
            });

            const [sql, params] = pool.query.mock.calls[0];
            expect(sql).toContain("notes = $1");
            expect(params).toEqual(["OK", DETOUR_ID, USER_ID]);
        });

        it("throws when no updatable fields are supplied", async () => {
            await expect(repo.updateDetour(DETOUR_ID, USER_ID, {})).rejects.toThrow(
                "updateDetour requires at least one updatable field"
            );
            expect(pool.query).not.toHaveBeenCalled();
        });

        it("returns null when no detour is updated", async () => {
            pool.query.mockResolvedValue({ rows: [] });
            const result = await repo.updateDetour(DETOUR_ID, USER_ID, {
                notes: "X",
            });
            expect(result).toBeNull();
        });

        it("rethrows database errors", async () => {
            pool.query.mockRejectedValue(new Error("DB down"));
            await expect(
                repo.updateDetour(DETOUR_ID, USER_ID, { notes: "X" })
            ).rejects.toThrow("DB down");
        });
    });

    describe("deleteDetour", () => {
        it("deletes a detour scoped via the parent trip", async () => {
            pool.query.mockResolvedValue({ rows: [{ detour_id: DETOUR_ID }] });

            const result = await repo.deleteDetour(DETOUR_ID, USER_ID);

            const [sql, params] = pool.query.mock.calls[0];
            expect(sql).toContain("DELETE FROM detours");
            expect(sql).toContain("WHERE detour_id = $1");
            expect(sql).toContain(
                "trip_id IN (SELECT trip_id FROM trips WHERE user_id = $2)"
            );
            expect(params).toEqual([DETOUR_ID, USER_ID]);
            expect(result).toEqual({ detour_id: DETOUR_ID });
        });

        it("returns null when no detour is deleted", async () => {
            pool.query.mockResolvedValue({ rows: [] });
            expect(await repo.deleteDetour("missing", USER_ID)).toBeNull();
        });

        it("rethrows database errors", async () => {
            pool.query.mockRejectedValue(new Error("DB down"));
            await expect(repo.deleteDetour(DETOUR_ID, USER_ID)).rejects.toThrow(
                "DB down"
            );
        });
    });
});
