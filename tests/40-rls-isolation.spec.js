const { test, expect } = require("@playwright/test");

async function safeWait(page, ms) {
  if (!page || page.isClosed()) return;
  try {
    await page.waitForTimeout(ms);
  } catch {}
}

async function attachQuick(page, testInfo, name) {
  if (!testInfo || !page) return;
  try {
    await testInfo.attach(`${name}.url.txt`, {
      body: Buffer.from(page.url(), "utf8"),
      contentType: "text/plain",
    });
  } catch {}
  try {
    const png = await page.screenshot({ fullPage: true });
    await testInfo.attach(`${name}.png`, { body: png, contentType: "image/png" });
  } catch {}
  try {
    const html = await page.content();
    await testInfo.attach(`${name}.html`, {
      body: Buffer.from(html, "utf8"),
      contentType: "text/html",
    });
  } catch {}
}

// --- Login (zgodnie z Twoimi założeniami) ---
async function uiLogin(page, email, pass) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});

  if (/\/app/i.test(page.url())) return;

  const emailInput = page
    .locator(
      'input[type="email"], input[name*="email" i], input[autocomplete="email"], input[placeholder*="mail" i]'
    )
    .first();
  await expect(emailInput).toBeVisible({ timeout: 15_000 });
  await emailInput.fill(email);

  const passInput = page
    .locator(
      'input[type="password"], input[name*="pass" i], input[autocomplete="current-password"], input[placeholder*="has" i]'
    )
    .first();
  await expect(passInput).toBeVisible({ timeout: 15_000 });
  await passInput.fill(pass);

  const submit = page.getByRole("button", { name: /zaloguj|login|sign in/i }).first();
  await expect(submit).toBeVisible({ timeout: 10_000 });
  await submit.click();

  await page.waitForURL(/\/app/i, { timeout: 30_000 });
}

async function openContractorsScope(page) {
  const openBtn = page
    .locator('button:has-text("Kontrahenci"), a:has-text("Kontrahenci"), [role="button"]:has-text("Kontrahenci")')
    .first();
  await expect(openBtn).toBeVisible({ timeout: 20_000 });
  await openBtn.click();

  const heading = page.getByRole("heading", { name: /baza kontrahent(ó|o)w/i }).first();
  await expect(heading).toBeVisible({ timeout: 20_000 });

  // prefer dialog
  const dialog = page.locator('[role="dialog"]').filter({ has: heading }).first();
  if ((await dialog.count().catch(() => 0)) > 0) return dialog;

  // pełny widok SPA: scope powinien objąć całą treść (nie tylko pasek nagłówka)
  const main = page.locator("main").filter({ has: heading }).first();
  if ((await main.count().catch(() => 0)) > 0) return main;

  // fallback: jakikolwiek container z nagłówkiem
  const container = page
    .locator('div:has(:text-matches("Baza kontrahent(ó|o)w", "i"))')
    .first();
  if ((await container.count().catch(() => 0)) > 0) return container;

  // ostatecznie: cały dokument (żeby klikacze dalej działały)
  return page.locator("body");
}

async function clickNew(scope) {
  const exact = scope.getByRole("button", { name: /^(\+\s*)?(nowy|new)$/i });
  if ((await exact.count().catch(() => 0)) > 0) {
    await exact.first().click();
    return;
  }

  const fallback = scope
    .getByRole("button", { name: /nowy|dodaj|new/i })
    .filter({ hasNot: scope.getByText(/do pliku/i) });

  await expect(fallback.first()).toBeVisible({ timeout: 15_000 });
  await fallback.first().click();
}

async function resolveForm(scope) {
  const form = scope.locator('form:has(button:has-text("Zapisz")), form:has(button:has-text("Save"))').first();
  if ((await form.count().catch(() => 0)) > 0) return form;

  const container = scope
    .locator(':is(div,section):has(button:has-text("Zapisz")), :is(div,section):has(button:has-text("Save"))')
    .first();
  if ((await container.count().catch(() => 0)) > 0) return container;

  return scope;
}

async function fillAndSaveContractor(page, scope, name, testInfo) {
  const formScope = await resolveForm(scope);

  let nameInput = formScope.locator('input[placeholder*="wymag" i]').first();
  if ((await nameInput.count().catch(() => 0)) === 0) {
    const label = formScope.locator('label:has-text("Nazwa"), label:has-text("imi")').first();
    if ((await label.count().catch(() => 0)) > 0) nameInput = label.locator('xpath=following::input[1]');
  }
  if ((await nameInput.count().catch(() => 0)) === 0) {
    nameInput = formScope
      .locator('input[type="text"], input:not([type])')
      .filter({ hasNot: formScope.locator('input[type="search"], input[placeholder*="szuk" i]') })
      .first();
  }

  await expect(nameInput).toBeVisible({ timeout: 20_000 });
  await nameInput.fill(name);
  await nameInput.blur().catch(() => {});

  // "Zapisz" tylko w obrębie formularza, z wykluczeniem "Zapisz do pliku"
  const saveExact = formScope.getByRole("button", { name: /^(zapisz|save)$/i });
  const save = (await saveExact.count().catch(() => 0)) > 0
    ? saveExact.first()
    : formScope
        .getByRole("button", { name: /zapisz|save/i })
        .filter({ hasNot: formScope.getByText(/do pliku/i) })
        .first();

  await expect(save).toBeVisible({ timeout: 20_000 });

  for (let i = 0; i < 25; i++) {
    if (await save.isEnabled().catch(() => false)) break;
    await safeWait(page, 200);
  }

  if (!(await save.isEnabled().catch(() => false))) {
    await attachQuick(page, testInfo, "save-disabled");
    throw new Error(`Przycisk Zapisz jest disabled. URL=${page.url()}`);
  }

  await save.click();
  await page.waitForLoadState("networkidle").catch(() => {});
  await safeWait(page, 600);
}

async function searchInContractors(page, scope, term) {
  const search = scope.locator('input[type="search"], input[placeholder*="szuk" i]').first();
  await expect(search).toBeVisible({ timeout: 20_000 });
  await search.fill(term);
  await page.waitForLoadState("networkidle").catch(() => {});
  await safeWait(page, 400);
}

test("RLS: user B nie widzi kontrahenta user A", async ({ browser }, testInfo) => {
  const emailA = process.env.LOFT_EMAIL_A;
  const passA = process.env.LOFT_PASS_A;
  const emailB = process.env.LOFT_EMAIL_B;
  const passB = process.env.LOFT_PASS_B;

  if (!emailA || !passA || !emailB || !passB) {
    throw new Error("Ustaw LOFT_EMAIL_A/LOFT_PASS_A oraz LOFT_EMAIL_B/LOFT_PASS_B.");
  }

  const baseURL = testInfo?.project?.use?.baseURL;
  if (!baseURL) throw new Error("Brak baseURL w playwright.config.js (use.baseURL).");

  const uniqueName = `RLS-${Date.now()}`;

  const ctxA = await browser.newContext({ baseURL });
  const pageA = await ctxA.newPage();

  const ctxB = await browser.newContext({ baseURL });
  const pageB = await ctxB.newPage();

  try {
    await uiLogin(pageA, emailA, passA);
    await uiLogin(pageB, emailB, passB);

    // A: dodaje kontrahenta
    const scopeA = await openContractorsScope(pageA);
    await clickNew(scopeA);
    await fillAndSaveContractor(pageA, scopeA, uniqueName, testInfo);
    await searchInContractors(pageA, scopeA, uniqueName);
    await expect(scopeA.getByText(uniqueName)).toBeVisible({ timeout: 20_000 });

    // B: nie widzi kontrahenta A
    const scopeB = await openContractorsScope(pageB);
    await searchInContractors(pageB, scopeB, uniqueName);
    await expect(scopeB.getByText(uniqueName)).toHaveCount(0, { timeout: 10_000 });
  } catch (e) {
    await attachQuick(pageA, testInfo, "fail-pageA");
    await attachQuick(pageB, testInfo, "fail-pageB");
    throw e;
  } finally {
    await ctxA.close().catch(() => {});
    await ctxB.close().catch(() => {});
  }
});
