require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: true });

const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",

  // globalny timeout testu (per test.describe można nadpisać)
  timeout: 60_000,
  expect: { timeout: 60_000 },

  reporter: [["line"], ["html", { open: "never" }]],

  // Logowanie raz i zapis storageState do .auth/user.json
  globalSetup: require.resolve("./tests/global-setup"),

  use: {
    baseURL: process.env.PW_BASE_URL || "https://www.loftdesk.pl",
    storageState: ".auth/user.json",

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    actionTimeout: 60_000,
    navigationTimeout: 60_000,
  },

  workers: 1,
});
