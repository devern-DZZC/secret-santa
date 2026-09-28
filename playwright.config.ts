import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against an `e2e` build, which uses the PUBLIC fixture draw
 * (tests/fixtures/assignments.e2e.ts), never the real one. Screenshots, traces
 * and video are off so nothing from a run can show a pairing.
 */
const PORT = 4174;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${PORT}/`,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [
    { name: "iPhone 13", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "Pixel 7", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
