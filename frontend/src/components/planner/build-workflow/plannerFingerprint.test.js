import { createPlannerFingerprint } from "./plannerFingerprint";

describe("planner fingerprint", () => {
  it("is stable for equivalent planner data", () => {
    const planner = {
      origin: " Atlanta ",
      destination: { address: "Charlotte" },
      tripName: " Weekend ",
      route: { overview_polyline: { points: "abc" } },
      detourList: [
        {
          name: "Paris Mountain",
          placeId: "one",
          lat: 1,
          lng: 2,
          type: "Hike",
          addedTime: 18,
        },
      ],
    };

    expect(createPlannerFingerprint(planner)).toBe(
      createPlannerFingerprint({
        ...planner,
        origin: "Atlanta",
        tripName: "Weekend",
      })
    );
  });

  it("changes when route order or naming changes", () => {
    const base = {
      origin: "Atlanta",
      destination: "Charlotte",
      tripName: "Weekend",
      route: { overview_polyline: { points: "abc" } },
      detourList: [
        { name: "One", placeId: "one" },
        { name: "Two", placeId: "two" },
      ],
    };

    expect(
      createPlannerFingerprint({
        ...base,
        detourList: base.detourList.slice().reverse(),
      })
    ).not.toBe(createPlannerFingerprint(base));
    expect(createPlannerFingerprint({ ...base, tripName: "Changed" })).not.toBe(
      createPlannerFingerprint(base)
    );
  });
});
