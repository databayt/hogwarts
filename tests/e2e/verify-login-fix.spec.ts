/**
 * Quick Verification Tests - Login Flow Fix
 *
 * Verifies that DEVELOPER and USER login flows work correctly:
 * 1. DEVELOPER via Login button -> /dashboard
 * 2. USER via Login button -> stays on /en (NOT /onboarding, NOT /dashboard)
 *
 * NOTE: We navigate directly to /login?context=saas to simulate clicking the
 * login button from the SaaS marketing page. This is equivalent to clicking
 * the login icon which has href="/en/login?context=saas"
 */

import { expect, test } from "@playwright/test"

const SCREENSHOT_DIR = "/Users/abdout/hogwarts/screenshots/fix-verification"

test.describe("Login Flow Fix Verification", () => {
  test("Test 1: DEVELOPER via Login button -> /dashboard", async ({
    page,
    context,
  }) => {
    // 1. Clear cookies for fresh state
    await context.clearCookies()

    // 2. Go directly to login page with SaaS context (simulates clicking login from /en)
    // The login button on /en has href="/en/login?context=saas"
    await page.goto("/en/login?context=saas")
    await page.waitForLoadState("domcontentloaded")

    console.log("Step 1: Navigated to /en/login?context=saas")
    console.log(`Current URL: ${page.url()}`)

    // Take screenshot of login page
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/developer-login-page.png`,
      fullPage: true,
    })

    // 3. Fill in DEVELOPER credentials
    await page.waitForSelector('input[name="email"]', { timeout: 10000 })
    await page.fill('input[name="email"]', "dev@databayt.org")
    await page.fill('input[name="password"]', "1234")

    console.log("Step 2: Filled in credentials")

    // 4. Submit form
    await page.click('button[type="submit"]')

    // 5. Wait for navigation to complete
    await page.waitForLoadState("networkidle").catch(() => {})
    await page.waitForTimeout(3000) // Allow for any redirects

    const finalUrl = page.url()
    console.log("Step 3: After login")
    console.log(`FINAL URL: ${finalUrl}`)

    // 6. Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/developer-login-result.png`,
      fullPage: true,
    })

    // 7. Verify redirect to dashboard
    expect(finalUrl).toMatch(/\/dashboard/)
    expect(finalUrl).not.toContain("demo") // Should be SaaS dashboard, not school
    expect(finalUrl).not.toContain("onboarding")

    console.log("TEST 1 PASSED: DEVELOPER redirected to dashboard")
  })

  test("Test 2: USER via Login button -> stays on /en", async ({
    page,
    context,
  }) => {
    // 1. Clear cookies for fresh state (CRITICAL)
    await context.clearCookies()

    // Track all navigation events to diagnose redirect chain
    const navigationHistory: string[] = []
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        navigationHistory.push(frame.url())
        console.log(`Navigation: ${frame.url()}`)
      }
    })

    // 2. Go directly to login page with SaaS context (simulates clicking login from /en)
    await page.goto("/en/login?context=saas")
    await page.waitForLoadState("domcontentloaded")

    console.log("Step 1: Navigated to /en/login?context=saas")
    console.log(`Current URL: ${page.url()}`)

    // Take screenshot of login page
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/user-login-page.png`,
      fullPage: true,
    })

    // 3. Fill in USER credentials
    await page.waitForSelector('input[name="email"]', { timeout: 10000 })
    await page.fill('input[name="email"]', "user@databayt.org")
    await page.fill('input[name="password"]', "1234")

    console.log("Step 2: Filled in credentials")

    // 4. Submit form
    await page.click('button[type="submit"]')

    // 5. Wait for navigation to complete
    await page.waitForLoadState("networkidle").catch(() => {})
    await page.waitForTimeout(3000) // Allow for any redirects

    const finalUrl = page.url()
    console.log("Step 3: After login")
    console.log(`FINAL URL: ${finalUrl}`)
    console.log("Navigation history:", navigationHistory)

    // 6. Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/user-login-result.png`,
      fullPage: true,
    })

    // 7. Verify USER stays on /en (NOT /onboarding, NOT /dashboard)
    // Expected: /en (stay on SaaS marketing)
    console.log(`Expected: /en or /ar (stay on SaaS marketing)`)
    console.log(`Actual: ${finalUrl}`)
    console.log(`Navigation chain: ${navigationHistory.join(" -> ")}`)

    // Verify correct behavior after fix
    expect(finalUrl).not.toContain("/onboarding")
    expect(finalUrl).not.toContain("/dashboard")
    expect(finalUrl).toMatch(/\/(en|ar)\/?$/)

    console.log("TEST 2 PASSED: USER stays on SaaS marketing homepage")
  })
})
