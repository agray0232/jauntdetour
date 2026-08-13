const express = require("express");
const request = require("supertest");
const logger = require("../utils/logger");
const createPlaceAutocompleteRouter = require("./placeAutocomplete");

jest.mock("../utils/logger", () => ({
  error: jest.fn(),
}));

describe("place autocomplete routes", () => {
  function buildApp(placeAutocompleteAPI) {
    const app = express();
    app.use(
      "/api/places/autocomplete",
      createPlaceAutocompleteRouter({ placeAutocompleteAPI })
    );
    return app;
  }

  it("requires an autocomplete API dependency", () => {
    expect(() => createPlaceAutocompleteRouter({})).toThrow(
      "createPlaceAutocompleteRouter requires a placeAutocompleteAPI"
    );
  });

  it("returns normalized suggestions for trimmed input", async () => {
    const suggestions = [{ placeId: "place-ohio", text: "Ashland, OH, USA" }];
    const placeAutocompleteAPI = {
      getSuggestions: jest.fn().mockResolvedValue(suggestions),
    };

    const response = await request(buildApp(placeAutocompleteAPI))
      .get("/api/places/autocomplete")
      .query({ input: "  Ashland  " });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ suggestions });
    expect(placeAutocompleteAPI.getSuggestions).toHaveBeenCalledWith("Ashland");
  });

  it.each(["", "A", "x".repeat(201)])(
    "rejects invalid input length for %p",
    async (input) => {
      const placeAutocompleteAPI = { getSuggestions: jest.fn() };

      const response = await request(buildApp(placeAutocompleteAPI))
        .get("/api/places/autocomplete")
        .query({ input });

      expect(response.status).toBe(400);
      expect(placeAutocompleteAPI.getSuggestions).not.toHaveBeenCalled();
    }
  );

  it("returns a gateway error when Google fails", async () => {
    const error = new Error("unavailable");
    error.response = { status: 403 };
    const placeAutocompleteAPI = {
      getSuggestions: jest.fn().mockRejectedValue(error),
    };

    const response = await request(buildApp(placeAutocompleteAPI))
      .get("/api/places/autocomplete")
      .query({ input: "Ashland" });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: "Failed to load place suggestions",
    });
    expect(logger.error).toHaveBeenCalledWith(
      "GET /api/places/autocomplete failed",
      { message: "unavailable", status: 403 }
    );
  });
});
