const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { firstVisible, clickIfVisible, safeWaitNetworkIdle } = require("./helpers");

module.exports = async () => {
  const email = process.env.LOFT_EMAIL;
  const pass = process.env.LOFT_PASS;

  if (!email || !pass) {
    throw new Error(
      'Brak LOFT_EMAIL / LOFT_PASS. Ustaw lokalnie w PowerShell:\n' +
        '$env:LOFT_EMAIL="..."\n$env:LOFT_PASS="..."'
    );
  }

  // przygotuj folder na auth state
  const authDir = path.join(process.cwd(), ".auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // logi pomocne gdyby coś padło
  page.on("pageerror", (err) => console.log("[pageerror]", err.message));
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) console.log(`[console:${msg.type()}]`, msg.text());
  });

  await page.goto("https://www.loftdesk.pl/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await safeWaitNetworkIdle(page);

  // Jeśli lądujemy na rejestracji, przełącz na login ("Mam konto")
  const mamKontoLink = page.getByRole("link", { name: /mam konto|zaloguj/i }).first();
  await clickIfVisible(mamKontoLink);
  await page.waitForTimeout(500);

  // Pola (heurystycznie)
  const emailInput = page
    .locator('input[type="email"], input[name="email"], input[autocomplete="email"], input[id*="email" i], input[placeholder*="mail" i]')
    .first();

  const passInput = page
    .locator('input[type="password"], input[name="password"], input[autocomplete="current-password"], input[id*="pass" i], input[placeholder*="has" i]')
    .first();

  // button logowania – po tekście, żeby nie kliknąć "Utwórz konto"
  const loginBtn = page.getByRole("button", { name: /zaloguj|login|sign in/i }).first();

  // wypełnij i zaloguj
  if (!(await emailInput.isVisible().catch(() => false))) {
    await page.screenshot({ path: path.join(authDir, "global-setup-no-email.png"), fullPage: true });
    throw new Error("Nie widzę pola email na /login. Zapisano .auth/global-setup-no-email.png");
  }

  await emailInput.fill(email);
  await passInput.fill(pass);
  await loginBtn.click().catch(async () => {
    // awaryjnie enter
    await passInput.press("Enter").catch(() => {});
  });

  // czekamy na /app
  await page.waitForURL(/\/app/, { timeout: 30_000 }).catch(async () => {
    await page.screenshot({ path: path.join(authDir, "global-setup-login-failed.png"), fullPage: true });
    throw new Error("Login nie przeszedł do /app. Zapisano .auth/global-setup-login-failed.png");
  });

  // zapis sesji
  await context.storageState({ path: ".auth/user.json" });
  await browser.close();
};
