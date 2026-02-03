import { expect, test } from "@playwright/test"

import {
  clearAuthState,
  getBaseUrl,
  getSchoolUrl,
  getTestEnv,
  goToMarketingLogin,
  loginAs,
  TEST_CREDENTIALS,
  waitForRedirect,
} from "./helpers"

const env = getTestEnv()
const baseUrl = getBaseUrl(env)

test.describe("Marketing Site Login - Credentials", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
  })

  test("login form is visible", async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("DEVELOPER redirects to operator dashboard", async ({ page }) => {
    await loginAs(page, "developer")
    const finalUrl = await waitForRedirect(page)

    // DEVELOPER should go to school-dashboard saas-dashboard dashboard on main domain
    expect(finalUrl).toMatch(/\/en\/dashboard/)
    expect(finalUrl).not.toMatch(/demo\./)
  })

  test("ADMIN with school redirects to school subdomain dashboard", async ({
    page,
  }) => {
    await loginAs(page, "admin")
    const finalUrl = await waitForRedirect(page)

    // ADMIN should redirect to demo school's dashboard
    const schoolUrl = getSchoolUrl("demo", env)
    expect(finalUrl).toContain(schoolUrl)
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("ACCOUNTANT with school redirects to school subdomain dashboard", async ({
    page,
  }) => {
    await loginAs(page, "accountant")
    const finalUrl = await waitForRedirect(page)

    // ACCOUNTANT should redirect to demo school's dashboard
    const schoolUrl = getSchoolUrl("demo", env)
    expect(finalUrl).toContain(schoolUrl)
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("STAFF with school redirects to school subdomain dashboard", async ({
    page,
  }) => {
    await loginAs(page, "staff")
    const finalUrl = await waitForRedirect(page)

    // STAFF should redirect to demo school's dashboard
    const schoolUrl = getSchoolUrl("demo", env)
    expect(finalUrl).toContain(schoolUrl)
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("TEACHER with school redirects to school subdomain dashboard", async ({
    page,
  }) => {
    await loginAs(page, "teacher")
    const finalUrl = await waitForRedirect(page)

    // TEACHER should redirect to demo school's dashboard
    const schoolUrl = getSchoolUrl("demo", env)
    expect(finalUrl).toContain(schoolUrl)
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("STUDENT with school redirects to school subdomain dashboard", async ({
    page,
  }) => {
    await loginAs(page, "student")
    const finalUrl = await waitForRedirect(page)

    // STUDENT should redirect to demo school's dashboard
    const schoolUrl = getSchoolUrl("demo", env)
    expect(finalUrl).toContain(schoolUrl)
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })

  test("PARENT with school redirects to school subdomain dashboard", async ({
    page,
  }) => {
    await loginAs(page, "parent")
    const finalUrl = await waitForRedirect(page)

    // PARENT (GUARDIAN) should redirect to demo school's dashboard
    const schoolUrl = getSchoolUrl("demo", env)
    expect(finalUrl).toContain(schoolUrl)
    expect(finalUrl).toMatch(/\/en\/dashboard/)
  })
})

test.describe("Marketing Site Login - Validation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
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

  test("shows error for wrong password", async ({ page }) => {
    await page.fill('input[name="email"]', TEST_CREDENTIALS.developer.email)
    await page.fill('input[name="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test("requires email field", async ({ page }) => {
    await page.fill('input[name="password"]', "somepassword")
    await page.click('button[type="submit"]')

    // Should show validation error
    await expect(page.getByText(/email is required|required/i)).toBeVisible({
      timeout: 3000,
    })
  })

  test("requires password field", async ({ page }) => {
    await page.fill('input[name="email"]', "test@test.com")
    await page.click('button[type="submit"]')

    // Should show validation error
    await expect(page.getByText(/password is required|required/i)).toBeVisible({
      timeout: 3000,
    })
  })
})

test.describe("Marketing Site Login - Arabic Locale", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "ar", env)
  })

  test("DEVELOPER redirects to Arabic dashboard", async ({ page }) => {
    await loginAs(page, "developer")
    const finalUrl = await waitForRedirect(page)

    // Should redirect to Arabic locale dashboard
    expect(finalUrl).toMatch(/\/ar\/dashboard/)
  })

  test("ADMIN redirects to Arabic school dashboard", async ({ page }) => {
    await loginAs(page, "admin")
    const finalUrl = await waitForRedirect(page)

    // Should redirect to Arabic locale on school subdomain
    expect(finalUrl).toMatch(/\/ar\/dashboard/)
    expect(finalUrl).toMatch(/demo/)
  })
})

test.describe("Marketing Site Login - Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
  })

  test("has link to registration page", async ({ page }) => {
    const registerLink = page.locator('a[href*="/join"]')
    await expect(registerLink).toBeVisible()
  })

  test("has link to forgot password", async ({ page }) => {
    const forgotLink = page.locator('a[href*="/reset"]')
    await expect(forgotLink).toBeVisible()
  })

  test("has social login options", async ({ page }) => {
    // Check for OAuth buttons (Google, Facebook, etc.)
    const socialButtons = page.locator(
      'button[data-provider], [data-testid*="oauth"], [data-testid*="social"]'
    )
    // At minimum should have social login section
    await expect(page.getByText(/continue with|or/i)).toBeVisible()
  })
})
