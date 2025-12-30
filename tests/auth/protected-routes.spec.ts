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

test.describe("Protected Routes - Unauthenticated Access", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("dashboard redirects to login with callback", async ({ page }) => {
    await page.goto(`${baseUrl}/en/dashboard`)
    await waitForRedirect(page)

    const finalUrl = page.url()

    // Should redirect to login with callback URL
    expect(finalUrl).toMatch(/\/login/)
    expect(finalUrl).toMatch(/callbackUrl=/)
  })

  test("school dashboard redirects to school login", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/dashboard`)
    await waitForRedirect(page)

    const finalUrl = page.url()

    // Should redirect to login on the school subdomain
    expect(finalUrl).toMatch(/\/login/)
    expect(finalUrl).toContain("demo")
  })

  test("protected school pages redirect to login", async ({ page }) => {
    // Test various protected routes
    const protectedPaths = [
      "/en/students",
      "/en/teachers",
      "/en/attendance",
      "/en/grades",
      "/en/finance",
    ]

    for (const path of protectedPaths) {
      await page.goto(`${schoolUrl}${path}`)
      await waitForRedirect(page)

      const finalUrl = page.url()

      // Should redirect to login
      expect(finalUrl).toMatch(/\/login/)
      // Should stay on school subdomain
      expect(finalUrl).toContain("demo")
    }
  })

  test("callback URL is preserved through login", async ({ page }) => {
    // Try to access a protected route
    await page.goto(`${schoolUrl}/en/students`)
    await waitForRedirect(page)

    // Should be on login with callback
    expect(page.url()).toMatch(/\/login.*callbackUrl=/)

    // Login
    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Should redirect to the original requested page (or dashboard)
    const finalUrl = page.url()
    expect(finalUrl).toMatch(/\/(students|dashboard)/)
  })
})

test.describe("Protected Routes - Role-Based Access", () => {
  test("ADMIN can access admin routes", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Admin should have access to admin routes
    await page.goto(`${schoolUrl}/en/students`)
    await page.waitForLoadState("networkidle")

    // Should not be redirected to login or unauthorized
    expect(page.url()).not.toMatch(/\/login/)
    expect(page.url()).not.toMatch(/unauthorized|403/)
  })

  test("TEACHER can access teacher routes", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)

    // Teacher should have access to class-related routes
    await page.goto(`${schoolUrl}/en/attendance`)
    await page.waitForLoadState("networkidle")

    // Should have access (might show different content based on permissions)
    expect(page.url()).toContain("/attendance")
  })

  test("STUDENT has limited access", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)

    // Student can access their dashboard
    expect(page.url()).toMatch(/\/dashboard/)

    // Try to access admin-only route
    await page.goto(`${schoolUrl}/en/admin`)
    await page.waitForLoadState("networkidle")

    // Should be denied or redirected
    const finalUrl = page.url()
    expect(
      finalUrl.includes("/dashboard") ||
        finalUrl.includes("/unauthorized") ||
        finalUrl.includes("/403") ||
        !finalUrl.includes("/admin")
    ).toBe(true)
  })

  test("DEVELOPER can access platform dashboard", async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
    await loginAs(page, "developer")
    await waitForRedirect(page)

    // DEVELOPER should be on main platform dashboard
    expect(page.url()).toMatch(/\/dashboard/)
    expect(page.url()).not.toContain("demo.")
  })
})

test.describe("Protected Routes - Cross-School Access", () => {
  test("user cannot access different school subdomain", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Verify logged in to demo school
    expect(page.url()).toContain("demo")

    // Try to access a different school (hypothetical)
    // Since we only have "demo" school, this test verifies the pattern
    const otherSchoolUrl = getSchoolUrl("other", env)
    await page.goto(`${otherSchoolUrl}/en/dashboard`)
    await page.waitForLoadState("networkidle")

    const finalUrl = page.url()

    // Should be denied access, redirected, or shown error
    // The exact behavior depends on implementation
    expect(
      finalUrl.includes("/login") ||
        finalUrl.includes("/unauthorized") ||
        finalUrl.includes("/403") ||
        finalUrl.includes("demo") // Redirected back to own school
    ).toBe(true)
  })

  test("DEVELOPER can access any school", async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
    await loginAs(page, "developer")
    await waitForRedirect(page)

    // DEVELOPER should be able to access school subdomain
    await page.goto(`${schoolUrl}/en/dashboard`)
    await page.waitForLoadState("networkidle")

    // Should have access (DEVELOPER has platform-wide access)
    expect(page.url()).not.toMatch(/\/login/)
  })
})

test.describe("Protected Routes - API Routes", () => {
  test("API routes require authentication", async ({ page }) => {
    await clearAuthState(page)

    // Try to access an API route
    const response = await page.request.get(`${baseUrl}/api/user`)

    // Should return 401 or redirect
    expect([401, 302, 403]).toContain(response.status())
  })

  test("authenticated user can access API", async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
    await loginAs(page, "developer")
    await waitForRedirect(page)

    // Now try API access (session should be established)
    const response = await page.request.get(`${baseUrl}/api/auth/session`)

    // Should return 200 with session data
    expect(response.status()).toBe(200)
    const session = await response.json()
    expect(session.user).toBeDefined()
  })
})

test.describe("Protected Routes - Session Expiry", () => {
  test("expired session redirects to login", async ({ page, context }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
    await loginAs(page, "developer")
    await waitForRedirect(page)

    // Clear cookies to simulate session expiry
    await context.clearCookies()

    // Try to access protected route
    await page.goto(`${baseUrl}/en/dashboard`)
    await waitForRedirect(page)

    // Should redirect to login
    expect(page.url()).toMatch(/\/login/)
  })

  test("login redirect preserves original destination", async ({
    page,
    context,
  }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Clear cookies to simulate session expiry
    await context.clearCookies()

    // Try to access specific protected route
    await page.goto(`${schoolUrl}/en/students`)
    await waitForRedirect(page)

    // Should be on login with callback URL containing original destination
    expect(page.url()).toMatch(/\/login/)
    expect(page.url()).toMatch(/callbackUrl=/)

    // The callback URL should reference students
    const decodedUrl = decodeURIComponent(page.url())
    expect(decodedUrl).toMatch(/students/)
  })
})

test.describe("Protected Routes - Locale Consistency", () => {
  test("Arabic protected route maintains Arabic locale", async ({ page }) => {
    await clearAuthState(page)

    // Access Arabic protected route
    await page.goto(`${schoolUrl}/ar/dashboard`)
    await waitForRedirect(page)

    // Should redirect to Arabic login
    expect(page.url()).toMatch(/\/ar\/login/)
  })

  test("login maintains locale through authentication", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "ar", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Should be on Arabic dashboard
    expect(page.url()).toMatch(/\/ar\/dashboard/)
  })
})

test.describe("Protected Routes - Public Routes", () => {
  test("login page is accessible without auth", async ({ page }) => {
    await clearAuthState(page)
    await page.goto(`${baseUrl}/en/login`)

    // Should load without redirect
    expect(page.url()).toMatch(/\/login/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test("registration page is accessible without auth", async ({ page }) => {
    await clearAuthState(page)
    await page.goto(`${baseUrl}/en/join`)

    // Should load without redirect
    expect(page.url()).toMatch(/\/join/)
  })

  test("public marketing pages are accessible", async ({ page }) => {
    await clearAuthState(page)
    await page.goto(`${baseUrl}/en`)
    await page.waitForLoadState("networkidle")

    // Should not redirect to login
    expect(page.url()).not.toMatch(/\/login/)
  })

  test("school public page is accessible", async ({ page }) => {
    await clearAuthState(page)
    await page.goto(`${schoolUrl}/en`)
    await page.waitForLoadState("networkidle")

    // Should not redirect to login (school marketing page)
    expect(page.url()).not.toMatch(/\/login/)
  })
})
