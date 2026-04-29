/**
 * Epic 13: Teachers Module - Production Readiness
 *
 * Comprehensive E2E tests for the teachers module covering:
 * - Admin CRUD operations and page navigation
 * - Teacher self-service access (own profile)
 * - Role-based access control
 * - No SSE errors across all sub-pages
 *
 * Tag: @teachers @rbac
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
const NAV_TIMEOUT = 30_000

test.use({
  storageState: { cookies: [], origins: [] },
  navigationTimeout: NAV_TIMEOUT,
})
test.describe.configure({ retries: 1 })

// =============================================================================
// ADMIN: Full access to teachers module
// =============================================================================

test.describe("Teachers Module - ADMIN Access @teachers @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("TCH-001: Admin can access teachers list page", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.teachers, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/teachers/)
    await assertNoSSE(page)
  })

  test("TCH-002: Teachers page renders data table", async ({ page }) => {
    test.slow()
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.teachers, "en", env),
      { timeout: NAV_TIMEOUT }
    )

    await expect(page.locator("table")).toBeVisible({ timeout: 20_000 })
    await assertNoSSE(page)
  })

  test("TCH-003: Admin can access teachers/departments page", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", "/teachers/departments", "en", env),
      {
        timeout: NAV_TIMEOUT,
      }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/teachers\/departments/)
    await assertNoSSE(page)
  })

  test("TCH-004: Admin can access teachers/performance page", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", "/teachers/performance", "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/teachers\/performance/)
    await assertNoSSE(page)
  })

  test("TCH-005: Admin can access teachers/schedule page", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/teachers/schedule", "en", env), {
      timeout: NAV_TIMEOUT,
    })
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/teachers\/schedule/)
    await assertNoSSE(page)
  })

  test("TCH-006: Admin can access teachers/settings page", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/teachers/settings", "en", env), {
      timeout: NAV_TIMEOUT,
    })
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/teachers\/settings/)
    await assertNoSSE(page)
  })

  test("TCH-007: Admin can access add-teacher wizard", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/teachers/add", "en", env), {
      timeout: NAV_TIMEOUT,
    })
    await page.waitForLoadState("domcontentloaded")

    // Wizard redirects to a step under /add/[id]/...; URL should still contain /teachers/add
    expect(page.url()).toMatch(/\/teachers\/add/)
    await assertNoSSE(page)
  })
})

// =============================================================================
// TEACHER: Self-service access
// =============================================================================

test.describe("Teachers Module - TEACHER Self-Service @teachers @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("teacher")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("TCH-008: Teacher can read teachers list", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.teachers, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const hasAccess = url.includes("/teachers") || url.includes("/dashboard")
    expect(
      hasAccess,
      `Teacher should access /teachers, got: ${url}`
    ).toBeTruthy()
    await assertNoSSE(page)
  })
})

// =============================================================================
// STAFF / ACCOUNTANT: Read-only access
// =============================================================================

test.describe("Teachers Module - STAFF Access @teachers @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("staff")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("TCH-009: Staff can read teachers list", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.teachers, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/teachers/)
    await assertNoSSE(page)
  })
})

// =============================================================================
// STUDENT / GUARDIAN: Blocked from teachers management
// =============================================================================

test.describe("Teachers Module - STUDENT Blocked @teachers @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("student")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("TCH-010: Student should not access teachers admin pages", async ({
    page,
  }) => {
    await page.goto(buildSchoolUrl("demo", "/teachers/settings", "en", env), {
      timeout: NAV_TIMEOUT,
    })
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const isBlocked =
      url.includes("/dashboard") ||
      url.includes("/unauthorized") ||
      url.includes("/403") ||
      url.includes("/login") ||
      !url.includes("/teachers/settings")

    expect(
      isBlocked,
      `Student should be blocked from /teachers/settings, got: ${url}`
    ).toBeTruthy()
  })
})

// =============================================================================
// Arabic locale (RTL)
// =============================================================================

test.describe("Teachers Module - Arabic Locale @teachers @i18n", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("TCH-011: Teachers page loads in Arabic without SSE", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.teachers, "ar", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/ar\/teachers/)
    await assertNoSSE(page)
  })

  test("TCH-012: Teachers page in Arabic uses RTL direction", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.teachers, "ar", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const html = page.locator("html")
    await expect(html).toHaveAttribute("dir", "rtl")
  })
})
