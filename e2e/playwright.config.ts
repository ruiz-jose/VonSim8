import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporters
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    process.env.CI ? ["github"] : ["list"],
  ],

  // Global test configuration
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: process.env.CI ? "on-first-retry" : "on",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Browser configurations
  projects: [
    // CI/CD - Solo Chromium para velocidad
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Desarrollo local - Múltiples navegadores
    ...(process.env.CI
      ? []
      : [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
          },
          {
            name: "mobile-chrome",
            use: { ...devices["Pixel 5"] },
          },
        ]),
  ],

  // Web server configuration
  webServer: {
    command: "pnpm --dir app run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Output directories
  outputDir: "test-results/",

  // Global setup/teardown
  globalSetup: require.resolve("./utils/global-setup.ts"),
  globalTeardown: require.resolve("./utils/global-teardown.ts"),
});
