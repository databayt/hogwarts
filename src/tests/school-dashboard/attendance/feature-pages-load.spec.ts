/**
 * Attendance feature pages — smoke load test
 *
 * For each attendance sub-route, verify the page loads as ADMIN without SSE.
 * Catches the most common regression: page.tsx imports a broken component.
 *
 * Tag: @attendance @smoke
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../e2e/_support/helpers/assertions"
import {
  buildSchoolUrl,
  getTestEnv,
} from "../../e2e/_support/helpers/test-data"
import { LoginPage } from "../../e2e/_support/page-objects"

const env = getTestEnv()
const SUBDOMAIN = "demo"

const ROUTES = [
  "/attendance",
  "/attendance/manual",
  "/attendance/qr-code",
  "/attendance/excuses",
  "/attendance/early-warning",
  "/attendance/interventions",
  "/attendance/analytics",
  "/attendance/reports",
  "/attendance/bulk-upload",
  "/attendance/letters",
  "/attendance/hall-pass",
  "/attendance/geo",
  "/attendance/barcode",
  "/attendance/gamification",
  "/attendance/intentions",
  "/attendance/recent",
  "/attendance/settings",
] as const

async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Attendance — Feature Pages Smoke @attendance @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  for (const route of ROUTES) {
    test(`ATT-SMK-${route.replace(/[^a-z]/g, "")}: ${route} loads`, async ({
      page,
    }) => {
      test.setTimeout(60_000)

      const response = await page.goto(
        buildSchoolUrl(SUBDOMAIN, route, "en", env)
      )
      await page.waitForLoadState("domcontentloaded")
      await assertNoSSE(page)

      // Either 200 or graceful 404 — but never a crash
      const status = response?.status() ?? 200
      expect(status).toBeLessThan(500)
    })
  }
})
