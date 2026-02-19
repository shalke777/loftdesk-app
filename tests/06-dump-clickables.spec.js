const { test } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

function ensureArtifactsDir() {
  const dir = path.join(process.cwd(), "artifacts");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test("dump: clickables w /app (button/menuitem/tab + aria/data-testid)", async ({ page }, testInfo) => {
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const items = await page.evaluate(() => {
    const norm = (s) => (s || "").trim().replace(/\s+/g, " ");

    const selectors = [
      "button",
      "[role='button']",
      "[role='menuitem']",
      "[role='tab']",
      "[role='navigation'] *",
      "[data-testid]",
      "[data-cy]",
      "[data-test]",
      "[title]",
      "[aria-label]"
    ];

    const els = Array.from(new Set(selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)))));

    const out = els.map((el) => {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role") || "";
      const text = norm(el.innerText || el.textContent);
      const aria = norm(el.getAttribute("aria-label") || "");
      const title = norm(el.getAttribute("title") || "");
      const testid = el.getAttribute("data-testid") || "";
      const datacy = el.getAttribute("data-cy") || "";
      const datatest = el.getAttribute("data-test") || "";
      const id = el.id || "";
      const cls = (el.className && typeof el.className === "string") ? el.className : "";

      // heurystyka: czy wygląda na klikalne
      const clickable =
        tag === "button" ||
        role === "button" ||
        role === "menuitem" ||
        role === "tab" ||
        typeof el.onclick === "function" ||
        el.hasAttribute("tabindex");

      const name = (aria || title || text).trim();

      return {
        tag, role, clickable,
        name,
        text, aria, title,
        testid, datacy, datatest,
        id, class: cls,
      };
    });

    // filtr: chcemy sensowne pozycje
    const filtered = out
      .filter(x => x.clickable || x.testid || x.datacy || x.datatest || x.role)
      .filter(x => (x.name && x.name.length >= 2) || x.testid || x.datacy || x.datatest)
      .slice(0, 800);

    return filtered;
  });

  const dir = ensureArtifactsDir();
  const outPath = path.join(dir, "clickables.json");
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2), "utf8");

  await testInfo.attach("clickables.json", {
    body: Buffer.from(JSON.stringify(items, null, 2)),
    contentType: "application/json",
  });

  await testInfo.attach("dump-app.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
