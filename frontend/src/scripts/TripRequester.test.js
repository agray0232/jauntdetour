import axios from "axios";
import TripRequester, { buildTripPayload } from "./TripRequester";

jest.mock("axios");

jest.mock("../utils/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe("buildTripPayload", () => {
  const state = {
    origin: "San Francisco, CA",
    destination: "Los Angeles, CA",
    route: {
      overview_polyline: { points: "encoded_polyline_string" },
      legs: [
        {
          start_location: { lat: 37.77, lng: -122.42 },
          end_location: { lat: 36.0, lng: -120.0 },
          distance: { value: 300000 },
          duration: { value: 18000 },
        },
        {
          start_location: { lat: 36.0, lng: -120.0 },
          end_location: { lat: 34.05, lng: -118.24 },
          distance: { value: 316000 },
          duration: { value: 14400 },
        },
      ],
    },
    detourList: [
      {
        name: "Big Sur",
        type: "Landmark",
        lat: 36.27,
        lng: -121.8,
        id: "place-1",
        placeId: "gplace-1",
        rating: 4.8,
        addedTime: 45,
      },
    ],
  };

  it("pairs the typed addresses with the resolved leg coordinates", () => {
    const payload = buildTripPayload(state, "Coastal drive");

    expect(payload.tripName).toBe("Coastal drive");
    expect(payload.origin).toEqual({
      address: "San Francisco, CA",
      lat: 37.77,
      lng: -122.42,
    });
    expect(payload.destination).toEqual({
      address: "Los Angeles, CA",
      lat: 34.05,
      lng: -118.24,
    });
  });

  it("sums distance and duration across all legs and takes the encoded polyline", () => {
    const payload = buildTripPayload(state, "Coastal drive");

    expect(payload.distanceMeters).toBe(616000);
    expect(payload.durationSeconds).toBe(32400);
    expect(payload.routePolyline).toBe("encoded_polyline_string");
  });

  it("maps detours to the backend shape", () => {
    const payload = buildTripPayload(state, "Coastal drive");

    expect(payload.detours).toEqual([
      {
        placeName: "Big Sur",
        placeType: "Landmark",
        latitude: 36.27,
        longitude: -121.8,
        placeId: "gplace-1",
        rating: 4.8,
        metadata: { addedTime: 45 },
      },
    ]);
  });

  it("degrades gracefully when route data is missing", () => {
    const payload = buildTripPayload(
      { origin: "A", destination: "B", route: {}, detourList: [] },
      "Empty"
    );

    expect(payload.origin).toEqual({ address: "A", lat: null, lng: null });
    expect(payload.destination).toEqual({ address: "B", lat: null, lng: null });
    expect(payload.distanceMeters).toBeNull();
    expect(payload.durationSeconds).toBeNull();
    expect(payload.routePolyline).toBeNull();
    expect(payload.detours).toEqual([]);
  });

  it("preserves a computed 0 distance/duration when a route (legs) exists", () => {
    const payload = buildTripPayload(
      {
        origin: "A",
        destination: "A",
        route: {
          legs: [
            {
              start_location: { lat: 1, lng: 2 },
              end_location: { lat: 1, lng: 2 },
              distance: { value: 0 },
              duration: { value: 0 },
            },
          ],
        },
        detourList: [],
      },
      "Zero"
    );

    expect(payload.distanceMeters).toBe(0);
    expect(payload.durationSeconds).toBe(0);
  });
});

describe("TripRequester.listTrips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests the given page/limit with credentials and returns the data", async () => {
    const data = { trips: [{ trip_id: "t1" }], total: 1, page: 2, limit: 5 };
    axios.get.mockResolvedValue({ data });

    const result = await new TripRequester().listTrips(2, 5);

    const [url, options] = axios.get.mock.calls[0];
    expect(url).toContain("/api/trips");
    expect(options).toMatchObject({
      params: { page: 2, limit: 5 },
      withCredentials: true,
    });
    expect(result).toBe(data);
  });

  it("defaults to page 1 and limit 10", async () => {
    axios.get.mockResolvedValue({ data: {} });

    await new TripRequester().listTrips();

    const [, options] = axios.get.mock.calls[0];
    expect(options.params).toEqual({ page: 1, limit: 10 });
  });

  it("propagates errors", async () => {
    axios.get.mockRejectedValue(new Error("network"));

    await expect(new TripRequester().listTrips()).rejects.toThrow("network");
  });
});
