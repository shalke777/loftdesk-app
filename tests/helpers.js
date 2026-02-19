async function isVisible(locator) {
  return await locator.isVisible().catch(() => false);
}

async function clickIfVisible(locator) {
  if (await isVisible(locator)) {
    await locator.click().catch(() => {});
    return true;
  }
  return false;
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let i = 0; i < count; i++) {
    const el = locator.nth(i);
    if (await isVisible(el)) return el;
  }
  return null;
}

async function safeWaitNetworkIdle(page, ms = 8000) {
  await page.waitForLoadState("networkidle", { timeout: ms }).catch(() => {});
}

function uniq(arr) {
  return [...new Set(arr)];
}

module.exports = {
  isVisible,
  clickIfVisible,
  firstVisible,
  safeWaitNetworkIdle,
  uniq,
};
