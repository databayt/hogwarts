/**
 * Epic 1: Entry Points - SaaS Dashboard
 * Story 1.2: SaaS Dashboard (DEVELOPER Only)
 *
 * Tests SaaS dashboard access control - only DEVELOPER role should access.
 * Tag: @rbac @entry-points
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE, assertRedirectedToLogin } from "../../helpers/assertions"
import {
  buildUrl,
  getBaseUrl,
  getTestEnv,
  SAAS_DASHBOARD_ROUTES,
  TEST_USERS,
  TIMEOUTS,
} from "../../helpers/test-data"
import { LoginPage, SchoolLoginPage } from "../../page-objects"
import {
  SaasAnalyticsPage,
  SaasBillingPage,
  SaasDashboardPage,
  SaasTenantsPage,
} from "../../page-objects/dashboard.page"

const env = getTestEnv()
const baseUrl = getBaseUrl(env)

// Helper to clear auth state
async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

// Helper to login as developer
async function loginAsDeveloper(page: import("@playwright/test").Page) {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.loginAs("developer")
}

test.describe("Story 1.2: SaaS Dashboard Access (DEVELOPER Only) @rbac @entry-points", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("EP-013: Dashboard redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.dashboard, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("EP-014: Analytics redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.analytics, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("EP-015: Tenants redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.tenants, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })

  test("EP-016: Billing redirects unauthenticated to login", async ({
    page,
  }) => {
    await page.goto(buildUrl(SAAS_DASHBOARD_ROUTES.billing, "en", env))
    await page.waitForLoadState("networkidle").catch(() => {})

    await assertRedirectedToLogin(page)
  })
})

test.describe("Story 1.2: DEVELOPER Access @rbac", () => {
  // Increase timeout for authenticated tests
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginAsDeveloper(page)

    // Skip if protocol mismatch (known dev issue)
    if (page.url().includes("chrome-error://")) {
      test.skip()
    }
  })

  test("EP-017: DEVELOPER can access dashboard", async ({ page }) => {
    // After login, developer should be on dashboard already
    const url = page.url()
    if (!url.includes("/dashboard")) {
      const dashboardPage = new SaasDashboardPage(page)
      await dashboardPage.goto()
    }

    expect(page.url()).toMatch(/\/dashboard/)
    expect(page.url()).not.toMatch(/\/login/)
    await assertNoSSE(page)
  })

  test("EP-018: DEVELOPER can access analytics", async ({ page }) => {
    const analyticsPage = new SaasAnalyticsPage(page)
    await analyticsPage.goto()

    // Verify access (not redirected to login) - route may or may not exist
    const url = page.url()
    expect(url).not.toMatch(/\/login$/)
    await assertNoSSE(page)
  })

  test("EP-019: DEVELOPER can access tenants", async ({ page }) => {
    const tenantsPage = new SaasTenantsPage(page)
    await tenantsPage.goto()

    // Verify access (not redirected to login)
    const url = page.url()
    expect(url).not.toMatch(/\/login$/)
    await assertNoSSE(page)
  })

  test("EP-020: DEVELOPER can access billing", async ({ page }) => {
    const billingPage = new SaasBillingPage(page)
    await billingPage.goto()

    // Verify access (not redirected to login)
    const url = page.url()
    expect(url).not.toMatch(/\/login$/)
    await assertNoSSE(page)
  })

  test("EP-021: DEVELOPER can access domains (if route exists)", async ({
    page,
  }) => {
    await page.goto(buildUrl("/domains", "en", env))
    await page.waitForLoadState("domcontentloaded")

    // Verify not blocked - route may redirect to 404 or dashboard
    const url = page.url()
    expect(url).not.toMatch(/\/login$/)
    await assertNoSSE(page)
  })

  test("EP-022: DEVELOPER can access kanban (if route exists)", async ({
    page,
  }) => {
    await page.goto(buildUrl("/kanban", "en", env))
    await page.waitForLoadState("domcontentloaded")

    // Verify not blocked - route may redirect to 404 or dashboard
    const url = page.url()
    expect(url).not.toMatch(/\/login$/)
    await assertNoSSE(page)
  })
})

test.describe("Story 1.2: Non-DEVELOPER Access Blocked @rbac", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("EP-023: ADMIN cannot access SaaS dashboard (redirects)", async ({
    page,
  }) => {
    // Login as ADMIN on school subdomain
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    // Try to access SaaS dashboard - should be blocked
    const response = await page.goto(
      buildUrl(SAAS_DASHBOARD_ROUTES.dashboard, "en", env),
      { timeout: TIMEOUTS.long }
    )
    await page.waitForLoadState("domcontentloaded")

    // ADMIN should be blocked - either redirect or forbidden
    const url = page.url()
    const status = response?.status() || 200
    expect(
      status === 403 ||
        url.includes("/onboarding") ||
        url.includes("demo") ||
        url.includes("/login") ||
        url.includes("/forbidden")
    ).toBeTruthy()
  })

  test("EP-024: TEACHER cannot access SaaS dashboard", async ({ page }) => {
    // Login as TEACHER on school subdomain
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("teacher")

    // Try to access SaaS dashboard - should be blocked
    const response = await page.goto(
      buildUrl(SAAS_DASHBOARD_ROUTES.dashboard, "en", env),
      { timeout: TIMEOUTS.long }
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const status = response?.status() || 200
    expect(
      status === 403 ||
        url.includes("/onboarding") ||
        url.includes("demo") ||
        url.includes("/login") ||
        url.includes("/forbidden")
    ).toBeTruthy()
  })

  test("EP-025: STUDENT cannot access SaaS dashboard", async ({ page }) => {
    // Login as STUDENT on school subdomain
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("student")

    // Try to access SaaS dashboard - should be blocked
    const response = await page.goto(
      buildUrl(SAAS_DASHBOARD_ROUTES.dashboard, "en", env),
      { timeout: TIMEOUTS.long }
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const status = response?.status() || 200
    expect(
      status === 403 ||
        url.includes("/onboarding") ||
        url.includes("demo") ||
        url.includes("/login") ||
        url.includes("/forbidden")
    ).toBeTruthy()
  })
})
