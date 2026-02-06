/**
 * Epic 1: Entry Points - School Dashboard
 * Story 1.4: School Dashboard (Authenticated)
 *
 * Tests school dashboard accessibility for authenticated users.
 * Tag: @entry-points @multi-tenant @auth
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE, assertRedirectedToLogin } from "../../helpers/assertions"
import {
  buildSchoolUrl,
  getSchoolUrl,
  getTestEnv,
  SCHOOL_DASHBOARD_ROUTES,
  TIMEOUTS,
} from "../../helpers/test-data"
import { SchoolLoginPage } from "../../page-objects"
import {
  SchoolAttendancePage,
  SchoolClassesPage,
  SchoolDashboardPage,
  SchoolExamsPage,
  SchoolFinancePage,
  SchoolSettingsPage,
  SchoolStudentsPage,
  SchoolTeachersPage,
} from "../../page-objects/dashboard.page"

const env = getTestEnv()
const schoolUrl = getSchoolUrl("demo", env)

// Helper to clear auth state
async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

// Helper to login as admin on school subdomain
async function loginAsSchoolAdmin(page: import("@playwright/test").Page) {
  const loginPage = new SchoolLoginPage(page, "demo")
  await loginPage.goto()
  await loginPage.loginAs("admin")
}

test.describe("Story 1.4: School Dashboard Protected Routes @entry-points @auth", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("EP-037: Dashboard redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildSchoolUrl("demo", "/dashboard", "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("EP-038: Students page redirects unauthenticated", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/students", "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("EP-039: Teachers page redirects unauthenticated", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/teachers", "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("EP-040: Finance page redirects unauthenticated", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/finance", "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("EP-041: Settings page redirects unauthenticated", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/dashboard/settings", "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })
})

test.describe("Story 1.4: ADMIN Dashboard Access @entry-points @rbac", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginAsSchoolAdmin(page)

    // Skip if protocol mismatch
    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("EP-042: ADMIN can access school dashboard", async ({ page }) => {
    const dashboardPage = new SchoolDashboardPage(page, "demo")
    await dashboardPage.goto()

    expect(page.url()).toMatch(/\/dashboard/)
    expect(page.url()).toContain("demo")
    await assertNoSSE(page)
  })

  test("EP-043: ADMIN can access students page", async ({ page }) => {
    const studentsPage = new SchoolStudentsPage(page, "demo")
    await studentsPage.goto()

    expect(page.url()).toMatch(/\/students/)
    await assertNoSSE(page)
  })

  test("EP-044: ADMIN can access teachers page", async ({ page }) => {
    const teachersPage = new SchoolTeachersPage(page, "demo")
    await teachersPage.goto()

    expect(page.url()).toMatch(/\/teachers/)
    await assertNoSSE(page)
  })

  test("EP-045: ADMIN can access classes page", async ({ page }) => {
    const classesPage = new SchoolClassesPage(page, "demo")
    await classesPage.goto()

    expect(page.url()).toMatch(/\/classes/)
    await assertNoSSE(page)
  })

  test("EP-046: ADMIN can access finance page", async ({ page }) => {
    const financePage = new SchoolFinancePage(page, "demo")
    await financePage.goto()

    expect(page.url()).toMatch(/\/finance/)
    await assertNoSSE(page)
  })

  test("EP-047: ADMIN can access attendance page", async ({ page }) => {
    const attendancePage = new SchoolAttendancePage(page, "demo")
    await attendancePage.goto()

    expect(page.url()).toMatch(/\/attendance/)
    await assertNoSSE(page)
  })

  test("EP-048: ADMIN can access exams page", async ({ page }) => {
    const examsPage = new SchoolExamsPage(page, "demo")
    await examsPage.goto()

    expect(page.url()).toMatch(/\/exams/)
    await assertNoSSE(page)
  })

  test("EP-049: ADMIN can access settings page", async ({ page }) => {
    const settingsPage = new SchoolSettingsPage(page, "demo")
    await settingsPage.goto()

    expect(page.url()).not.toMatch(/\/login/)
    await assertNoSSE(page)
  })
})

test.describe("Story 1.4: Dashboard Sidebar & Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginAsSchoolAdmin(page)

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("EP-050: Dashboard has sidebar", async ({ page }) => {
    const dashboardPage = new SchoolDashboardPage(page, "demo")
    await dashboardPage.goto()

    const hasSidebar = await dashboardPage.hasSidebar()
    expect(hasSidebar).toBeTruthy()
  })

  test("EP-051: Dashboard has main content area", async ({ page }) => {
    const dashboardPage = new SchoolDashboardPage(page, "demo")
    await dashboardPage.goto()

    const hasMainContent = await dashboardPage.hasMainContent()
    expect(hasMainContent).toBeTruthy()
  })
})
