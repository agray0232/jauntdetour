import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { FluentProvider } from "@fluentui/react-components";
import DiscoverWorkspace from "./DiscoverWorkspace";
import DetourRequester from "../../../scripts/DetourRequester";
import RouteRequester from "../../../scripts/RouteRequester";
import { jauntDetourTheme } from "../../../design-system/jauntDetourTheme";
import { trackEvent } from "../../../telemetry/telemetry";

jest.mock("../../../scripts/DetourRequester");
jest.mock("../../../scripts/RouteRequester");
jest.mock("../../../telemetry/telemetry", () => ({ trackEvent: jest.fn() }));

function createProps(overrides = {}) {
  return {
    detourSearchLocation: 50,
    detourSearchRadius: 20000,
    detourType: "Hike",
    detourHighlight: [],
    detourList: [],
    detourOptions: [],
    origin: "Atlanta",
    destination: "Charlotte",
    tripSummary: { distance: 245, time: { hours: 3, min: 47 } },
    route: {
      overview_polyline: {
        decodedPoints: [
          [33.749, -84.388],
          [34.5, -82.6],
          [35.2271, -80.8431],
        ],
      },
    },
    setDetourHighlight: jest.fn(),
    setDetourOptions: jest.fn(),
    setDetourSearchLocation: jest.fn(),
    setDetourSearchRadius: jest.fn(),
    setDetourType: jest.fn(),
    setRoute: jest.fn(),
    setTripSummary: jest.fn(),
    addDetour: jest.fn(),
    onAdded: jest.fn(),
    onDetourHover: jest.fn(),
    ...overrides,
  };
}

function renderWorkspace(props) {
  return render(
    <FluentProvider theme={jauntDetourTheme}>
      <DiscoverWorkspace {...props} />
    </FluentProvider>
  );
}

describe("DiscoverWorkspace", () => {
  beforeEach(() => {
    DetourRequester.mockReset();
    RouteRequester.mockReset();
    trackEvent.mockReset();
  });

  it("uses explicit category selection and preserves slider units", () => {
    const props = createProps();
    renderWorkspace(props);

    fireEvent.click(screen.getByRole("radio", { name: "Coffee" }));
    expect(props.setDetourType).toHaveBeenCalledWith("Coffee");
    expect(trackEvent).toHaveBeenCalledWith("detour_category_selected", {
      category: "Coffee",
      feature: "detour",
    });
    expect(screen.getAllByTestId(/category-icon-/)).toHaveLength(8);
    expect(screen.getByTestId("category-icon-hike")).toHaveAttribute(
      "viewBox",
      "0 0 20 20"
    );

    const routePosition = screen.getByRole("slider", {
      name: "Where along the route?",
    });
    expect(routePosition).toHaveAttribute("min", "0");
    expect(routePosition).toHaveAttribute("max", "100");
    expect(routePosition).toHaveAttribute("step", "any");
    fireEvent.change(routePosition, { target: { value: "63.4" } });
    expect(props.setDetourSearchLocation).toHaveBeenCalledWith(63.4);

    const searchRadius = screen.getByRole("slider", {
      name: "Search radius",
    });
    expect(searchRadius).toHaveAttribute("step", "any");
    fireEvent.change(searchRadius, { target: { value: "27.6" } });
    expect(props.setDetourSearchRadius).toHaveBeenCalledWith(27600);
  });

  it("selects a category from the full card surface", () => {
    const props = createProps();
    renderWorkspace(props);

    fireEvent.mouseDown(screen.getByTestId("category-card-coffee"), {
      button: 0,
    });

    expect(props.setDetourType).toHaveBeenCalledWith("Coffee");
  });

  it("rounds the displayed route percentage without changing its value", () => {
    renderWorkspace(createProps({ detourSearchLocation: 63.4 }));

    expect(
      screen.getByRole("slider", { name: "Where along the route?" })
    ).toHaveValue("63.4");
    expect(screen.getByText("Later in the drive · 63%")).toBeVisible();
  });

  it("restores persisted results and clears them when criteria changes", () => {
    const result = {
      name: "Paris Mountain",
      place_id: "place-1",
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const props = createProps({ detourOptions: [result] });
    renderWorkspace(props);

    expect(screen.getByRole("heading", { name: "1 place" })).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: "Coffee" }));

    expect(props.setDetourType).toHaveBeenCalledWith("Coffee");
    expect(props.setDetourOptions).toHaveBeenCalledWith([]);
    expect(props.setDetourHighlight).toHaveBeenCalledWith([]);
    expect(screen.getByText(/set what you want/i)).toBeVisible();
  });

  it("searches the selected route point and normalizes successful results", async () => {
    const results = [
      {
        name: "Paris Mountain",
        place_id: "place-1",
        geometry: { location: { lat: 34.9, lng: -82.4 } },
      },
    ];
    const getDetours = jest.fn().mockResolvedValue({ results });
    DetourRequester.mockImplementation(() => ({ getDetours }));
    const props = createProps();
    renderWorkspace(props);

    fireEvent.click(screen.getByRole("button", { name: "Search this area" }));

    expect(
      screen.getByRole("button", { name: "Searching this area" })
    ).toBeDisabled();
    await waitFor(() => expect(props.setDetourOptions).toHaveBeenCalled());
    expect(getDetours).toHaveBeenCalledWith(34.5, -82.6, 20000, "Hike");
    expect(props.setDetourOptions).toHaveBeenCalledWith([
      expect.objectContaining({ place_id: "place-1", type: "Hike" }),
    ]);
    expect(props.setDetourHighlight).toHaveBeenCalledWith([
      { id: "place-1", highlight: false },
    ]);
    expect(trackEvent).toHaveBeenNthCalledWith(1, "detour_search_started", {
      category: "Hike",
      feature: "detour",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "detour_search_succeeded", {
      category: "Hike",
      feature: "detour",
      resultCountBucket: "1-5",
    });
  });

  it("shows an empty result state", async () => {
    DetourRequester.mockImplementation(() => ({
      getDetours: jest.fn().mockResolvedValue({ results: [] }),
    }));
    renderWorkspace(createProps());

    fireEvent.click(screen.getByRole("button", { name: "Search this area" }));

    expect(
      await screen.findByText(/no places matched this search/i)
    ).toBeVisible();
    expect(trackEvent).toHaveBeenLastCalledWith("detour_search_empty", {
      category: "Hike",
      feature: "detour",
      resultCountBucket: "0",
    });
  });

  it("shows an error and retries the same search", async () => {
    const getDetours = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ results: [] });
    DetourRequester.mockImplementation(() => ({ getDetours }));
    renderWorkspace(createProps());

    fireEvent.click(screen.getByRole("button", { name: "Search this area" }));
    expect(
      await screen.findByText(/could not search this area/i)
    ).toBeVisible();
    expect(trackEvent).toHaveBeenLastCalledWith("detour_search_failed", {
      category: "Hike",
      failureClass: "request_failed",
      feature: "detour",
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(getDetours).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/no places matched/i)).toBeVisible();
  });

  it("selects and adds a numbered result after rerouting succeeds", async () => {
    const result = {
      id: "one",
      name: "Paris Mountain",
      place_id: "place-1",
      rating: 4.7,
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    DetourRequester.mockImplementation(() => ({
      getDetours: jest.fn().mockResolvedValue({ results: [result] }),
    }));
    const nextRoute = {
      summary: { distance: 258, time: { hours: 4, min: 5 } },
    };
    const getRoute = jest.fn().mockResolvedValue({ routes: [nextRoute] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps({ detourOptions: [result] });
    const { rerender } = renderWorkspace(props);

    fireEvent.click(screen.getByRole("button", { name: "Search this area" }));
    expect(
      await screen.findByRole("heading", { name: "1 place" })
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Select Paris Mountain" })
    );
    expect(props.setDetourHighlight).toHaveBeenLastCalledWith([
      { id: "place-1", highlight: true },
    ]);
    expect(getRoute).not.toHaveBeenCalled();
    expect(props.addDetour).not.toHaveBeenCalled();

    rerender(
      <FluentProvider theme={jauntDetourTheme}>
        <DiscoverWorkspace
          {...props}
          detourHighlight={[{ id: "place-1", highlight: true }]}
        />
      </FluentProvider>
    );
    expect(
      screen.getByRole("button", { name: "Select Paris Mountain" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(props.addDetour).toHaveBeenCalledTimes(1));
    expect(props.setRoute).toHaveBeenCalledWith(nextRoute);
    expect(props.setTripSummary).toHaveBeenCalledWith(nextRoute.summary);
    expect(props.addDetour).toHaveBeenCalledWith(
      expect.objectContaining({ placeId: "place-1", addedTime: 18 })
    );
    expect(props.setDetourOptions).toHaveBeenLastCalledWith([]);
    expect(props.setDetourHighlight).toHaveBeenLastCalledWith([]);
    expect(props.onAdded).toHaveBeenCalledWith("Paris Mountain", 18);
  });

  it("disables Add and stays inert while a shared mutation is pending", () => {
    const result = {
      id: "one",
      name: "Paris Mountain",
      place_id: "place-1",
      rating: 4.7,
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const getRoute = jest.fn();
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps({
      detourOptions: [result],
      detourHighlight: [{ id: "place-1", highlight: true }],
      mutationPending: true,
      onAddingChange: jest.fn(),
    });
    renderWorkspace(props);

    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toBeDisabled();

    fireEvent.click(addButton);

    expect(getRoute).not.toHaveBeenCalled();
    expect(props.addDetour).not.toHaveBeenCalled();
    expect(props.onAddingChange).not.toHaveBeenCalled();
  });

  it("signals adding state to coordinate with other mutations", async () => {
    const result = {
      id: "one",
      name: "Paris Mountain",
      place_id: "place-1",
      rating: 4.7,
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const getRoute = jest.fn().mockResolvedValue({
      routes: [{ summary: { distance: 258, time: { hours: 4, min: 5 } } }],
    });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const onAddingChange = jest.fn();
    const props = createProps({
      detourOptions: [result],
      detourHighlight: [{ id: "place-1", highlight: true }],
      onAddingChange,
    });
    renderWorkspace(props);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAddingChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(props.addDetour).toHaveBeenCalledTimes(1));
    expect(onAddingChange).toHaveBeenLastCalledWith(false);
  });

  it("previews a result on hover without selecting it or showing Add", () => {
    const result = {
      name: "Paris Mountain",
      place_id: "place-1",
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const props = createProps({ detourOptions: [result] });
    renderWorkspace(props);

    const resultCard = screen.getByRole("listitem");
    fireEvent.mouseEnter(resultCard);

    expect(props.onDetourHover).toHaveBeenLastCalledWith("place-1");
    expect(props.setDetourHighlight).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Add" })
    ).not.toBeInTheDocument();

    fireEvent.mouseLeave(resultCard);
    expect(props.onDetourHover).toHaveBeenLastCalledWith(null);
  });

  it("scrolls an offscreen result into view after map selection", () => {
    const result = {
      name: "Paris Mountain",
      place_id: "place-1",
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const scrollIntoView = jest.fn();
    const getComputedStyle = jest
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ overflowY: "auto" });
    const getBoundingClientRect = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function getBounds() {
        return this.tagName === "LI"
          ? { bottom: 200, top: 150 }
          : { bottom: 100, top: 0 };
      });
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    renderWorkspace(
      createProps({
        detourOptions: [result],
        mapSelectedDetourId: "place-1",
      })
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
    });
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    getComputedStyle.mockRestore();
    getBoundingClientRect.mockRestore();
  });

  it("previews a result on keyboard focus and clears it on blur", () => {
    const result = {
      name: "Paris Mountain",
      place_id: "place-1",
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const props = createProps({ detourOptions: [result] });
    renderWorkspace(props);

    const selectButton = screen.getByRole("button", {
      name: "Select Paris Mountain",
    });
    fireEvent.focus(selectButton);

    expect(props.onDetourHover).toHaveBeenLastCalledWith("place-1");
    expect(props.setDetourHighlight).not.toHaveBeenCalled();

    fireEvent.blur(selectButton);
    expect(props.onDetourHover).toHaveBeenLastCalledWith(null);
  });

  it("keeps the result selected and offers retry when add rerouting fails", async () => {
    const result = {
      name: "Paris Mountain",
      place_id: "place-1",
      rating: 4.7,
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    DetourRequester.mockImplementation(() => ({
      getDetours: jest.fn().mockResolvedValue({ results: [result] }),
    }));
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockRejectedValue(new Error("offline")),
    }));
    const props = createProps({
      detourOptions: [result],
      detourHighlight: [{ id: "place-1", highlight: true }],
    });
    renderWorkspace(props);

    fireEvent.click(screen.getByRole("button", { name: "Search this area" }));
    await screen.findByRole("heading", { name: "1 place" });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText(/could not add this stop/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry add" })).toBeVisible();
    expect(props.addDetour).not.toHaveBeenCalled();
  });

  it("has no automated accessibility violations", async () => {
    const { container } = renderWorkspace(createProps());

    expect(await axe(container)).toHaveNoViolations();
  });
});
