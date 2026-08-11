import {
  beginPageView,
  clearAuthenticatedUser,
  createEphemeralId,
  initializeTelemetry,
  normalizeTelemetryPath,
  resetTelemetryForTests,
  sanitizeTelemetryMeasurements,
  sanitizeTelemetryProperties,
  setAuthenticatedUser,
  trackEvent,
  trackPageView,
} from "./telemetry";

function createSdkMock() {
  return {
    addTelemetryInitializer: jest.fn(),
    clearAuthenticatedUserContext: jest.fn(),
    loadAppInsights: jest.fn(),
    setAuthenticatedUserContext: jest.fn(),
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
  };
}

describe("telemetry", () => {
  afterEach(() => {
    resetTelemetryForTests();
  });

  test("stays disabled without a connection string", () => {
    const ApplicationInsightsClass = jest.fn();

    expect(
      initializeTelemetry({ connectionString: "", ApplicationInsightsClass })
    ).toBeNull();
    trackPageView({ name: "Home", path: "/" });
    trackEvent("route_search_started");

    expect(ApplicationInsightsClass).not.toHaveBeenCalled();
  });

  test("initializes the SDK without cookies or browser storage", () => {
    const sdk = createSdkMock();
    const ApplicationInsightsClass = jest.fn(() => sdk);

    initializeTelemetry({
      connectionString: "InstrumentationKey=test",
      ApplicationInsightsClass,
    });

    expect(ApplicationInsightsClass).toHaveBeenCalledWith({
      config: expect.objectContaining({
        disableAjaxTracking: true,
        disableCookiesUsage: true,
        disableExceptionTracking: true,
        disableFetchTracking: true,
        enableAutoRouteTracking: false,
        enableUnhandledPromiseRejectionTracking: false,
        enableSessionStorageBuffer: false,
        isStorageUseDisabled: true,
      }),
    });
    expect(sdk.loadAppInsights).toHaveBeenCalledTimes(1);
    expect(sdk.addTelemetryInitializer).toHaveBeenCalledTimes(1);
  });

  test("redacts dynamic trip paths and removes query strings", () => {
    const tripId = "123e4567-e89b-42d3-a456-426614174000";

    expect(normalizeTelemetryPath(`/trips/${tripId}?from=email#details`)).toBe(
      "/trips/:tripId"
    );
  });

  test("keeps only approved primitive properties", () => {
    expect(
      sanitizeTelemetryProperties({
        category: "Coffee",
        resultCountBucket: "1-5",
        address: "123 Main Street",
        payload: { secret: true },
      })
    ).toEqual({ category: "Coffee", resultCountBucket: "1-5" });
  });

  test("keeps only approved finite measurements", () => {
    expect(
      sanitizeTelemetryMeasurements({
        activeDurationMs: 1250,
        exactLatitude: 34.9,
        invalid: Number.POSITIVE_INFINITY,
      })
    ).toEqual({ activeDurationMs: 1250 });
  });

  test("creates ephemeral identifiers without browser storage", () => {
    const firstId = createEphemeralId();
    const secondId = createEphemeralId();

    expect(firstId).toHaveLength(32);
    expect(secondId).toHaveLength(32);
    expect(firstId).not.toBe(secondId);
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  test("adds page context and sequential action ordinals", () => {
    const sdk = createSdkMock();
    const ApplicationInsightsClass = jest.fn(() => sdk);

    initializeTelemetry({
      connectionString: "InstrumentationKey=test",
      ApplicationInsightsClass,
    });
    beginPageView({ name: "Planner", path: "/plan", visitId: "visit-1" });
    trackEvent("route_search_started", { feature: "route" });
    trackEvent("route_search_succeeded", { feature: "route" });

    expect(sdk.trackPageView).toHaveBeenCalledWith({
      name: "Planner",
      uri: "/plan",
      properties: expect.objectContaining({
        actionOrdinal: 0,
        pageName: "Planner",
        visitId: "visit-1",
      }),
    });
    expect(sdk.trackEvent.mock.calls[0][0].properties).toEqual(
      expect.objectContaining({ actionOrdinal: 1, pageName: "Planner" })
    );
    expect(sdk.trackEvent.mock.calls[1][0].properties).toEqual(
      expect.objectContaining({ actionOrdinal: 2, pageName: "Planner" })
    );
  });

  test("places approved measurements in the event envelope", () => {
    const sdk = createSdkMock();
    const ApplicationInsightsClass = jest.fn(() => sdk);

    initializeTelemetry({
      connectionString: "InstrumentationKey=test",
      ApplicationInsightsClass,
    });
    trackEvent(
      "page_engagement",
      { feature: "engagement" },
      { activeDurationMs: 2500, latitude: 34.9 }
    );

    expect(sdk.trackEvent).toHaveBeenCalledWith({
      name: "page_engagement",
      properties: { actionOrdinal: 1, feature: "engagement" },
      measurements: { activeDurationMs: 2500 },
    });
  });

  test("tracks normalized pages, events, and in-memory user context", () => {
    const sdk = createSdkMock();
    const ApplicationInsightsClass = jest.fn(() => sdk);
    const tripId = "123e4567-e89b-42d3-a456-426614174000";

    initializeTelemetry({
      connectionString: "InstrumentationKey=test",
      ApplicationInsightsClass,
    });
    trackPageView({
      name: "Jaunt detail",
      path: `/trips/${tripId}?source=list`,
      properties: { source: "list", tripName: "Private trip" },
    });
    trackEvent("trip_detail_viewed", {
      source: "list",
      tripId,
    });
    setAuthenticatedUser("user-123");
    clearAuthenticatedUser();

    expect(sdk.trackPageView).toHaveBeenCalledWith({
      name: "Jaunt detail",
      uri: "/trips/:tripId",
      properties: { source: "list" },
    });
    expect(sdk.trackEvent).toHaveBeenCalledWith({
      name: "trip_detail_viewed",
      properties: { actionOrdinal: 1, source: "list" },
      measurements: {},
    });
    expect(sdk.setAuthenticatedUserContext).toHaveBeenCalledWith(
      "user-123",
      undefined,
      false
    );
    expect(sdk.clearAuthenticatedUserContext).toHaveBeenCalledTimes(1);
  });
});
