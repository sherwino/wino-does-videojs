const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "playback.spec.cjs",
  workers: 1,
  timeout: 45000,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYBACK_BASE_URL || "http://127.0.0.1:5000",
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
});
