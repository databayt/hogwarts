import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import { TEST_USERS, TIMEOUTS } from "../../helpers/test-data"

/**
 * Epic 7: School Marketing Login Flow Tests
 *
 * Tests the login flow from School marketing (demo.databayt.org / demo.localhost:3000)
 *
 * CRITICAL BEHAVIOR:
 * - Login on school subdomain → After auth → stay on school marketing or school dashboard
 * - Protected route on school subdomain → proxy adds context=school&subdomain=demo
 * - After login as school member → lands on school dashboard (NOT /onboarding)
 * - No one ever gets redirected to /onboarding (only reachable via Get Started button)
 */

const SCHOOL_BASE_URL = "http://demo.localhost:3000"

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

test.describe("School Marketing Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  // Test: School Login button has correct context params
  test("Login link on school marketing has context=school&subdomain params", async ({
    page,
  }) => {
    await page.goto(`${SCHOOL_BASE_URL}/en`)
    await page.waitForLoadState("domcontentloaded")
    await assertNoSSE(page)

    // Find login link in header
    const loginLink = page.locator('a[href*="/login"]').first()
    const loginHref = await loginLink.getAttribute("href")

    // Verify context params are present
    expect(loginHref).toContain("context=school")
    expect(loginHref).toContain("subdomain=demo")
  })

  // Test: Login stays on school marketing for users without school
  test("User without school stays on school marketing after login", async ({
    page,
  }) => {
    // Navigate directly to login on school subdomain (with school context)
    await page.goto(`${SCHOOL_BASE_URL}/en/login?context=school&subdomain=demo`)
    await page.waitForLoadState("domcontentloaded")

    // Login as user without school
    await fillLoginForm(page, TEST_USERS.user.email, TEST_USERS.user.password)

    await page.waitForLoadState("networkidle").catch(() => {})

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Should NOT redirect to /onboarding
    const currentUrl = page.url()
    expect(currentUrl).not.toContain("/onboarding")
  })

  // Test: School member accessing protected route → dashboard (not onboarding)
  test("School member accessing dashboard lands on school dashboard", async ({
    page,
  }) => {
    // Navigate to protected route on school subdomain
    // Proxy will redirect to login with context=school&subdomain=demo
    await page.goto(`${SCHOOL_BASE_URL}/en/dashboard`)
    await page.waitForLoadState("domcontentloaded")

    // Should be on login with context params
    const loginUrl = page.url()
    expect(loginUrl).toContain("/login")
    expect(loginUrl).toContain("context=school")
    expect(loginUrl).toContain("subdomain=demo")

    // Login as school member (admin of demo school)
    await fillLoginForm(page, TEST_USERS.admin.email, TEST_USERS.admin.password)

    // Should redirect to school dashboard
    await page.waitForURL(/\/dashboard/, { timeout: TIMEOUTS.navigation })

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Should NOT see access denied or onboarding
    const url = page.url()
    expect(url).not.toContain("access-denied")
    expect(url).not.toContain("/onboarding")

    // Should be on demo subdomain
    expect(url).toContain("demo.")
  })

  // Test: Non-member should be denied access to school dashboard
  test("Non-member accessing school dashboard is denied access", async ({
    page,
  }) => {
    // Navigate to protected route on school subdomain
    await page.goto(`${SCHOOL_BASE_URL}/en/dashboard`)
    await page.waitForLoadState("domcontentloaded")

    // Login as user without school
    await fillLoginForm(page, TEST_USERS.user.email, TEST_USERS.user.password)

    // Should redirect to access-denied
    await page.waitForURL(/\/access-denied/, { timeout: TIMEOUTS.navigation })

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Should NOT see onboarding
    const url = page.url()
    expect(url).not.toContain("/onboarding")
  })

  // Test: Member of DIFFERENT school cannot access Platform
  test("Member of different school should be denied access", async ({
    page,
  }) => {
    test.skip(
      true,
      "Requires test user belonging to a different school (not demo)"
    )
  })

  // Test: DEVELOPER can access any school's dashboard
  test("DEVELOPER should be able to access any school dashboard", async ({
    page,
  }) => {
    // Navigate to protected route on school subdomain
    await page.goto(`${SCHOOL_BASE_URL}/en/dashboard`)
    await page.waitForLoadState("domcontentloaded")

    // Login as DEVELOPER
    await fillLoginForm(
      page,
      TEST_USERS.developer.email,
      TEST_USERS.developer.password
    )

    // Should redirect to dashboard (DEVELOPER has access to all schools)
    await page.waitForURL(/\/dashboard/, { timeout: TIMEOUTS.navigation })

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Should NOT see access denied or onboarding
    const url = page.url()
    expect(url).not.toContain("access-denied")
    expect(url).not.toContain("/onboarding")
  })
})
