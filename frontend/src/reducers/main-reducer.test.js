import mainReducer from "./main-reducer";

describe("mainReducer — trip name and current trip", () => {
  it("defaults tripName to an empty string and currentTrip to null", () => {
    const state = mainReducer(undefined, { type: "@@INIT" });
    expect(state.tripName).toBe("");
    expect(state.currentTrip).toBeNull();
  });

  it("SET_TRIP_NAME updates the trip name", () => {
    const state = mainReducer(undefined, {
      type: "SET_TRIP_NAME",
      data: { tripName: "Coastal weekend" },
    });
    expect(state.tripName).toBe("Coastal weekend");
  });

  it("SET_CURRENT_TRIP records the loaded trip", () => {
    const currentTrip = {
      tripId: "t1",
      tripName: "Coastal weekend",
      updatedAt: "2026-07-07T12:00:00.000Z",
    };
    const state = mainReducer(undefined, {
      type: "SET_CURRENT_TRIP",
      data: { currentTrip },
    });
    expect(state.currentTrip).toEqual(currentTrip);
  });

  it("CLEAR_ALL resets tripName and currentTrip but preserves the user", () => {
    const loaded = mainReducer(
      { user: { id: "u1" } },
      {
        type: "SET_CURRENT_TRIP",
        data: {
          currentTrip: { tripId: "t1", tripName: "X", updatedAt: "now" },
        },
      }
    );
    const withName = mainReducer(loaded, {
      type: "SET_TRIP_NAME",
      data: { tripName: "X" },
    });

    const cleared = mainReducer(withName, { type: "CLEAR_ALL" });

    expect(cleared.tripName).toBe("");
    expect(cleared.currentTrip).toBeNull();
    expect(cleared.user).toEqual({ id: "u1" });
  });

  it("BUMP_TRIPS_REVISION increments the revision counter", () => {
    const first = mainReducer(undefined, { type: "BUMP_TRIPS_REVISION" });
    expect(first.tripsRevision).toBe(1);
    const second = mainReducer(first, { type: "BUMP_TRIPS_REVISION" });
    expect(second.tripsRevision).toBe(2);
  });

  it("CLEAR_ALL preserves the trips revision counter", () => {
    const bumped = mainReducer(undefined, { type: "BUMP_TRIPS_REVISION" });
    const cleared = mainReducer(bumped, { type: "CLEAR_ALL" });
    expect(cleared.tripsRevision).toBe(1);
  });
});
