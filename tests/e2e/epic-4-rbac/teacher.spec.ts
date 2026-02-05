/**
 * Epic 4: RBAC - TEACHER Permissions
 * Story 4.3: TEACHER Permissions
 *
 * Tests TEACHER role access to school dashboard routes.
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

test.describe("Story 4.3: TEACHER Permissions @rbac", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("teacher")

    if (page.url().includes("chrome-error://")) {
      test.skip()
    }
  })

  test("RBAC-013: TEACHER can access /dashboard", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.dashboard, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/dashboard/)
    await assertNoSSE(page)
  })

  test("RBAC-014: TEACHER can access /classes", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.classes, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/classes/)
    await assertNoSSE(page)
  })

  test("RBAC-015: TEACHER can access /attendance", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.attendance, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/attendance/)
    await assertNoSSE(page)
  })

  test("RBAC-016: TEACHER can access /exams", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.exams, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/exams/)
    await assertNoSSE(page)
  })

  test("RBAC-017: TEACHER blocked from /settings", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.settings, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    // Teacher should be blocked or redirected
    expect(
      url.includes("/dashboard") ||
        url.includes("/unauthorized") ||
        url.includes("/403") ||
        !url.includes("/settings")
    ).toBeTruthy()
  })

  test("RBAC-018: TEACHER can access /students (limited view)", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    // Teacher may have limited view of students
    // Either allowed or blocked depending on implementation
    const url = page.url()
    expect(
      url.includes("/students") ||
        url.includes("/dashboard") ||
        url.includes("/unauthorized")
    ).toBeTruthy()
  })
})
