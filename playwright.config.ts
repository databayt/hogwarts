import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright Configuration - Multi-Tenant Testing
 *
 * Supports:
 * - Local development (localhost:3000)
 * - Production testing (ed.databayt.org)
 * - Multiple projects for different test suites
 * - Tagged test filtering (@smoke, @rbac, @multi-tenant)
 *
 * Usage:
 *   All tests:     pnpm test:e2e
 *   Smoke only:    pnpm test:e2e --project=smoke
 *   RBAC only:     pnpm test:e2e --grep @rbac
 *   Production:    TEST_ENV=production pnpm test:e2e
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const isProduction = process.env.TEST_ENV === "production"
/* IMPORTANT: Always use port 3000 for local development, never switch ports */
const baseURL = isProduction
  ? "https://ed.databayt.org"
  : "http://localhost:3000"

export default defineConfig({
  testDir: "./tests",

  /* Match only .spec.ts files in e2e and smoke directories */
  testMatch: ["**/*.spec.ts"],

  /* Ignore old test files during migration */
  testIgnore: [
    "**/auth/helpers.ts",
    "**/exams/helpers.ts",
    "**/saas-marketing/*.ts",
    "**/saas-dashboard/*.ts",
    "**/school-marketing/*.ts",
    "**/school-dashboard/*.ts",
  ],

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
    ...(process.env.CI ? ([["github", {}]] as const) : []),
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

  /* Configure projects for different test suites */
  projects: [
    // ============================================
    // Smoke Tests (run first, fast critical path)
    // ============================================
    {
      name: "smoke",
      testDir: "./tests/smoke",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "http://localhost:3000",
      },
    },

    // ============================================
    // E2E Tests - Chromium (default)
    // ============================================
    {
      name: "chromium",
      testDir: "./tests/e2e",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "http://localhost:3000",
      },
    },

    // ============================================
    // E2E Tests - Firefox
    // ============================================
    {
      name: "firefox",
      testDir: "./tests/e2e",
      use: {
        ...devices["Desktop Firefox"],
        baseURL: "http://localhost:3000",
      },
    },

    // ============================================
    // E2E Tests - WebKit (Safari)
    // ============================================
    {
      name: "webkit",
      testDir: "./tests/e2e",
      use: {
        ...devices["Desktop Safari"],
        baseURL: "http://localhost:3000",
      },
    },

    // ============================================
    // Mobile Tests
    // ============================================
    {
      name: "mobile-chrome",
      testDir: "./tests/e2e",
      use: {
        ...devices["Pixel 5"],
        baseURL: "http://localhost:3000",
      },
    },
    {
      name: "mobile-safari",
      testDir: "./tests/e2e",
      use: {
        ...devices["iPhone 12"],
        baseURL: "http://localhost:3000",
      },
    },

    // ============================================
    // Production Tests
    // ============================================
    {
      name: "production-smoke",
      testDir: "./tests/smoke",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "https://ed.databayt.org",
      },
    },
    {
      name: "production-chromium",
      testDir: "./tests/e2e",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "https://ed.databayt.org",
      },
    },
  ],

  /* Run local dev server before starting tests (only for local) */
  /* IMPORTANT: Always use port 3000, never switch to another port */
  webServer: isProduction
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true, // Always reuse existing server - NEVER start on different port
        timeout: 120_000, // 2 minutes for server startup
        ignoreHTTPSErrors: true,
      },
})
