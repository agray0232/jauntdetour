const { expect } = require("@playwright/test");

const DEFAULT_ORIGIN = "Atlanta, GA";
const DEFAULT_DESTINATION = "Charlotte, NC";

function createRouteResponse({ hasDetour = false } = {}) {
  return {
    routes: [
      {
        bounds: {
          northeast: { lat: 35.2271, lng: -80.8431 },
          southwest: { lat: 33.749, lng: -84.388 },
        },
        legs: [
          {
            distance: { value: 394000 },
            duration: { value: 13620 },
            start_address: DEFAULT_ORIGIN,
            end_address: DEFAULT_DESTINATION,
            start_location: { lat: 33.749, lng: -84.388 },
            end_location: { lat: 35.2271, lng: -80.8431 },
          },
        ],
        overview_polyline: {
          points: "encoded",
          decodedPoints: [
            [33.749, -84.388],
            [35.2271, -80.8431],
          ],
          complete_overview: [
            [33.749, -84.388],
            [35.2271, -80.8431],
          ],
        },
        summary: hasDetour
          ? { distance: 258, time: { hours: 4, min: 5 } }
          : { distance: 245, time: { hours: 3, min: 47 } },
      },
    ],
  };
}

function createPlacesResponse() {
  return {
    results: [
      {
        id: "one",
        place_id: "place-1",
        name: "Paris Mountain",
        type: "Hike",
        rating: 4.7,
        vicinity: "Greenville County",
        geometry: { location: { lat: 34.9, lng: -82.4 } },
      },
      {
        id: "two",
        place_id: "place-2",
        name: "Falls Park",
        type: "Hike",
        rating: 4.8,
        vicinity: "Greenville",
        geometry: { location: { lat: 34.85, lng: -82.4 } },
      },
    ],
  };
}

function createSinglePlaceResponse() {
  const [place] = createPlacesResponse().results;
  return { results: [place] };
}

function createSavedJauntResponse() {
  return {
    trip: {
      tripId: "trip-1",
      tripName: "Carolinas weekend",
      origin: { address: DEFAULT_ORIGIN, lat: 33.749, lng: -84.388 },
      destination: {
        address: DEFAULT_DESTINATION,
        lat: 35.2271,
        lng: -80.8431,
      },
      updatedAt: "2026-08-01T12:00:00.000Z",
      distanceMeters: 415000,
      durationSeconds: 14700,
    },
    route: {
      ...createRouteResponse({ hasDetour: true }).routes[0],
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
        placeId: "place-1",
        rating: 4.7,
        addedTime: 18,
      },
    ],
  };
}

async function installAnonymousAuth(page) {
  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Unauthorized" }),
    });
  });
}

async function installAuthorizedAuth(page) {
  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { email: "traveler@example.com", display_name: "Avery Traveler" },
      }),
    });
  });
}

async function installPlannerApi(
  page,
  { places = createPlacesResponse() } = {}
) {
  await page.route("**/route**", async (route) => {
    const hasDetour = route.request().url().includes("waypoints");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createRouteResponse({ hasDetour })),
    });
  });
  await page.route("**/places**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(places),
    });
  });
}

async function installSavedJauntApi(page) {
  await page.route("**/api/trips/trip-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createSavedJauntResponse()),
    });
  });
}

async function seedPlannerWithDetour(page) {
  const route = createRouteResponse({ hasDetour: true }).routes[0];
  await page.addInitScript(
    ({ persistedRoute }) => {
      sessionStorage.setItem(
        "jaunt.tripState",
        JSON.stringify({
          origin: "Atlanta, GA",
          destination: "Charlotte, NC",
          tripName: "Carolinas weekend",
          currentTrip: null,
          tripsRevision: 0,
          detourType: "Hike",
          detourList: [
            {
              name: "Paris Mountain",
              placeId: "place-1",
              type: "Hike",
              lat: 34.9,
              lng: -82.4,
              rating: 4.7,
              addedTime: 18,
            },
          ],
          tripSummary: persistedRoute.summary,
          route: persistedRoute,
          routeOptions: [],
          detourOptions: [],
          detourHighlight: [],
          detourSearchLocation: 50,
          detourSearchRadius: 20000,
          showRoute: true,
          showDetourButton: true,
          showDetourForm: false,
          showDetourOptions: false,
          showDetourSearchPoint: false,
        })
      );
    },
    { persistedRoute: route }
  );
}

async function createPlannerRoute(
  page,
  { origin = DEFAULT_ORIGIN, destination = DEFAULT_DESTINATION } = {}
) {
  await page.goto("/plan", { waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: "Start" }).fill(origin);
  await page.getByRole("combobox", { name: "Destination" }).fill(destination);
  await page.getByRole("button", { name: "Create route" }).click();
  await expect(
    page.getByRole("region", { name: "Route summary" })
  ).toContainText("245 mi");
}

async function searchForDetours(page) {
  await page.getByRole("tab", { name: "Discover" }).click();
  await page.getByRole("button", { name: "Search this area" }).click();
}

async function moveCompactSheetToPeek(page) {
  const handle = page.getByRole("slider", { name: "Resize planning tools" });
  await handle.dispatchEvent("pointerdown", {
    clientY: 100,
    pointerId: 1,
    pointerType: "touch",
  });
  await handle.dispatchEvent("pointermove", {
    clientY: 500,
    pointerId: 1,
    pointerType: "touch",
  });
  await handle.dispatchEvent("pointerup", {
    clientY: 500,
    pointerId: 1,
    pointerType: "touch",
  });
  await expect(handle).toHaveAttribute("aria-valuetext", "peek position");
}

module.exports = {
  DEFAULT_DESTINATION,
  DEFAULT_ORIGIN,
  createPlacesResponse,
  createPlannerRoute,
  createRouteResponse,
  createSavedJauntResponse,
  createSinglePlaceResponse,
  installAnonymousAuth,
  installAuthorizedAuth,
  installPlannerApi,
  installSavedJauntApi,
  moveCompactSheetToPeek,
  searchForDetours,
  seedPlannerWithDetour,
};
