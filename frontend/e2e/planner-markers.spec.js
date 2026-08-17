const { test, expect } = require("@playwright/test");
const {
  createPlannerRoute,
  createSinglePlaceResponse,
  installAnonymousAuth,
  installPlannerApi,
  moveCompactSheetToPeek,
  searchForDetours,
} = require("./support/plannerFixtures");

test.beforeEach(async ({ page }) => {
  await installAnonymousAuth(page);
  await installPlannerApi(page, { places: createSinglePlaceResponse() });
});

test("planner adds a detour from a candidate marker", async ({
  page,
}, testInfo) => {
  await createPlannerRoute(page);
  await searchForDetours(page);
  await expect(page.getByRole("heading", { name: "1 place" })).toBeVisible();

  if (testInfo.project.metadata.compact) {
    await moveCompactSheetToPeek(page);
  }

  const candidateMarker = page.getByTitle("1. Paris Mountain");
  await expect(candidateMarker).toBeVisible();
  await candidateMarker.click();

  const candidateDetails = page.getByLabel("Paris Mountain details");
  await expect(candidateDetails).toContainText("4.7 rating");
  await expect(candidateDetails).toContainText("Greenville County");
  await candidateDetails.getByRole("button", { name: "Add to Jaunt" }).click();

  await expect(
    page.getByRole("button", { name: "Dismiss added detour notification" })
  ).toBeVisible();
  await expect(page.getByTitle("Paris Mountain, added stop")).toHaveCount(1);
  await expect(candidateMarker).toHaveCount(0);
});

test("desktop marker hover previews details before selection", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.metadata.supportsHover, "Requires hover input");

  await createPlannerRoute(page);
  await searchForDetours(page);
  const candidateMarker = page.getByTitle("1. Paris Mountain");

  await candidateMarker.hover();
  const candidateDetails = page.getByLabel("Paris Mountain details");
  await expect(candidateDetails).toBeVisible();
  await expect(
    candidateDetails.getByRole("button", { name: "Add to Jaunt" })
  ).toHaveCount(0);

  await candidateMarker.click();
  await expect(
    candidateDetails.getByRole("button", { name: "Add to Jaunt" })
  ).toBeVisible();
});

test("compact planner resizes tools over its tappable map", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.metadata.compact, "Requires compact layout");

  await createPlannerRoute(page);
  await searchForDetours(page);
  const sheetHandle = page.getByRole("slider", {
    name: "Resize planning tools",
  });
  await expect(sheetHandle).toHaveAttribute("aria-valuetext", "mid position");
  await moveCompactSheetToPeek(page);
  await expect(
    page.getByRole("region", { name: "Jaunt route map" })
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Jaunt planning tools" })
  ).toBeAttached();

  await page.getByTitle("1. Paris Mountain").click();
  await expect(page.getByLabel("Paris Mountain details")).toBeVisible();
  await sheetHandle.click();
  await expect(sheetHandle).toHaveAttribute("aria-valuetext", "mid position");
  await expect(
    page.getByRole("complementary", { name: "Jaunt planning tools" })
  ).toBeVisible();
});
