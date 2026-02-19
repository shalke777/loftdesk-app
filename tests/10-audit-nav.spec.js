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

test("audit: scan nawigacji (linki) + 5xx + console errors", async ({ page }, testInfo) => {
  const errors = [];
  const http5xx = [];

  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console:error: ${msg.text()}`);
  });

  page.on("response", (res) => {
    const status = res.status();
    if (status >= 500) http5xx.push(`${status} ${res.request().method()} ${res.url()}`);
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const hrefs = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a[href]"));
    return links
      .map((a) => a.getAttribute("href"))
      .filter(Boolean)
      .filter((h) => typeof h === "string")
      .filter((h) => h.startsWith("/"))
      .filter((h) => !h.startsWith("/login") && !h.startsWith("/register") && !h.startsWith("/auth"));
  });

  const targets = uniq(hrefs).slice(0, 40);

  for (const href of targets) {
    await page.goto(href, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(500);

    const shot = await page.screenshot({ fullPage: true });
    await testInfo.attach(`route-${href.replaceAll("/", "_")}.png`, {
      body: shot,
      contentType: "image/png",
    });

    const bodyText = await page.locator("body").innerText().catch(() => "");
    if (/error|błąd|unexpected|500|something went wrong/i.test(bodyText)) {
      errors.push(`ui-error-like-text on ${href}`);
    }
  }

  const errorsTxt = errors.join("\n") || "no-console/pageerrors";
  const http5xxTxt = http5xx.join("\n") || "no-5xx";

  // --- attachments do reportu ---
  await testInfo.attach("audit-errors.txt", {
    body: Buffer.from(errorsTxt),
    contentType: "text/plain",
  });

  await testInfo.attach("audit-5xx.txt", {
    body: Buffer.from(http5xxTxt),
    contentType: "text/plain",
  });

  // --- stały zapis na dysk ---
  const dir = ensureArtifactsDir();
  fs.writeFileSync(path.join(dir, "audit-errors.txt"), errorsTxt, "utf8");
  fs.writeFileSync(path.join(dir, "audit-5xx.txt"), http5xxTxt, "utf8");

  expect(http5xx, `Wykryto 5xx:\n${http5xx.join("\n")}`).toEqual([]);
});
