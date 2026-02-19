const { test, expect } = require("@playwright/test");
const { safeWaitNetworkIdle } = require("./helpers");

test("auth: wejscie do /app i sesja po refreshu", async ({ page }) => {
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await safeWaitNetworkIdle(page);

  await expect(page).toHaveURL(/\/app/);

  // refresh i dalej /app
  await page.reload({ waitUntil: "domcontentloaded" });
  await safeWaitNetworkIdle(page);
  await expect(page).toHaveURL(/\/app/);

  // sanity: nie pokazuj login/register
  await expect(page.locator("body")).not.toContainText(/zaloguj|login|załóż konto|utwórz konto/i);
});
