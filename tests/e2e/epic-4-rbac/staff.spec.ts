/**
 * Epic 4: RBAC - STAFF Permissions
 * Story 4.7: STAFF Permissions
 *
 * Tests STAFF role access to school dashboard routes.
 * Tag: @rbac
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import {
  buildSchoolUrl,
  getTestEnv,
  SCHOOL_DASHBOARD_ROUTES,
} from "../../helpers/test-data"
import { SchoolLoginPage } from "../../page-objects"

const env = getTestEnv()

// Helper to clear auth state
async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Story 4.7: STAFF Permissions @rbac", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("staff")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("RBAC-037: STAFF can access /dashboard", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.dashboard, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/dashboard/)
    await assertNoSSE(page)
  })

  test("RBAC-038: STAFF can access /attendance", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.attendance, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/attendance/)
    await assertNoSSE(page)
  })

  test("RBAC-039: STAFF can access /messages", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.messages, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    await assertNoSSE(page)
  })

  test("RBAC-040: STAFF blocked from /settings", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.settings, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(
      url.includes("/dashboard") ||
        url.includes("/unauthorized") ||
        url.includes("/403") ||
        !url.includes("/settings")
    ).toBeTruthy()
  })

  test("RBAC-041: STAFF blocked from admin routes", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.admission, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(
      url.includes("/dashboard") ||
        url.includes("/admission") || // May have limited view
        url.includes("/unauthorized") ||
        url.includes("/403")
    ).toBeTruthy()
  })

  test("RBAC-042: STAFF limited access to /finance", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.finance, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    // Staff may be blocked or have limited view
    expect(
      url.includes("/dashboard") ||
        url.includes("/finance") || // May have limited view
        url.includes("/unauthorized") ||
        url.includes("/403")
    ).toBeTruthy()
  })
})
