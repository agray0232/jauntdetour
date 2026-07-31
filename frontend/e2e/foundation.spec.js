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
  await expect(page).toHaveTitle("JauntDetour");
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
  await page.route("**/route**", (route) =>
    route.fulfill({
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
            summary: { distance: 245, time: { hours: 3, min: 47 } },
          },
        ],
      }),
    })
  );
  await page.goto("/plan", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("textbox", { name: "Start" })).toHaveCount(1);
  await expect(page.getByRole("textbox", { name: "Destination" })).toHaveCount(
    1
  );
  await expect(
    page.getByRole("link", { name: "Plan a Jaunt" })
  ).toHaveAttribute("aria-current", "page");
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

  await page.getByRole("textbox", { name: "Start" }).fill("Atlanta, GA");
  await page
    .getByRole("textbox", { name: "Destination" })
    .fill("Charlotte, NC");
  await page.getByRole("button", { name: "Create route" }).click();
  await expect(
    page.getByRole("region", { name: "Route summary" })
  ).toContainText("245 mi");
  await expect(page.getByRole("region", { name: "Itinerary" })).toContainText(
    "Atlanta, GA"
  );
  await expect(page.getByText("Not saved")).toBeVisible();
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
