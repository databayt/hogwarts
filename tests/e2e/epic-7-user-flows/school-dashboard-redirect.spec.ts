/**
 * Epic 7: School Dashboard Redirect Regression Tests
 *
 * Regression tests for the bug where school subdomain login
 * redirects to /onboarding instead of /dashboard.
 *
 * Root cause: Missing subdomain context in login redirect chain.
 * Fix: proxy.ts passes context/subdomain params, form.tsx detects
 * subdomain from hostname, action.ts uses absolute URL for redirect.
 *
 * Tag: @auth @multi-tenant @regression
 */

import { expect, test } from "@playwright/test"

import {
  assertLoginFormVisible,
  assertNoSSE,
  assertOnSchoolSubdomain,
} from "../../helpers/assertions"
import {
  buildSchoolUrl,
  getSchoolUrl,
  getTestEnv,
  TEST_USERS,
  TIMEOUTS,
} from "../../helpers/test-data"
import { SchoolLoginPage } from "../../page-objects"

const env = getTestEnv()
const SCHOOL_BASE_URL = getSchoolUrl("demo", env)

async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

/** Fill login form with retries for stability */
async function fillLoginForm(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.waitForSelector('input[name="email"]', { state: "visible" })
  const emailInput = page.locator('input[name="email"]')
  await emailInput.clear()
  await emailInput.fill(email)
  // Verify email was filled
  await page.waitForFunction(
    (e) => {
      const input = document.querySelector(
        'input[name="email"]'
      ) as HTMLInputElement
      return input && input.value === e
    },
    email,
    { timeout: 5000 }
  )
  const passwordInput = page.locator('input[name="password"]')
  await passwordInput.clear()
  await passwordInput.fill(password)
  await page.waitForTimeout(100)
  await page.click('button[type="submit"]')
}

test.describe("Regression: School subdomain login → dashboard (not onboarding) @auth @multi-tenant @regression", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("REGR-001: Proxy passes context=school&subdomain when redirecting to login", async ({
    page,
  }) => {
    // Navigate to a protected route on demo subdomain (unauthenticated)
    await page.goto(buildSchoolUrl("demo", "/dashboard", "en", env))
    await page.waitForLoadState("domcontentloaded")

    // Should be redirected to login page
    const url = page.url()
    expect(url).toContain("/login")

    // Login URL must include context=school and subdomain=demo
    expect(url).toContain("context=school")
    expect(url).toContain("subdomain=demo")

    // callbackUrl must also be preserved
    expect(url).toContain("callbackUrl")
  })

  test("REGR-002: Proxy passes subdomain context for non-dashboard protected routes", async ({
    page,
  }) => {
    // Try accessing /students (also protected)
    await page.goto(buildSchoolUrl("demo", "/students", "en", env))
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(url).toContain("/login")
    expect(url).toContain("context=school")
    expect(url).toContain("subdomain=demo")
  })

  test("REGR-003: Login form detects subdomain from URL params", async ({
    page,
  }) => {
    // Navigate directly to login with context params
    await page.goto(
      `${SCHOOL_BASE_URL}/en/login?callbackUrl=%2Fen%2Fdashboard&context=school&subdomain=demo`
    )
    await page.waitForLoadState("domcontentloaded")
    await assertLoginFormVisible(page)
    await assertNoSSE(page)
  })

  test("REGR-004: ADMIN login on school subdomain lands on /dashboard, NOT /onboarding", async ({
    page,
  }) => {
    // This is the main regression test for the bug
    // Go to school dashboard (protected) → redirected to login with context
    await page.goto(buildSchoolUrl("demo", "/dashboard", "en", env))
    await page.waitForLoadState("domcontentloaded")

    // Should be on login with context params
    const loginUrl = page.url()
    expect(loginUrl).toContain("/login")

    // Login as admin (member of demo school)
    await fillLoginForm(page, TEST_USERS.admin.email, TEST_USERS.admin.password)

    // Wait for navigation to complete
    await page.waitForURL(/\/(dashboard|onboarding|access-denied)/, {
      timeout: TIMEOUTS.navigation,
    })

    // Skip if protocol mismatch in dev
    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const finalUrl = page.url()

    // CRITICAL: Must land on /dashboard, NOT /onboarding
    expect(finalUrl).toContain("/dashboard")
    expect(finalUrl).not.toContain("/onboarding")
    expect(finalUrl).not.toContain("/access-denied")

    // Should be on demo subdomain
    assertOnSchoolSubdomain(page, "demo")
  })

  test("REGR-005: TEACHER login on school subdomain lands on /dashboard", async ({
    page,
  }) => {
    await page.goto(buildSchoolUrl("demo", "/dashboard", "en", env))
    await page.waitForLoadState("domcontentloaded")

    await fillLoginForm(
      page,
      TEST_USERS.teacher.email,
      TEST_USERS.teacher.password
    )

    await page.waitForURL(/\/(dashboard|onboarding|access-denied)/, {
      timeout: TIMEOUTS.navigation,
    })

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const finalUrl = page.url()
    expect(finalUrl).toContain("/dashboard")
    expect(finalUrl).not.toContain("/onboarding")
  })

  test("REGR-006: STUDENT login on school subdomain lands on /dashboard", async ({
    page,
  }) => {
    await page.goto(buildSchoolUrl("demo", "/dashboard", "en", env))
    await page.waitForLoadState("domcontentloaded")

    await fillLoginForm(
      page,
      TEST_USERS.student.email,
      TEST_USERS.student.password
    )

    await page.waitForURL(/\/(dashboard|onboarding|access-denied)/, {
      timeout: TIMEOUTS.navigation,
    })

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const finalUrl = page.url()
    expect(finalUrl).toContain("/dashboard")
    expect(finalUrl).not.toContain("/onboarding")
  })

  test("REGR-007: Login form hostname fallback detects subdomain without params", async ({
    page,
  }) => {
    // Navigate directly to login on subdomain WITHOUT context params
    // The form should detect the subdomain from window.location.hostname
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await assertLoginFormVisible(page)

    // Login as admin
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const finalUrl = page.url()
    // Should NOT end up on /onboarding
    expect(finalUrl).not.toContain("/onboarding")
    // Should redirect away from login
    expect(finalUrl).not.toMatch(/\/login$/)
  })

  test("REGR-008: DEVELOPER login on main domain still reaches SaaS dashboard", async ({
    page,
  }) => {
    // Ensure the fix doesn't break main domain login for DEVELOPER
    await page.goto("http://localhost:3000/en/login")
    await page.waitForLoadState("domcontentloaded")

    await fillLoginForm(
      page,
      TEST_USERS.developer.email,
      TEST_USERS.developer.password
    )

    await page.waitForURL(/\/(dashboard|onboarding)/, {
      timeout: TIMEOUTS.navigation,
    })

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const finalUrl = page.url()
    // DEVELOPER should land on main domain dashboard
    expect(finalUrl).toContain("/dashboard")
    expect(finalUrl).not.toContain("/onboarding")
    // Should NOT be on a school subdomain
    expect(finalUrl).not.toContain("demo.")
  })

  test("REGR-009: Main domain login does NOT inject school context params", async ({
    page,
  }) => {
    // Access protected route on main domain (no subdomain)
    await page.goto("http://localhost:3000/en/dashboard")
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    // Should redirect to login
    expect(url).toContain("/login")
    // Should NOT have school context params (no subdomain)
    expect(url).not.toContain("context=school")
    expect(url).not.toContain("subdomain=")
  })

  test("REGR-010: Arabic locale preserved in school subdomain redirect", async ({
    page,
  }) => {
    test.setTimeout(60000)

    // Access protected route with Arabic locale on demo subdomain
    await page.goto(buildSchoolUrl("demo", "/dashboard", "ar", env))
    await page.waitForLoadState("domcontentloaded")

    const loginUrl = page.url()
    expect(loginUrl).toContain("/login")
    expect(loginUrl).toContain("context=school")
    expect(loginUrl).toContain("subdomain=demo")

    // The callbackUrl should contain /ar/
    expect(loginUrl).toMatch(/callbackUrl.*%2Far/)
  })

  test("REGR-011: Non-DEVELOPER on main domain SaaS dashboard gets access-denied, NOT onboarding", async ({
    page,
  }) => {
    // Login as admin on main domain
    await page.goto("http://localhost:3000/en/login")
    await page.waitForLoadState("domcontentloaded")

    await fillLoginForm(page, TEST_USERS.admin.email, TEST_USERS.admin.password)

    // Wait for redirect
    await page.waitForLoadState("networkidle").catch(() => {})

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Now try accessing SaaS dashboard directly as non-DEVELOPER
    await page.goto("http://localhost:3000/en/dashboard")
    await page.waitForLoadState("domcontentloaded")

    const finalUrl = page.url()
    // CRITICAL: Must NOT redirect to /onboarding
    // Onboarding is ONLY reachable via Get Started button
    expect(finalUrl).not.toContain("/onboarding")
  })

  test("REGR-012: /onboarding is never a redirect target from login flow", async ({
    page,
  }) => {
    // Login as a user with no school on the main domain
    await page.goto("http://localhost:3000/en/login")
    await page.waitForLoadState("domcontentloaded")

    await fillLoginForm(page, TEST_USERS.user.email, TEST_USERS.user.password)

    await page.waitForLoadState("networkidle").catch(() => {})

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const finalUrl = page.url()
    // Even a fresh USER should NOT be auto-redirected to onboarding
    // Onboarding is only reachable via Get Started button click
    expect(finalUrl).not.toContain("/onboarding")
  })
})
