const { test } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

function ensureArtifactsDir() {
  const dir = path.join(process.cwd(), "artifacts");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test("dump: lista linków w /app (tekst + href)", async ({ page }, testInfo) => {
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const links = await page.evaluate(() => {
    const isVisible = (el) => {
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };

    return Array.from(document.querySelectorAll("a[href]"))
      .filter(isVisible)
      .map((a) => ({
        text: (a.innerText || a.textContent || "").trim().replace(/\s+/g, " "),
        href: a.getAttribute("href"),
      }))
      .filter((x) => x.href && x.href.startsWith("/"));
  });

  const dir = ensureArtifactsDir();
  const out = path.join(dir, "nav-links.json");
  fs.writeFileSync(out, JSON.stringify(links, null, 2), "utf8");

  await testInfo.attach("nav-links.json", {
    body: Buffer.from(JSON.stringify(links, null, 2)),
    contentType: "application/json",
  });

  await testInfo.attach("dump-nav.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
