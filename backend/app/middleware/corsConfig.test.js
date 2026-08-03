const cors = require("cors");
const express = require("express");
const request = require("supertest");
const createCorsOptions = require("./corsConfig");

function createApp(allowedOrigins) {
  const app = express();
  app.use(
    cors(
      createCorsOptions({
        allowedOrigins,
        fallbackOrigin: "http://localhost:3001",
      })
    )
  );
  app.get("/auth/me", (req, res) => res.sendStatus(401));
  return app;
}

describe("CORS configuration", () => {
  const apexOrigin = "https://jauntdetour.com";
  const wwwOrigin = "https://www.jauntdetour.com";
  const app = createApp(` ${apexOrigin}, ${wwwOrigin} `);

  it.each([apexOrigin, wwwOrigin])(
    "allows credentialed requests from %s",
    async (origin) => {
      const response = await request(app).get("/auth/me").set("Origin", origin);

      expect(response.status).toBe(401);
      expect(response.headers["access-control-allow-origin"]).toBe(origin);
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    }
  );

  it("allows preflight requests from an allowed origin", async () => {
    const response = await request(app)
      .options("/auth/me")
      .set("Origin", wwwOrigin)
      .set("Access-Control-Request-Method", "GET");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(wwwOrigin);
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not allow an unknown origin", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Origin", "https://example.com");

    expect(response.status).toBe(401);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows requests without an Origin header", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("falls back to FRONTEND_URL when no allowlist is configured", () => {
    expect(
      createCorsOptions({
        allowedOrigins: undefined,
        fallbackOrigin: "http://localhost:3001",
      }).origin
    ).toEqual(["http://localhost:3001"]);
  });
});
