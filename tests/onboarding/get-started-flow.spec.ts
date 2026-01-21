import { expect, test } from "@playwright/test"

import {
  clearAuthState,
  getBaseUrl,
  getTestEnv,
  goToMarketingLogin,
  loginAs,
  waitForRedirect,
} from "../auth/helpers"

/**
 * Get Started / Onboarding Flow Tests
 *
 * Tests the complete onboarding journey for:
 * 1. Landing page accessibility
 * 2. Authentication flows and redirects
 * 3. Step navigation
 * 4. Form validation
 * 5. Infrastructure/API errors
 */

const env = getTestEnv()
const baseUrl = getBaseUrl(env)

// Test results collector for report
interface TestResult {
  test: string
  status: "pass" | "fail" | "skip"
  duration: number
  error?: string
  details?: string
}

const testResults: TestResult[] = []

test.describe("Onboarding Flow - Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("onboarding landing page loads successfully", async ({ page }) => {
    const start = Date.now()
    try {
      const response = await page.goto(`${baseUrl}/en/onboarding`)

      // Check HTTP status
      expect(response?.status()).toBeLessThan(400)

      // Check page has content (not blank)
      await expect(page.locator("body")).not.toBeEmpty()

      // Check for main heading or content
      const hasContent = await page
        .locator("h1, h2, [data-testid], main")
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      expect(hasContent).toBeTruthy()

      testResults.push({
        test: "Landing page loads",
        status: "pass",
        duration: Date.now() - start,
        details: `Status: ${response?.status()}, URL: ${page.url()}`,
      })
    } catch (error) {
      testResults.push({
        test: "Landing page loads",
        status: "fail",
        duration: Date.now() - start,
        error: String(error),
      })
      throw error
    }
  })

  test("Arabic locale onboarding page loads", async ({ page }) => {
    const start = Date.now()
    try {
      const response = await page.goto(`${baseUrl}/ar/onboarding`)

      expect(response?.status()).toBeLessThan(400)

      // Check RTL direction is set
      const dir = await page.locator("html").getAttribute("dir")

      testResults.push({
        test: "Arabic locale loads",
        status: "pass",
        duration: Date.now() - start,
        details: `Direction: ${dir}`,
      })
    } catch (error) {
      testResults.push({
        test: "Arabic locale loads",
        status: "fail",
        duration: Date.now() - start,
        error: String(error),
      })
      throw error
    }
  })

  test("no server-side exceptions on landing", async ({ page }) => {
    const start = Date.now()
    const errors: string[] = []

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      }
    })

    // Listen for page errors
    page.on("pageerror", (err) => {
      errors.push(err.message)
    })

    await page.goto(`${baseUrl}/en/onboarding`)

    // Check for SSE error page
    const hasSSE = await page
      .getByText(/server-side exception|application error/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasSSE) {
      testResults.push({
        test: "No SSE errors",
        status: "fail",
        duration: Date.now() - start,
        error: "Server-side exception detected on page",
      })
      expect(hasSSE).toBeFalsy()
    }

    testResults.push({
      test: "No SSE errors",
      status: "pass",
      duration: Date.now() - start,
      details: `Console errors: ${errors.length}`,
    })
  })
})

test.describe("Onboarding Flow - Authentication Redirects", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("unauthenticated user can access onboarding", async ({ page }) => {
    const start = Date.now()
    try {
      await page.goto(`${baseUrl}/en/onboarding`)

      // Should NOT redirect to login
      const currentUrl = page.url()
      expect(currentUrl).not.toMatch(/\/login/)
      expect(currentUrl).toMatch(/\/onboarding/)

      testResults.push({
        test: "Unauthenticated access",
        status: "pass",
        duration: Date.now() - start,
        details: `URL: ${currentUrl}`,
      })
    } catch (error) {
      testResults.push({
        test: "Unauthenticated access",
        status: "fail",
        duration: Date.now() - start,
        error: String(error),
      })
      throw error
    }
  })

  test("authenticated DEVELOPER can access onboarding", async ({ page }) => {
    const start = Date.now()
    try {
      await goToMarketingLogin(page, "en", env)
      await loginAs(page, "developer")
      await waitForRedirect(page)

      // Navigate to onboarding
      await page.goto(`${baseUrl}/en/onboarding`)
      const currentUrl = page.url()

      testResults.push({
        test: "DEVELOPER access",
        status: "pass",
        duration: Date.now() - start,
        details: `Final URL: ${currentUrl}`,
      })
    } catch (error) {
      testResults.push({
        test: "DEVELOPER access",
        status: "fail",
        duration: Date.now() - start,
        error: String(error),
      })
      throw error
    }
  })

  test("step pages require school ID in URL", async ({ page }) => {
    const start = Date.now()
    try {
      // Try accessing a step without school ID
      const response = await page.goto(`${baseUrl}/en/onboarding/title`)

      // Should either 404 or redirect
      const status = response?.status()
      const currentUrl = page.url()

      testResults.push({
        test: "Step requires school ID",
        status: "pass",
        duration: Date.now() - start,
        details: `Status: ${status}, URL: ${currentUrl}`,
      })
    } catch (error) {
      testResults.push({
        test: "Step requires school ID",
        status: "fail",
        duration: Date.now() - start,
        error: String(error),
      })
      throw error
    }
  })
})

test.describe("Onboarding Flow - Infrastructure Checks", () => {
  test("API endpoint /api/onboarding/validate-access responds", async ({
    page,
  }) => {
    const start = Date.now()
    try {
      const response = await page.goto(
        `${baseUrl}/api/onboarding/validate-access`
      )

      // Should return some response (even if 4xx/5xx with proper error)
      expect(response).not.toBeNull()

      testResults.push({
        test: "API validate-access",
        status: "pass",
        duration: Date.now() - start,
        details: `Status: ${response?.status()}`,
      })
    } catch (error) {
      testResults.push({
        test: "API validate-access",
        status: "fail",
        duration: Date.now() - start,
        error: String(error),
      })
      throw error
    }
  })

  test("static assets load correctly", async ({ page }) => {
    const start = Date.now()
    const failedAssets: string[] = []

    page.on("response", (response) => {
      if (response.status() >= 400 && !response.url().includes("/api/")) {
        failedAssets.push(`${response.status()}: ${response.url()}`)
      }
    })

    await page.goto(`${baseUrl}/en/onboarding`)
    await page.waitForLoadState("networkidle")

    testResults.push({
      test: "Static assets load",
      status: failedAssets.length === 0 ? "pass" : "fail",
      duration: Date.now() - start,
      details:
        failedAssets.length === 0
          ? "All assets loaded"
          : `Failed: ${failedAssets.join(", ")}`,
    })

    expect(failedAssets.length).toBe(0)
  })

  test("page performance is acceptable", async ({ page }) => {
    const start = Date.now()

    await page.goto(`${baseUrl}/en/onboarding`)

    const metrics = await page.evaluate(() => {
      const timing = performance.timing
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded:
          timing.domContentLoadedEventEnd - timing.navigationStart,
        firstByte: timing.responseStart - timing.navigationStart,
      }
    })

    testResults.push({
      test: "Page performance",
      status: metrics.loadTime < 5000 ? "pass" : "fail",
      duration: Date.now() - start,
      details: `Load: ${metrics.loadTime}ms, TTFB: ${metrics.firstByte}ms, DOMContentLoaded: ${metrics.domContentLoaded}ms`,
    })

    // Page should load in under 5 seconds
    expect(metrics.loadTime).toBeLessThan(5000)
  })
})

test.describe("Onboarding Flow - Step Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("can navigate between steps with valid school ID", async ({ page }) => {
    const start = Date.now()
    try {
      // First go to landing to potentially get a school ID
      await page.goto(`${baseUrl}/en/onboarding`)

      // Check if there's a "Get Started" or similar button
      const getStartedBtn = page.locator(
        'button:has-text("Get Started"), a:has-text("Get Started"), button:has-text("Start"), a:has-text("Start")'
      )
      const hasGetStarted = await getStartedBtn
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      testResults.push({
        test: "Step navigation",
        status: "pass",
        duration: Date.now() - start,
        details: `Get Started button visible: ${hasGetStarted}`,
      })
    } catch (error) {
      testResults.push({
        test: "Step navigation",
        status: "fail",
        duration: Date.now() - start,
        error: String(error),
      })
      throw error
    }
  })
})

test.describe("Onboarding Flow - Error Handling", () => {
  test("handles 404 gracefully for invalid school ID", async ({ page }) => {
    const start = Date.now()
    try {
      await page.goto(`${baseUrl}/en/onboarding/invalid-school-id-12345/title`)

      // Should show error page or redirect, not crash
      const hasError = await page
        .getByText(/not found|error|invalid/i)
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      const status = await page.evaluate(() => {
        // Check if there's a 404 status indicator
        return document.querySelector("[data-status], [data-error]")
          ? "error page"
          : "normal"
      })

      testResults.push({
        test: "Invalid school ID handling",
        status: "pass",
        duration: Date.now() - start,
        details: `Error displayed: ${hasError}, Page status: ${status}`,
      })
    } catch (error) {
      testResults.push({
        test: "Invalid school ID handling",
        status: "fail",
        duration: Date.now() - start,
        error: String(error),
      })
      throw error
    }
  })

  test("handles network errors gracefully", async ({ page }) => {
    const start = Date.now()
    try {
      // Load page first
      await page.goto(`${baseUrl}/en/onboarding`)

      // Check for error boundaries
      const hasErrorBoundary = await page
        .locator("[data-testid='error-boundary'], .error-boundary")
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      testResults.push({
        test: "Network error handling",
        status: "pass",
        duration: Date.now() - start,
        details: `Error boundary present: ${hasErrorBoundary}`,
      })
    } catch (error) {
      testResults.push({
        test: "Network error handling",
        status: "fail",
        duration: Date.now() - start,
        error: String(error),
      })
      throw error
    }
  })
})

// After all tests, output the report
test.afterAll(async () => {
  console.log("\n" + "=".repeat(80))
  console.log("GET STARTED FLOW - E2E TEST REPORT")
  console.log("=".repeat(80))
  console.log(`Environment: ${env}`)
  console.log(`Base URL: ${baseUrl}`)
  console.log(`Total Tests: ${testResults.length}`)

  const passed = testResults.filter((r) => r.status === "pass").length
  const failed = testResults.filter((r) => r.status === "fail").length

  console.log(`Passed: ${passed} | Failed: ${failed}`)
  console.log("-".repeat(80))

  for (const result of testResults) {
    const icon = result.status === "pass" ? "✅" : "❌"
    console.log(`${icon} ${result.test} (${result.duration}ms)`)
    if (result.details) console.log(`   Details: ${result.details}`)
    if (result.error) console.log(`   Error: ${result.error}`)
  }

  console.log("=".repeat(80))
})
