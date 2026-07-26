const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Unauthorized" }),
    })
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });
});

test("loads the branded application foundation", async ({ page, request }) => {
  await expect(page).toHaveTitle("JauntDetour");
  await expect(page.locator('input[placeholder="Origin"]:visible')).toHaveCount(
    1
  );
  await expect(
    page.locator('input[placeholder="Destination"]:visible')
  ).toHaveCount(1);

  const bodyFont = await page.locator("body").evaluate((element) =>
    window.getComputedStyle(element).fontFamily
  );
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