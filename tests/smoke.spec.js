const { test, expect } = require("@playwright/test");

test("smoke: /app działa (sesja z storageState)", async ({ page }) => {
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/app/);
});
