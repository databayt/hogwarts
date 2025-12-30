import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright Configuration - Multi-Environment Testing
 * Supports both local development and production testing
 *
 * Usage:
 *   Local:       pnpm test:e2e (default)
 *   Production:  TEST_ENV=production pnpm test:e2e --project=production-chromium
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const isProduction = process.env.TEST_ENV === "production"
const baseURL = isProduction
  ? "https://ed.databayt.org"
  : "https://localhost:3000"

export default defineConfig({
  testDir: "./tests",

  /* Parallel execution for faster test runs */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only, more retries for production (network flakiness) */
  retries: process.env.CI ? 2 : isProduction ? 1 : 0,

  /* Workers: Use all available cores locally, single worker on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter configuration */
  reporter: [
    ["html", { open: "never" }],
    ["list"], // Console output for CI
  ],

  /* Global timeout for each test (longer for production network latency) */
  timeout: isProduction ? 60_000 : 30_000,

  /* Expect timeout for assertions */
  expect: {
    timeout: isProduction ? 10_000 : 5_000,
  },

  /* Shared settings for all projects */
  use: {
    /* Base URL */
    baseURL,

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

    /* Action timeout (longer for production) */
    actionTimeout: isProduction ? 15_000 : 10_000,

    /* Navigation timeout (longer for production) */
    navigationTimeout: isProduction ? 30_000 : 15_000,

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
    // ============================================
    // Local Development Testing (default)
    // ============================================
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "https://localhost:3000",
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        baseURL: "https://localhost:3000",
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        baseURL: "https://localhost:3000",
      },
    },

    /* Mobile viewports - Local */
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        baseURL: "https://localhost:3000",
      },
    },
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 12"],
        baseURL: "https://localhost:3000",
      },
    },

    // ============================================
    // Production Testing
    // Run with: TEST_ENV=production pnpm test:e2e --project=production-chromium
    // ============================================
    {
      name: "production-chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "https://ed.databayt.org",
      },
    },
    {
      name: "production-firefox",
      use: {
        ...devices["Desktop Firefox"],
        baseURL: "https://ed.databayt.org",
      },
    },
    {
      name: "production-webkit",
      use: {
        ...devices["Desktop Safari"],
        baseURL: "https://ed.databayt.org",
      },
    },
    {
      name: "production-mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        baseURL: "https://ed.databayt.org",
      },
    },
  ],

  /* Run local dev server before starting tests (only for local) */
  webServer: isProduction
    ? undefined
    : {
        command: "pnpm dev:https",
        url: "https://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000, // 2 minutes for server startup
        ignoreHTTPSErrors: true,
      },
})
