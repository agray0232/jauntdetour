import { act, renderHook } from "@testing-library/react";
import RouteRequester from "../../../scripts/RouteRequester";
import { trackEvent } from "../../../telemetry/telemetry";
import useDetourMutations from "./useDetourMutations";

jest.mock("../../../scripts/RouteRequester");
jest.mock("../../../telemetry/telemetry", () => ({ trackEvent: jest.fn() }));

const detours = [
  { name: "Paris Mountain", placeId: "one", type: "Hike" },
  { name: "Falls Park", placeId: "two", type: "Landmark" },
];

function createProps(overrides = {}) {
  return {
    destination: "Charlotte",
    detourList: detours,
    origin: "Atlanta",
    setDetourList: jest.fn(),
    setRoute: jest.fn(),
    setTripSummary: jest.fn(),
    ...overrides,
  };
}

describe("useDetourMutations", () => {
  beforeEach(() => {
    RouteRequester.mockReset();
    trackEvent.mockReset();
  });

  it("captures a successful removal and restores it into the current route", async () => {
    const removedRoute = { summary: { distance: 180 } };
    const restoredRoute = { summary: { distance: 205 } };
    const getRoute = jest
      .fn()
      .mockResolvedValueOnce({ routes: [removedRoute] })
      .mockResolvedValueOnce({ routes: [restoredRoute] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps();
    const { result, rerender } = renderHook(
      (hookProps) => useDetourMutations(hookProps),
      { initialProps: props }
    );

    await act(() => result.current.runMutation({ kind: "remove", index: 0 }));

    expect(props.setDetourList).toHaveBeenLastCalledWith([detours[1]]);
    expect(result.current.undoRemoval).toEqual({
      detour: detours[0],
      index: 0,
    });

    rerender({ ...props, detourList: [detours[1]] });
    await act(() => result.current.undoLastRemoval());

    expect(props.setDetourList).toHaveBeenLastCalledWith(detours);
    expect(props.setRoute).toHaveBeenLastCalledWith(restoredRoute);
    expect(result.current.undoRemoval).toBeNull();
    expect(getRoute).toHaveBeenLastCalledWith(
      "Atlanta",
      "Charlotte",
      "Address",
      { waypoints: ["one", "two"] }
    );
  });

  it("does not duplicate a detour that is already present when Undo runs", async () => {
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockResolvedValue({
        routes: [{ summary: { distance: 180 } }],
      }),
    }));
    const props = createProps();
    const { result, rerender } = renderHook(
      (hookProps) => useDetourMutations(hookProps),
      { initialProps: props }
    );

    await act(() => result.current.runMutation({ kind: "remove", index: 0 }));
    rerender(props);
    const setDetourListCalls = props.setDetourList.mock.calls.length;

    await act(() => result.current.undoLastRemoval());

    expect(props.setDetourList).toHaveBeenCalledTimes(setDetourListCalls);
  });
});
