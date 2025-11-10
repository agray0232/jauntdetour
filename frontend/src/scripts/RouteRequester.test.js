import axios from "axios";
import RouteRequester from "./RouteRequester";
import config from "../config/config.js";

// Mock axios
jest.mock("axios");

// Mock logger
jest.mock("../utils/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe("RouteRequester", () => {
  let routeRequester;

  beforeEach(() => {
    routeRequester = new RouteRequester();
    jest.clearAllMocks();
  });

  describe("getUrlBase", () => {
    it("should return development URL when NODE_ENV is development", () => {
      const originalEnv = config.NODE_ENV;
      config.NODE_ENV = "development";

      const urlBase = routeRequester.getUrlBase();

      expect(urlBase).toBe("http://localhost:3000");

      config.NODE_ENV = originalEnv;
    });

    it("should return production URL when NODE_ENV is production", () => {
      const originalEnv = config.NODE_ENV;
      config.NODE_ENV = "production";

      const urlBase = routeRequester.getUrlBase();

      expect(urlBase).toBe("https://jauntdetour-backend.azurewebsites.net");

      config.NODE_ENV = originalEnv;
    });

    it("should return production URL by default for unknown environments", () => {
      const originalEnv = config.NODE_ENV;
      config.NODE_ENV = "unknown";

      const urlBase = routeRequester.getUrlBase();

      expect(urlBase).toBe("https://jauntdetour-backend.azurewebsites.net");

      config.NODE_ENV = originalEnv;
    });
  });

  describe("getParameters", () => {
    it("should return parameters for Address type", () => {
      const origin = "123 Main St, New York, NY";
      const destination = "456 Park Ave, New York, NY";
      const type = "Address";
      const opts = {};

      const params = routeRequester.getParameters(
        origin,
        destination,
        type,
        opts
      );

      expect(params).toEqual({
        type: "Address",
        origin: origin,
        destination: destination,
      });
    });

    it("should include waypoints when provided for Address type", () => {
      const origin = "123 Main St";
      const destination = "456 Park Ave";
      const type = "Address";
      const waypoints = [
        { location: "789 Broadway" },
        { location: "321 5th Ave" },
      ];
      const opts = { waypoints: waypoints };

      const params = routeRequester.getParameters(
        origin,
        destination,
        type,
        opts
      );

      expect(params).toEqual({
        type: "Address",
        origin: origin,
        destination: destination,
        waypoints: waypoints,
      });
    });

    it("should return empty parameters for Coordinates type", () => {
      const origin = { lat: 40.7128, lng: -74.006 };
      const destination = { lat: 40.7589, lng: -73.9851 };
      const type = "Coordinates";
      const opts = {};

      const params = routeRequester.getParameters(
        origin,
        destination,
        type,
        opts
      );

      expect(params).toEqual({});
    });

    it("should return empty parameters for unknown type", () => {
      const params = routeRequester.getParameters(
        "origin",
        "destination",
        "UnknownType",
        {}
      );

      expect(params).toEqual({});
    });

    it("should not include waypoints if not provided in opts", () => {
      const origin = "123 Main St";
      const destination = "456 Park Ave";
      const type = "Address";
      const opts = {};

      const params = routeRequester.getParameters(
        origin,
        destination,
        type,
        opts
      );

      expect(params).not.toHaveProperty("waypoints");
    });
  });

  describe("getRoute", () => {
    it("should make a GET request with correct parameters", async () => {
      const mockResponse = {
        data: {
          route: {
            legs: [
              {
                distance: { text: "10 miles", value: 16093 },
                duration: { text: "20 mins", value: 1200 },
              },
            ],
          },
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      const origin = "123 Main St, New York, NY";
      const destination = "456 Park Ave, New York, NY";
      const type = "Address";
      const opts = {};

      const result = await routeRequester.getRoute(
        origin,
        destination,
        type,
        opts
      );

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/route"),
        {
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            type: "Address",
            origin: origin,
            destination: destination,
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should resolve with response data on successful request", async () => {
      const mockData = {
        route: { overview_polyline: { points: "encoded_polyline" } },
      };
      axios.get.mockResolvedValue({ data: mockData });

      const result = await routeRequester.getRoute(
        "New York",
        "Boston",
        "Address",
        {}
      );

      expect(result).toEqual(mockData);
    });

    it("should reject with error on failed request", async () => {
      const mockError = {
        response: {
          status: 400,
          data: { error: "Invalid address" },
        },
      };

      axios.get.mockRejectedValue(mockError);

      await expect(
        routeRequester.getRoute(
          "Invalid Address",
          "Another Invalid",
          "Address",
          {}
        )
      ).rejects.toEqual(mockError);
    });

    it("should include waypoints in the request when provided", async () => {
      const mockResponse = { data: { route: {} } };
      axios.get.mockResolvedValue(mockResponse);

      const origin = "New York";
      const destination = "Boston";
      const waypoints = [{ location: "Hartford" }, { location: "Providence" }];
      const opts = { waypoints: waypoints };

      await routeRequester.getRoute(origin, destination, "Address", opts);

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            waypoints: waypoints,
          }),
        })
      );
    });

    it("should handle requests without waypoints", async () => {
      const mockResponse = { data: { route: {} } };
      axios.get.mockResolvedValue(mockResponse);

      await routeRequester.getRoute("New York", "Boston", "Address", {});

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.not.objectContaining({
            waypoints: expect.anything(),
          }),
        })
      );
    });

    it("should handle coordinate type requests", async () => {
      const mockResponse = { data: { route: {} } };
      axios.get.mockResolvedValue(mockResponse);

      const origin = { lat: 40.7128, lng: -74.006 };
      const destination = { lat: 40.7589, lng: -73.9851 };

      await routeRequester.getRoute(origin, destination, "Coordinates", {});

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: {},
        })
      );
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network Error");
      axios.get.mockRejectedValue(networkError);

      await expect(
        routeRequester.getRoute("New York", "Boston", "Address", {})
      ).rejects.toThrow("Network Error");
    });
  });
});
