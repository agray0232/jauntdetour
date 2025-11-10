// Mock axios before requiring the module
jest.mock("axios");
const axios = require("axios");
const placesAPI = require("./placesAPI");

describe("placesAPI", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getPlaces", () => {
    it("should return places data when API call is successful", async () => {
      const mockInput = {
        searchText: "coffee",
        lat: 40.7128,
        lng: -74.006,
        radius: 5000,
      };

      const mockResponse = {
        data: {
          results: [
            {
              name: "Starbucks",
              place_id: "ChIJ1234",
              geometry: {
                location: {
                  lat: 40.7128,
                  lng: -74.006,
                },
              },
            },
            {
              name: "Local Coffee Shop",
              place_id: "ChIJ5678",
              geometry: {
                location: {
                  lat: 40.713,
                  lng: -74.007,
                },
              },
            },
          ],
          status: "OK",
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await placesAPI.getPlaces(mockInput);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(2);
      expect(result.results[0].name).toBe("Starbucks");
    });

    it("should handle API errors", async () => {
      const mockInput = {
        searchText: "invalid",
        lat: 0,
        lng: 0,
        radius: 1000,
      };

      const mockError = new Error("API Error");
      mockError.response = "Error response";

      axios.get.mockRejectedValue(mockError);

      await expect(placesAPI.getPlaces(mockInput)).rejects.toThrow("API Error");
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it("should format URL correctly with search parameters", async () => {
      const mockInput = {
        searchText: "hiking trails",
        lat: 35.6762,
        lng: 139.6503,
        radius: 10000,
      };

      const mockResponse = {
        data: {
          results: [],
          status: "ZERO_RESULTS",
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      await placesAPI.getPlaces(mockInput);

      expect(axios.get).toHaveBeenCalledTimes(1);
      const calledUrl = axios.get.mock.calls[0][0];
      expect(calledUrl).toContain("location=35.6762,139.6503");
      expect(calledUrl).toContain("radius=10000");
      expect(calledUrl).toContain("keyword=hiking%20trails");
    });

    it("should handle search text with spaces", async () => {
      const mockInput = {
        searchText: "burger restaurant",
        lat: 40.7128,
        lng: -74.006,
        radius: 2000,
      };

      const mockResponse = {
        data: {
          results: [],
          status: "OK",
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      await placesAPI.getPlaces(mockInput);

      expect(axios.get).toHaveBeenCalledTimes(1);
      const calledUrl = axios.get.mock.calls[0][0];
      expect(calledUrl).toContain("keyword=burger%20restaurant");
    });

    it("should include all required parameters in URL", async () => {
      const mockInput = {
        searchText: "museum",
        lat: 51.5074,
        lng: -0.1278,
        radius: 3000,
      };

      const mockResponse = {
        data: {
          results: [],
          status: "OK",
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      await placesAPI.getPlaces(mockInput);

      expect(axios.get).toHaveBeenCalledTimes(1);
      const calledUrl = axios.get.mock.calls[0][0];
      expect(calledUrl).toContain("location=");
      expect(calledUrl).toContain("radius=");
      expect(calledUrl).toContain("keyword=");
      expect(calledUrl).toContain("key=");
    });
  });
});
