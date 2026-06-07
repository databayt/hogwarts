import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright Configuration - Multi-Tenant Testing
 *
 * Supports:
 * - Local development (localhost:3000)
 * - Production testing (ed.databayt.org)
 * - Multiple projects for different tests suites
 * - Tagged tests filtering (@smoke, @rbac, @multi-tenant)
 *
 * Usage:
 *   All tests:     pnpm tests:e2e
 *   Smoke only:    pnpm tests:e2e --project=smoke
 *   RBAC only:     pnpm tests:e2e --grep @rbac
 *   Production:    TEST_ENV=production pnpm tests:e2e
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const isProduction = process.env.TEST_ENV === "production"
/* IMPORTANT: Always use port 3000 for local development, never switch ports */
const baseURL = isProduction
  ? "https://ed.databayt.org"
  : "http://localhost:3000"

/* Cross-cutting suites that run under their own dedicated projects (smoke, lifecycle).
   Browser projects exclude these so each spec runs in exactly one project. */
const DEDICATED = ["**/e2e/smoke/**", "**/e2e/lifecycle/**"]

export default defineConfig({
  /* Tests are URL-mirrored under src/tests/<category>/; e2e specs are *.spec.ts
     (next to *.test.ts unit tests), cross-cutting ones under src/tests/e2e/. */
  testDir: "./src/tests",

  /* Only *.spec.ts are Playwright e2e; *.test.ts (Vitest) and support .ts are ignored. */
  testMatch: ["**/*.spec.ts"],

  /* Parallel execution for faster tests runs */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left tests.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only, more retries for production (network flakiness) */
  retries: process.env.CI ? 2 : isProduction ? 1 : 0,

  /* Workers: limited locally (Turbopack dev server can't handle many concurrent requests) */
  workers: process.env.CI ? 1 : 2,

  /* Reporter configuration */
  reporter: [
    ["html", { open: "never" }],
    ["list"], // Console output for CI
    ...(process.env.CI ? ([["github", {}]] as const) : []),
  ],

  /* Global timeout for each tests (longer for production network latency) */
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

  /* Configure projects for different tests suites */
  projects: [
    // ============================================
    // Auth Setup (runs once, saves storage state)
    // ============================================
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      testDir: "./src/tests",
      fullyParallel: false,
      use: {
        navigationTimeout: 30_000,
      },
    },

    // ============================================
    // Smoke Tests (run first, fast critical path)
    // ============================================
    {
      name: "smoke",
      testDir: "./src/tests/e2e/smoke",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "http://localhost:3000",
      },
    },

    // ============================================
    // E2E Tests - Chromium (default, depends on auth setup)
    // Runs all URL-mirrored specs except the dedicated smoke/lifecycle suites.
    // ============================================
    {
      name: "chromium",
      testDir: "./src/tests",
      testIgnore: DEDICATED,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "http://localhost:3000",
        storageState: "playwright/.auth/admin.json",
      },
    },

    // ============================================
    // E2E Tests - Firefox
    // ============================================
    {
      name: "firefox",
      testDir: "./src/tests",
      testIgnore: DEDICATED,
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
      testDir: "./src/tests",
      testIgnore: DEDICATED,
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
      testDir: "./src/tests",
      testIgnore: DEDICATED,
      use: {
        ...devices["Pixel 5"],
        baseURL: "http://localhost:3000",
      },
    },
    {
      name: "mobile-safari",
      testDir: "./src/tests",
      testIgnore: DEDICATED,
      use: {
        ...devices["iPhone 12"],
        baseURL: "http://localhost:3000",
      },
    },

    // ============================================
    // Lifecycle Tests (full school flow, sequential)
    // ============================================
    {
      name: "lifecycle",
      testDir: "./src/tests/e2e/lifecycle",
      fullyParallel: false,
      workers: 1,
      timeout: 300_000,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "http://localhost:3000",
      },
    },

    // ============================================
    // Production Tests
    // ============================================
    {
      name: "production-smoke",
      testDir: "./src/tests/e2e/smoke",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: "https://ed.databayt.org",
      },
    },
    {
      name: "production-chromium",
      testDir: "./src/tests",
      testIgnore: DEDICATED,
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
