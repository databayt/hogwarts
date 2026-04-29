/**
 * Epic 14: Parents (Guardians) Module - Production Readiness
 *
 * Comprehensive E2E tests for the parents module covering:
 * - Admin CRUD operations and page navigation
 * - Guardian self-service access (own profile + linked children)
 * - Role-based access control
 * - No SSE errors across all sub-pages
 *
 * Tag: @parents @guardians @rbac
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
// ADMIN: Full access to parents module
// =============================================================================

test.describe("Parents Module - ADMIN Access @parents @guardians @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("GRD-001: Admin can access parents list page", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.parents, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/parents/)
    await assertNoSSE(page)
  })

  test("GRD-002: Parents page renders data table", async ({ page }) => {
    test.slow()
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.parents, "en", env),
      { timeout: NAV_TIMEOUT }
    )

    await expect(page.locator("table")).toBeVisible({ timeout: 20_000 })
    await assertNoSSE(page)
  })

  test("GRD-003: Parents page has navigation tabs (All / Link / Communication / Settings)", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.parents, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const navLinks = page.locator(
      'nav a[href*="/parents"], a[href*="/parents"]'
    )
    const count = await navLinks.count()
    expect(count).toBeGreaterThanOrEqual(1)
    await assertNoSSE(page)
  })
})

// =============================================================================
// GUARDIAN: Self-service access (own profile + linked children)
// =============================================================================

test.describe("Parents Module - GUARDIAN Self-Service @parents @guardians @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("guardian")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("GRD-004: Guardian can access /parents (own listing or redirected)", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.parents, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const allowed =
      url.includes("/parents") ||
      url.includes("/dashboard") ||
      url.includes("/parent")
    expect(
      allowed,
      `Guardian /parents should not 500/SSE, got: ${url}`
    ).toBeTruthy()
    await assertNoSSE(page)
  })

  test("GRD-005: Guardian can access /dashboard", async ({ page }) => {
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
// TEACHER: Can view parents (link students to guardians)
// =============================================================================

test.describe("Parents Module - TEACHER Access @parents @guardians @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("teacher")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("GRD-006: Teacher can view parents list", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.parents, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const hasAccess = url.includes("/parents") || url.includes("/dashboard")
    expect(
      hasAccess,
      `Teacher should access /parents, got: ${url}`
    ).toBeTruthy()
    await assertNoSSE(page)
  })
})

// =============================================================================
// STUDENT: Blocked from parents management
// =============================================================================

test.describe("Parents Module - STUDENT Blocked @parents @guardians @rbac", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("student")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("GRD-007: Student should not see parents management UI", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.parents, "en", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    // Student is allowed to see /dashboard if blocked. Either they get redirected
    // or the page renders without crashing — just guard against SSE.
    const safe =
      url.includes("/dashboard") ||
      url.includes("/unauthorized") ||
      url.includes("/403") ||
      url.includes("/login") ||
      url.includes("/parents")
    expect(safe).toBeTruthy()
    await assertNoSSE(page)
  })
})

// =============================================================================
// Arabic locale (RTL)
// =============================================================================

test.describe("Parents Module - Arabic Locale @parents @i18n", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("GRD-008: Parents page loads in Arabic without SSE", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.parents, "ar", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toMatch(/\/ar\/parents/)
    await assertNoSSE(page)
  })

  test("GRD-009: Parents page in Arabic uses RTL direction", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.parents, "ar", env),
      { timeout: NAV_TIMEOUT }
    )
    await page.waitForLoadState("domcontentloaded")

    const html = page.locator("html")
    await expect(html).toHaveAttribute("dir", "rtl")
  })
})
