const { buildTripView, buildSummary, computeBounds } = require("./tripView");

// The canonical Google-documented polyline; decodes to three points.
const SAMPLE_POLYLINE = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
const SAMPLE_POINTS = [
  [38.5, -120.2],
  [40.7, -120.95],
  [43.252, -126.453],
];

describe("buildSummary", () => {
  it("converts meters to miles and seconds to hours/min", () => {
    // 3218.68 m = 2 mi; 5400 s = 1 h 30 m. Under 100 mi is a toPrecision(3)
    // string (matches routeAPI), so "2.00" not 2.
    const summary = buildSummary(3218.68, 5400);
    expect(summary.distance).toBe("2.00");
    expect(summary.time).toEqual({ hours: 1, min: 30 });
  });

  it("keeps 3 significant digits under 100 miles", () => {
    const summary = buildSummary(16093.4, 0); // ~10 mi
    expect(summary.distance).toBe("10.0");
    expect(summary.time).toEqual({ hours: 0, min: 0 });
  });

  it("rounds to whole miles at or above 100", () => {
    const summary = buildSummary(200000, 0); // ~124.3 mi
    expect(summary.distance).toBe(124);
  });

  it("treats null distance/duration as zero", () => {
    expect(buildSummary(null, null)).toEqual({
      distance: "0.00",
      time: { hours: 0, min: 0 },
    });
  });
});

describe("computeBounds", () => {
  it("returns north-east / south-west corners", () => {
    expect(computeBounds(SAMPLE_POINTS)).toEqual({
      northeast: { lat: 43.252, lng: -120.2 },
      southwest: { lat: 38.5, lng: -126.453 },
    });
  });

  it("returns null for empty points", () => {
    expect(computeBounds([])).toBeNull();
  });
});

describe("buildTripView", () => {
  const trip = {
    trip_id: "t1",
    trip_name: "Coastal drive",
    origin: { address: "SF", lat: 37.77, lng: -122.42 },
    destination: { address: "LA", lat: 34.05, lng: -118.24 },
    route_polyline: SAMPLE_POLYLINE,
    distance_meters: 3218.68,
    duration_seconds: 5400,
  };

  it("decodes the polyline into complete_overview and decodedPoints", () => {
    const view = buildTripView(trip, []);

    expect(view.route.overview_polyline.points).toBe(SAMPLE_POLYLINE);
    expect(view.route.overview_polyline.complete_overview).toHaveLength(3);
    // Same array is exposed under both keys the frontend reads.
    expect(view.route.overview_polyline.decodedPoints).toBe(
      view.route.overview_polyline.complete_overview
    );
    view.route.overview_polyline.complete_overview.forEach((point, i) => {
      expect(point[0]).toBeCloseTo(SAMPLE_POINTS[i][0], 3);
      expect(point[1]).toBeCloseTo(SAMPLE_POINTS[i][1], 3);
    });
  });

  it("includes bounds and a formatted summary", () => {
    const view = buildTripView(trip, []);
    expect(view.route.bounds.northeast.lat).toBeCloseTo(43.252, 3);
    expect(view.route.bounds.southwest.lng).toBeCloseTo(-126.453, 3);
    expect(view.route.summary).toEqual({
      distance: "2.00",
      time: { hours: 1, min: 30 },
    });
  });

  it("returns the trip identity and endpoints", () => {
    const view = buildTripView(trip, []);
    expect(view.trip).toEqual({
      tripId: "t1",
      tripName: "Coastal drive",
      origin: { address: "SF", lat: 37.77, lng: -122.42 },
      destination: { address: "LA", lat: 34.05, lng: -118.24 },
    });
  });

  it("maps detours and coerces DECIMAL string columns to numbers", () => {
    const view = buildTripView(trip, [
      {
        place_name: "Big Sur",
        place_type: "Landmark",
        latitude: "36.27000000",
        longitude: "-121.80000000",
        place_id: "gp-1",
        rating: "4.8",
        metadata: { addedTime: 45 },
      },
    ]);

    expect(view.detours).toEqual([
      {
        name: "Big Sur",
        type: "Landmark",
        lat: 36.27,
        lng: -121.8,
        id: "gp-1",
        placeId: "gp-1",
        rating: 4.8,
        addedTime: 45,
      },
    ]);
  });

  it("returns a null route when the trip has no polyline", () => {
    const view = buildTripView({ ...trip, route_polyline: null }, []);
    expect(view.route).toBeNull();
    expect(view.trip.tripId).toBe("t1");
  });
});
