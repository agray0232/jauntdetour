const { test, expect } = require("@playwright/test");
const { installAnonymousAuth } = require("./support/plannerFixtures");

test.beforeEach(async ({ page }) => {
  await installAnonymousAuth(page);
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
  await expect(page.getByText(/does not provide live navigation/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Plan your Jaunt" })
  ).toHaveAttribute("href", "/plan");
});