import axios from "axios";
import DetourRequester from "./DetourRequester";
import config from "../config/config.js";

// Mock axios
jest.mock("axios");

// Mock logger
jest.mock("../utils/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe("DetourRequester", () => {
  let detourRequester;

  beforeEach(() => {
    detourRequester = new DetourRequester();
    jest.clearAllMocks();
  });

  describe("getUrlBase", () => {
    it("should return development URL when NODE_ENV is development", () => {
      const originalEnv = config.NODE_ENV;
      config.NODE_ENV = "development";

      const urlBase = detourRequester.getUrlBase();

      expect(urlBase).toBe("http://localhost:3000");

      config.NODE_ENV = originalEnv;
    });

    it("should return production URL when NODE_ENV is production", () => {
      const originalEnv = config.NODE_ENV;
      config.NODE_ENV = "production";

      const urlBase = detourRequester.getUrlBase();

      expect(urlBase).toBe("https://jauntdetour-backend.azurewebsites.net");

      config.NODE_ENV = originalEnv;
    });

    it("should return production URL by default for unknown environments", () => {
      const originalEnv = config.NODE_ENV;
      config.NODE_ENV = "unknown";

      const urlBase = detourRequester.getUrlBase();

      expect(urlBase).toBe("https://jauntdetour-backend.azurewebsites.net");

      config.NODE_ENV = originalEnv;
    });
  });

  describe("getDetours", () => {
    it("should make a GET request with correct parameters", async () => {
      const mockResponse = {
        data: {
          places: [
            { name: "Test Place 1", location: { lat: 40.7128, lng: -74.006 } },
            { name: "Test Place 2", location: { lat: 40.7138, lng: -74.007 } },
          ],
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      const lat = 40.7128;
      const lng = -74.006;
      const radius = 5000;
      const type = "restaurant";

      const result = await detourRequester.getDetours(lat, lng, radius, type);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/places"),
        {
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            searchText: type,
            lat: lat,
            lng: lng,
            radius: radius,
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should resolve with response data on successful request", async () => {
      const mockData = { places: [{ name: "Coffee Shop" }] };
      axios.get.mockResolvedValue({ data: mockData });

      const result = await detourRequester.getDetours(
        40.7128,
        -74.006,
        1000,
        "coffee"
      );

      expect(result).toEqual(mockData);
    });

    it("should reject with error on failed request", async () => {
      const mockError = {
        response: {
          status: 500,
          data: { error: "Internal server error" },
        },
      };

      axios.get.mockRejectedValue(mockError);

      await expect(
        detourRequester.getDetours(40.7128, -74.006, 1000, "restaurant")
      ).rejects.toEqual(mockError);
    });

    it("should handle different detour types", async () => {
      const mockResponse = { data: { places: [] } };
      axios.get.mockResolvedValue(mockResponse);

      const types = ["hike", "museum", "park", "bar"];

      for (const type of types) {
        await detourRequester.getDetours(40.7128, -74.006, 2000, type);

        expect(axios.get).toHaveBeenCalledWith(expect.any(String), {
          headers: { "Content-Type": "application/json" },
          params: {
            searchText: type,
            lat: 40.7128,
            lng: -74.006,
            radius: 2000,
          },
        });
      }
    });

    it("should handle different radius values", async () => {
      const mockResponse = { data: { places: [] } };
      axios.get.mockResolvedValue(mockResponse);

      const radiusValues = [500, 1000, 5000, 10000];

      for (const radius of radiusValues) {
        await detourRequester.getDetours(40.7128, -74.006, radius, "coffee");

        expect(axios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            params: expect.objectContaining({
              radius: radius,
            }),
          })
        );
      }
    });

    it("should handle different coordinates", async () => {
      const mockResponse = { data: { places: [] } };
      axios.get.mockResolvedValue(mockResponse);

      const coordinates = [
        { lat: 40.7128, lng: -74.006 },
        { lat: 51.5074, lng: -0.1278 },
        { lat: 35.6762, lng: 139.6503 },
      ];

      for (const coord of coordinates) {
        await detourRequester.getDetours(
          coord.lat,
          coord.lng,
          1000,
          "restaurant"
        );

        expect(axios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            params: expect.objectContaining({
              lat: coord.lat,
              lng: coord.lng,
            }),
          })
        );
      }
    });
  });
});
