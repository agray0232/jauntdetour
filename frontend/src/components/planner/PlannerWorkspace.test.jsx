import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import PlannerWorkspace from "./PlannerWorkspace";
import { jauntDetourTheme } from "../../design-system/jauntDetourTheme";

jest.mock(
  "../sidebar/UserInput",
  () =>
    function MockRouteForm() {
      return <div>Route form instance</div>;
    }
);

jest.mock(
  "../sidebar/TripSummary",
  () =>
    function MockTripSummary(props) {
      return <button onClick={props.getDetourForm}>Open Discover</button>;
    }
);

jest.mock(
  "../sidebar/MyTrips",
  () =>
    function MockMyTrips() {
      return <div>My Jaunts control</div>;
    }
);

jest.mock(
  "../detour/DetourForm",
  () =>
    function MockDetourForm() {
      return <div>Detour form instance</div>;
    }
);

jest.mock(
  "../detour/DetourOptionsList",
  () =>
    function MockResults() {
      return <div>Detour results instance</div>;
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
    tripSummary: {},
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
  it("mounts one workflow tree and one map", () => {
    renderWorkspace(
      createProps({
        showDetourButton: true,
        showDetourForm: true,
        showDetourOptions: true,
      })
    );

    expect(screen.getAllByText("Route form instance")).toHaveLength(1);
    expect(screen.getAllByText("Detour form instance")).toHaveLength(1);
    expect(screen.getAllByText("Detour results instance")).toHaveLength(1);
    expect(screen.getAllByText("Map instance")).toHaveLength(1);
  });

  it("keeps Discover unavailable until a route exists", () => {
    renderWorkspace(createProps());

    expect(screen.getByRole("tab", { name: "Discover" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Build" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("opens Discover from the existing Add Detour action", () => {
    const props = createProps({ showDetourButton: true });
    renderWorkspace(props);

    fireEvent.click(screen.getByRole("button", { name: "Open Discover" }));

    expect(props.getDetourForm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("tab", { name: "Discover" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("keeps the map mounted while compact tools are hidden", () => {
    renderWorkspace(createProps());

    fireEvent.click(screen.getByRole("button", { name: "Show map" }));

    expect(screen.getByText("Map instance")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to tools" }));
    expect(screen.getByText("Route form instance")).toBeInTheDocument();
  });
});
