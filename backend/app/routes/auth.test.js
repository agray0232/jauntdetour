// Mock the MSAL/Entra config so the router can be imported without real env vars
// or network access. Each function is a jest mock we can program per test.
jest.mock("../../config/auth", () => ({
  msalClient: {
    getAuthCodeUrl: jest.fn(),
    acquireTokenByCode: jest.fn(),
  },
  authority: "https://testtenant.ciamlogin.com/tenant-guid",
  redirectUri: "http://localhost:3000/auth/callback",
  scopes: ["openid", "profile", "email"],
  cryptoProvider: {
    generatePkceCodes: jest.fn(),
    createNewGuid: jest.fn(),
  },
}));

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const { msalClient, cryptoProvider } = require("../../config/auth");
const createAuthRouter = require("./auth");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

describe("auth routes", () => {
  let app;
  let session;
  let userRepository;

  // Minimal fake session middleware: a plain object with a destroy() method,
  // seeded per test so we can assert what the routes read and write.
  function buildApp(initialSession = {}) {
    session = { ...initialSession };
    const application = express();
    application.use((req, res, next) => {
      req.session = session;
      req.session.destroy = (cb) => {
        session = {};
        req.session = {};
        if (cb) cb();
      };
      next();
    });
    application.use("/auth", createAuthRouter({ userRepository }));
    return application;
  }

  beforeEach(() => {
    userRepository = {
      upsertByExternalId: jest.fn(),
      getUserById: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("factory", () => {
    it("throws when no userRepository is provided", () => {
      expect(() => createAuthRouter({})).toThrow(
        "createAuthRouter requires a userRepository"
      );
    });
  });

  describe("GET /auth/login", () => {
    it("stores PKCE + state in the session and redirects to the auth URL", async () => {
      cryptoProvider.generatePkceCodes.mockResolvedValue({
        verifier: "verifier-1",
        challenge: "challenge-1",
      });
      cryptoProvider.createNewGuid.mockReturnValue("state-1");
      msalClient.getAuthCodeUrl.mockResolvedValue(
        "https://testtenant.ciamlogin.com/authorize?x=1"
      );

      app = buildApp();
      const res = await request(app).get("/auth/login");

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(
        "https://testtenant.ciamlogin.com/authorize?x=1"
      );
      expect(session.pkceVerifier).toBe("verifier-1");
      expect(session.authState).toBe("state-1");

      const [args] = msalClient.getAuthCodeUrl.mock.calls[0];
      expect(args).toMatchObject({
        codeChallenge: "challenge-1",
        codeChallengeMethod: "S256",
        state: "state-1",
      });
    });

    it("returns 500 when building the auth URL fails", async () => {
      cryptoProvider.generatePkceCodes.mockRejectedValue(new Error("boom"));

      app = buildApp();
      const res = await request(app).get("/auth/login");

      expect(res.status).toBe(500);
    });
  });

  describe("GET /auth/callback", () => {
    it("exchanges the code, upserts the user, sets the session, and redirects", async () => {
      msalClient.acquireTokenByCode.mockResolvedValue({
        idTokenClaims: {
          sub: "entra-sub-1",
          email: "alice@example.com",
          name: "Alice",
        },
      });
      userRepository.upsertByExternalId.mockResolvedValue({
        user_id: "user-1",
      });

      app = buildApp({ authState: "state-1", pkceVerifier: "verifier-1" });
      const res = await request(app)
        .get("/auth/callback")
        .query({ code: "auth-code", state: "state-1" });

      expect(msalClient.acquireTokenByCode).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "auth-code",
          codeVerifier: "verifier-1",
        })
      );
      expect(userRepository.upsertByExternalId).toHaveBeenCalledWith({
        externalId: "entra-sub-1",
        email: "alice@example.com",
        displayName: "Alice",
      });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(FRONTEND_URL);
      expect(session.userId).toBe("user-1");
      expect(session.pkceVerifier).toBeUndefined();
      expect(session.authState).toBeUndefined();
    });

    it("rejects a state mismatch with 400 and does not exchange the code", async () => {
      app = buildApp({ authState: "state-1", pkceVerifier: "verifier-1" });
      const res = await request(app)
        .get("/auth/callback")
        .query({ code: "auth-code", state: "wrong-state" });

      expect(res.status).toBe(400);
      expect(msalClient.acquireTokenByCode).not.toHaveBeenCalled();
    });

    it("returns 400 when the authorization code is missing", async () => {
      app = buildApp({ authState: "state-1" });
      const res = await request(app)
        .get("/auth/callback")
        .query({ state: "state-1" });

      expect(res.status).toBe(400);
    });

    it("returns 400 and does not upsert when the ID token has no email claim", async () => {
      msalClient.acquireTokenByCode.mockResolvedValue({
        idTokenClaims: { sub: "entra-sub-1", name: "Alice" },
      });

      app = buildApp({ authState: "state-1", pkceVerifier: "verifier-1" });
      const res = await request(app)
        .get("/auth/callback")
        .query({ code: "auth-code", state: "state-1" });

      expect(res.status).toBe(400);
      expect(userRepository.upsertByExternalId).not.toHaveBeenCalled();
    });
  });

  describe("GET /auth/me", () => {
    it("returns the current user when authenticated", async () => {
      const user = { user_id: "user-1", email: "alice@example.com" };
      userRepository.getUserById.mockResolvedValue(user);

      app = buildApp({ userId: "user-1" });
      const res = await request(app).get("/auth/me");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ user });
    });

    it("returns 401 when there is no session user", async () => {
      app = buildApp();
      const res = await request(app).get("/auth/me");

      expect(res.status).toBe(401);
      expect(userRepository.getUserById).not.toHaveBeenCalled();
    });
  });

  describe("POST /auth/logout", () => {
    it("destroys the session and returns the Entra logout URL", async () => {
      app = buildApp({ userId: "user-1" });
      const res = await request(app).post("/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.logoutUrl).toContain(
        "https://testtenant.ciamlogin.com/tenant-guid/oauth2/v2.0/logout"
      );
      expect(res.body.logoutUrl).toContain(encodeURIComponent(FRONTEND_URL));
    });
  });
});
