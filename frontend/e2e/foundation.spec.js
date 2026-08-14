const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Unauthorized" }),
    })
  );
});

test("loads the branded application foundation", async ({ page, request }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(
    "JauntDetour | Road Trip Planner with Interesting Stops"
  );
  await expect(
    page.getByRole("heading", {
      name: "Find the stop that makes the drive.",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Plan your Jaunt" })
  ).toHaveAttribute("href", "/plan");
  await expect(
    page.getByRole("heading", { name: "The route is only the beginning." })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /JauntDetour planner preview/ })
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Map" })).toHaveCount(0);

  const bodyFont = await page
    .locator("body")
    .evaluate((element) => window.getComputedStyle(element).fontFamily);
  expect(bodyFont).toContain("DM Sans");

  const manifestResponse = await request.get("/manifest.json");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.theme_color).toBe("#12664f");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", purpose: "any" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ])
  );
});

test("mounts the current planner at its stable route", async ({ page }) => {
  await page.route("**/route**", (route) => {
    const hasDetour = route.request().url().includes("waypoints");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
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
                start_address: "Atlanta, GA",
                end_address: "Charlotte, NC",
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
      }),
    });
  });
  await page.route("**/places**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            id: "one",
            place_id: "place-1",
            name: "Paris Mountain",
            rating: 4.7,
            geometry: { location: { lat: 34.9, lng: -82.4 } },
          },
          {
            id: "two",
            place_id: "place-2",
            name: "Falls Park",
            rating: 4.8,
            geometry: { location: { lat: 34.85, lng: -82.4 } },
          },
        ],
      }),
    })
  );
  await page.goto("/plan", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("combobox", { name: "Start" })).toHaveCount(1);
  await expect(page.getByRole("combobox", { name: "Destination" })).toHaveCount(
    1
  );
  await expect(page.locator('nav:visible a[href="/plan"]')).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(
    page.getByRole("complementary", { name: "Jaunt planning tools" })
  ).toHaveCount(1);
  await expect(
    page.getByRole("region", { name: "Jaunt route map" })
  ).toHaveCount(1);
  await expect(page.getByRole("tab", { name: "Build" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(page.getByRole("tab", { name: "Discover" })).toBeDisabled();

  await page.getByRole("combobox", { name: "Start" }).fill("Atlanta, GA");
  await page
    .getByRole("combobox", { name: "Destination" })
    .fill("Charlotte, NC");
  await page.getByRole("button", { name: "Create route" }).click();
  await expect(
    page.getByRole("region", { name: "Route summary" })
  ).toContainText("245 mi");
  await expect(page.getByRole("region", { name: "Itinerary" })).toContainText(
    "Atlanta, GA"
  );
  await expect(page.getByText("Not saved")).toBeVisible();
  const startMarker = page.getByTitle("Jaunt start");
  const destinationMarker = page.getByTitle("Jaunt destination");
  await expect(startMarker).toHaveCount(1);
  await expect(destinationMarker).toHaveCount(1);
  await startMarker.hover();
  await expect(page.getByLabel("Start details")).toContainText("Atlanta, GA");
  await expect(
    page.getByRole("button", { name: "Close", exact: true })
  ).toHaveCount(0);
  await page.getByRole("region", { name: "Route summary" }).hover();
  await expect(page.getByLabel("Start details")).toHaveCount(0);
  await startMarker.click();
  await expect(page.getByLabel("Start details")).toContainText("Atlanta, GA");
  await expect(
    page.getByRole("button", { name: "Close", exact: true })
  ).toHaveCount(1);
  await destinationMarker.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Start details")).toHaveCount(0);
  await expect(page.getByLabel("Destination details")).toContainText(
    "Charlotte, NC"
  );
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Destination details")).toHaveCount(0);
  await expect(destinationMarker).toBeFocused();
  const jauntName = page.getByRole("textbox", { name: "Jaunt name" });
  await expect(jauntName).toHaveCount(1);
  await expect(jauntName).toHaveAttribute(
    "placeholder",
    "Atlanta, GA to Charlotte, NC"
  );
  await jauntName.fill("Carolinas weekend");
  await expect(jauntName).toHaveValue("Carolinas weekend");
  await expect(page.getByRole("button", { name: "Save Jaunt" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Discover" })).toBeEnabled();

  await page.getByRole("tab", { name: "Discover" }).click();
  await expect(
    page.getByRole("heading", { name: "Find a worthwhile stop" })
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "Hike" })).toBeChecked();
  await expect(page.getByRole("slider")).toHaveCount(2);
  await page.getByRole("button", { name: "Search this area" }).click();
  await expect(page.getByRole("heading", { name: "2 places" })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await page.getByRole("listitem").first().hover();
  await expect(
    page.getByRole("button", { name: "Add", exact: true })
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Select Paris Mountain" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Discover" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(page.getByText(/Paris Mountain added/)).toBeVisible();
  await expect(page.getByText(/set what you want/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /places?$/ })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Dismiss added stop message" })
    .click();
  await expect(page.getByText(/Paris Mountain added/)).toHaveCount(0);
  await page.getByRole("tab", { name: "Build" }).click();
  await expect(page.getByRole("region", { name: "Itinerary" })).toContainText(
    "Adds 18 min"
  );
  await page.getByTitle("Paris Mountain, added stop").click();
  const detourDetails = page.getByLabel("Paris Mountain details");
  await expect(detourDetails).toContainText("Hike");
  await expect(detourDetails).toContainText("4.7 rating");
  await expect(detourDetails).toContainText("18 min added");
  await page.keyboard.press("Escape");
  await expect(detourDetails).toHaveCount(0);

  const viewport = page.viewportSize();
  const showMap = page.getByRole("button", { name: "Show map" });
  if (viewport && viewport.width <= 780 && viewport.height > 500) {
    await expect(showMap).toBeVisible();
    await showMap.click();
    await expect(
      page.getByRole("button", { name: "Back to tools" })
    ).toBeVisible();
    await expect(
      page.locator('[aria-label="Jaunt planning tools"]')
    ).toBeHidden();
    await expect(
      page.getByRole("region", { name: "Jaunt route map" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Back to tools" }).click();
    await expect(
      page.getByRole("complementary", { name: "Jaunt planning tools" })
    ).toBeVisible();
  } else {
    await expect(showMap).toBeHidden();
  }
});

test("renders endpoint markers on the saved Jaunt detail map", async ({
  page,
}) => {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { email: "traveler@example.com", display_name: "Avery Traveler" },
      }),
    })
  );
  await page.route("**/api/trips/trip-1", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        trip: {
          tripId: "trip-1",
          tripName: "Carolinas weekend",
          origin: { address: "Atlanta, GA", lat: 33.749, lng: -84.388 },
          destination: {
            address: "Charlotte, NC",
            lat: 35.2271,
            lng: -80.8431,
          },
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
      }),
    })
  );

  await page.goto("/trips/trip-1", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Carolinas weekend" })
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Saved Jaunt details" })
  ).toBeVisible();
  await expect(page.getByTitle("Jaunt start")).toHaveCount(1);
  await expect(page.getByTitle("Jaunt destination")).toHaveCount(1);
});

test("selects marker details on a saved Jaunt map", async ({ page }) => {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { email: "traveler@example.com", display_name: "Avery Traveler" },
      }),
    })
  );
  await page.route("**/api/trips/trip-1", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        trip: {
          tripId: "trip-1",
          tripName: "Carolinas weekend",
          origin: { address: "Atlanta, GA", lat: 33.749, lng: -84.388 },
          destination: {
            address: "Charlotte, NC",
            lat: 35.2271,
            lng: -80.8431,
          },
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
            addedTime: 18,
          },
        ],
      }),
    })
  );

  await page.goto("/trips/trip-1", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Carolinas weekend" })
  ).toBeVisible();

  await page.getByTitle("Jaunt start").click();
  await expect(page.getByLabel("Start details")).toContainText("Atlanta, GA");
  await page.getByTitle("Paris Mountain, added stop").click();
  await expect(page.getByLabel("Start details")).toHaveCount(0);
  const details = page.getByLabel("Paris Mountain details");
  await expect(details).toContainText("Hike");
  await expect(details).toContainText("4.7 rating");
  await expect(details).toContainText("18 min added");
});

test("protects saved Jaunts while preserving anonymous planning", async ({
  page,
}) => {
  await page.goto("/trips", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Sign in to view My Jaunts" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in" }).last()
  ).toBeVisible();
});

test("describes current product capabilities without future claims", async ({
  page,
}) => {
  await page.goto("/about", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Make room for the unexpected." })
  ).toBeVisible();
  await expect(
    page.getByText(/does not provide live navigation/i)
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Plan your Jaunt" })
  ).toHaveAttribute("href", "/plan");
});
