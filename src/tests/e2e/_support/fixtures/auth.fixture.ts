/**
 * Authentication Fixture
 *
 * Provides multi-role authentication for Playwright tests.
 * Extends base test with authenticated page contexts.
 */

import {
  test as base,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test"

import {
  buildSchoolUrl,
  buildUrl,
  getTestEnv,
  SELECTORS,
  TEST_USERS,
  TIMEOUTS,
  type Locale,
  type TestUserKey,
} from "../helpers/test-data"

// =============================================================================
// LOGIN HELPER
// =============================================================================

/**
 * Login with credentials and wait for navigation
 */
async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Wait for form fields to be visible and ready
  await page.waitForSelector(SELECTORS.emailInput, { state: "visible" })
  await page.waitForSelector(SELECTORS.passwordInput, { state: "visible" })

  // Clear and fill email field
  const emailInput = page.locator(SELECTORS.emailInput)
  await emailInput.clear()
  await emailInput.fill(email)

  // Wait for email to be properly filled
  await page.waitForFunction(
    (expectedEmail) => {
      const input = document.querySelector(
        'input[name="email"]'
      ) as HTMLInputElement
      return input && input.value === expectedEmail
    },
    email,
    { timeout: TIMEOUTS.short }
  )

  // Fill password
  const passwordInput = page.locator(SELECTORS.passwordInput)
  await passwordInput.clear()
  await passwordInput.fill(password)

  // Small delay to ensure form state is updated
  await page.waitForTimeout(100)

  // Click submit and wait for navigation
  await Promise.all([
    page
      .waitForNavigation({
        waitUntil: "domcontentloaded",
        timeout: TIMEOUTS.navigation,
      })
      .catch(() => null),
    page.click(SELECTORS.submitButton),
  ])
}

/**
 * Login as a specific test user
 */
async function loginAs(page: Page, userKey: TestUserKey): Promise<void> {
  const user = TEST_USERS[userKey]
  await loginWithCredentials(page, user.email, user.password)
}

/**
 * Navigate to login page (main domain)
 */
async function goToMainLogin(page: Page, locale: Locale = "en"): Promise<void> {
  const url = buildUrl("/login", locale, getTestEnv())
  await page.goto(url)
}

/**
 * Navigate to login page (school subdomain)
 */
async function goToSchoolLogin(
  page: Page,
  subdomain: string,
  locale: Locale = "en"
): Promise<void> {
  const url = buildSchoolUrl(subdomain, "/login", locale, getTestEnv())
  await page.goto(url)
}

/**
 * Wait for redirect to complete
 */
async function waitForRedirect(
  page: Page,
  timeout: number = TIMEOUTS.navigation
): Promise<string> {
  try {
    await page.waitForLoadState("networkidle", { timeout })
  } catch {
    // If networkidle times out, wait for domcontentloaded as fallback
    await page.waitForLoadState("domcontentloaded", { timeout: TIMEOUTS.short })
  }
  return page.url()
}

/**
 * Clear all auth state
 */
async function clearAuthState(page: Page): Promise<void> {
  await page.context().clearCookies()
  try {
    const url = page.url()
    if (url && url !== "about:blank") {
      await page.evaluate(() => {
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch {
          // Ignore if localStorage is not accessible
        }
      })
    }
  } catch {
    // Ignore errors - we still cleared cookies
  }
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated(page: Page): Promise<boolean> {
  const userMenu = page.locator(SELECTORS.userMenu)
  const dashboardLink = page.locator(SELECTORS.dashboardLink)

  const hasUserMenu = await userMenu
    .isVisible({ timeout: TIMEOUTS.short })
    .catch(() => false)
  const hasDashboardLink = await dashboardLink
    .isVisible({ timeout: TIMEOUTS.short })
    .catch(() => false)

  return hasUserMenu || hasDashboardLink
}

/**
 * Logout from current session
 */
async function logout(page: Page): Promise<void> {
  const userMenu = page.locator(SELECTORS.userMenu)
  if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userMenu.click()
    await page.click(SELECTORS.logoutButton)
  } else {
    // Fallback: navigate to logout URL directly
    await page.goto("/api/auth/signout")
    await page.click('button[type="submit"]')
  }
}

// =============================================================================
// FIXTURE TYPES
// =============================================================================

export interface AuthFixtures {
  // Auth helpers
  loginAs: (userKey: TestUserKey) => Promise<void>
  loginWithCredentials: (email: string, password: string) => Promise<void>
  goToMainLogin: (locale?: Locale) => Promise<void>
  goToSchoolLogin: (subdomain: string, locale?: Locale) => Promise<void>
  waitForRedirect: (timeout?: number) => Promise<string>
  clearAuthState: () => Promise<void>
  isAuthenticated: () => Promise<boolean>
  logout: () => Promise<void>

  // Pre-authenticated pages
  developerPage: Page
  adminPage: Page
  teacherPage: Page
  studentPage: Page
  guardianPage: Page
  accountantPage: Page
  staffPage: Page
}

// =============================================================================
// FIXTURE IMPLEMENTATION
// =============================================================================

/**
 * Create authenticated context for a user role
 */
async function createAuthenticatedContext(
  browser: Browser,
  userKey: TestUserKey
): Promise<{ context: BrowserContext; page: Page }> {
  if (!browser) throw new Error("Browser not available")

  const context = await browser.newContext()
  const page = await context.newPage()

  const user = TEST_USERS[userKey]

  // Determine login URL based on user's school
  if (user.schoolId) {
    await goToSchoolLogin(page, user.schoolId)
  } else {
    await goToMainLogin(page)
  }

  await loginAs(page, userKey)
  await waitForRedirect(page)

  return { context, page }
}

/**
 * Extended test with auth fixtures
 */
export const test = base.extend<AuthFixtures>({
  // Auth helper functions bound to current page
  loginAs: async ({ page }, use) => {
    await use((userKey: TestUserKey) => loginAs(page, userKey))
  },

  loginWithCredentials: async ({ page }, use) => {
    await use((email: string, password: string) =>
      loginWithCredentials(page, email, password)
    )
  },

  goToMainLogin: async ({ page }, use) => {
    await use((locale?: Locale) => goToMainLogin(page, locale))
  },

  goToSchoolLogin: async ({ page }, use) => {
    await use((subdomain: string, locale?: Locale) =>
      goToSchoolLogin(page, subdomain, locale)
    )
  },

  waitForRedirect: async ({ page }, use) => {
    await use((timeout?: number) => waitForRedirect(page, timeout))
  },

  clearAuthState: async ({ page }, use) => {
    await use(() => clearAuthState(page))
  },

  isAuthenticated: async ({ page }, use) => {
    await use(() => isAuthenticated(page))
  },

  logout: async ({ page }, use) => {
    await use(() => logout(page))
  },

  // Pre-authenticated pages for each role
  developerPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedContext(
      browser,
      "developer"
    )
    await use(page)
    await context.close()
  },

  adminPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedContext(browser, "admin")
    await use(page)
    await context.close()
  },

  teacherPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedContext(
      browser,
      "teacher"
    )
    await use(page)
    await context.close()
  },

  studentPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedContext(
      browser,
      "student"
    )
    await use(page)
    await context.close()
  },

  guardianPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedContext(
      browser,
      "guardian"
    )
    await use(page)
    await context.close()
  },

  accountantPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedContext(
      browser,
      "accountant"
    )
    await use(page)
    await context.close()
  },

  staffPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedContext(browser, "staff")
    await use(page)
    await context.close()
  },
})

export { expect } from "@playwright/test"
