import { defineConfig, devices } from "@playwright/test";

// Runs only on GATE tasks (`npm run test:e2e`). Uses its own server + in-memory
// DB (test/e2e/server.ts) on E2E_PORT, never a running dev server or .env.local's DB.
// Viewport widths (360, 1280) are set per test.
const port = process.env.E2E_PORT ?? "3100";

export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node test/e2e/server.ts",
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
