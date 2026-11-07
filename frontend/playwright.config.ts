import fs from "node:fs";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

const defaultLocalPort = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.BASE_URL ?? `http://localhost:${defaultLocalPort}`;
const authStatePath = path.resolve(process.env.E2E_STORAGE_STATE ?? "playwright/.auth/user.json");
const localBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseURL);
const localPort = new URL(baseURL).port || defaultLocalPort;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    storageState: authStatePath,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ignoreHTTPSErrors: process.env.PW_IGNORE_HTTPS_ERRORS === "1",
  },
  projects: [
    {
      name: "desktop-chromium",
      testMatch: /public\.spec\.ts|performance\.spec\.ts|api-security\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: { cookies: [], origins: [] } },
    },
    {
      name: "desktop-firefox",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Firefox"], storageState: { cookies: [], origins: [] } },
    },
    {
      name: "mobile-webkit",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["iPhone 13"], storageState: { cookies: [], origins: [] } },
    },
    {
      name: "desktop-chromium-authenticated",
      testMatch: /authenticated\.spec\.ts|authenticated-api\.spec\.ts|receipt-upload\.spec\.ts|session\.spec\.ts|workflow\.spec\.ts|validation\.spec\.ts|visual\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: authStatePath },
    },
    {
      name: "mobile-chromium",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Pixel 7"], storageState: { cookies: [], origins: [] } },
    },
    {
      name: "mobile-chromium-authenticated",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"], storageState: authStatePath },
    },
  ],
  webServer: localBaseUrl && process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "1"
    ? {
        command: `node node_modules/next/dist/bin/next dev --port ${localPort}`,
        cwd: path.resolve(__dirname),
        url: baseURL,
        reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
        gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
        timeout: 120_000,
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      }
    : undefined,
});

export function hasAuthState(): boolean {
  return fs.existsSync(path.resolve(process.env.E2E_AUTH_MARKER ?? "playwright/.auth/ready"));
}
