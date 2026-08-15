import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { jauntDetourTheme } from "../design-system/jauntDetourTheme";
import mainReducer from "../reducers/main-reducer";
import TripRequester from "../scripts/TripRequester";
import { trackEvent } from "../telemetry/telemetry";
import { exportToGoogleMaps } from "../utils/googleMapsExport";
import JauntDetailPage from "./JauntDetailPage";
import MyJauntsPage from "./MyJauntsPage";

const mockMapProps = jest.fn();

jest.mock("../scripts/TripRequester");
jest.mock("../telemetry/telemetry", () => ({ trackEvent: jest.fn() }));
jest.mock("../utils/googleMapsExport");
jest.mock(
  "../components/MapContainer",
  () =>
    function MockMap(props) {
      mockMapProps(props);
      return <div>Saved route map</div>;
    }
);

const listTrip = {
  trip_id: "trip-1",
  trip_name: "Carolinas weekend",
  origin: { address: "Atlanta, GA" },
  destination: { address: "Charlotte, NC" },
  detour_count: 1,
  updated_at: "2026-08-01T12:00:00.000Z",
};

const detailView = {
  trip: {
    tripId: "trip-1",
    tripName: "Carolinas weekend",
    origin: { address: "Atlanta, GA", lat: 33.749, lng: -84.388 },
    destination: { address: "Charlotte, NC", lat: 35.2271, lng: -80.8431 },
    updatedAt: "2026-08-01T12:00:00.000Z",
    distanceMeters: 415000,
    durationSeconds: 14700,
  },
  route: {
    summary: { distance: 258, time: { hours: 4, min: 5 } },
    bounds: {
      northeast: { lat: 35.3, lng: -80.8 },
      southwest: { lat: 33.7, lng: -84.4 },
    },
    overview_polyline: {
      points: "saved-polyline",
      complete_overview: [
        [33.749, -84.388],
        [35.2271, -80.8431],
      ],
    },
  },
  detours: [
    {
      name: "Paris Mountain",
      type: "Hike",
      lat: 34.94,
      lng: -82.41,
      placeId: "hike-1",
      rating: 4.7,
    },
  ],
};

function CurrentLocation() {
  const location = useLocation();
  return <div>Current route: {location.pathname}</div>;
}

function renderPage(page, { route = "/trips", state } = {}) {
  const store = createStore(
    mainReducer,
    state ? { ...mainReducer(undefined, {}), ...state } : undefined
  );
  return {
    store,
    ...render(
      <Provider store={store}>
        <FluentProvider theme={jauntDetourTheme}>
          <MemoryRouter
            future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
            initialEntries={[route]}
          >
            <Routes>
              <Route path="/trips" element={page} />
              <Route path="/trips/:tripId" element={page} />
              <Route path="/plan" element={<CurrentLocation />} />
            </Routes>
          </MemoryRouter>
        </FluentProvider>
      </Provider>
    ),
  };
}

describe("MyJauntsPage", () => {
  const listTrips = jest.fn();
  const duplicateTrip = jest.fn();
  const deleteTrip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    listTrips.mockResolvedValue({
      trips: [listTrip],
      total: 11,
      page: 1,
      limit: 10,
    });
    duplicateTrip.mockResolvedValue({});
    deleteTrip.mockResolvedValue({});
    TripRequester.mockImplementation(() => ({
      deleteTrip,
      duplicateTrip,
      listTrips,
    }));
  });

  it("renders saved Jaunts and pages through the existing list API", async () => {
    renderPage(<MyJauntsPage />);

    expect(await screen.findByText("Carolinas weekend")).toBeVisible();
    expect(screen.getByText("1 detour")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      "/trips/trip-1"
    );
    expect(trackEvent).toHaveBeenCalledWith("trip_list_viewed", {
      countBucket: "1-5",
      feature: "trip",
      source: "list",
    });

    listTrips.mockResolvedValueOnce({
      trips: [],
      total: 11,
      page: 2,
      limit: 10,
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(listTrips).toHaveBeenLastCalledWith(2, 10));
    expect(await screen.findByText("Page 2 of 2")).toBeVisible();
  });

  it("duplicates and confirms deletion from the row action menu", async () => {
    renderPage(<MyJauntsPage />);
    await screen.findByText("Carolinas weekend");

    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Carolinas weekend" })
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: "Duplicate" }));
    await waitFor(() => expect(duplicateTrip).toHaveBeenCalledWith("trip-1"));
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("trip_duplicated", {
        feature: "trip",
        source: "list",
      })
    );

    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Carolinas weekend" })
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(
      screen.getByRole("heading", { name: "Delete this Jaunt permanently?" })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteTrip).toHaveBeenCalledWith("trip-1"));
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("trip_deleted", {
        feature: "trip",
        source: "list",
      })
    );
  });

  it("offers recovery when the list cannot be loaded", async () => {
    listTrips.mockRejectedValueOnce(new Error("offline"));
    renderPage(<MyJauntsPage />);

    expect(
      await screen.findByRole("heading", { name: "Jaunts could not be loaded" })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Carolinas weekend")).toBeVisible();
  });

  it("does not report zero detours when the API omits the count", async () => {
    listTrips.mockResolvedValueOnce({
      trips: [{ ...listTrip, detour_count: undefined }],
      total: 1,
      page: 1,
      limit: 10,
    });

    renderPage(<MyJauntsPage />);

    expect(await screen.findByText("Detour count unavailable")).toBeVisible();
    expect(screen.queryByText("0 detours")).not.toBeInTheDocument();
  });
});

describe("JauntDetailPage", () => {
  const getTrip = jest.fn();
  const duplicateTrip = jest.fn();
  const deleteTrip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getTrip.mockResolvedValue(detailView);
    duplicateTrip.mockResolvedValue({});
    deleteTrip.mockResolvedValue({});
    TripRequester.mockImplementation(() => ({
      deleteTrip,
      duplicateTrip,
      getTrip,
    }));
  });

  it("renders a direct saved-Jaunt URL without replacing the planner", async () => {
    const { store } = renderPage(<JauntDetailPage />, {
      route: "/trips/trip-1",
      state: { origin: "Current route" },
    });

    expect(
      await screen.findByRole("heading", { name: "Carolinas weekend" })
    ).toBeVisible();
    expect(getTrip).toHaveBeenCalledWith("trip-1");
    expect(screen.getByText("258 mi")).toBeVisible();
    expect(screen.getByText("4 hr 5 min")).toBeVisible();
    expect(screen.getByText("Paris Mountain")).toBeVisible();
    expect(screen.getByRole("img", { name: "Start marker" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Hike stop" })).toBeVisible();
    expect(
      screen.getByRole("img", { name: "Destination marker" })
    ).toBeVisible();
    expect(screen.getByText("Saved route map")).toBeVisible();
    expect(mockMapProps).toHaveBeenCalledWith(
      expect.objectContaining({
        cameraControl: false,
        origin: detailView.trip.origin,
        destination: detailView.trip.destination,
        mapTypeControl: false,
        zoomControl: false,
      })
    );
    expect(store.getState().origin).toBe("Current route");
    expect(trackEvent).toHaveBeenCalledWith("trip_detail_viewed", {
      countBucket: "1-5",
      feature: "trip",
      source: "detail",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Open in Google Maps" })
    );
    expect(exportToGoogleMaps).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith("trip_export_opened", {
      countBucket: "1-5",
      feature: "export",
      source: "detail",
    });
  });

  it("confirms before replacing different in-progress planning work", async () => {
    const { store } = renderPage(<JauntDetailPage />, {
      route: "/trips/trip-1",
      state: { origin: "Current route" },
    });
    await screen.findByRole("heading", { name: "Carolinas weekend" });

    fireEvent.click(screen.getByRole("button", { name: "Resume Planning" }));
    expect(
      screen.getByRole("heading", { name: "Replace your in-progress Jaunt?" })
    ).toBeVisible();
    expect(store.getState().origin).toBe("Current route");

    fireEvent.click(screen.getByRole("button", { name: "Replace and resume" }));
    expect(await screen.findByText("Current route: /plan")).toBeVisible();
    expect(store.getState()).toMatchObject({
      origin: "Atlanta, GA",
      destination: "Charlotte, NC",
      tripName: "Carolinas weekend",
      currentTrip: { tripId: "trip-1" },
    });
  });

  it("distinguishes a missing Jaunt and supports retry", async () => {
    getTrip.mockRejectedValueOnce({ response: { status: 404 } });
    renderPage(<JauntDetailPage />, { route: "/trips/missing" });

    expect(
      await screen.findByRole("heading", {
        name: "This Jaunt could not be found",
      })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByRole("heading", { name: "Carolinas weekend" })
    ).toBeVisible();
  });
});
