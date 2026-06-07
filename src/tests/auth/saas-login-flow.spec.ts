import { expect, test } from "@playwright/test"

/**
 * Epic 7: SaaS Marketing Login Flow Tests
 *
 * Tests the login flow from SaaS marketing (ed.databayt.org / localhost:3000)
 *
 * CRITICAL BEHAVIOR:
 * - Login button → After auth → STAY on SaaS marketing (not redirect to onboarding)
 * - "Get Started" button → After auth → Go to /onboarding
 */

test.describe("SaaS Marketing Login Flow", () => {
  // Test: SaaS Login stays on SaaS marketing
  test("Login button should keep user on SaaS marketing after authentication", async ({
    page,
  }) => {
    // Go to SaaS marketing (main domain)
    await page.goto("/en")

    // Verify we're on SaaS marketing
    await expect(page).toHaveURL(/\/en$/)

    // Click login button (should have ?context=saas)
    const loginLink = page.locator('a[href*="/login"]').first()
    const loginHref = await loginLink.getAttribute("href")

    // Verify context param is present
    expect(loginHref).toContain("context=saas")

    // Click and navigate to login
    await loginLink.click()
    await expect(page).toHaveURL(/\/en\/login/)

    // Fill in login form with test user (user without school)
    await page.fill('input[name="email"]', "user@databayt.org")
    await page.fill('input[name="password"]', "1234")

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for redirect to complete
    await page.waitForURL(/\/en$/, { timeout: 10000 })

    // Should stay on SaaS marketing, NOT go to /onboarding
    const currentUrl = page.url()
    expect(currentUrl).not.toContain("/onboarding")
    expect(currentUrl).toMatch(/\/en\/?$/)
  })

  // Test: Get Started goes to onboarding
  test("Get Started button should redirect to onboarding after authentication", async ({
    page,
  }) => {
    // Go to SaaS marketing
    await page.goto("/en")

    // Find and click "Get Started" button in hero section
    const getStartedLink = page.locator('a[href*="/onboarding"]').first()
    await expect(getStartedLink).toBeVisible()

    await getStartedLink.click()

    // Should be redirected to login with callbackUrl=/onboarding
    await expect(page).toHaveURL(/\/en\/login.*callbackUrl.*onboarding/)

    // Fill in login form
    await page.fill('input[name="email"]', "user@databayt.org")
    await page.fill('input[name="password"]', "1234")

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to onboarding after login
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
  })

  // Test: DEVELOPER can access SaaS dashboard
  test("DEVELOPER should be able to access SaaS dashboard", async ({
    page,
  }) => {
    // Go to login directly with dashboard callback
    await page.goto("/en/login?callbackUrl=/en/dashboard")

    // Login as DEVELOPER
    await page.fill('input[name="email"]', "dev@databayt.org")
    await page.fill('input[name="password"]', "1234")
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })

    // Should NOT see access denied
    const url = page.url()
    expect(url).not.toContain("access-denied")
  })

  // Test: Non-DEVELOPER without school cannot access SaaS dashboard
  test("User without school should be denied SaaS dashboard access", async ({
    page,
  }) => {
    // Go to login directly with dashboard callback
    await page.goto("/en/login?callbackUrl=/en/dashboard")

    // Login as user without school
    await page.fill('input[name="email"]', "user@databayt.org")
    await page.fill('input[name="password"]', "1234")
    await page.click('button[type="submit"]')

    // Should redirect to access-denied
    await page.waitForURL(/\/access-denied/, { timeout: 10000 })
  })
})
