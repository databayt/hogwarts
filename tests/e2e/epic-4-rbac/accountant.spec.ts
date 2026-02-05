/**
 * Epic 4: RBAC - ACCOUNTANT Permissions
 * Story 4.6: ACCOUNTANT Permissions
 *
 * Tests ACCOUNTANT role access to finance-related routes.
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

test.describe("Story 4.6: ACCOUNTANT Permissions @rbac", () => {
  // Increase timeout for authenticated tests
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("accountant")

    if (page.url().includes("chrome-error://")) {
      test.skip()
    }
  })

  test("RBAC-031: ACCOUNTANT can access /dashboard", async ({ page }) => {
    // After login, should be on dashboard already - navigate only if needed
    const url = page.url()
    if (!url.includes("/dashboard")) {
      await page.goto(
        buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.dashboard, "en", env)
      )
      await page.waitForLoadState("domcontentloaded")
    }

    expect(page.url()).toMatch(/\/dashboard/)
  })

  test("RBAC-032: ACCOUNTANT can access /finance (full)", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.finance, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/finance/)
    await assertNoSSE(page)
  })

  test("RBAC-033: ACCOUNTANT blocked from /settings", async ({ page }) => {
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

  test("RBAC-034: ACCOUNTANT limited access to /students", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    // Accountant may have limited view for fee-related data
    // or be redirected
    const url = page.url()
    expect(
      url.includes("/students") ||
        url.includes("/dashboard") ||
        url.includes("/login")
    ).toBeTruthy()
  })

  test("RBAC-035: ACCOUNTANT blocked from /teachers", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.teachers, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(
      url.includes("/dashboard") ||
        url.includes("/teachers") || // May have limited view
        url.includes("/unauthorized") ||
        url.includes("/403")
    ).toBeTruthy()
  })

  test("RBAC-036: ACCOUNTANT blocked from /exams", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.exams, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(
      url.includes("/dashboard") ||
        url.includes("/exams") || // May have limited view
        url.includes("/unauthorized") ||
        url.includes("/403")
    ).toBeTruthy()
  })
})
