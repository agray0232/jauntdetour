import React, { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import PlannerWorkspace from "./PlannerWorkspace";
import { jauntDetourTheme } from "../../design-system/jauntDetourTheme";
import RouteRequester from "../../scripts/RouteRequester";

const mockDiscoverProps = jest.fn();
const mockMapProps = jest.fn();

jest.mock("../../scripts/RouteRequester");

jest.mock("./build-workflow/RouteForm", () => {
  const PropTypes = require("prop-types");

  function MockRouteForm({ onRouteReady }) {
    return (
      <div>
        Route form instance
        <button onClick={onRouteReady}>Complete route</button>
      </div>
    );
  }

  MockRouteForm.propTypes = {
    onRouteReady: PropTypes.func.isRequired,
  };

  return MockRouteForm;
});

jest.mock("./build-workflow/BuildRouteDetails", () => {
  const PropTypes = require("prop-types");

  function MockRouteDetails({
    onClear,
    onDiscover,
    onEditRoute,
    onSaveStateChange,
  }) {
    return (
      <div>
        Route details instance
        <button onClick={onDiscover}>Open Discover</button>
        <button onClick={onEditRoute}>Edit route</button>
        <button onClick={onClear}>Clear Jaunt</button>
        <button onClick={() => onSaveStateChange("saving")}>
          Start saving
        </button>
      </div>
    );
  }

  MockRouteDetails.propTypes = {
    onClear: PropTypes.func.isRequired,
    onDiscover: PropTypes.func.isRequired,
    onEditRoute: PropTypes.func.isRequired,
    onSaveStateChange: PropTypes.func.isRequired,
  };

  return MockRouteDetails;
});

jest.mock("./discover-workflow/DiscoverWorkspace", () => {
  const PropTypes = require("prop-types");

  function MockDiscoverWorkspace(props) {
    mockDiscoverProps(props);
    const { hoveredDetourId, onAdded, onAddingChange, onDetourHover } = props;
    return (
      <div>
        Discover workspace instance
        <span data-testid="discover-hovered">{hoveredDetourId || "none"}</span>
        <button onClick={() => onDetourHover("place-1")}>Hover result</button>
        <button onClick={() => onAdded("Paris Mountain", 18)}>
          Complete add
        </button>
        <button onClick={() => onAddingChange(true)}>Start add request</button>
        <button onClick={() => onAddingChange(false)}>
          Finish add request
        </button>
      </div>
    );
  }

  MockDiscoverWorkspace.propTypes = {
    hoveredDetourId: PropTypes.string,
    onAdded: PropTypes.func.isRequired,
    onAddingChange: PropTypes.func.isRequired,
    onDetourHover: PropTypes.func.isRequired,
  };

  return MockDiscoverWorkspace;
});

jest.mock(
  "./export-workflow/ExportWorkspace",
  () =>
    function MockExportWorkspace() {
      return <div>Export workspace instance</div>;
    }
);

jest.mock(
  "../MapContainer",
  () =>
    function MockMap(props) {
      mockMapProps(props);
      return (
        <div>
          Map instance
          <span data-testid="map-detour-count">{props.detourList.length}</span>
          <span data-testid="map-hovered">
            {props.hoveredDetourId || "none"}
          </span>
          {props.onRemoveDetour ? (
            <button onClick={() => props.onRemoveDetour(0)}>
              Remove map detour
            </button>
          ) : null}
        </div>
      );
    }
);

function createProps(overrides = {}) {
  return {
    origin: "",
    destination: "",
    currentTrip: null,
    tripSummary: {},
    tripName: "",
    route: [],
    detourList: [],
    detourOptions: [],
    detourHighlight: [],
    detourType: "Hike",
    detourSearchLocation: 50,
    detourSearchRadius: 20000,
    showRoute: false,
    showDetourButton: false,
    showDetourForm: false,
    showDetourOptions: false,
    showDetourSearchPoint: false,
    setOrigin: jest.fn(),
    setDestination: jest.fn(),
    setRoute: jest.fn(),
    setTripSummary: jest.fn(),
    setTripName: jest.fn(),
    setDetourType: jest.fn(),
    setDetourSearchLocation: jest.fn(),
    setDetourSearchRadius: jest.fn(),
    setDetourOptions: jest.fn(),
    setDetourHighlight: jest.fn(),
    setDetourList: jest.fn(),
    addDetour: jest.fn(),
    removeDetour: jest.fn(),
    getDetourForm: jest.fn(),
    clearAll: jest.fn(),
    clearDetourOptions: jest.fn(),
    ...overrides,
  };
}

function renderWorkspace(props) {
  return render(
    <FluentProvider theme={jauntDetourTheme}>
      <PlannerWorkspace {...props} />
    </FluentProvider>
  );
}

describe("PlannerWorkspace", () => {
  let compactMediaQuery;

  beforeEach(() => {
    compactMediaQuery = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    window.matchMedia = jest.fn(() => compactMediaQuery);
    mockDiscoverProps.mockClear();
    mockMapProps.mockClear();
    RouteRequester.mockReset();
  });

  it("shows only route entry before a route exists", () => {
    renderWorkspace(createProps());

    expect(screen.getByText("Route form instance")).toBeVisible();
    expect(
      screen.queryByText("Route details instance")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Not saved")).not.toBeInTheDocument();
    expect(screen.queryByText("My Jaunts control")).not.toBeInTheDocument();
    expect(screen.getAllByText("Map instance")).toHaveLength(1);
  });

  it("uses touch-native map options only in compact layouts", () => {
    compactMediaQuery.matches = true;
    const { unmount } = renderWorkspace(createProps());

    expect(mockMapProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cameraControl: false,
        mapGestureHandling: "greedy",
        mapTypeControl: false,
        zoomControl: false,
      })
    );
    unmount();

    compactMediaQuery.matches = false;
    renderWorkspace(createProps());
    expect(mockMapProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cameraControl: true,
        mapGestureHandling: undefined,
        mapTypeControl: true,
        zoomControl: true,
      })
    );
  });

  it("replaces route entry with details and supports Edit route", () => {
    renderWorkspace(createProps());

    fireEvent.click(screen.getByRole("button", { name: "Complete route" }));
    expect(screen.queryByText("Route form instance")).not.toBeInTheDocument();
    expect(screen.getByText("Route details instance")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Edit route" }));
    expect(screen.getByText("Route form instance")).toBeVisible();
  });

  it("mounts one ready workflow tree and one map", () => {
    renderWorkspace(
      createProps({
        showDetourButton: true,
        showDetourForm: true,
        showDetourOptions: true,
        tripSummary: { distance: 245 },
      })
    );

    expect(screen.queryByText("Route form instance")).not.toBeInTheDocument();
    expect(screen.getAllByText("Route details instance")).toHaveLength(1);
    expect(screen.getAllByText("Discover workspace instance")).toHaveLength(1);
    expect(screen.getAllByText("Map instance")).toHaveLength(1);
    expect(screen.getByText("Not saved")).toBeVisible();
  });

  it("shows the detour search area only while Discover is active", () => {
    renderWorkspace(
      createProps({
        showDetourButton: true,
        showDetourSearchPoint: true,
      })
    );

    expect(mockMapProps.mock.lastCall[0].showDetourSearchPoint).toBe(false);

    fireEvent.click(screen.getByRole("tab", { name: "Discover" }));
    expect(mockMapProps.mock.lastCall[0].showDetourSearchPoint).toBe(true);

    fireEvent.click(screen.getByRole("tab", { name: "Export" }));
    expect(mockMapProps.mock.lastCall[0].showDetourSearchPoint).toBe(false);

    fireEvent.click(screen.getByRole("tab", { name: "Build" }));
    expect(mockMapProps.mock.lastCall[0].showDetourSearchPoint).toBe(false);
  });

  it("removes a map detour and restores it from the Undo toast", async () => {
    const detour = {
      name: "Paris Mountain",
      placeId: "place-1",
      type: "Hike",
    };
    const getRoute = jest
      .fn()
      .mockResolvedValueOnce({ routes: [{ summary: { distance: 180 } }] })
      .mockResolvedValueOnce({ routes: [{ summary: { distance: 205 } }] });
    RouteRequester.mockImplementation(() => ({ getRoute }));

    function MutationHarness() {
      const [detourList, setDetourList] = useState([detour]);
      return (
        <PlannerWorkspace
          {...createProps({
            destination: "Charlotte",
            detourList,
            origin: "Atlanta",
            setDetourList,
            showDetourButton: true,
            showRoute: true,
            tripSummary: { distance: 205 },
          })}
        />
      );
    }

    render(
      <FluentProvider theme={jauntDetourTheme}>
        <MutationHarness />
      </FluentProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove map detour" }));

    expect(
      await screen.findByText("Paris Mountain removed from this Jaunt")
    ).toBeVisible();
    expect(screen.getByTestId("map-detour-count")).toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "Undo" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Undo" })).toHaveStyle({
      minWidth: "auto",
      paddingLeft: 0,
      paddingRight: 0,
    });
    expect(
      screen.getByRole("button", { name: "Dismiss removal notification" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() =>
      expect(screen.getByTestId("map-detour-count")).toHaveTextContent("1")
    );
    expect(getRoute).toHaveBeenLastCalledWith(
      "Atlanta",
      "Charlotte",
      "Address",
      { waypoints: ["place-1"] }
    );
  });

  it("blocks Undo during a Discover add and releases it afterward", async () => {
    const detour = {
      name: "Paris Mountain",
      placeId: "place-1",
      type: "Hike",
    };
    const getRoute = jest.fn().mockResolvedValue({
      routes: [{ summary: { distance: 180 } }],
    });
    RouteRequester.mockImplementation(() => ({ getRoute }));

    function MutationHarness() {
      const [detourList, setDetourList] = useState([detour]);
      return (
        <PlannerWorkspace
          {...createProps({
            destination: "Charlotte",
            detourList,
            origin: "Atlanta",
            setDetourList,
            showDetourButton: true,
            showDetourForm: true,
            showRoute: true,
            tripSummary: { distance: 205 },
          })}
        />
      );
    }

    render(
      <FluentProvider theme={jauntDetourTheme}>
        <MutationHarness />
      </FluentProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove map detour" }));
    await screen.findByRole("button", { name: "Undo" });
    expect(getRoute).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Start add request" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(getRoute).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Finish add request" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(getRoute).toHaveBeenCalledTimes(2));
  });

  it("retries a failed map removal from the error toast", async () => {
    const detour = {
      name: "Paris Mountain",
      placeId: "place-1",
      type: "Hike",
    };
    const getRoute = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ routes: [{ summary: { distance: 180 } }] });
    RouteRequester.mockImplementation(() => ({ getRoute }));

    function MutationHarness() {
      const [detourList, setDetourList] = useState([detour]);
      return (
        <PlannerWorkspace
          {...createProps({
            destination: "Charlotte",
            detourList,
            origin: "Atlanta",
            setDetourList,
            showDetourButton: true,
            showRoute: true,
            tripSummary: { distance: 205 },
          })}
        />
      );
    }

    render(
      <FluentProvider theme={jauntDetourTheme}>
        <MutationHarness />
      </FluentProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove map detour" }));

    expect(
      await screen.findByText("Could not remove the detour.")
    ).toBeVisible();
    expect(screen.getByTestId("map-detour-count")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByText("Paris Mountain removed from this Jaunt")
    ).toBeVisible();
    await waitFor(() =>
      expect(screen.getByTestId("map-detour-count")).toHaveTextContent("0")
    );
    expect(getRoute).toHaveBeenCalledTimes(2);
  });

  it("retries a failed Undo restore from the error toast", async () => {
    const detour = {
      name: "Paris Mountain",
      placeId: "place-1",
      type: "Hike",
    };
    const getRoute = jest
      .fn()
      .mockResolvedValueOnce({ routes: [{ summary: { distance: 180 } }] })
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ routes: [{ summary: { distance: 205 } }] });
    RouteRequester.mockImplementation(() => ({ getRoute }));

    function MutationHarness() {
      const [detourList, setDetourList] = useState([detour]);
      return (
        <PlannerWorkspace
          {...createProps({
            destination: "Charlotte",
            detourList,
            origin: "Atlanta",
            setDetourList,
            showDetourButton: true,
            showRoute: true,
            tripSummary: { distance: 205 },
          })}
        />
      );
    }

    render(
      <FluentProvider theme={jauntDetourTheme}>
        <MutationHarness />
      </FluentProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove map detour" }));
    await screen.findByText("Paris Mountain removed from this Jaunt");
    await waitFor(() =>
      expect(screen.getByTestId("map-detour-count")).toHaveTextContent("0")
    );

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(
      await screen.findByText("Could not restore the detour.")
    ).toBeVisible();
    expect(screen.getByTestId("map-detour-count")).toHaveTextContent("0");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(screen.getByTestId("map-detour-count")).toHaveTextContent("1")
    );
    expect(getRoute).toHaveBeenCalledTimes(3);
  });

  it("allows the removal toast to be dismissed early", async () => {
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockResolvedValue({
        routes: [{ summary: { distance: 180 } }],
      }),
    }));
    const detour = {
      name: "Paris Mountain",
      placeId: "place-1",
      type: "Hike",
    };

    function MutationHarness() {
      const [detourList, setDetourList] = useState([detour]);
      return (
        <PlannerWorkspace
          {...createProps({
            destination: "Charlotte",
            detourList,
            origin: "Atlanta",
            setDetourList,
            showDetourButton: true,
            showRoute: true,
            tripSummary: { distance: 205 },
          })}
        />
      );
    }

    render(
      <FluentProvider theme={jauntDetourTheme}>
        <MutationHarness />
      </FluentProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove map detour" }));
    await screen.findByText("Paris Mountain removed from this Jaunt");

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss removal notification" })
    );

    await waitFor(() =>
      expect(
        screen.queryByText("Paris Mountain removed from this Jaunt")
      ).not.toBeInTheDocument()
    );
  });

  it("synchronizes detour hover and clears it when results change", () => {
    const props = createProps({
      detourOptions: [{ place_id: "place-1" }],
      showDetourButton: true,
      showDetourForm: true,
    });
    const { rerender } = renderWorkspace(props);

    fireEvent.click(screen.getByRole("button", { name: "Hover result" }));
    expect(screen.getByTestId("discover-hovered")).toHaveTextContent("place-1");
    expect(screen.getByTestId("map-hovered")).toHaveTextContent("place-1");

    rerender(
      <FluentProvider theme={jauntDetourTheme}>
        <PlannerWorkspace {...props} detourOptions={[]} />
      </FluentProvider>
    );

    expect(screen.getByTestId("discover-hovered")).toHaveTextContent("none");
    expect(screen.getByTestId("map-hovered")).toHaveTextContent("none");
  });

  it("keeps Discover unavailable until a route exists", () => {
    renderWorkspace(createProps());

    const buildTab = screen.getByRole("tab", { name: "Build" });
    const discoverTab = screen.getByRole("tab", { name: "Discover" });
    const exportTab = screen.getByRole("tab", { name: "Export" });

    expect(discoverTab).toBeDisabled();
    expect(exportTab).toBeDisabled();
    expect(buildTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("build-tab-icon")).toBeInTheDocument();
    expect(screen.getByTestId("discover-tab-icon")).toBeInTheDocument();
    expect(screen.getByTestId("export-tab-icon")).toBeInTheDocument();
  });

  it("shows a resumed saved Jaunt name and status in the panel header", () => {
    const origin = { address: "Atlanta, GA", lat: 33.749, lng: -84.388 };
    const destination = {
      address: "Charlotte, NC",
      lat: 35.2271,
      lng: -80.8431,
    };
    renderWorkspace(
      createProps({
        currentTrip: {
          tripId: "trip-1",
          tripName: "Saved weekend",
          origin,
          destination,
        },
        tripName: "Saved weekend",
        showDetourButton: true,
        tripSummary: { distance: 245 },
      })
    );

    expect(screen.getByRole("textbox", { name: "Jaunt name" })).toHaveValue(
      "Saved weekend"
    );
    expect(screen.getByText("Loaded")).toBeVisible();
    expect(mockMapProps).toHaveBeenCalledWith(
      expect.objectContaining({ origin, destination })
    );
  });

  it("edits the Jaunt name once in the panel header", () => {
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      showDetourButton: true,
      tripSummary: { distance: 245 },
    });
    const { rerender } = renderWorkspace(props);

    const nameField = screen.getByRole("textbox", { name: "Jaunt name" });
    expect(nameField).toHaveAttribute("placeholder", "Atlanta to Charlotte");
    expect(nameField).toHaveValue("");
    expect(props.setTripName).toHaveBeenCalledWith("Atlanta to Charlotte");
    props.setTripName.mockClear();

    fireEvent.change(nameField, { target: { value: "Carolinas weekend" } });
    expect(props.setTripName).toHaveBeenCalledWith("Carolinas weekend");

    rerender(
      <FluentProvider theme={jauntDetourTheme}>
        <PlannerWorkspace
          {...createProps({
            origin: "Atlanta",
            destination: "Charlotte",
            showDetourButton: true,
            tripSummary: { distance: 245 },
            tripName: "Carolinas weekend",
          })}
        />
      </FluentProvider>
    );
    expect(screen.getByRole("textbox", { name: "Jaunt name" })).toHaveValue(
      "Carolinas weekend"
    );
    expect(screen.getAllByRole("textbox", { name: "Jaunt name" })).toHaveLength(
      1
    );
  });

  it("prefills the suggested name for a new Jaunt", () => {
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      showDetourButton: true,
      tripSummary: { distance: 245 },
    });
    renderWorkspace(props);

    expect(props.setTripName).toHaveBeenCalledWith("Atlanta to Charlotte");
  });

  it("does not replace a custom Jaunt name", () => {
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      showDetourButton: true,
      tripName: "Carolinas weekend",
      tripSummary: { distance: 245 },
    });
    renderWorkspace(props);

    expect(props.setTripName).not.toHaveBeenCalled();
  });

  it("allows the user to clear a generated name while editing", () => {
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      showDetourButton: true,
      tripName: "Atlanta to Charlotte",
      tripSummary: { distance: 245 },
    });
    const { rerender } = renderWorkspace(props);
    props.setTripName.mockClear();

    rerender(
      <FluentProvider theme={jauntDetourTheme}>
        <PlannerWorkspace {...props} tripName="" />
      </FluentProvider>
    );

    expect(props.setTripName).not.toHaveBeenCalled();
  });

  it("updates a generated name when the route changes", () => {
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      showDetourButton: true,
      tripName: "Atlanta to Charlotte",
      tripSummary: { distance: 245 },
    });
    const { rerender } = renderWorkspace(props);
    expect(props.setTripName).not.toHaveBeenCalled();

    rerender(
      <FluentProvider theme={jauntDetourTheme}>
        <PlannerWorkspace {...props} destination="Greenville" />
      </FluentProvider>
    );

    expect(props.setTripName).toHaveBeenCalledWith("Atlanta to Greenville");
  });

  it("moves save operation status into the panel header", () => {
    renderWorkspace(
      createProps({
        showDetourButton: true,
        tripSummary: { distance: 245 },
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Start saving" }));
    expect(screen.getByText("Saving")).toBeVisible();
  });

  it("opens Discover from the route-ready action", () => {
    const props = createProps({
      showDetourButton: true,
      tripSummary: { distance: 245 },
    });
    renderWorkspace(props);

    fireEvent.click(screen.getByRole("button", { name: "Open Discover" }));

    expect(props.getDetourForm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("tab", { name: "Discover" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("opens Export from the route-ready planner", () => {
    renderWorkspace(
      createProps({
        showDetourButton: true,
        tripSummary: { distance: 245 },
      })
    );

    fireEvent.click(screen.getByRole("tab", { name: "Export" }));

    expect(screen.getByRole("tab", { name: "Export" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("Export workspace instance")).toBeVisible();
  });

  it("clears the Jaunt from the route-ready Build actions", () => {
    const props = createProps({
      showDetourButton: true,
      tripSummary: { distance: 245 },
    });
    renderWorkspace(props);

    fireEvent.click(screen.getByRole("button", { name: "Clear Jaunt" }));

    expect(props.clearAll).toHaveBeenCalledTimes(1);
  });

  it("keeps Discover active and dismisses the add toast manually", async () => {
    renderWorkspace(
      createProps({
        showDetourButton: true,
        showDetourForm: true,
        tripSummary: { distance: 245 },
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete add" }));

    expect(screen.getByRole("tab", { name: "Discover" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    const dismissButton = screen.getByRole("button", {
      name: "Dismiss added detour notification",
    });
    expect(dismissButton).toBeVisible();

    fireEvent.click(dismissButton);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", {
          name: "Dismiss added detour notification",
        })
      ).not.toBeInTheDocument()
    );
  });

  it("clears the add toast automatically after five seconds", async () => {
    jest.useFakeTimers();
    try {
      renderWorkspace(
        createProps({
          showDetourButton: true,
          showDetourForm: true,
          tripSummary: { distance: 245 },
        })
      );
      fireEvent.click(screen.getByRole("button", { name: "Complete add" }));

      act(() => jest.advanceTimersByTime(6000));

      expect(
        screen.queryByRole("button", {
          name: "Dismiss added detour notification",
        })
      ).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps one map and one tools panel mounted while the compact sheet moves", () => {
    compactMediaQuery.matches = true;
    renderWorkspace(createProps());

    const handle = screen.getByRole("slider", {
      name: "Resize planning tools",
    });
    expect(handle).toHaveAttribute("aria-valuetext", "mid position");
    expect(screen.getAllByText("Map instance")).toHaveLength(1);
    expect(
      screen.getAllByRole("complementary", { name: "Jaunt planning tools" })
    ).toHaveLength(1);

    fireEvent.click(handle);
    expect(handle).toHaveAttribute("aria-valuetext", "expanded position");
    expect(screen.getAllByText("Map instance")).toHaveLength(1);
    expect(screen.getByText("Route form instance")).toBeInTheDocument();
  });
});
