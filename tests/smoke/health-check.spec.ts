/**
 * Smoke Tests - Health Check
 *
 * Fast critical path tests to verify the application is functioning.
 * Run before any other tests to catch deployment failures early.
 *
 * Tag: @smoke @critical
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../helpers/assertions"
import {
  buildSchoolUrl,
  buildUrl,
  getBaseUrl,
  getSchoolUrl,
  getTestEnv,
} from "../helpers/test-data"

const env = getTestEnv()
const baseUrl = getBaseUrl(env)
const schoolUrl = getSchoolUrl("demo", env)

test.describe("Smoke Tests - Application Health @smoke @critical", () => {
  test("SMOKE-001: Main domain responds", async ({ page }) => {
    const response = await page.goto(buildUrl("", "en", env))

    expect(response?.status()).toBeLessThan(500)
    await assertNoSSE(page)
  })

  test("SMOKE-002: Main domain login page loads", async ({ page }) => {
    const response = await page.goto(buildUrl("/login", "en", env))

    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test("SMOKE-003: School subdomain responds", async ({ page }) => {
    const response = await page.goto(buildSchoolUrl("demo", "", "en", env))

    expect(response?.status()).toBeLessThan(500)
    await assertNoSSE(page)
  })

  test("SMOKE-004: School subdomain login page loads", async ({ page }) => {
    const response = await page.goto(
      buildSchoolUrl("demo", "/login", "en", env)
    )

    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test("SMOKE-005: API auth providers endpoint responds", async ({ page }) => {
    const response = await page.goto(`${baseUrl}/api/auth/providers`)

    expect(response?.status()).toBeLessThan(500)
  })

  test("SMOKE-006: Arabic locale works", async ({ page }) => {
    const response = await page.goto(buildUrl("", "ar", env))

    expect(response?.status()).toBeLessThan(500)
    expect(page.url()).toMatch(/\/ar/)
  })
})

test.describe("Smoke Tests - Authentication @smoke", () => {
  test("SMOKE-007: Login form accepts input", async ({ page }) => {
    await page.goto(buildUrl("/login", "en", env))
    await page.waitForLoadState("domcontentloaded")

    // Wait for form to be interactive
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toBeEnabled()

    // Clear first, then fill with click to focus
    await emailInput.click()
    await emailInput.fill("test@test.com")

    // Wait for React state to update
    await expect(emailInput).toHaveValue("test@test.com", { timeout: 10000 })

    const passwordInput = page.locator('input[name="password"]')
    await passwordInput.click()
    await passwordInput.fill("password123")
    await expect(passwordInput).toHaveValue("password123", { timeout: 10000 })
  })

  test("SMOKE-008: Protected route redirects", async ({ page }) => {
    await page.goto(buildUrl("/dashboard", "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    // Should redirect to login
    expect(page.url()).toMatch(/\/login/)
  })
})

test.describe("Smoke Tests - Navigation @smoke", () => {
  test("SMOKE-009: Features page accessible", async ({ page }) => {
    const response = await page.goto(buildUrl("/features", "en", env))

    expect(response?.status()).toBeLessThan(400)
  })

  test("SMOKE-010: Pricing page accessible", async ({ page }) => {
    const response = await page.goto(buildUrl("/pricing", "en", env))

    expect(response?.status()).toBeLessThan(400)
  })

  test("SMOKE-011: Docs page accessible", async ({ page }) => {
    // Docs page can be slow due to MDX compilation
    const response = await page.goto(buildUrl("/docs", "en", env), {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    })

    expect(response?.status()).toBeLessThan(400)
  })

  test("SMOKE-012: School about page accessible", async ({ page }) => {
    const response = await page.goto(
      buildSchoolUrl("demo", "/about", "en", env)
    )

    expect(response?.status()).toBeLessThan(400)
  })
})

test.describe("Smoke Tests - Infrastructure @smoke @critical", () => {
  test("SMOKE-013: No server-side exceptions on landing", async ({ page }) => {
    await page.goto(buildUrl("", "en", env))
    await assertNoSSE(page)
  })

  test("SMOKE-014: No server-side exceptions on school home", async ({
    page,
  }) => {
    await page.goto(buildSchoolUrl("demo", "", "en", env))
    await assertNoSSE(page)
  })

  test("SMOKE-015: Static assets load (no 5xx)", async ({ page }) => {
    const failedAssets: string[] = []

    page.on("response", (response) => {
      if (response.status() >= 500) {
        failedAssets.push(`${response.status()}: ${response.url()}`)
      }
    })

    await page.goto(buildUrl("", "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    expect(failedAssets).toHaveLength(0)
  })
})
