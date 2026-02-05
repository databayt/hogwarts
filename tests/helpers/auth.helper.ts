import { type Page } from "@playwright/test"

/**
 * Authentication Helper for E2E Tests
 *
 * Provides common authentication utilities for Playwright tests.
 */

export interface TestUser {
  email: string
  password: string
  role:
    | "DEVELOPER"
    | "ADMIN"
    | "TEACHER"
    | "STUDENT"
    | "GUARDIAN"
    | "ACCOUNTANT"
    | "STAFF"
    | "USER"
  hasSchool: boolean
}

// Test users from seed data
export const TEST_USERS: Record<string, TestUser> = {
  developer: {
    email: "dev@databayt.org",
    password: "1234",
    role: "DEVELOPER",
    hasSchool: false,
  },
  user: {
    email: "user@databayt.org",
    password: "1234",
    role: "USER",
    hasSchool: false,
  },
  admin: {
    email: "admin@databayt.org",
    password: "1234",
    role: "ADMIN",
    hasSchool: true,
  },
  teacher: {
    email: "teacher@databayt.org",
    password: "1234",
    role: "TEACHER",
    hasSchool: true,
  },
  student: {
    email: "student@databayt.org",
    password: "1234",
    role: "STUDENT",
    hasSchool: true,
  },
  guardian: {
    email: "parent@databayt.org",
    password: "1234",
    role: "GUARDIAN",
    hasSchool: true,
  },
  accountant: {
    email: "accountant@databayt.org",
    password: "1234",
    role: "ACCOUNTANT",
    hasSchool: true,
  },
  staff: {
    email: "staff@databayt.org",
    password: "1234",
    role: "STAFF",
    hasSchool: true,
  },
}

export class AuthHelper {
  readonly page: Page
  readonly baseUrl: string

  constructor(page: Page, baseUrl = "http://localhost:3000") {
    this.page = page
    this.baseUrl = baseUrl
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string, locale = "en") {
    await this.page.goto(`${this.baseUrl}/${locale}/login`)
    await this.page.waitForLoadState("networkidle")

    // Fill credentials
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)

    // Submit
    await this.page.click('button[type="submit"]')

    // Wait for redirect (login complete)
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000,
    })
  }

  /**
   * Login as a predefined test user
   */
  async loginAs(userType: keyof typeof TEST_USERS, locale = "en") {
    const user = TEST_USERS[userType]
    await this.login(user.email, user.password, locale)
  }

  /**
   * Logout current user
   */
  async logout() {
    // Try to find and click logout button in user menu
    const avatarButton = this.page.locator(
      '[data-testid="user-menu"], button:has(span.sr-only:text("User menu"))'
    )

    if (await avatarButton.isVisible()) {
      await avatarButton.click()

      // Click logout option
      const logoutButton = this.page.locator(
        'button:has-text("Logout"), a:has-text("Logout"), [role="menuitem"]:has-text("Logout")'
      )
      await logoutButton.click()

      // Wait for redirect to homepage or login
      await this.page.waitForURL(
        (url) =>
          url.pathname === "/" ||
          url.pathname.match(/^\/(en|ar)\/?$/) !== null ||
          url.pathname.includes("/login")
      )
    } else {
      // Fallback: clear cookies and refresh
      await this.clearSession()
    }
  }

  /**
   * Clear session cookies
   */
  async clearSession() {
    await this.page.context().clearCookies()
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const cookies = await this.page.context().cookies()
    return cookies.some((c) => c.name === "authjs.session-token")
  }

  /**
   * Get current user info from page (if available)
   */
  async getCurrentUser(): Promise<{ email?: string; name?: string } | null> {
    // Try to get user info from avatar dropdown or page
    const userEmail = await this.page
      .locator('[data-testid="user-email"]')
      .textContent()
      .catch(() => null)
    const userName = await this.page
      .locator('[data-testid="user-name"]')
      .textContent()
      .catch(() => null)

    if (userEmail || userName) {
      return { email: userEmail || undefined, name: userName || undefined }
    }
    return null
  }

  /**
   * Navigate to login page with callback URL
   */
  async gotoLoginWithCallback(callbackUrl: string, locale = "en") {
    const encodedCallback = encodeURIComponent(callbackUrl)
    await this.page.goto(
      `${this.baseUrl}/${locale}/login?callbackUrl=${encodedCallback}`
    )
    await this.page.waitForLoadState("networkidle")
  }

  /**
   * Assert user is on login page
   */
  async expectLoginPage() {
    await this.page.waitForURL(/\/login/)
  }

  /**
   * Assert user is authenticated and on expected page
   */
  async expectAuthenticatedOn(urlPattern: RegExp) {
    const isAuth = await this.isAuthenticated()
    if (!isAuth) {
      throw new Error("User is not authenticated")
    }
    await this.page.waitForURL(urlPattern)
  }
}

/**
 * Create auth helper with fresh session
 */
export async function withFreshSession(
  page: Page,
  baseUrl = "http://localhost:3000"
): Promise<AuthHelper> {
  const auth = new AuthHelper(page, baseUrl)
  await auth.clearSession()
  return auth
}

/**
 * Create auth helper and login as user
 */
export async function withAuthenticatedUser(
  page: Page,
  userType: keyof typeof TEST_USERS,
  baseUrl = "http://localhost:3000"
): Promise<AuthHelper> {
  const auth = new AuthHelper(page, baseUrl)
  await auth.clearSession()
  await auth.loginAs(userType)
  return auth
}
