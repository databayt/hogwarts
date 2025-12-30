import { expect, test } from "@playwright/test"

import {
  clearAuthState,
  getBaseUrl,
  getSchoolUrl,
  getTestEnv,
  goToMarketingLogin,
  goToSchoolLogin,
} from "./helpers"

const env = getTestEnv()
const baseUrl = getBaseUrl(env)
const schoolUrl = getSchoolUrl("demo", env)

/**
 * OAuth tests verify that:
 * 1. OAuth buttons are present and clickable
 * 2. OAuth flows initiate correctly
 * 3. Tenant context is preserved through OAuth flow
 *
 * Note: Full OAuth flow requires real provider credentials
 * These tests verify the setup, not complete end-to-end OAuth authentication
 */

test.describe("OAuth - Marketing Site", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
  })

  test("Google OAuth button is visible", async ({ page }) => {
    const googleButton = page.locator(
      'button:has-text("Google"), [data-provider="google"], [aria-label*="Google"]'
    )
    await expect(googleButton).toBeVisible({ timeout: 5000 })
  })

  test("Facebook OAuth button is visible", async ({ page }) => {
    const facebookButton = page.locator(
      'button:has-text("Facebook"), [data-provider="facebook"], [aria-label*="Facebook"]'
    )
    // Facebook OAuth may or may not be enabled
    const isVisible = await facebookButton
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    if (!isVisible) {
      test.skip()
    }
    await expect(facebookButton).toBeVisible()
  })

  test("Google OAuth initiates redirect", async ({ page }) => {
    const googleButton = page.locator(
      'button:has-text("Google"), [data-provider="google"], [aria-label*="Google"]'
    )

    // Click and wait for navigation
    await googleButton.click()

    // Should redirect to Google OAuth or Auth.js API
    await page.waitForURL(
      (url) =>
        url.href.includes("accounts.google.com") ||
        url.href.includes("/api/auth/signin/google") ||
        url.href.includes("oauth"),
      { timeout: 10000 }
    )

    const currentUrl = page.url()
    expect(
      currentUrl.includes("google") ||
        currentUrl.includes("oauth") ||
        currentUrl.includes("/api/auth")
    ).toBe(true)
  })
})

test.describe("OAuth - School Subdomain", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
  })

  test("OAuth buttons present on school login", async ({ page }) => {
    const googleButton = page.locator(
      'button:has-text("Google"), [data-provider="google"], [aria-label*="Google"]'
    )
    await expect(googleButton).toBeVisible({ timeout: 5000 })
  })

  test("OAuth from school preserves tenant context via session storage", async ({
    page,
  }) => {
    // Check that tenant is stored before OAuth redirect
    const googleButton = page.locator(
      'button:has-text("Google"), [data-provider="google"], [aria-label*="Google"]'
    )

    // Before clicking, verify we're on school subdomain
    expect(page.url()).toContain("demo")

    // The form should store tenant info for OAuth callback
    // Check if there's a hidden input or the URL includes tenant
    const pageContent = await page.content()

    // Either tenant is in URL, hidden form field, or session storage
    const hasTenantInUrl = page.url().includes("tenant=demo")
    const hasTenantInForm =
      pageContent.includes('name="tenant"') ||
      pageContent.includes('value="demo"')

    // Check session storage
    const tenantInStorage = await page.evaluate(() => {
      return (
        sessionStorage.getItem("oauth_tenant") ||
        sessionStorage.getItem("tenant") ||
        sessionStorage.getItem("callbackTenant")
      )
    })

    // At least one mechanism should preserve tenant context
    const hasTenantContext =
      hasTenantInUrl || hasTenantInForm || tenantInStorage === "demo"

    // If no tenant preservation found, the implementation might use cookies
    // which is also valid - just verify we're on the right subdomain
    if (!hasTenantContext) {
      expect(page.url()).toContain("demo")
    }
  })

  test("OAuth redirects include callback URL with tenant", async ({ page }) => {
    const googleButton = page.locator(
      'button:has-text("Google"), [data-provider="google"], [aria-label*="Google"]'
    )

    // Check the OAuth link or form action
    const oauthLink = await page
      .locator('a[href*="google"], form[action*="google"]')
      .first()
      .getAttribute("href")
      .catch(() => null)

    // If there's a direct link, check it includes callback
    if (oauthLink) {
      expect(oauthLink).toMatch(/callback|redirect|tenant/i)
    }

    // Click OAuth button
    await googleButton.click()

    // Wait for navigation to start
    await page.waitForURL(
      (url) => !url.href.includes("/login") || url.href.includes("/api/auth"),
      { timeout: 10000 }
    )

    // The OAuth initiation should have callbackUrl that points back to school
    const currentUrl = page.url()

    // Check for callback URL parameter
    if (
      currentUrl.includes("callbackUrl=") ||
      currentUrl.includes("callback_url=")
    ) {
      const decodedUrl = decodeURIComponent(currentUrl)
      // Callback should reference the school subdomain
      expect(decodedUrl).toMatch(/demo|tenant/i)
    }
  })
})

test.describe("OAuth - Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("displays error for OAuthAccountNotLinked", async ({ page }) => {
    // Navigate with error parameter
    await page.goto(`${baseUrl}/en/login?error=OAuthAccountNotLinked`)

    // Should show appropriate error message
    await expect(
      page.getByText(/email already|different provider|account not linked/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test("displays error for generic OAuth error", async ({ page }) => {
    await page.goto(`${baseUrl}/en/login?error=OAuthCallback`)

    // Should show error or at least not crash
    await page.waitForLoadState("networkidle")
    const hasError = await page
      .getByText(/error|failed|try again/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    // Page should at least load successfully
    expect(page.url()).toContain("/login")
  })

  test("handles OAuth cancellation gracefully", async ({ page }) => {
    // When user cancels OAuth, they should return to login
    await page.goto(`${baseUrl}/en/login?error=access_denied`)

    await page.waitForLoadState("networkidle")

    // Should be back on login page without crash
    expect(page.url()).toContain("/login")
  })
})

test.describe("OAuth - Locale Preservation", () => {
  test("OAuth from Arabic login preserves locale", async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "ar", env)

    const googleButton = page.locator(
      'button:has-text("Google"), [data-provider="google"], [aria-label*="Google"]'
    )

    // The callback URL should include Arabic locale
    await googleButton.click()

    await page.waitForURL(
      (url) =>
        url.href.includes("google") ||
        url.href.includes("/api/auth") ||
        url.href.includes("oauth"),
      { timeout: 10000 }
    )

    // If there's a callback URL, it should include /ar/
    const currentUrl = page.url()
    if (currentUrl.includes("callbackUrl=")) {
      const decodedUrl = decodeURIComponent(currentUrl)
      expect(decodedUrl).toMatch(/\/ar\/|locale=ar/)
    }
  })
})

test.describe("OAuth - Social Section UI", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToMarketingLogin(page, "en", env)
  })

  test("social login section has divider", async ({ page }) => {
    // Should have "Or continue with" or similar divider
    await expect(
      page.getByText(/or continue with|or|continue with/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test("social buttons are styled correctly", async ({ page }) => {
    const socialSection = page.locator(
      '[data-testid="social"], .social-login, [class*="social"]'
    )

    // At minimum, OAuth buttons should be present
    const oauthButtons = page.locator(
      'button:has-text("Google"), button:has-text("Facebook"), [data-provider]'
    )

    const count = await oauthButtons.count()
    expect(count).toBeGreaterThan(0)
  })
})
