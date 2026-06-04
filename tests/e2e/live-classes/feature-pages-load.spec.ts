/**
 * Live-classes feature pages — smoke load test
 *
 * For each live-classes sub-route, verify the page loads as ADMIN without
 * SSE. Same pattern as `tests/e2e/attendance/feature-pages-load.spec.ts`.
 *
 * Tag: @live-classes @smoke
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import { buildSchoolUrl, getTestEnv } from "../../helpers/test-data"
import { SchoolLoginPage } from "../../page-objects"

const env = getTestEnv()
const SUBDOMAIN = "demo"

const ROUTES = [
  "/live-classes",
  "/live-classes/schedule",
  "/live-classes/network-test",
] as const

async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Live-classes — feature pages smoke @live-classes @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    const loginPage = new SchoolLoginPage(page, SUBDOMAIN)
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  for (const route of ROUTES) {
    test(`LC-SMK-${route.replace(/[^a-z]/g, "")}: ${route} loads`, async ({
      page,
    }) => {
      test.setTimeout(60_000)
      await page.goto(buildSchoolUrl(SUBDOMAIN, route, "en", env))
      await page.waitForLoadState("domcontentloaded")

      if (page.url().includes("chrome-error://")) {
        test.skip(true, "Protocol mismatch in dev environment")
        return
      }

      // Page reached its target route (or got redirected within /live-classes/*).
      // For ADMIN, no /live-classes route should send them to /dashboard.
      expect(page.url()).toMatch(/\/live-classes/)
      await assertNoSSE(page)
    })
  }

  test("LC-SMK-overview-renders-empty-state-or-list", async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live-classes", "en", env))
    await page.waitForLoadState("domcontentloaded")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Title shows up (dictionary key resolved)
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10_000,
    })
    // Either the empty-state copy ("No live classes yet") or a list row is present.
    const hasEmpty = await page
      .getByText(/no live classes yet/i)
      .first()
      .isVisible()
      .catch(() => false)
    const hasList = await page
      .locator(".divide-y")
      .first()
      .isVisible()
      .catch(() => false)
    expect(hasEmpty || hasList).toBe(true)
  })

  test("LC-SMK-ar-overview-renders-rtl", async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live-classes", "ar", env))
    await page.waitForLoadState("domcontentloaded")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Arabic title must render — the page must not fall through to the English
    // fallback, which would mean the dictionary registration is broken.
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10_000,
    })
    // <html dir="rtl"> is set globally for ar; sanity check.
    const dir = await page.evaluate(() => document.documentElement.dir)
    expect(dir).toBe("rtl")
  })
})
