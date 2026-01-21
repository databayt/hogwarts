import { expect, test } from "@playwright/test"

/**
 * Diagnostic Tests for Production Onboarding
 * Goal: Understand why pages are rendering blank
 */

const PRODUCTION_URL = "https://ed.databayt.org"

test.describe("Production Diagnostic - Onboarding", () => {
  test("diagnose onboarding landing page", async ({ page }) => {
    // Capture all network requests
    const requests: { url: string; status: number; method: string }[] = []
    const consoleMessages: { type: string; text: string }[] = []
    const pageErrors: string[] = []

    page.on("request", (req) => {
      requests.push({
        url: req.url(),
        status: 0,
        method: req.method(),
      })
    })

    page.on("response", (res) => {
      const idx = requests.findIndex((r) => r.url === res.url())
      if (idx >= 0) {
        requests[idx].status = res.status()
      }
    })

    page.on("console", (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      })
    })

    page.on("pageerror", (err) => {
      pageErrors.push(err.message)
    })

    // Navigate to onboarding
    console.log("\n🔍 Testing: " + PRODUCTION_URL + "/en/onboarding")
    const response = await page.goto(`${PRODUCTION_URL}/en/onboarding`, {
      waitUntil: "domcontentloaded",
    })

    console.log("\n📊 Response Status: " + response?.status())
    console.log("📊 Final URL: " + page.url())

    // Wait for full load
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      console.log("⚠️ Network did not reach idle state")
    })

    // Get page HTML
    const bodyHtml = await page.evaluate(() => document.body.innerHTML)
    const htmlLength = bodyHtml.length

    console.log("\n📄 Body HTML length: " + htmlLength + " characters")

    if (htmlLength < 100) {
      console.log("🚨 CRITICAL: Page body is nearly empty!")
      console.log("Body content: " + bodyHtml.substring(0, 500))
    }

    // Check for specific elements
    const h1Count = await page.locator("h1").count()
    const divCount = await page.locator("div").count()
    const buttonCount = await page.locator("button").count()
    const formCount = await page.locator("form").count()

    console.log("\n📋 Element Counts:")
    console.log("  h1: " + h1Count)
    console.log("  div: " + divCount)
    console.log("  button: " + buttonCount)
    console.log("  form: " + formCount)

    // Check for error indicators
    const hasError = await page
      .getByText(/error|exception|500|503|something went wrong|not found|404/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    console.log("\n🚨 Error indicators visible: " + hasError)

    // Check for React hydration issues
    const hasHydrationError = consoleMessages.some(
      (m) =>
        m.text.includes("Hydration") ||
        m.text.includes("Server Error") ||
        m.text.includes("ChunkLoadError")
    )

    console.log("🔄 Hydration errors detected: " + hasHydrationError)

    // Output failed requests
    const failedRequests = requests.filter(
      (r) => r.status >= 400 || r.status === 0
    )
    if (failedRequests.length > 0) {
      console.log("\n❌ Failed Requests:")
      failedRequests.forEach((r) => {
        console.log(`  ${r.method} ${r.status}: ${r.url}`)
      })
    }

    // Output console errors
    const errors = consoleMessages.filter((m) => m.type === "error")
    if (errors.length > 0) {
      console.log("\n⚠️ Console Errors:")
      errors.forEach((e) => {
        console.log(`  ${e.text}`)
      })
    }

    // Output page errors
    if (pageErrors.length > 0) {
      console.log("\n💥 Page Errors:")
      pageErrors.forEach((e) => {
        console.log(`  ${e}`)
      })
    }

    // Take a full-page screenshot
    await page.screenshot({
      path: "test-results/diagnostic-onboarding-landing.png",
      fullPage: true,
    })

    // Test basic assertions
    expect(response?.status()).toBeLessThan(500)
    expect(htmlLength).toBeGreaterThan(100)
  })

  test("diagnose homepage redirect behavior", async ({ page }) => {
    console.log("\n🔍 Testing: " + PRODUCTION_URL + " (homepage)")

    const response = await page.goto(PRODUCTION_URL, {
      waitUntil: "domcontentloaded",
    })

    console.log("📊 Response Status: " + response?.status())
    console.log("📊 Final URL: " + page.url())

    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      console.log("⚠️ Network did not reach idle state")
    })

    const bodyHtml = await page.evaluate(() => document.body.innerHTML)
    console.log("📄 Body HTML length: " + bodyHtml.length + " characters")

    // Check where homepage redirects
    const finalUrl = page.url()
    console.log("🔗 Final URL after redirects: " + finalUrl)

    await page.screenshot({
      path: "test-results/diagnostic-homepage.png",
      fullPage: true,
    })

    expect(response?.status()).toBeLessThan(500)
  })

  test("diagnose /ar/onboarding (Arabic)", async ({ page }) => {
    console.log("\n🔍 Testing: " + PRODUCTION_URL + "/ar/onboarding")

    const response = await page.goto(`${PRODUCTION_URL}/ar/onboarding`, {
      waitUntil: "domcontentloaded",
    })

    console.log("📊 Response Status: " + response?.status())
    console.log("📊 Final URL: " + page.url())

    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      console.log("⚠️ Network did not reach idle state")
    })

    const bodyHtml = await page.evaluate(() => document.body.innerHTML)
    console.log("📄 Body HTML length: " + bodyHtml.length + " characters")

    // Check RTL
    const htmlDir = await page.locator("html").getAttribute("dir")
    console.log("📐 HTML dir attribute: " + htmlDir)

    await page.screenshot({
      path: "test-results/diagnostic-arabic-onboarding.png",
      fullPage: true,
    })

    expect(response?.status()).toBeLessThan(500)
  })

  test("diagnose login page for comparison", async ({ page }) => {
    console.log("\n🔍 Testing: " + PRODUCTION_URL + "/en/login (comparison)")

    const response = await page.goto(`${PRODUCTION_URL}/en/login`, {
      waitUntil: "domcontentloaded",
    })

    console.log("📊 Response Status: " + response?.status())
    console.log("📊 Final URL: " + page.url())

    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      console.log("⚠️ Network did not reach idle state")
    })

    const bodyHtml = await page.evaluate(() => document.body.innerHTML)
    console.log("📄 Body HTML length: " + bodyHtml.length + " characters")

    // Check for login form elements
    const emailInput = await page.locator('input[name="email"]').isVisible()
    const passwordInput = await page
      .locator('input[name="password"]')
      .isVisible()
    const submitBtn = await page.locator('button[type="submit"]').isVisible()

    console.log("📋 Login form elements:")
    console.log("  Email input visible: " + emailInput)
    console.log("  Password input visible: " + passwordInput)
    console.log("  Submit button visible: " + submitBtn)

    await page.screenshot({
      path: "test-results/diagnostic-login.png",
      fullPage: true,
    })

    expect(response?.status()).toBeLessThan(500)
    expect(bodyHtml.length).toBeGreaterThan(1000)
  })

  test("test API health endpoint", async ({ request }) => {
    console.log("\n🔍 Testing API health...")

    // Test common health endpoints
    const endpoints = [
      "/api/health",
      "/api/onboarding/validate-access",
      "/api/auth/session",
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`${PRODUCTION_URL}${endpoint}`)
        console.log(`📊 ${endpoint}: Status ${response.status()}`)
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error}`)
      }
    }
  })
})
