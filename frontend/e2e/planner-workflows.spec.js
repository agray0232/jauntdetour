const { test, expect } = require("@playwright/test");
const {
  createPlannerRoute,
  installAnonymousAuth,
  installPlannerApi,
  moveCompactSheetToPeek,
  searchForDetours,
  seedPlannerWithDetour,
} = require("./support/plannerFixtures");

test.beforeEach(async ({ page }) => {
  await installAnonymousAuth(page);
  await installPlannerApi(page);
});

test("planner initializes a route", async ({ page }) => {
  await createPlannerRoute(page);

  await expect(page.getByRole("region", { name: "Itinerary" })).toContainText(
    "Atlanta, GA"
  );
  await expect(page.getByTitle("Jaunt start")).toHaveCount(1);
  await expect(page.getByTitle("Jaunt destination")).toHaveCount(1);
  await expect(page.getByText("Not saved")).toBeVisible();

  const jauntName = page.getByRole("textbox", { name: "Jaunt name" });
  await expect(jauntName).toHaveAttribute(
    "placeholder",
    "Atlanta, GA to Charlotte, NC"
  );
  await jauntName.fill("Carolinas weekend");
  await expect(jauntName).toHaveValue("Carolinas weekend");
  await expect(page.getByRole("tab", { name: "Discover" })).toBeEnabled();
});

test("planner discovers and adds a detour from results", async ({ page }) => {
  await createPlannerRoute(page);
  await searchForDetours(page);

  await expect(page.getByRole("heading", { name: "2 places" })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await page.getByRole("button", { name: "Select Paris Mountain" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();

  await expect(
    page.getByRole("button", { name: "Dismiss added detour notification" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /places?$/ })).toHaveCount(0);
  await page.getByRole("tab", { name: "Build" }).click();
  await expect(page.getByRole("region", { name: "Itinerary" })).toContainText(
    "Paris Mountain"
  );
  await expect(page.getByRole("region", { name: "Itinerary" })).toContainText(
    "Adds 18 min"
  );
});

test("planner removes a detour and restores it with Undo", async ({
  page,
}, testInfo) => {
  await seedPlannerWithDetour(page);
  await page.goto("/plan", { waitUntil: "domcontentloaded" });

  if (testInfo.project.metadata.compact) {
    await moveCompactSheetToPeek(page);
  }

  await page.getByTitle("Paris Mountain, added stop").click();
  await page
    .getByRole("button", { name: "Actions for Paris Mountain" })
    .click();
  await page.getByRole("menuitem", { name: "Remove detour" }).click();

  await expect(
    page.getByRole("button", { name: "Dismiss removal notification" })
  ).toBeVisible();
  await expect(page.getByTitle("Paris Mountain, added stop")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByTitle("Paris Mountain, added stop")).toHaveCount(1);

  await expect(page.getByRole("region", { name: "Itinerary" })).toContainText(
    "Paris Mountain"
  );
});
