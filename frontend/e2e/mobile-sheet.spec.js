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
