const { test, expect } = require("@playwright/test");
const {
  installAuthorizedAuth,
  installSavedJauntApi,
} = require("./support/plannerFixtures");

test.beforeEach(async ({ page }) => {
  await installAuthorizedAuth(page);
  await installSavedJauntApi(page);
});

test("saved Jaunt renders its endpoint markers", async ({ page }) => {
  await page.goto("/trips/trip-1", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Carolinas weekend" })
  ).toBeVisible();
  await expect(page.getByTitle("Jaunt start")).toHaveCount(1);
  await expect(page.getByTitle("Jaunt destination")).toHaveCount(1);
});

test("saved Jaunt selects an added marker to show details", async ({
  page,
}, testInfo) => {
  test.skip(
    !testInfo.project.metadata.supportsHover,
    "Saved-map selection is covered on desktop; compact tap selection is covered in the planner"
  );

  await page.goto("/trips/trip-1", { waitUntil: "domcontentloaded" });
  await page.getByTitle("Paris Mountain, added stop").click();

  const details = page.getByLabel("Paris Mountain details");
  await expect(details).toContainText("Hike");
  await expect(details).toContainText("4.7 rating");
  await expect(details).toContainText("+ 18 min");
});
