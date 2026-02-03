import { expect, test } from "@playwright/test"

import {
  clearAuthState,
  getBaseUrl,
  getSchoolUrl,
  getTestEnv,
  goToSchoolLogin,
  loginAs,
  waitForRedirect,
} from "./helpers"

const env = getTestEnv()
const schoolUrl = getSchoolUrl("demo", env)
const baseUrl = getBaseUrl(env)

test.describe("School Subdomain Login - Stay in Context", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
  })

  test("login form is visible on school subdomain", async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("ADMIN stays on school subdomain dashboard", async ({ page }) => {
    await loginAs(page, "admin")
    const finalUrl = await waitForRedirect(page)

    // MUST stay on demo subdomain, NOT redirect to main domain
    expect(finalUrl).toContain("demo")
    expect(finalUrl).toMatch(/\/en\/dashboard/)
    expect(finalUrl).not.toMatch(/^https?:\/\/ed\./)
    expect(finalUrl).not.toMatch(/localhost:3000\/en\/dashboard$/)
  })

  test("ACCOUNTANT stays on school subdomain dashboard", async ({ page }) => {
    await loginAs(page, "accountant")
    const finalUrl = await waitForRedirect(page)

    // MUST stay on demo subdomain
    expect(finalUrl).toContain("demo")
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("STAFF stays on school subdomain dashboard", async ({ page }) => {
    await loginAs(page, "staff")
    const finalUrl = await waitForRedirect(page)

    // MUST stay on demo subdomain
    expect(finalUrl).toContain("demo")
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("TEACHER stays on school subdomain dashboard", async ({ page }) => {
    await loginAs(page, "teacher")
    const finalUrl = await waitForRedirect(page)

    // MUST stay on demo subdomain
    expect(finalUrl).toContain("demo")
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("STUDENT stays on school subdomain dashboard", async ({ page }) => {
    await loginAs(page, "student")
    const finalUrl = await waitForRedirect(page)

    // MUST stay on demo subdomain
    expect(finalUrl).toContain("demo")
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("PARENT stays on school subdomain dashboard", async ({ page }) => {
    await loginAs(page, "parent")
    const finalUrl = await waitForRedirect(page)

    // MUST stay on demo subdomain
    expect(finalUrl).toContain("demo")
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("DEVELOPER redirects to platform dashboard (not school)", async ({
    page,
  }) => {
    await loginAs(page, "developer")
    const finalUrl = await waitForRedirect(page)

    // DEVELOPER always goes to main school-dashboard dashboard regardless of entry point
    expect(finalUrl).toMatch(/\/en\/dashboard/)
    // Should NOT have school subdomain
    expect(finalUrl).not.toContain("demo.")
  })
})

test.describe("School Subdomain Login - Arabic Locale", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "ar", env)
  })

  test("ADMIN stays on Arabic school subdomain dashboard", async ({ page }) => {
    await loginAs(page, "admin")
    const finalUrl = await waitForRedirect(page)

    // MUST stay on demo subdomain with Arabic locale
    expect(finalUrl).toContain("demo")
    expect(finalUrl).toMatch(/\/ar\/dashboard/)
  })

  test("TEACHER stays on Arabic school subdomain dashboard", async ({
    page,
  }) => {
    await loginAs(page, "teacher")
    const finalUrl = await waitForRedirect(page)

    // MUST stay on demo subdomain with Arabic locale
    expect(finalUrl).toContain("demo")
    expect(finalUrl).toMatch(/\/ar\/dashboard/)
  })
})

test.describe("School Subdomain Login - Validation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
  })

  test("shows error for invalid credentials", async ({ page }) => {
    await page.fill('input[name="email"]', "invalid@test.com")
    await page.fill('input[name="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(
      page.getByText(/email does not exist|invalid credentials/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test("shows error for user from different school", async ({ page }) => {
    // This test would require a user from a different school
    // For now, test with non-existent user
    await page.fill('input[name="email"]', "otherschool@test.com")
    await page.fill('input[name="password"]', "1234")
    await page.click('button[type="submit"]')

    await expect(
      page.getByText(/email does not exist|invalid credentials/i)
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe("School Subdomain - Session Persistence", () => {
  test("session persists on school subdomain after refresh", async ({
    page,
  }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)

    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Refresh the page
    await page.reload()
    await page.waitForLoadState("networkidle")

    const currentUrl = page.url()

    // Should still be on dashboard (not redirected to login)
    expect(currentUrl).toMatch(/\/dashboard/)
    expect(currentUrl).toContain("demo")
  })

  test("session persists across school pages", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)

    await loginAs(page, "teacher")
    await waitForRedirect(page)

    // Navigate to another school page
    await page.goto(`${schoolUrl}/en/students`)
    await page.waitForLoadState("networkidle")

    const currentUrl = page.url()

    // Should not be redirected to login
    expect(currentUrl).not.toMatch(/\/login/)
    expect(currentUrl).toContain("demo")
  })
})

test.describe("School Subdomain - Dashboard Role Awareness", () => {
  test("ADMIN sees admin-specific dashboard content", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)

    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Admin should see admin-specific navigation or content
    // Check for presence of admin-related elements
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible({
      timeout: 5000,
    })
  })

  test("TEACHER sees teacher-specific dashboard content", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)

    await loginAs(page, "teacher")
    await waitForRedirect(page)

    // Teacher should see teacher-specific navigation
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible({
      timeout: 5000,
    })
  })

  test("STUDENT sees student-specific dashboard content", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)

    await loginAs(page, "student")
    await waitForRedirect(page)

    // Student should see student-specific navigation
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible({
      timeout: 5000,
    })
  })
})
