import { expect, test } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const DEVELOPER = {
  email: "dev@databayt.org",
  password: "1234",
}

test.describe("DEVELOPER SaaS Dashboard Access", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip mobile viewports - login link is in hamburger menu
    if (testInfo.project.name.includes("mobile")) {
      test.skip()
    }
    // Clear cookies to ensure fresh state
    await page.context().clearCookies()
  })

  test("Scenario 1: DEVELOPER logs in from SaaS marketing → redirects to /dashboard", async ({
    page,
  }) => {
    // 1. Go to SaaS marketing page
    await page.goto(`${BASE_URL}/en`)
    await page.waitForLoadState("domcontentloaded")

    // 2. Click login button (user icon in header)
    const loginLink = page.locator('a[href*="/login"]').first()
    await loginLink.click()
    await page.waitForURL(/\/login/)

    // 3. Fill in DEVELOPER credentials
    const emailInput = page.getByRole("textbox", { name: /email/i })
    await emailInput.waitFor({ state: "visible", timeout: 10000 })
    await emailInput.fill(DEVELOPER.email)

    const passwordInput = page.getByRole("textbox", { name: /password/i })
    await passwordInput.fill(DEVELOPER.password)

    // 4. Submit login
    await page.getByRole("button", { name: /login/i }).click()

    // 5. Should redirect to /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    expect(page.url()).toContain("/dashboard")
  })

  test("Scenario 2: DEVELOPER accesses /dashboard directly → lands on /dashboard", async ({
    page,
  }) => {
    // 1. Try to access dashboard directly (unauthenticated)
    await page.goto(`${BASE_URL}/en/dashboard`)

    // 2. Should redirect to login with callbackUrl
    await page.waitForURL(/\/login.*callbackUrl/, { timeout: 10000 })
    expect(page.url()).toContain("callbackUrl")

    // 3. Fill in DEVELOPER credentials
    const emailInput = page.getByRole("textbox", { name: /email/i })
    await emailInput.waitFor({ state: "visible", timeout: 10000 })
    await emailInput.fill(DEVELOPER.email)

    const passwordInput = page.getByRole("textbox", { name: /password/i })
    await passwordInput.fill(DEVELOPER.password)

    // 4. Submit login
    await page.getByRole("button", { name: /login/i }).click()

    // 5. Should redirect back to /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    expect(page.url()).toContain("/dashboard")
  })
})
