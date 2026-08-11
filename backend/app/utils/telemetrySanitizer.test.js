const {
  sanitizeHttpSpan,
  sanitizePostgresSpan,
  sanitizeUrl,
} = require("./telemetrySanitizer");

describe("telemetrySanitizer", () => {
  test("removes query strings and redacts dynamic trip IDs", () => {
    const tripId = "123e4567-e89b-42d3-a456-426614174000";

    expect(sanitizeUrl(`/api/trips/${tripId}?include=private`)).toBe(
      "/api/trips/:tripId"
    );
    expect(
      sanitizeUrl(`https://maps.googleapis.com/maps/api/place?key=secret`)
    ).toBe("https://maps.googleapis.com/maps/api/place");
  });

  test("overrides HTTP URL attributes with a sanitized path", () => {
    const span = { setAttributes: jest.fn() };

    sanitizeHttpSpan(span, { url: "/places?location=34.9,-82.4&key=secret" });

    expect(span.setAttributes).toHaveBeenCalledWith({
      "client.address": "0.0.0.0",
      "http.client_ip": "0.0.0.0",
      "http.target": "/places",
      "http.url": "/places",
      "http.user_agent": "[REDACTED]",
      "network.peer.address": "0.0.0.0",
      "url.full": "/places",
      "url.query": "",
      "user_agent.original": "[REDACTED]",
    });
  });

  test("sanitizes outgoing request paths when no URL field exists", () => {
    const span = { setAttributes: jest.fn() };

    sanitizeHttpSpan(span, { path: "/maps/api/directions/json?key=secret" });

    expect(span.setAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        "http.url": "/maps/api/directions/json",
        "url.full": "/maps/api/directions/json",
      })
    );
  });

  test("redacts PostgreSQL statement attributes", () => {
    const span = { setAttributes: jest.fn() };

    sanitizePostgresSpan(span);

    expect(span.setAttributes).toHaveBeenCalledWith({
      "db.query.text": "[REDACTED]",
      "db.statement": "[REDACTED]",
    });
  });
});
