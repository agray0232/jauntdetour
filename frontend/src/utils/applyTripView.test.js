import mainReducer from "../reducers/main-reducer";
import applyTripView from "./applyTripView";

describe("applyTripView", () => {
  it("replaces in-progress planning state with the saved Jaunt snapshot", () => {
    let state = mainReducer(undefined, {});
    state = {
      ...state,
      user: { name: "Alex" },
      origin: "Old origin",
      detourList: [{ placeId: "old-stop" }],
      tripsRevision: 4,
    };
    const dispatch = (action) => {
      state = mainReducer(state, action);
    };
    const trip = {
      tripId: 42,
      tripName: "Mountain weekend",
      updatedAt: "2026-08-01T12:00:00.000Z",
      origin: { address: "Atlanta, GA", lat: 33.749, lng: -84.388 },
      destination: {
        address: "Asheville, NC",
        lat: 35.5951,
        lng: -82.5515,
      },
      distanceMeters: 320000,
      durationSeconds: 12600,
    };
    const route = {
      summary: "I-85 N",
      overview_polyline: { points: "saved-polyline" },
    };
    const detours = [{ placeId: "coffee-stop", type: "Coffee" }];

    applyTripView(dispatch, { trip, route, detours });

    expect(state).toMatchObject({
      user: { name: "Alex" },
      tripsRevision: 4,
      origin: "Atlanta, GA",
      destination: "Asheville, NC",
      tripName: "Mountain weekend",
      route,
      tripSummary: "I-85 N",
      detourList: detours,
      currentTrip: {
        tripId: 42,
        tripName: "Mountain weekend",
        routePolyline: "saved-polyline",
        distanceMeters: 320000,
        durationSeconds: 12600,
      },
    });
    expect(state.currentTrip.savedFingerprint).toEqual(expect.any(String));
  });
});
