const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

function ensureArtifactsDir() {
  const dir = path.join(process.cwd(), "artifacts");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function uniq(arr) {
  return [...new Set(arr)];
}

function dummyForInput(meta) {
  const name = (meta.name || "").toLowerCase();
  const ph = (meta.placeholder || "").toLowerCase();
  const type = (meta.type || "").toLowerCase();
  const key = `${name} ${ph} ${type}`;

  if (type === "email" || key.includes("email") || key.includes("mail")) return "test@example.com";
  if (type === "tel" || key.includes("tel") || key.includes("telefon")) return "500600700";
  if (key.includes("nip")) return "1234567890";
  if (key.includes("regon")) return "123456789";
  if (key.includes("kod") || key.includes("zip") || key.includes("poczt")) return "00-001";
  if (key.includes("miasto") || key.includes("city")) return "Warszawa";
  if (key.includes("ulic") || key.includes("street")) return "Testowa 1";
  if (key.includes("numer") || key.includes("number")) return "TEST/1/2026";
  if (type === "date") return "2026-02-19";
  if (type === "number") return "1";
  return "Test";
}

async function tryFillVisibleForm(page) {
  const els = page.locator("input, textarea");
  const count = await els.count();

  for (let i = 0; i < count; i++) {
    const el = els.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    if (await el.isDisabled().catch(() => false)) continue;

    const type = (await el.getAttribute("type").catch(() => "")) || "";
    const name = (await el.getAttribute("name").catch(() => "")) || "";
    const placeholder = (await el.getAttribute("placeholder").catch(() => "")) || "";

    if (type.toLowerCase() === "password") continue;
    if (["checkbox", "radio", "file", "hidden"].includes(type.toLowerCase())) continue;

    const val = await el.inputValue().catch(() => "");
    if (val && val.trim().length > 0) continue;

    await el.fill(dummyForInput({ type, name, placeholder })).catch(() => {});
  }
}

test("audit: akcje (Dodaj/Nowy) na kilku widokach + zapis bez 5xx i bez 'error' w UI", async ({ page }, testInfo) => {
  const http5xx = [];

  page.on("response", (res) => {
    if (res.status() >= 500) http5xx.push(`${res.status()} ${res.request().method()} ${res.url()}`);
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const hrefs = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a[href]"));
    return links
      .map((a) => a.getAttribute("href"))
      .filter(Boolean)
      .filter((h) => typeof h === "string")
      .filter((h) => h.startsWith("/app"));
  });

  const targets = uniq(hrefs).slice(0, 8);
  const addPatterns = [/dodaj/i, /nowy/i, /utwórz/i, /create/i, /add/i];
  const savePatterns = [/zapisz/i, /save/i, /utwórz/i, /create/i];

  for (const route of targets) {
    await page.goto(route, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(500);

    await testInfo.attach(`actions-view-${route.replaceAll("/", "_")}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    // kliknij Dodaj/Nowy jeśli istnieje
    const btns = page.locator("button");
    const btnCount = await btns.count();
    let clickedAdd = false;

    for (let i = 0; i < btnCount; i++) {
      const b = btns.nth(i);
      if (!(await b.isVisible().catch(() => false))) continue;
      const t = (await b.innerText().catch(() => "")).trim();
      if (t && addPatterns.some((re) => re.test(t))) {
        await b.click().catch(() => {});
        clickedAdd = true;
        break;
      }
    }
    if (!clickedAdd) continue;

    await page.waitForTimeout(600);

    await testInfo.attach(`actions-form-${route.replaceAll("/", "_")}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await tryFillVisibleForm(page);

    // kliknij Zapisz/Save
    let clickedSave = false;
    const btnCount2 = await btns.count();

    for (let i = 0; i < btnCount2; i++) {
      const b = btns.nth(i);
      if (!(await b.isVisible().catch(() => false))) continue;
      const t = (await b.innerText().catch(() => "")).trim();
      if (t && savePatterns.some((re) => re.test(t))) {
        await b.click().catch(() => {});
        clickedSave = true;
        break;
      }
    }
    if (!clickedSave) continue;

    await page.waitForTimeout(1200);

    await testInfo.attach(`actions-after-save-${route.replaceAll("/", "_")}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    const bodyText = await page.locator("body").innerText().catch(() => "");
    expect(bodyText.toLowerCase()).not.toMatch(/database error|unexpected|something went wrong|500|błąd krytyczny/);
  }

  const http5xxTxt = http5xx.join("\n") || "no-5xx";

  // --- attachment do reportu ---
  await testInfo.attach("actions-5xx.txt", {
    body: Buffer.from(http5xxTxt),
    contentType: "text/plain",
  });

  // --- stały zapis na dysk ---
  const dir = ensureArtifactsDir();
  fs.writeFileSync(path.join(dir, "actions-5xx.txt"), http5xxTxt, "utf8");

  expect(http5xx, `Wykryto 5xx:\n${http5xx.join("\n")}`).toEqual([]);
});
