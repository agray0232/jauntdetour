import { buildTripPayload } from "./TripRequester";

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
});
