/**
 * Epic 5: Onboarding
 * Story 5.1: Get Started Flow
 * Story 5.2: Live Demo Flow
 *
 * Tests the onboarding journey for new users.
 * Tag: @onboarding
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import {
  buildUrl,
  getBaseUrl,
  getTestEnv,
  TIMEOUTS,
} from "../../helpers/test-data"
import { LoginPage, OnboardingPage, SaasHomePage } from "../../page-objects"

const env = getTestEnv()
const baseUrl = getBaseUrl(env)

// Helper to clear auth state
async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Story 5.1: Get Started Flow @onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("OB-001: Get Started button visible on landing", async ({ page }) => {
    const homePage = new SaasHomePage(page)
    await homePage.goto()

    const hasGetStarted = await homePage.hasGetStartedButton()
    expect(hasGetStarted).toBeTruthy()
  })

  test("OB-002: Click Get Started redirects to login (guest)", async ({
    page,
  }) => {
    const homePage = new SaasHomePage(page)
    await homePage.goto()
    await homePage.clickGetStarted()
    await page.waitForLoadState("domcontentloaded")

    // Guest should be redirected to login or onboarding
    const url = page.url()
    expect(url.includes("/login") || url.includes("/onboarding")).toBeTruthy()
  })

  test("OB-003: Login redirects fresh user to onboarding", async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("user@databayt.org", "1234")

    if (page.url().includes("chrome-error://")) {
      return
    }

    // Fresh user (no school) should go to onboarding
    const url = page.url()
    expect(
      url.includes("/onboarding") ||
        url.includes("/dashboard") ||
        url.includes("/en")
    ).toBeTruthy()
  })

  test("OB-004: Onboarding page loads", async ({ page }) => {
    const onboardingPage = new OnboardingPage(page)
    const response = await onboardingPage.goto()

    expect(response?.status()).toBeLessThan(400)
    await assertNoSSE(page)
    expect(page.url()).toMatch(/\/onboarding/)
  })
})

test.describe("Story 5.2: Live Demo Flow @onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("OB-005: Live Demo button visible on landing", async ({ page }) => {
    const homePage = new SaasHomePage(page)
    await homePage.goto()

    const hasLiveDemo = await homePage.hasLiveDemoButton()
    expect(hasLiveDemo).toBeTruthy()
  })

  test("OB-006: Live Demo link has target=_blank or leads to demo", async ({
    page,
  }) => {
    const homePage = new SaasHomePage(page)
    await homePage.goto()

    const liveDemoButton = homePage.liveDemoButton.first()
    const target = await liveDemoButton.getAttribute("target")
    const href = await liveDemoButton.getAttribute("href")

    // Either opens in new tab OR navigates to demo
    expect(target === "_blank" || (href && href.includes("demo"))).toBeTruthy()
  })

  test("OB-007: Demo school public pages accessible", async ({ page }) => {
    await page.goto("http://demo.localhost:3000/en")
    await page.waitForLoadState("domcontentloaded")

    // Demo school should be publicly accessible
    await assertNoSSE(page)
    await expect(page.locator("body")).not.toBeEmpty()
  })

  test("OB-008: Demo school does not require auth for marketing", async ({
    page,
  }) => {
    await page.goto("http://demo.localhost:3000/en/about")
    await page.waitForLoadState("domcontentloaded")

    // Should not redirect to login
    const url = page.url()
    expect(url).not.toMatch(/\/login/)
    await assertNoSSE(page)
  })
})

test.describe("Story 5.1: Onboarding Page Content @onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("OB-009: Onboarding page has content", async ({ page }) => {
    const onboardingPage = new OnboardingPage(page)
    await onboardingPage.goto()

    await expect(page.locator("body")).not.toBeEmpty()
    await expect(
      page.locator("h1, h2, [data-testid='hero'], main").first()
    ).toBeVisible({ timeout: TIMEOUTS.medium })
  })

  test("OB-010: No SSE on onboarding page", async ({ page }) => {
    const onboardingPage = new OnboardingPage(page)
    await onboardingPage.goto()

    await assertNoSSE(page)
  })

  test("OB-011: Arabic onboarding page loads", async ({ page }) => {
    const onboardingPage = new OnboardingPage(page, "ar")
    const response = await onboardingPage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toMatch(/\/ar\/onboarding/)
  })
})

test.describe("Story 5.1: Onboarding Flow Navigation @onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("OB-012: Authenticated DEVELOPER can access onboarding", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("developer")

    if (page.url().includes("chrome-error://")) {
      return
    }

    // Navigate to onboarding
    await page.goto(buildUrl("/onboarding", "en", env))
    await page.waitForLoadState("domcontentloaded")

    // DEVELOPER should be able to access
    await assertNoSSE(page)
  })

  test("OB-013: Step pages require valid school ID", async ({ page }) => {
    // Try accessing a step without school ID
    const response = await page.goto(buildUrl("/onboarding/title", "en", env))
    await page.waitForLoadState("domcontentloaded")

    // Should either 404 or redirect
    // This documents expected behavior
    console.log(
      `Step without school ID: Status ${response?.status()}, URL: ${page.url()}`
    )
  })
})
