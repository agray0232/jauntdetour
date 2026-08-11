import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import { Provider } from "react-redux";
import { createStore } from "redux";
import SaveTrip from "./SaveTrip";
import TripRequester from "../../scripts/TripRequester";
import AuthRequester from "../../scripts/AuthRequester";
import mainReducer from "../../reducers/main-reducer";
import { jauntDetourTheme } from "../../design-system/jauntDetourTheme";
import { createPlannerFingerprint } from "../planner/build-workflow/plannerFingerprint";
import { trackEvent } from "../../telemetry/telemetry";

jest.mock("../../scripts/TripRequester");
jest.mock("../../scripts/AuthRequester");
jest.mock("../../telemetry/telemetry", () => ({ trackEvent: jest.fn() }));

const route = {
  overview_polyline: { points: "encoded" },
  legs: [
    {
      distance: { value: 1000 },
      duration: { value: 600 },
      start_location: { lat: 1, lng: 2 },
      end_location: { lat: 3, lng: 4 },
    },
  ],
};

function createState(overrides = {}) {
  return {
    ...mainReducer(undefined, { type: "@@INIT" }),
    origin: "Atlanta",
    destination: "Charlotte",
    route,
    tripSummary: { distance: 1, time: { hours: 0, min: 10 } },
    showRoute: true,
    showDetourButton: true,
    tripName: "Weekend",
    ...overrides,
  };
}

function renderSaveTrip(
  state,
  onStatusChange = jest.fn(),
  onClear = jest.fn()
) {
  const store = createStore(mainReducer, state);
  render(
    <Provider store={store}>
      <FluentProvider theme={jauntDetourTheme}>
        <SaveTrip onClear={onClear} onStatusChange={onStatusChange} />
      </FluentProvider>
    </Provider>
  );
  return { onClear, onStatusChange, store };
}

describe("SaveTrip", () => {
  beforeEach(() => {
    TripRequester.mockReset();
    AuthRequester.mockReset();
    AuthRequester.mockImplementation(() => ({ login: jest.fn() }));
    sessionStorage.clear();
    trackEvent.mockReset();
  });

  it("shows save intent before requiring authentication", async () => {
    renderSaveTrip(createState());

    fireEvent.click(screen.getByRole("button", { name: "Save Jaunt" }));

    expect(
      await screen.findByRole("dialog", { name: "Sign in to save your Jaunt" })
    ).toBeVisible();
    expect(trackEvent).toHaveBeenCalledWith("trip_save_auth_required", {
      feature: "trip",
    });
  });

  it("offers update and clear actions for a loaded Jaunt", () => {
    renderSaveTrip(
      createState({
        currentTrip: {
          tripId: "trip-1",
          tripName: "Weekend",
          savedFingerprint: createPlannerFingerprint({
            origin: "Atlanta",
            destination: "Charlotte",
            route,
            detourList: [],
            tripName: "Weekend",
          }),
        },
      })
    );

    expect(screen.getByRole("button", { name: "Update Jaunt" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Clear" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Google Maps" })
    ).not.toBeInTheDocument();
  });

  it("clears the current Jaunt from the Build actions", () => {
    const { onClear } = renderSaveTrip(createState());

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("rebases persistence and reports save operation state", async () => {
    const saveTrip = jest.fn().mockResolvedValue({
      trip: {
        trip_id: "trip-1",
        trip_name: "Weekend",
        updated_at: "2026-07-27T00:00:00Z",
        origin: { address: "Atlanta", lat: 1, lng: 2 },
        destination: { address: "Charlotte", lat: 3, lng: 4 },
        route_polyline: "encoded",
        distance_meters: 1000,
        duration_seconds: 600,
      },
    });
    TripRequester.mockImplementation(() => ({ saveTrip }));
    const { onStatusChange, store } = renderSaveTrip(
      createState({ user: { email: "traveler@example.com" } })
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Jaunt" }));

    await waitFor(() => expect(saveTrip).toHaveBeenCalledTimes(1));
    expect(onStatusChange).toHaveBeenNthCalledWith(1, "saving");
    expect(onStatusChange).toHaveBeenLastCalledWith("idle");
    expect(store.getState().currentTrip.savedFingerprint).toBe(
      createPlannerFingerprint({
        origin: "Atlanta",
        destination: "Charlotte",
        route,
        detourList: [],
        tripName: "Weekend",
      })
    );
    expect(trackEvent).toHaveBeenNthCalledWith(1, "trip_save_started", {
      feature: "trip",
      mode: "create",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "trip_save_succeeded", {
      feature: "trip",
      mode: "create",
    });
  });

  it("reports a failed save without changing the loaded baseline", async () => {
    TripRequester.mockImplementation(() => ({
      saveTrip: jest.fn().mockRejectedValue(new Error("offline")),
    }));
    const { onStatusChange, store } = renderSaveTrip(
      createState({ user: { email: "traveler@example.com" } })
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Jaunt" }));

    await waitFor(() =>
      expect(onStatusChange).toHaveBeenLastCalledWith("failed")
    );
    expect(store.getState().currentTrip).toBeNull();
    expect(trackEvent).toHaveBeenLastCalledWith("trip_save_failed", {
      failureClass: "request_failed",
      feature: "trip",
      mode: "create",
    });
  });

  it("reports create when a missing loaded Jaunt falls back from update", async () => {
    const updateTrip = jest
      .fn()
      .mockRejectedValue({ response: { status: 404 } });
    const saveTrip = jest.fn().mockResolvedValue({
      trip: { trip_id: "trip-2", trip_name: "Weekend" },
    });
    TripRequester.mockImplementation(() => ({ saveTrip, updateTrip }));
    renderSaveTrip(
      createState({
        user: { email: "traveler@example.com" },
        currentTrip: { tripId: "trip-1", tripName: "Weekend" },
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Update Jaunt" }));

    await waitFor(() => expect(saveTrip).toHaveBeenCalledTimes(1));
    expect(trackEvent).toHaveBeenLastCalledWith("trip_save_succeeded", {
      feature: "trip",
      mode: "create",
    });
  });
});
