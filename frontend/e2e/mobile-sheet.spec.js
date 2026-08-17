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

test("compact header stays visible while routes and planner tools scroll", async ({
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

  await page.getByRole("combobox", { name: "Start" }).focus();
  const sheetHandle = page.getByRole("slider", {
    name: "Resize planning tools",
  });
  await sheetHandle.press("End");
  await expect(sheetHandle).toHaveAttribute(
    "aria-valuetext",
    "expanded position"
  );
  await expect(homeLink).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("compact planner exposes route entry at the initial sheet height", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.metadata.compact, "Requires compact layout");

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
