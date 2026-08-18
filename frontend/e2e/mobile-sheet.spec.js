const { test, expect } = require("@playwright/test");
const {
  createPlannerRoute,
  installAnonymousAuth,
  installPlannerApi,
} = require("./support/plannerFixtures");

test.beforeEach(async ({ page }) => {
  await installAnonymousAuth(page);
  await installPlannerApi(page);
});

test("compact planner locks outer scrolling while sheet content remains bounded", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.metadata.compact, "Requires compact layout");

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const main = page.locator("#main-content");
  const homeLink = page.getByRole("link", { name: "JauntDetour home" });
  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect
    .poll(() => main.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await expect(homeLink).toBeInViewport();

  await page.getByRole("link", { name: "Plan your Jaunt" }).first().click();
  await expect(page).toHaveURL(/\/plan$/);
  await expect
    .poll(() => main.evaluate((element) => element.scrollTop))
    .toBe(0);
  await expect(homeLink).toBeInViewport();
  await expect(
    page.getByRole("navigation", { name: "Compact navigation" })
  ).toBeInViewport();
  await expect(main).toHaveAttribute("data-scroll-locked", "true");
  await expect(main).toHaveCSS("overflow-y", "hidden");
  await expect
    .poll(() => page.evaluate(() => document.body.style.position))
    .toBe("fixed");

  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.evaluate(() => window.scrollTo(0, 1000));
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  const map = page.getByRole("region", { name: "Jaunt route map" });
  const plannerBounds = await main.boundingBox();
  const mapBounds = await map.boundingBox();
  expect(plannerBounds).not.toBeNull();
  expect(mapBounds).not.toBeNull();
  expect(mapBounds.y).toBeGreaterThanOrEqual(plannerBounds.y);
  expect(mapBounds.y + mapBounds.height).toBeLessThanOrEqual(
    plannerBounds.y + plannerBounds.height
  );

  const sheetHandle = page.getByRole("slider", {
    name: "Resize planning tools",
  });
  await page.getByRole("combobox", { name: "Start" }).focus();
  await expect(sheetHandle).toHaveAttribute("aria-valuetext", "mid position");
  await expect(homeLink).toBeInViewport();
  await page.getByRole("combobox", { name: "Destination" }).focus();
  await expect(sheetHandle).toHaveAttribute("aria-valuetext", "mid position");
  await expect(homeLink).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("compact planner exposes route entry at the initial sheet height", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.metadata.compact, "Requires compact layout");

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/plan", { waitUntil: "domcontentloaded" });
  const sheetHandle = page.getByRole("slider", {
    name: "Resize planning tools",
  });
  await expect(sheetHandle).toHaveAttribute("aria-valuetext", "mid position");
  await expect(
    page.getByRole("heading", { name: "Where are you headed?" })
  ).toBeInViewport();
  await expect(page.getByRole("combobox", { name: "Start" })).toBeInViewport();
  await expect(
    page.getByRole("combobox", { name: "Destination" })
  ).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Create route" })
  ).toBeInViewport();

  const sheet = page.locator('[data-sheet-position="mid"]');
  await expect(sheet).toHaveCSS("border-top-left-radius", "16px");
  await expect(sheet).toHaveCSS("border-top-right-radius", "16px");
});

test("compact route-ready header stays concise at mid height", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.metadata.compact, "Requires compact layout");

  await createPlannerRoute(page);
  await expect(
    page.getByRole("textbox", { name: "Jaunt name" })
  ).toBeInViewport();
  await expect(page.getByRole("tab", { name: "Build" })).toBeInViewport();
});

test("compact Discover scroll reaches controls at mid sheet height", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.metadata.compact, "Requires compact layout");

  await createPlannerRoute(page);
  await page.getByRole("tab", { name: "Discover" }).click();

  const sheetHandle = page.getByRole("slider", {
    name: "Resize planning tools",
  });
  await expect(sheetHandle).toHaveAttribute("aria-valuetext", "mid position");

  const radius = page.getByLabel("Search radius");
  await radius.scrollIntoViewIfNeeded();
  await expect(radius).toBeInViewport();

  const search = page.getByRole("button", { name: "Search this area" });
  await search.scrollIntoViewIfNeeded();
  await expect(search).toBeInViewport();
});
