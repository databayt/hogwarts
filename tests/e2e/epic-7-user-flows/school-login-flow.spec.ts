import { expect, test } from "@playwright/test"

/**
 * Epic 7: School Marketing Login Flow Tests
 *
 * Tests the login flow from School marketing (demo.databayt.org / demo.localhost:3000)
 *
 * CRITICAL BEHAVIOR:
 * - Login button → After auth → STAY on school marketing (not redirect anywhere)
 * - Platform link → After auth → /dashboard (if school member) or access-denied (if not)
 */

const SCHOOL_BASE_URL = "http://demo.localhost:3000"

test.describe("School Marketing Login Flow", () => {
  // Test: School Login stays on school marketing
  test("Login button should keep user on school marketing after authentication", async ({
    page,
  }) => {
    // Go to school marketing (subdomain)
    await page.goto(`${SCHOOL_BASE_URL}/en`)

    // Verify we're on school marketing
    await expect(page).toHaveURL(/demo\.localhost:3000\/en/)

    // Find login button (should have ?context=school&subdomain=demo)
    const loginLink = page.locator('a[href*="/login"]').first()
    const loginHref = await loginLink.getAttribute("href")

    // Verify context params are present
    expect(loginHref).toContain("context=school")
    expect(loginHref).toContain("subdomain=demo")

    // Click and navigate to login
    await loginLink.click()
    await expect(page).toHaveURL(/\/en\/login/)

    // Fill in login form with fresh user (no school)
    await page.fill('input[name="email"]', "user@databayt.org")
    await page.fill('input[name="password"]', "1234")

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for redirect to complete - should stay on school marketing
    await page.waitForURL(/demo\.localhost:3000\/en\/?$/, { timeout: 10000 })

    // Should NOT redirect to /onboarding or /dashboard
    const currentUrl = page.url()
    expect(currentUrl).not.toContain("/onboarding")
    expect(currentUrl).not.toContain("/dashboard")
  })

  // Test: School member can access Platform
  test("School member clicking Platform should access dashboard", async ({
    page,
  }) => {
    // Go to school marketing
    await page.goto(`${SCHOOL_BASE_URL}/en`)

    // Click Platform link (protected route)
    const platformLink = page.locator('a[href*="/dashboard"]').first()
    await platformLink.click()

    // Should redirect to login with callback to dashboard
    await expect(page).toHaveURL(/\/login.*callbackUrl.*dashboard/)

    // Login as school member (admin of demo school)
    await page.fill('input[name="email"]', "admin@databayt.org")
    await page.fill('input[name="password"]', "1234")
    await page.click('button[type="submit"]')

    // Should redirect to school dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })

    // Should NOT see access denied
    const url = page.url()
    expect(url).not.toContain("access-denied")
  })

  // Test: Non-member cannot access Platform
  test("Non-member clicking Platform should be denied access", async ({
    page,
  }) => {
    // Go to school marketing
    await page.goto(`${SCHOOL_BASE_URL}/en`)

    // Click Platform link
    const platformLink = page.locator('a[href*="/dashboard"]').first()
    await platformLink.click()

    // Should redirect to login with callback to dashboard
    await expect(page).toHaveURL(/\/login.*callbackUrl.*dashboard/)

    // Login as user without school
    await page.fill('input[name="email"]', "user@databayt.org")
    await page.fill('input[name="password"]', "1234")
    await page.click('button[type="submit"]')

    // Should redirect to access-denied
    await page.waitForURL(/\/access-denied/, { timeout: 10000 })
  })

  // Test: Member of DIFFERENT school cannot access Platform
  test("Member of different school should be denied access", async ({
    page,
  }) => {
    // This test requires a user who belongs to a different school
    // For now, we'll document this scenario and skip if test users aren't set up
    test.skip(
      true,
      "Requires test user belonging to a different school (not demo)"
    )

    // Expected behavior:
    // 1. Go to demo.localhost:3000/en (demo school marketing)
    // 2. Click Platform → login with callback to /dashboard
    // 3. Login as user from "other" school
    // 4. Should redirect to /access-denied (not demo dashboard)
  })

  // Test: DEVELOPER can access any school's Platform
  test("DEVELOPER should be able to access any school dashboard", async ({
    page,
  }) => {
    // Go to school marketing
    await page.goto(`${SCHOOL_BASE_URL}/en`)

    // Click Platform link
    const platformLink = page.locator('a[href*="/dashboard"]').first()
    await platformLink.click()

    // Login as DEVELOPER
    await page.fill('input[name="email"]', "dev@databayt.org")
    await page.fill('input[name="password"]', "1234")
    await page.click('button[type="submit"]')

    // Should redirect to dashboard (DEVELOPER has access to all schools)
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })

    // Should NOT see access denied
    const url = page.url()
    expect(url).not.toContain("access-denied")
  })
})
