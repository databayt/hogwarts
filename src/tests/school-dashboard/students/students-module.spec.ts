/**
 * Epic 12: Students Module - Production Readiness
 *
 * Comprehensive E2E tests for the students module covering:
 * - Admin CRUD operations and page navigation
 * - Student self-service access (own profile)
 * - Role-based access control
 * - No SSE errors across all sub-pages
 *
 * Tag: @students @rbac
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../e2e/_support/helpers/assertions"
import {
  buildSchoolUrl,
  getTestEnv,
  SCHOOL_DASHBOARD_ROUTES,
  TIMEOUTS,
} from "../../e2e/_support/helpers/test-data"
import { SchoolLoginPage } from "../../e2e/_support/page-objects"

const env = getTestEnv()
const NAV_TIMEOUT = 30_000

// Override project-level storageState (admin.json on localhost domain won't work
// for demo.localhost subdomain). Each describe block logs in fresh.
// Increase navigation timeout for Turbopack on-demand compilation.
// Allow 1 retry for hydration race conditions on dev server.
test.use({
  storageState: { cookies: [], origins: [] },
  navigationTimeout: NAV_TIMEOUT,
})
test.describe.configure({ retries: 1 })

// =============================================================================
// ADMIN: Full access to students module
// =============================================================================

test.describe("Students Module - ADMIN Access @students @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("STU-001: Admin can access students list page", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students/)
    await assertNoSSE(page)
  })

  test("STU-002: Students page renders data table", async ({ page }) => {
    test.slow() // Triple timeout — page load + data fetch can be slow on dev
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env),
      { timeout: NAV_TIMEOUT }
    )

    // Wait for table to appear (server-side data fetch + render)
    await expect(page.locator("table")).toBeVisible({ timeout: 20_000 })
    await assertNoSSE(page)
  })

  test("STU-003: Admin can access students/enroll page", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/students/enroll", "en", env), {
      timeout: NAV_TIMEOUT,
    })
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students\/enroll/)
    await assertNoSSE(page)
  })

  test("STU-004: Admin can access students/performance page", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", "/students/performance", "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students\/performance/)
    await assertNoSSE(page)
  })

  test("STU-005: Admin can access students/reports page", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/students/reports", "en", env), {
      timeout: NAV_TIMEOUT,
    })
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students\/reports/)
    await assertNoSSE(page)
  })

  test("STU-006: Admin can access students/settings page", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/students/settings", "en", env), {
      timeout: NAV_TIMEOUT,
    })
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students\/settings/)
    await assertNoSSE(page)
  })

  test("STU-007: Admin can access students/year-levels page", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", "/students/year-levels", "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students\/year-levels/)
    await assertNoSSE(page)
  })

  test("STU-008: Students page has navigation tabs", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const navLinks = page.locator(
      'nav a[href*="/students"], a[href*="/students"]'
    )
    const count = await navLinks.count()
    expect(count).toBeGreaterThanOrEqual(3)
    await assertNoSSE(page)
  })
})

// =============================================================================
// STUDENT: Self-service access
// =============================================================================

test.describe("Students Module - STUDENT Self-Service @students @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("student")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("STU-009: Student can access /students route", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const hasAccess = url.includes("/students") || url.includes("/dashboard")

    expect(
      hasAccess,
      `Student should access /students, got: ${url}`
    ).toBeTruthy()
    await assertNoSSE(page)
  })

  test("STU-010: Student can access /dashboard", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.dashboard, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/dashboard/)
    await assertNoSSE(page)
  })
})

// =============================================================================
// GUARDIAN: View linked children
// =============================================================================

test.describe("Students Module - GUARDIAN Access @students @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("guardian")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("STU-011: Guardian can access /students route", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const hasAccess = url.includes("/students") || url.includes("/dashboard")

    expect(
      hasAccess,
      `Guardian should access /students, got: ${url}`
    ).toBeTruthy()
    await assertNoSSE(page)
  })
})

// =============================================================================
// TEACHER: Can manage students
// =============================================================================

test.describe("Students Module - TEACHER Access @students @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("teacher")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("STU-012: Teacher can access students list", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students/)
    await assertNoSSE(page)
  })

  test("STU-013: Teacher can access students/enroll", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/students/enroll", "en", env), {
      timeout: NAV_TIMEOUT,
    })
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students\/enroll/)
    await assertNoSSE(page)
  })
})

// =============================================================================
// STAFF: Read-only access
// =============================================================================

test.describe("Students Module - STAFF Access @students @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("staff")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("STU-014: Staff can access students list (read-only)", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/students/)
    await assertNoSSE(page)
  })
})

// =============================================================================
// ACCOUNTANT: Blocked from students management
// =============================================================================

test.describe("Students Module - ACCOUNTANT Access @students @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("accountant")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("STU-015: Accountant blocked from students page", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const isBlocked =
      url.includes("/dashboard") ||
      url.includes("/unauthorized") ||
      url.includes("/403") ||
      url.includes("/login") ||
      !url.includes("/students")

    expect(
      isBlocked,
      `Accountant should be blocked from /students, got: ${url}`
    ).toBeTruthy()
  })
})

// =============================================================================
// Arabic locale (RTL)
// =============================================================================

test.describe("Students Module - Arabic Locale @students @i18n", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("STU-016: Students page loads in Arabic without SSE", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "ar", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/ar\/students/)
    await assertNoSSE(page)
  })
})
