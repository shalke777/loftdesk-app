const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

function ensureArtifactsDir() {
  const dir = path.join(process.cwd(), "artifacts");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Szukamy TYLKO typowych wzorców błędnego dekodowania UTF-8 jako Latin-1/CP1252.
// NIE łapiemy zwykłych polskich znaków ani "•".
const MOJIBAKE_RE = /(Ã.|Â.|â€|â€™|â€œ|â€\x9d|â€¢|â„¢|â€¦|â€“|â€”|âš|âś|Ĺ|Ä|Ă)/;

test("scan: mojibake w /app", async ({ page }, testInfo) => {
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const text = await page.locator("body").innerText().catch(() => "");
  const bad = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((line) => MOJIBAKE_RE.test(line))
    .slice(0, 300);

  const dir = ensureArtifactsDir();
  const out = bad.join("\n") || "no-mojibake";

  // Zapis z UTF-8 BOM, żeby Windows PowerShell nie czytał jako ANSI
  fs.writeFileSync(path.join(dir, "encoding-bad-lines.txt"), "\uFEFF" + out, "utf8");

  await testInfo.attach("encoding-bad-lines.txt", {
    body: Buffer.from(out),
    contentType: "text/plain",
  });

  expect(bad, "Wykryto mojibake (złe dekodowanie znaków).").toEqual([]);
});
