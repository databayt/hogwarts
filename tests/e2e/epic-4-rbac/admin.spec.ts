/**
 * Epic 4: RBAC - ADMIN Permissions
 * Story 4.2: ADMIN Permissions
 *
 * Tests ADMIN role access to school dashboard routes.
 * Tag: @rbac
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import {
  buildSchoolUrl,
  buildUrl,
  getTestEnv,
  SCHOOL_DASHBOARD_ROUTES,
  TIMEOUTS,
} from "../../helpers/test-data"
import { SchoolLoginPage } from "../../page-objects"

const env = getTestEnv()

// Helper to clear auth state
async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Story 4.2: ADMIN Permissions @rbac", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("RBAC-007: ADMIN can access /dashboard (school)", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.dashboard, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/dashboard/)
    expect(page.url()).toContain("demo")
    await assertNoSSE(page)
  })

  test("RBAC-008: ADMIN can access /students", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students/)
    await assertNoSSE(page)
  })

  test("RBAC-009: ADMIN can access /teachers", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.teachers, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/teachers/)
    await assertNoSSE(page)
  })

  test("RBAC-010: ADMIN can access /classes", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.classes, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/classes/)
    await assertNoSSE(page)
  })

  test("RBAC-011: ADMIN can access /finance", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.finance, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/finance/)
    await assertNoSSE(page)
  })

  test("RBAC-012: ADMIN cannot access SaaS dashboard (main)", async ({
    page,
  }) => {
    await page.goto(buildUrl("/dashboard", "en", env), {
      timeout: TIMEOUTS.long,
    })
    await page.waitForLoadState("domcontentloaded")

    // ADMIN should be blocked from SaaS dashboard
    const url = page.url()
    expect(
      url.includes("/onboarding") ||
        url.includes("demo") ||
        !url.includes("localhost:3000/en/dashboard") ||
        url.includes("/login")
    ).toBeTruthy()
  })
})
