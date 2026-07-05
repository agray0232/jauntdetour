// Mock the logger so tests don't produce noisy output.
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const UserRepository = require("./UserRepository");

describe("UserRepository", () => {
  let pool;
  let repo;

  beforeEach(() => {
    pool = { query: jest.fn() };
    repo = new UserRepository(pool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("throws when no pool is provided", () => {
      expect(() => new UserRepository()).toThrow(
        "UserRepository requires a database pool with a query method"
      );
    });

    it("throws when the pool has no query method", () => {
      expect(() => new UserRepository({})).toThrow(
        "UserRepository requires a database pool with a query method"
      );
    });
  });

  describe("createUser", () => {
    it("inserts a user with parameterized values and returns the row", async () => {
      const newUser = {
        user_id: "11111111-1111-1111-1111-111111111111",
        external_id: "entra-sub-1",
        email: "alice@example.com",
        display_name: "Alice",
        preferences: {},
      };
      pool.query.mockResolvedValue({ rows: [newUser] });

      const result = await repo.createUser({
        externalId: "entra-sub-1",
        email: "alice@example.com",
        displayName: "Alice",
        preferences: { theme: "dark" },
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("INSERT INTO users");
      expect(sql).toContain("$1, $2, $3, $4");
      expect(params).toEqual([
        "entra-sub-1",
        "alice@example.com",
        "Alice",
        { theme: "dark" },
      ]);
      expect(result).toBe(newUser);
    });

    it("defaults displayName to null and preferences to an empty object", async () => {
      pool.query.mockResolvedValue({ rows: [{ user_id: "u1" }] });

      await repo.createUser({ externalId: "x", email: "b@example.com" });

      const [, params] = pool.query.mock.calls[0];
      expect(params).toEqual(["x", "b@example.com", null, {}]);
    });

    it("maps a unique-violation to a DUPLICATE_USER error", async () => {
      const pgError = new Error("duplicate key value");
      pgError.code = "23505";
      pgError.constraint = "users_email_key";
      pool.query.mockRejectedValue(pgError);

      await expect(
        repo.createUser({ externalId: "x", email: "dup@example.com" })
      ).rejects.toMatchObject({ code: "DUPLICATE_USER" });
    });

    it("rethrows non-unique database errors", async () => {
      pool.query.mockRejectedValue(new Error("connection terminated"));

      await expect(
        repo.createUser({ externalId: "x", email: "c@example.com" })
      ).rejects.toThrow("connection terminated");
    });
  });

  describe("getUserById", () => {
    it("selects an active user by id and returns the row", async () => {
      const user = { user_id: "u1", email: "a@example.com" };
      pool.query.mockResolvedValue({ rows: [user] });

      const result = await repo.getUserById("u1");

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("WHERE user_id = $1 AND is_active = true");
      expect(params).toEqual(["u1"]);
      expect(result).toBe(user);
    });

    it("returns null when no user is found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await repo.getUserById("missing")).toBeNull();
    });

    it("rethrows database errors", async () => {
      pool.query.mockRejectedValue(new Error("DB down"));
      await expect(repo.getUserById("u1")).rejects.toThrow("DB down");
    });
  });

  describe("getUserByEmail", () => {
    it("selects an active user by email", async () => {
      const user = { user_id: "u1", email: "a@example.com" };
      pool.query.mockResolvedValue({ rows: [user] });

      const result = await repo.getUserByEmail("a@example.com");

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("WHERE email = $1 AND is_active = true");
      expect(params).toEqual(["a@example.com"]);
      expect(result).toBe(user);
    });

    it("returns null when no user is found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await repo.getUserByEmail("nope@example.com")).toBeNull();
    });
  });

  describe("getUserByExternalId", () => {
    it("selects a user by external_id (no active filter)", async () => {
      const user = { user_id: "u1", external_id: "entra-sub-1" };
      pool.query.mockResolvedValue({ rows: [user] });

      const result = await repo.getUserByExternalId("entra-sub-1");

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("WHERE external_id = $1");
      expect(params).toEqual(["entra-sub-1"]);
      expect(result).toBe(user);
    });

    it("returns null when no user is found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await repo.getUserByExternalId("missing")).toBeNull();
    });
  });

  describe("upsertByExternalId", () => {
    it("creates a new user when none exists for the external_id", async () => {
      const created = {
        user_id: "u-new",
        external_id: "entra-sub-9",
        email: "new@example.com",
        display_name: "New User",
      };
      // First query: getUserByExternalId -> no rows. Second query: createUser insert.
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [created] });

      const result = await repo.upsertByExternalId({
        externalId: "entra-sub-9",
        email: "new@example.com",
        displayName: "New User",
      });

      expect(pool.query).toHaveBeenCalledTimes(2);
      const [insertSql, insertParams] = pool.query.mock.calls[1];
      expect(insertSql).toContain("INSERT INTO users");
      expect(insertParams).toEqual([
        "entra-sub-9",
        "new@example.com",
        "New User",
        {},
      ]);
      expect(result).toBe(created);
    });

    it("updates email, display name, and last_login when the user exists", async () => {
      const existing = {
        user_id: "u-existing",
        external_id: "entra-sub-1",
        email: "old@example.com",
        display_name: "Old Name",
      };
      const updated = {
        ...existing,
        email: "fresh@example.com",
        display_name: "Fresh",
      };
      // First query: getUserByExternalId -> the existing row. Second: updateUser.
      pool.query
        .mockResolvedValueOnce({ rows: [existing] })
        .mockResolvedValueOnce({ rows: [updated] });

      const result = await repo.upsertByExternalId({
        externalId: "entra-sub-1",
        email: "fresh@example.com",
        displayName: "Fresh",
      });

      expect(pool.query).toHaveBeenCalledTimes(2);
      const [updateSql, updateParams] = pool.query.mock.calls[1];
      expect(updateSql).toContain("UPDATE users");
      expect(updateSql).toContain("email = $1");
      expect(updateSql).toContain("display_name = $2");
      expect(updateSql).toContain("last_login = $3");
      // email, displayName, lastLogin (a Date), then the user_id in the WHERE clause.
      expect(updateParams[0]).toBe("fresh@example.com");
      expect(updateParams[1]).toBe("Fresh");
      expect(updateParams[2]).toBeInstanceOf(Date);
      expect(updateParams[3]).toBe("u-existing");
      expect(result).toBe(updated);
    });

    it("defaults displayName to null when omitted", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ user_id: "u2" }] });

      await repo.upsertByExternalId({
        externalId: "entra-sub-2",
        email: "noname@example.com",
      });

      const [, insertParams] = pool.query.mock.calls[1];
      expect(insertParams).toEqual([
        "entra-sub-2",
        "noname@example.com",
        null,
        {},
      ]);
    });
  });

  describe("updateUser", () => {
    it("builds a parameterized SET clause for provided fields only", async () => {
      const updated = { user_id: "u1", display_name: "New Name" };
      pool.query.mockResolvedValue({ rows: [updated] });

      const result = await repo.updateUser("u1", {
        displayName: "New Name",
        preferences: { theme: "light" },
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("display_name = $1");
      expect(sql).toContain("preferences = $2");
      expect(sql).toContain("WHERE user_id = $3 AND is_active = true");
      expect(params).toEqual(["New Name", { theme: "light" }, "u1"]);
      expect(result).toBe(updated);
    });

    it("ignores unknown fields and only updates allowed columns", async () => {
      pool.query.mockResolvedValue({ rows: [{ user_id: "u1" }] });

      await repo.updateUser("u1", {
        email: "new@example.com",
        hacker: "DROP TABLE",
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("email = $1");
      expect(sql).not.toContain("hacker");
      expect(params).toEqual(["new@example.com", "u1"]);
    });

    it("throws when no updatable fields are supplied", async () => {
      await expect(repo.updateUser("u1", {})).rejects.toThrow(
        "updateUser requires at least one updatable field"
      );
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns null when the user does not exist", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await repo.updateUser("missing", { displayName: "X" })).toBeNull();
    });

    it("maps a unique-violation to a DUPLICATE_USER error", async () => {
      const pgError = new Error("duplicate key value");
      pgError.code = "23505";
      pool.query.mockRejectedValue(pgError);

      await expect(
        repo.updateUser("u1", { email: "taken@example.com" })
      ).rejects.toMatchObject({ code: "DUPLICATE_USER" });
    });
  });

  describe("deleteUser (soft delete)", () => {
    it("sets is_active = false and returns the row", async () => {
      const row = { user_id: "u1", is_active: false };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await repo.deleteUser("u1");

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("SET is_active = false");
      expect(sql).toContain("WHERE user_id = $1 AND is_active = true");
      expect(params).toEqual(["u1"]);
      expect(result).toBe(row);
    });

    it("returns null when the user is already inactive or missing", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await repo.deleteUser("u1")).toBeNull();
    });

    it("rethrows database errors", async () => {
      pool.query.mockRejectedValue(new Error("DB error"));
      await expect(repo.deleteUser("u1")).rejects.toThrow("DB error");
    });
  });

  describe("hardDeleteUser", () => {
    it("deletes the row and returns its id", async () => {
      pool.query.mockResolvedValue({ rows: [{ user_id: "u1" }] });

      const result = await repo.hardDeleteUser("u1");

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("DELETE FROM users");
      expect(sql).toContain("WHERE user_id = $1");
      expect(params).toEqual(["u1"]);
      expect(result).toEqual({ user_id: "u1" });
    });

    it("returns null when the user does not exist", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await repo.hardDeleteUser("missing")).toBeNull();
    });

    it("rethrows database errors", async () => {
      pool.query.mockRejectedValue(new Error("FK violation"));
      await expect(repo.hardDeleteUser("u1")).rejects.toThrow("FK violation");
    });
  });
});
