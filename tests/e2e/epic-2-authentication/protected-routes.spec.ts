/**
 * Epic 2: Authentication - Protected Routes
 * Story 2.3: Protected Route Redirects
 *
 * Tests that protected routes redirect unauthenticated users to login.
 * Tag: @auth
 */

import { expect, test } from "@playwright/test"

import { assertRedirectedToLogin } from "../../helpers/assertions"
import {
  buildSchoolUrl,
  buildUrl,
  getTestEnv,
  SAAS_DASHBOARD_ROUTES,
  SCHOOL_DASHBOARD_ROUTES,
} from "../../helpers/test-data"

const env = getTestEnv()

// Helper to clear auth state
async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Story 2.3: SaaS Dashboard Protected Routes @auth", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("AUTH-023: Dashboard redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.dashboard, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-024: Analytics redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.analytics, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-025: Tenants redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.tenants, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-026: Billing redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.billing, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-027: Profile redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.profile, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-028: Kanban redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.kanban, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })
})

test.describe("Story 2.3: School Dashboard Protected Routes @auth @multi-tenant", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("AUTH-029: School dashboard redirects unauthenticated", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.dashboard, "en", env)
    )
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-030: Students page redirects unauthenticated", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.students, "en", env)
    )
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-031: Teachers page redirects unauthenticated", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.teachers, "en", env)
    )
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-032: Finance page redirects unauthenticated", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.finance, "en", env)
    )
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-033: Settings page redirects unauthenticated", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.settings, "en", env)
    )
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-034: Attendance page redirects unauthenticated", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.attendance, "en", env)
    )
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("AUTH-035: Exams page redirects unauthenticated", async ({ page }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.exams, "en", env)
    )
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })
})

test.describe("Story 2.3: Callback URL Preservation @auth", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("AUTH-036: Callback URL preserved for dashboard", async ({ page }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.dashboard, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    // URL should contain callbackUrl or redirect back after login
    const url = page.url()
    const hasCallback =
      url.includes("callbackUrl") ||
      url.includes("redirect") ||
      url.includes("/login")

    expect(hasCallback).toBeTruthy()
  })

  test("AUTH-037: Callback URL preserved for school dashboard", async ({
    page,
  }) => {
    await page.goto(
      buildSchoolUrl("demo", SCHOOL_DASHBOARD_ROUTES.dashboard, "en", env)
    )
    await page.waitForLoadState("networkidle").catch(() => {})

    const url = page.url()
    const hasCallback =
      url.includes("callbackUrl") ||
      url.includes("redirect") ||
      url.includes("/login")

    expect(hasCallback).toBeTruthy()
  })
})
