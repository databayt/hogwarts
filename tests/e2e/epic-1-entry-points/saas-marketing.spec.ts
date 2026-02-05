/**
 * Epic 1: Entry Points - SaaS Marketing
 * Story 1.1: SaaS Marketing Public Access
 *
 * Tests public accessibility of main domain marketing pages.
 * Tag: @smoke @entry-points
 */

import { expect, test } from "@playwright/test"

import {
  assertLtrDirection,
  assertNoSSE,
  assertRtlDirection,
} from "../../helpers/assertions"
import {
  buildUrl,
  getBaseUrl,
  getTestEnv,
  SAAS_MARKETING_ROUTES,
} from "../../helpers/test-data"
import {
  SaasBlogPage,
  SaasDocsPage,
  SaasFeaturesPage,
  SaasHomePage,
  SaasPricingPage,
} from "../../page-objects"

const env = getTestEnv()
const baseUrl = getBaseUrl(env)

test.describe("Story 1.1: SaaS Marketing Public Access @smoke @entry-points", () => {
  test("EP-001: Landing page loads", async ({ page }) => {
    const homePage = new SaasHomePage(page)
    const response = await homePage.goto()

    expect(response?.status()).toBeLessThan(400)
    await assertNoSSE(page)
    await expect(page.locator("body")).not.toBeEmpty()
  })

  test("EP-002: Features page loads", async ({ page }) => {
    const featuresPage = new SaasFeaturesPage(page)
    const response = await featuresPage.goto()

    expect(response?.status()).toBeLessThan(400)
    await assertNoSSE(page)
    expect(page.url()).toMatch(/\/features/)
  })

  test("EP-003: Pricing page loads", async ({ page }) => {
    const pricingPage = new SaasPricingPage(page)
    const response = await pricingPage.goto()

    expect(response?.status()).toBeLessThan(400)
    await assertNoSSE(page)
    expect(page.url()).toMatch(/\/pricing/)
  })

  test("EP-004: Docs page loads", async ({ page }) => {
    const docsPage = new SaasDocsPage(page)
    const response = await docsPage.goto()

    expect(response?.status()).toBeLessThan(400)
    await assertNoSSE(page)
    expect(page.url()).toMatch(/\/docs/)
  })

  test("EP-005: Blog page loads", async ({ page }) => {
    const blogPage = new SaasBlogPage(page)
    const response = await blogPage.goto()

    expect(response?.status()).toBeLessThan(400)
    await assertNoSSE(page)
    expect(page.url()).toMatch(/\/blog/)
  })

  test("EP-006: Arabic locale works with RTL", async ({ page }) => {
    const homePage = new SaasHomePage(page, "ar")
    const response = await homePage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toMatch(/\/ar/)
    await assertRtlDirection(page)
  })
})

test.describe("Story 1.1: Additional Marketing Tests", () => {
  test("EP-007: English locale has LTR direction", async ({ page }) => {
    const homePage = new SaasHomePage(page, "en")
    await homePage.goto()

    expect(page.url()).toMatch(/\/en/)
    await assertLtrDirection(page)
  })

  test("EP-008: Login page accessible from marketing", async ({ page }) => {
    await page.goto(buildUrl("/login", "en", env))

    expect(page.url()).toMatch(/\/login/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test("EP-009: Join page accessible", async ({ page }) => {
    await page.goto(buildUrl("/join", "en", env))

    expect(page.url()).toMatch(/\/join/)
    await assertNoSSE(page)
  })

  test("EP-010: Landing has Get Started button", async ({ page }) => {
    const homePage = new SaasHomePage(page)
    await homePage.goto()

    const hasGetStarted = await homePage.hasGetStartedButton()
    expect(hasGetStarted).toBeTruthy()
  })

  test("EP-011: Landing has Live Demo button", async ({ page }) => {
    const homePage = new SaasHomePage(page)
    await homePage.goto()

    const hasLiveDemo = await homePage.hasLiveDemoButton()
    expect(hasLiveDemo).toBeTruthy()
  })

  test("EP-012: No console errors on landing page", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      }
    })

    const homePage = new SaasHomePage(page)
    await homePage.goto()
    await page.waitForLoadState("networkidle")

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") && !e.includes("404") && !e.includes("net::ERR")
    )

    expect(criticalErrors).toHaveLength(0)
  })
})
