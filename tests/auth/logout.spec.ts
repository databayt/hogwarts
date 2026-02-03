import { expect, test } from "@playwright/test"

import {
  clearAuthState,
  getBaseUrl,
  getSchoolUrl,
  getTestEnv,
  goToMarketingLogin,
  goToSchoolLogin,
  loginAs,
  waitForRedirect,
} from "./helpers"

const env = getTestEnv()
const baseUrl = getBaseUrl(env)
const schoolUrl = getSchoolUrl("demo", env)

test.describe("Logout - Marketing Site Context", () => {
  test("logout from marketing dashboard redirects to marketing homepage", async ({
    page,
  }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)

    // Login as DEVELOPER (goes to saas-marketing dashboard)
    await loginAs(page, "developer")
    await waitForRedirect(page)

    // Verify we're on the dashboard
    expect(page.url()).toMatch(/\/dashboard/)

    // Find and click logout
    const userMenuOrLogout = page.locator(
      '[data-testid="user-menu"], [data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")'
    )

    if (await userMenuOrLogout.first().isVisible({ timeout: 3000 })) {
      await userMenuOrLogout.first().click()

      // If it was a menu, click the logout option
      const logoutOption = page.locator(
        '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")'
      )
      if (await logoutOption.isVisible({ timeout: 2000 })) {
        await logoutOption.click()
      }
    } else {
      // Fallback: navigate to signout API
      await page.goto(`${baseUrl}/api/auth/signout`)
      const submitButton = page.locator('button[type="submit"]')
      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click()
      }
    }

    await waitForRedirect(page)

    // Should be on saas-marketing homepage or login page (not school subdomain)
    const finalUrl = page.url()
    expect(finalUrl).not.toContain("demo.")
    expect(finalUrl).toMatch(
      /\/(en|ar)(\/login)?$|\/en$|\/ar$|localhost:3000\/(en|ar)/
    )
  })
})

test.describe("Logout - School Context", () => {
  test("logout from school dashboard redirects to school homepage", async ({
    page,
  }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)

    // Login as ADMIN (stays on school dashboard)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Verify we're on the school dashboard
    const dashboardUrl = page.url()
    expect(dashboardUrl).toContain("demo")
    expect(dashboardUrl).toMatch(/\/dashboard/)

    // Find and click logout
    const userMenuOrLogout = page.locator(
      '[data-testid="user-menu"], [data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")'
    )

    if (await userMenuOrLogout.first().isVisible({ timeout: 3000 })) {
      await userMenuOrLogout.first().click()

      // If it was a menu, click the logout option
      const logoutOption = page.locator(
        '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")'
      )
      if (await logoutOption.isVisible({ timeout: 2000 })) {
        await logoutOption.click()
      }
    } else {
      // Fallback: navigate to signout API on school subdomain
      await page.goto(`${schoolUrl}/api/auth/signout`)
      const submitButton = page.locator('button[type="submit"]')
      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click()
      }
    }

    await waitForRedirect(page)

    // Should stay on school subdomain (not redirected to main domain)
    const finalUrl = page.url()
    expect(finalUrl).toContain("demo")
    expect(finalUrl).not.toMatch(/^https?:\/\/ed\./)
  })

  test("TEACHER logout stays on school context", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)

    await loginAs(page, "teacher")
    await waitForRedirect(page)

    // Navigate to signout
    await page.goto(`${schoolUrl}/api/auth/signout`)
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click()
    }

    await waitForRedirect(page)

    // Should stay on school subdomain
    const finalUrl = page.url()
    expect(finalUrl).toContain("demo")
  })

  test("STUDENT logout stays on school context", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)

    await loginAs(page, "student")
    await waitForRedirect(page)

    // Navigate to signout
    await page.goto(`${schoolUrl}/api/auth/signout`)
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click()
    }

    await waitForRedirect(page)

    // Should stay on school subdomain
    const finalUrl = page.url()
    expect(finalUrl).toContain("demo")
  })
})

test.describe("Logout - Session Cleanup", () => {
  test("logout clears session cookie", async ({ page, context }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)

    await loginAs(page, "developer")
    await waitForRedirect(page)

    // Check that session cookie exists
    let cookies = await context.cookies()
    const sessionCookie = cookies.find(
      (c) =>
        c.name.includes("authjs.session-token") ||
        c.name.includes("next-auth.session-token")
    )
    expect(sessionCookie).toBeDefined()

    // Logout
    await page.goto(`${baseUrl}/api/auth/signout`)
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click()
    }
    await waitForRedirect(page)

    // Session cookie should be cleared or expired
    cookies = await context.cookies()
    const sessionCookieAfter = cookies.find(
      (c) =>
        c.name.includes("authjs.session-token") ||
        c.name.includes("next-auth.session-token")
    )

    // Either cookie is removed or value is empty/different
    if (sessionCookieAfter) {
      expect(sessionCookieAfter.value).not.toBe(sessionCookie?.value)
    }
  })

  test("cannot access protected route after logout", async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)

    await loginAs(page, "developer")
    await waitForRedirect(page)

    // Verify dashboard access
    expect(page.url()).toMatch(/\/dashboard/)

    // Logout
    await page.goto(`${baseUrl}/api/auth/signout`)
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click()
    }
    await waitForRedirect(page)

    // Try to access dashboard
    await page.goto(`${baseUrl}/en/dashboard`)
    await waitForRedirect(page)

    // Should be redirected to login
    const finalUrl = page.url()
    expect(finalUrl).toMatch(/\/login/)
  })
})

test.describe("Logout - Arabic Locale", () => {
  test("logout from Arabic dashboard stays in Arabic", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "ar", env)

    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Verify we're on Arabic dashboard
    expect(page.url()).toMatch(/\/ar\/dashboard/)

    // Logout
    await page.goto(`${schoolUrl}/api/auth/signout`)
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click()
    }
    await waitForRedirect(page)

    // Should still be in Arabic locale
    const finalUrl = page.url()
    expect(finalUrl).toMatch(/\/ar/)
  })
})
