// Mock axios before requiring the module
jest.mock("axios");
const axios = require("axios");
const routeAPI = require("./routeAPI");

describe("routeAPI", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRoute", () => {
    it("should return route data when API call is successful", async () => {
      const mockInput = {
        origin: "New York, NY",
        destination: "Boston, MA",
        type: "Address",
      };

      const mockResponse = {
        data: {
          routes: [
            {
              legs: [
                {
                  duration: { value: 14400 },
                  distance: { value: 346000 },
                  steps: [
                    {
                      polyline: {
                        points: "encodedPolylineString",
                      },
                    },
                  ],
                },
              ],
              overview_polyline: {
                points: "encodedOverviewPolyline",
              },
            },
          ],
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await routeAPI.getRoute(mockInput);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result.routes).toBeDefined();
      expect(result.routes[0].summary).toBeDefined();
      expect(result.routes[0].summary.time).toBeDefined();
      expect(result.routes[0].summary.distance).toBeDefined();
    });

    it("should handle API errors", async () => {
      const mockInput = {
        origin: "Invalid Location",
        destination: "Another Invalid",
        type: "Address",
      };

      const mockError = new Error("API Error");
      mockError.response = "Error response";

      axios.get.mockRejectedValue(mockError);

      await expect(routeAPI.getRoute(mockInput)).rejects.toThrow("API Error");
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it("should include waypoints in the URL when provided", async () => {
      const mockInput = {
        origin: "New York, NY",
        destination: "Boston, MA",
        type: "Address",
        "waypoints[]": ["ChIJ1234", "ChIJ5678"],
      };

      const mockResponse = {
        data: {
          routes: [
            {
              legs: [
                {
                  duration: { value: 14400 },
                  distance: { value: 346000 },
                  steps: [
                    {
                      polyline: {
                        points: "encodedPolylineString",
                      },
                    },
                  ],
                },
              ],
              overview_polyline: {
                points: "encodedOverviewPolyline",
              },
            },
          ],
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      await routeAPI.getRoute(mockInput);

      expect(axios.get).toHaveBeenCalledTimes(1);
      const calledUrl = axios.get.mock.calls[0][0];
      expect(calledUrl).toContain("waypoints");
      expect(calledUrl).toContain("ChIJ1234");
      expect(calledUrl).toContain("ChIJ5678");
    });

    it("should handle single waypoint as string", async () => {
      const mockInput = {
        origin: "New York, NY",
        destination: "Boston, MA",
        type: "Address",
        "waypoints[]": "ChIJ1234",
      };

      const mockResponse = {
        data: {
          routes: [
            {
              legs: [
                {
                  duration: { value: 14400 },
                  distance: { value: 346000 },
                  steps: [
                    {
                      polyline: {
                        points: "encodedPolylineString",
                      },
                    },
                  ],
                },
              ],
              overview_polyline: {
                points: "encodedOverviewPolyline",
              },
            },
          ],
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      await routeAPI.getRoute(mockInput);

      expect(axios.get).toHaveBeenCalledTimes(1);
      const calledUrl = axios.get.mock.calls[0][0];
      expect(calledUrl).toContain("waypoints");
      expect(calledUrl).toContain("ChIJ1234");
    });

    it("should calculate travel time correctly", async () => {
      const mockInput = {
        origin: "New York, NY",
        destination: "Boston, MA",
        type: "Address",
      };

      // 2 hours and 30 minutes = 9000 seconds
      const mockResponse = {
        data: {
          routes: [
            {
              legs: [
                {
                  duration: { value: 9000 },
                  distance: { value: 200000 },
                  steps: [
                    {
                      polyline: {
                        points: "encodedPolylineString",
                      },
                    },
                  ],
                },
              ],
              overview_polyline: {
                points: "encodedOverviewPolyline",
              },
            },
          ],
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await routeAPI.getRoute(mockInput);

      expect(result.routes[0].summary.time.hours).toBe(2);
      expect(result.routes[0].summary.time.min).toBe(30);
    });

    it("should calculate distance in miles correctly", async () => {
      const mockInput = {
        origin: "New York, NY",
        destination: "Boston, MA",
        type: "Address",
      };

      // 161 km (approximately 100 miles)
      const mockResponse = {
        data: {
          routes: [
            {
              legs: [
                {
                  duration: { value: 7200 },
                  distance: { value: 160934 },
                  steps: [
                    {
                      polyline: {
                        points: "encodedPolylineString",
                      },
                    },
                  ],
                },
              ],
              overview_polyline: {
                points: "encodedOverviewPolyline",
              },
            },
          ],
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await routeAPI.getRoute(mockInput);

      const distance = parseFloat(result.routes[0].summary.distance);
      expect(distance).toBeCloseTo(100, 0);
    });
  });
});
