import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { FluentProvider } from "@fluentui/react-components";
import JauntItinerary from "./JauntItinerary";
import RouteRequester from "../../../scripts/RouteRequester";
import { jauntDetourTheme } from "../../../design-system/jauntDetourTheme";
import { trackEvent } from "../../../telemetry/telemetry";

jest.mock("../../../scripts/RouteRequester");
jest.mock("../../../telemetry/telemetry", () => ({ trackEvent: jest.fn() }));

const detours = [
  {
    name: "Paris Mountain",
    placeId: "one",
    rating: 4.7,
    type: "Hike",
    addedTime: 18,
  },
  {
    name: "Falls Park",
    placeId: "two",
    rating: 4.8,
    type: "Landmark",
    addedTime: 12,
  },
];

function createProps(overrides = {}) {
  return {
    origin: "Atlanta",
    destination: "Charlotte",
    detourList: detours,
    setRoute: jest.fn(),
    setTripSummary: jest.fn(),
    setDetourList: jest.fn(),
    ...overrides,
  };
}

function renderItinerary(props) {
  return render(
    <FluentProvider theme={jauntDetourTheme}>
      <JauntItinerary {...props} />
    </FluentProvider>
  );
}

describe("JauntItinerary", () => {
  beforeEach(() => {
    RouteRequester.mockReset();
    trackEvent.mockReset();
  });

  it("renders a complete non-map route sequence", () => {
    renderItinerary(createProps());

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("Atlanta")).toBeVisible();
    expect(screen.getByText("Paris Mountain")).toBeVisible();
    expect(screen.getByText("Falls Park")).toBeVisible();
    expect(screen.getByText("Charlotte")).toBeVisible();
    expect(screen.getByRole("img", { name: "Hike stop" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Landmark stop" })).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Find a detour" })
    ).toHaveLength(2);
  });

  it("commits a removal only after rerouting succeeds", async () => {
    const route = { summary: { distance: 200 } };
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockResolvedValue({ routes: [route] }),
    }));
    const props = createProps();
    renderItinerary(props);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Paris Mountain" })
    );

    expect(screen.getByRole("status")).toHaveTextContent("Recalculating route");
    await waitFor(() =>
      expect(props.setDetourList).toHaveBeenCalledWith([detours[1]])
    );
    expect(props.setRoute).toHaveBeenCalledWith(route);
    expect(props.setTripSummary).toHaveBeenCalledWith(route.summary);
    expect(trackEvent).toHaveBeenCalledWith("detour_removed", {
      category: "Hike",
      countBucket: "1-5",
      feature: "detour",
    });
  });

  it("retains the itinerary on failure and retries the same mutation", async () => {
    const getRoute = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ routes: [{ summary: { distance: 200 } }] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps();
    renderItinerary(props);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Paris Mountain" })
    );
    expect(await screen.findByText(/itinerary was not changed/i)).toBeVisible();
    expect(props.setDetourList).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalledWith(
      "detour_removed",
      expect.anything()
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(props.setDetourList).toHaveBeenCalledTimes(1));
    expect(getRoute).toHaveBeenCalledTimes(2);
  });

  it("reorders stops through keyboard-operable commands", async () => {
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockResolvedValue({
        routes: [{ summary: { distance: 210 } }],
      }),
    }));
    const props = createProps();
    renderItinerary(props);

    fireEvent.click(
      screen.getByRole("button", { name: "Move Paris Mountain later" })
    );

    await waitFor(() => expect(props.setDetourList).toHaveBeenCalledTimes(1));
    expect(
      props.setDetourList.mock.calls[0][0].map((detour) => detour.placeId)
    ).toEqual(["two", "one"]);
  });

  it("returns focus to the itinerary heading after removing the only stop", async () => {
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockResolvedValue({
        routes: [{ summary: { distance: 190 } }],
      }),
    }));
    const props = createProps({ detourList: [detours[0]] });
    renderItinerary(props);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Paris Mountain" })
    );

    await waitFor(() => expect(props.setDetourList).toHaveBeenCalledWith([]));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Itinerary" })).toHaveFocus()
    );
  });

  it("has no automated accessibility violations", async () => {
    const { container } = renderItinerary(createProps());

    expect(await axe(container)).toHaveNoViolations();
  });
});
