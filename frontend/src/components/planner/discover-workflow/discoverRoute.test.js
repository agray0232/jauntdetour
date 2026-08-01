import { getRoutePoint, getVisibleDetourOptions } from "./discoverRoute";

describe("Discover route point", () => {
  const route = {
    overview_polyline: {
      decodedPoints: [
        [1, 1],
        [2, 2],
        [3, 3],
      ],
    },
  };

  it("selects the same bounded route point for search and map display", () => {
    expect(getRoutePoint(route, 50)).toEqual({ lat: 2, lng: 2 });
    expect(getRoutePoint(route, -10)).toEqual({ lat: 1, lng: 1 });
    expect(getRoutePoint(route, 110)).toEqual({ lat: 3, lng: 3 });
  });

  it("supports the rendered overview and an unavailable route", () => {
    expect(
      getRoutePoint({ overview_polyline: { complete_overview: [[4, 5]] } }, 50)
    ).toEqual({ lat: 4, lng: 5 });
    expect(getRoutePoint({}, 50)).toBeNull();
  });

  it("removes candidate markers for stops already added to the Jaunt", () => {
    const visible = getVisibleDetourOptions(
      [
        { place_id: "one", name: "One" },
        { place_id: "two", name: "Two" },
      ],
      [{ placeId: "one" }]
    );

    expect(visible).toEqual([
      { index: 1, option: { place_id: "two", name: "Two" } },
    ]);
  });
});
