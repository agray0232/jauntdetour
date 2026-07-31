import RouteRequester from "../../../scripts/RouteRequester";
import { moveDetour, recalculateItinerary } from "./routeMutations";

jest.mock("../../../scripts/RouteRequester");

describe("route mutations", () => {
  it("moves detours immutably and resets calculated added time", () => {
    const detours = [
      { placeId: "one", addedTime: 10 },
      { placeId: "two", addedTime: 20 },
    ];

    const result = moveDetour(detours, 0, 1);

    expect(result.map((detour) => detour.placeId)).toEqual(["two", "one"]);
    expect(result.map((detour) => detour.addedTime)).toEqual([-1, -1]);
    expect(detours.map((detour) => detour.placeId)).toEqual(["one", "two"]);
  });

  it("recalculates with waypoint place IDs", async () => {
    const route = { summary: { distance: 12 } };
    const getRoute = jest.fn().mockResolvedValue({ routes: [route] });
    RouteRequester.mockImplementation(() => ({ getRoute }));

    await expect(
      recalculateItinerary({
        origin: "Atlanta",
        destination: "Charlotte",
        detours: [{ placeId: "one" }, { placeId: "two" }],
      })
    ).resolves.toBe(route);
    expect(getRoute).toHaveBeenCalledWith("Atlanta", "Charlotte", "Address", {
      waypoints: ["one", "two"],
    });
  });

  it("rejects a response without a route", async () => {
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockResolvedValue({ routes: [] }),
    }));

    await expect(
      recalculateItinerary({
        origin: "Atlanta",
        destination: "Charlotte",
        detours: [],
      })
    ).rejects.toThrow("No route returned");
  });
});
