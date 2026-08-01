import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import PlannerWorkspace from "./PlannerWorkspace";
import { jauntDetourTheme } from "../../design-system/jauntDetourTheme";

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

  function MockDiscoverWorkspace({ feedback, onAdded, onDismissFeedback }) {
    return (
      <div>
        Discover workspace instance
        {feedback ? <span>{feedback}</span> : null}
        <button onClick={() => onAdded("Paris Mountain", 18)}>
          Complete add
        </button>
        {feedback ? (
          <button onClick={onDismissFeedback}>Dismiss feedback</button>
        ) : null}
      </div>
    );
  }

  MockDiscoverWorkspace.propTypes = {
    feedback: PropTypes.string,
    onAdded: PropTypes.func.isRequired,
    onDismissFeedback: PropTypes.func.isRequired,
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
    function MockMap() {
      return <div>Map instance</div>;
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
    renderWorkspace(
      createProps({
        currentTrip: { tripId: "trip-1", tripName: "Saved weekend" },
        tripName: "Saved weekend",
        showDetourButton: true,
        tripSummary: { distance: 245 },
      })
    );

    expect(screen.getByRole("textbox", { name: "Jaunt name" })).toHaveValue(
      "Saved weekend"
    );
    expect(screen.getByText("Loaded")).toBeVisible();
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

  it("keeps Discover active and dismisses add feedback manually", () => {
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
    expect(
      screen.getByText("Paris Mountain added. The route is 18 minutes longer.")
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss feedback" }));
    expect(screen.queryByText(/Paris Mountain added/)).not.toBeInTheDocument();
  });

  it("clears add feedback automatically after ten seconds", () => {
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

      act(() => jest.advanceTimersByTime(10000));

      expect(
        screen.queryByText(/Paris Mountain added/)
      ).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps the map mounted while compact tools are hidden", () => {
    renderWorkspace(createProps());

    fireEvent.click(screen.getByRole("button", { name: "Show map" }));

    expect(screen.getByText("Map instance")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to tools" }));
    expect(screen.getByText("Route form instance")).toBeInTheDocument();
  });
});
