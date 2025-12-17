import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright Configuration - Optimized for Headless Mode
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",

  /* Parallel execution for faster test runs */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Workers: Use all available cores locally, single worker on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter configuration */
  reporter: [
    ["html", { open: "never" }],
    ["list"], // Console output for CI
  ],

  /* Global timeout for each test */
  timeout: 30_000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 5_000,
  },

  /* Shared settings for all projects */
  use: {
    /* Base URL for HTTPS localhost */
    baseURL: "https://localhost:3000",

    /* Ignore HTTPS errors for self-signed certificates */
    ignoreHTTPSErrors: true,

    /* Headless mode (default: true) */
    headless: true,

    /* Viewport for consistent screenshots */
    viewport: { width: 1280, height: 720 },

    /* Collect trace when retrying failed tests */
    trace: "on-first-retry",

    /* Screenshot on failure for debugging */
    screenshot: "only-on-failure",

    /* Video on failure (first retry) */
    video: "on-first-retry",

    /* Action timeout */
    actionTimeout: 10_000,

    /* Navigation timeout */
    navigationTimeout: 15_000,

    /* GPU acceleration for faster headless execution */
    launchOptions: {
      args: [
        "--use-gl=egl", // GPU hardware acceleration (30% faster)
        "--disable-dev-shm-usage", // Avoid /dev/shm issues in Docker/CI
        "--no-sandbox", // Required for some CI environments
        "--disable-setuid-sandbox",
        "--disable-web-security", // Allow cross-origin for local testing
      ],
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium", // Use new headless mode
      },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Mobile viewports */
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: "pnpm dev:https",
    url: "https://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // 2 minutes for server startup
    ignoreHTTPSErrors: true,
  },
})
