import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import mainReducer from "../reducers/main-reducer";
import TelemetryProvider from "./TelemetryProvider";
import {
  beginPageView,
  clearAuthenticatedUser,
  initializeTelemetry,
  setAuthenticatedUser,
  trackEvent,
} from "./telemetry";

jest.mock("./telemetry", () => ({
  beginPageView: jest.fn(),
  clearAuthenticatedUser: jest.fn(),
  createEphemeralId: jest.fn(() => "visit-1"),
  initializeTelemetry: jest.fn(),
  normalizeTelemetryPath:
    jest.requireActual("./telemetry").normalizeTelemetryPath,
  setAuthenticatedUser: jest.fn(),
  trackEvent: jest.fn(),
}));

function renderProvider(user = null) {
  const initialState = { ...mainReducer(undefined, {}), user };
  const store = createStore(mainReducer, initialState);

  render(
    <Provider store={store}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={["/plan"]}
      >
        <TelemetryProvider>
          <Link to="/trips/123e4567-e89b-42d3-a456-426614174000">
            Open Jaunt
          </Link>
          <Routes>
            <Route path="/plan" element={<div>Planner</div>} />
            <Route path="/trips/:tripId" element={<div>Detail</div>} />
          </Routes>
        </TelemetryProvider>
      </MemoryRouter>
    </Provider>
  );

  return { reduxStore: store };
}

describe("TelemetryProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .requireMock("./telemetry")
      .createEphemeralId.mockReturnValue("visit-1");
  });

  test("initializes once and tracks normalized route transitions", () => {
    renderProvider();

    expect(initializeTelemetry).toHaveBeenCalledTimes(1);
    expect(beginPageView).toHaveBeenCalledWith({
      name: "Planner",
      path: "/plan",
      visitId: "visit-1",
    });

    fireEvent.click(screen.getByRole("link", { name: "Open Jaunt" }));

    expect(beginPageView).toHaveBeenLastCalledWith({
      name: "Jaunt detail",
      path: "/trips/:tripId",
      visitId: "visit-1",
    });
    expect(beginPageView).toHaveBeenCalledTimes(2);
  });

  test("sets and clears authenticated context as Redux auth changes", () => {
    const { reduxStore } = renderProvider({ user_id: "user-123" });

    expect(setAuthenticatedUser).toHaveBeenCalledWith("user-123");

    act(() => {
      reduxStore.dispatch({ type: "CLEAR_USER" });
    });

    expect(clearAuthenticatedUser).toHaveBeenCalled();
  });

  test("completes visible engagement when the page hides", () => {
    renderProvider();

    window.dispatchEvent(new Event("pagehide"));

    expect(trackEvent).toHaveBeenCalledWith(
      "page_engagement",
      { feature: "engagement" },
      { activeDurationMs: expect.any(Number) }
    );
  });
});
