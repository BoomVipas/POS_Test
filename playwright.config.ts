import { defineConfig, devices } from "@playwright/test";

// Smoke / regression tests for credential-free UI surfaces.
// Run with `npm run e2e` — the webServer config below auto-starts the
// dev server on :3000 (or reuses an existing one when not in CI). To
// run against a server you started yourself, set E2E_NO_AUTOSTART=1.
//
// First-time setup on a fresh machine:
//   npm run e2e:install   (installs the chromium browser binary)

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_NO_AUTOSTART
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
