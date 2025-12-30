import type { Page } from "@playwright/test"

/**
 * Test environment configuration
 */
export type TestEnv = "local" | "production"

/**
 * Test credentials from seed data
 */
export const TEST_CREDENTIALS = {
  developer: {
    email: "dev@databayt.org",
    password: "1234",
    role: "DEVELOPER",
    schoolId: null,
  },
  admin: {
    email: "admin@databayt.org",
    password: "1234",
    role: "ADMIN",
    schoolId: "demo",
  },
  accountant: {
    email: "accountant@databayt.org",
    password: "1234",
    role: "ACCOUNTANT",
    schoolId: "demo",
  },
  staff: {
    email: "staff@databayt.org",
    password: "1234",
    role: "STAFF",
    schoolId: "demo",
  },
  teacher: {
    email: "teacher@databayt.org",
    password: "1234",
    role: "TEACHER",
    schoolId: "demo",
  },
  student: {
    email: "student@databayt.org",
    password: "1234",
    role: "STUDENT",
    schoolId: "demo",
  },
  parent: {
    email: "parent@databayt.org",
    password: "1234",
    role: "GUARDIAN",
    schoolId: "demo",
  },
} as const

export type TestUserRole = keyof typeof TEST_CREDENTIALS

/**
 * Get base URL for the marketing/SaaS site
 */
export function getBaseUrl(env: TestEnv = "local"): string {
  return env === "production"
    ? "https://ed.databayt.org"
    : "https://localhost:3000"
}

/**
 * Get URL for a school subdomain
 */
export function getSchoolUrl(
  subdomain: string,
  env: TestEnv = "local"
): string {
  return env === "production"
    ? `https://${subdomain}.databayt.org`
    : `https://${subdomain}.localhost:3000`
}

/**
 * Get current test environment from env variable
 */
export function getTestEnv(): TestEnv {
  return (process.env.TEST_ENV as TestEnv) || "local"
}

/**
 * Login as a specific user role
 * @param page Playwright page object
 * @param email User email
 * @param password User password
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
}

/**
 * Login as a test user by role
 */
export async function loginAs(page: Page, role: TestUserRole): Promise<void> {
  const credentials = TEST_CREDENTIALS[role]
  await loginWithCredentials(page, credentials.email, credentials.password)
}

/**
 * Navigate to login page for marketing site
 */
export async function goToMarketingLogin(
  page: Page,
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): Promise<void> {
  const baseUrl = getBaseUrl(env)
  await page.goto(`${baseUrl}/${locale}/login`)
}

/**
 * Navigate to login page for a school subdomain
 */
export async function goToSchoolLogin(
  page: Page,
  subdomain: string,
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): Promise<void> {
  const schoolUrl = getSchoolUrl(subdomain, env)
  await page.goto(`${schoolUrl}/${locale}/login`)
}

/**
 * Wait for redirect to complete and return final URL
 */
export async function waitForRedirect(
  page: Page,
  timeout: number = 10000
): Promise<string> {
  await page.waitForLoadState("networkidle", { timeout })
  return page.url()
}

/**
 * Check if current URL matches expected pattern
 */
export function urlMatches(url: string, pattern: RegExp | string): boolean {
  if (typeof pattern === "string") {
    return url.includes(pattern)
  }
  return pattern.test(url)
}

/**
 * Logout from current session
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click user menu first
  const userMenu = page.locator('[data-testid="user-menu"]')
  if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userMenu.click()
    await page.click('[data-testid="logout-button"]')
  } else {
    // Fallback: navigate to logout URL directly
    await page.goto("/api/auth/signout")
    await page.click('button[type="submit"]')
  }
}

/**
 * Check if user is authenticated by looking for session indicators
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for common authenticated state indicators
  const dashboardLink = page.locator('a[href*="/dashboard"]')
  const userMenu = page.locator('[data-testid="user-menu"]')

  const hasDashboardLink = await dashboardLink
    .isVisible({ timeout: 1000 })
    .catch(() => false)
  const hasUserMenu = await userMenu
    .isVisible({ timeout: 1000 })
    .catch(() => false)

  return hasDashboardLink || hasUserMenu
}

/**
 * Get expected redirect URL for a user role
 */
export function getExpectedRedirect(
  role: TestUserRole,
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): string {
  const credentials = TEST_CREDENTIALS[role]

  if (role === "developer") {
    // DEVELOPER goes to platform operator dashboard
    const baseUrl = getBaseUrl(env)
    return `${baseUrl}/${locale}/dashboard`
  }

  if (credentials.schoolId) {
    // School members go to their school's dashboard
    const schoolUrl = getSchoolUrl(credentials.schoolId, env)
    return `${schoolUrl}/${locale}/dashboard`
  }

  // Users without school go to onboarding
  const baseUrl = getBaseUrl(env)
  return `${baseUrl}/${locale}/onboarding`
}

/**
 * Clear all cookies and local storage
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}
