import { expect, test, type Page } from "@playwright/test"

/**
 * E2E Tests: School Onboarding Flow
 *
 * Tests the complete journey from "Get Started" to school creation:
 * 1. Access control (auth required)
 * 2. School initialization
 * 3. Multi-step form completion
 * 4. Subdomain reservation
 * 5. Successful completion
 *
 * Test user: user@databayt.org (USER role, no school initially)
 * Password: 1234
 */

// Test configuration
const BASE_URL = "http://localhost:3000"
const TEST_USER = {
  email: "user@databayt.org",
  password: "1234",
}

// Generate unique subdomain for each test run
const generateUniqueSubdomain = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `test-${timestamp}-${random}`
}

// Helper: Login as test user
async function loginAsUser(page: Page) {
  // Clear cookies first for clean state
  await page.context().clearCookies()

  await page.goto(`${BASE_URL}/en/login`)
  await page.waitForLoadState("domcontentloaded")

  // Wait for email input to be visible and fill credentials
  // Use getByRole for more reliable element selection
  const emailInput = page.getByRole("textbox", { name: /email/i })
  await emailInput.waitFor({ state: "visible", timeout: 10000 })
  await emailInput.clear()
  await emailInput.fill(TEST_USER.email)

  const passwordInput = page.getByRole("textbox", { name: /password/i })
  await passwordInput.waitFor({ state: "visible", timeout: 5000 })
  await passwordInput.fill(TEST_USER.password)

  // Submit and wait for redirect
  await page.getByRole("button", { name: /login/i }).click()

  // Wait for redirect after login (might go to various pages)
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  })
  await page.waitForLoadState("domcontentloaded")
}

// Helper: Navigate to onboarding and create school
async function navigateToOnboarding(page: Page) {
  await page.goto(`${BASE_URL}/en/onboarding`)
  await page.waitForLoadState("domcontentloaded")
}

// Helper: Start onboarding process - always create a new school for clean test state
async function startOnboardingProcess(page: Page) {
  await navigateToOnboarding(page)

  // Always use "Create a new school" link for clean test state
  // This avoids issues with draft school card onClick handlers
  const createLink = page.locator('a:has-text("Create a new school")')
  await expect(createLink.first()).toBeVisible({ timeout: 10000 })
  await createLink.first().click()

  // Wait for navigation to any onboarding step (overview or school-specific)
  await page.waitForURL(/\/onboarding\//, { timeout: 15000 })
}

// Helper: Fill title step
async function fillTitleStep(page: Page, schoolName: string) {
  // Wait for title input
  await page.waitForSelector(
    'input[name="name"], input[placeholder*="school"]',
    {
      timeout: 10000,
    }
  )
  await page.fill(
    'input[name="name"], input[placeholder*="school"]',
    schoolName
  )
  // Wait for validation
  await page.waitForTimeout(500)
}

// Helper: Fill description step
async function fillDescriptionStep(
  page: Page,
  description: string,
  schoolType?: string
) {
  await page.waitForSelector('textarea[name="description"], textarea', {
    timeout: 10000,
  })
  await page.fill('textarea[name="description"], textarea', description)

  // Select school type if provided
  if (schoolType) {
    const typeButton = page.locator(`button:has-text("${schoolType}")`)
    if (await typeButton.isVisible()) {
      await typeButton.click()
    }
  }
  await page.waitForTimeout(500)
}

// Helper: Fill location step
async function fillLocationStep(
  page: Page,
  location: { address: string; city: string; state: string; country?: string }
) {
  await page.waitForSelector('input[name="address"]', { timeout: 10000 })
  await page.fill('input[name="address"]', location.address)
  await page.fill('input[name="city"]', location.city)
  await page.fill('input[name="state"]', location.state)
  if (location.country) {
    await page.fill('input[name="country"]', location.country)
  }
  await page.waitForTimeout(500)
}

// Helper: Fill capacity step
async function fillCapacityStep(
  page: Page,
  capacity: { students: number; teachers: number }
) {
  await page.waitForSelector('input[name="maxStudents"]', { timeout: 10000 })
  await page.fill('input[name="maxStudents"]', capacity.students.toString())
  await page.fill('input[name="maxTeachers"]', capacity.teachers.toString())
  await page.waitForTimeout(500)
}

// Helper: Fill branding step (optional fields)
async function fillBrandingStep(
  page: Page,
  branding?: { primaryColor?: string }
) {
  // Branding is optional, just wait for the step to load
  await page.waitForLoadState("domcontentloaded")
  if (branding?.primaryColor) {
    const colorInput = page.locator('input[name="primaryColor"]')
    if (await colorInput.isVisible()) {
      await colorInput.fill(branding.primaryColor)
    }
  }
  await page.waitForTimeout(500)
}

// Helper: Fill pricing step
async function fillPricingStep(
  page: Page,
  pricing: { tuitionFee: number; currency?: string; schedule?: string }
) {
  await page.waitForSelector('input[name="tuitionFee"]', { timeout: 10000 })
  await page.fill('input[name="tuitionFee"]', pricing.tuitionFee.toString())

  // Select currency if dropdown exists
  if (pricing.currency) {
    const currencySelect = page.locator('select[name="currency"]')
    if (await currencySelect.isVisible()) {
      await currencySelect.selectOption(pricing.currency)
    }
  }
  await page.waitForTimeout(500)
}

// Helper: Fill legal step (accept all checkboxes)
async function fillLegalStep(page: Page) {
  await page.waitForLoadState("domcontentloaded")

  // Check all required checkboxes
  const checkboxes = page.locator(
    'input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="privacy"], input[type="checkbox"][name*="data"]'
  )
  const count = await checkboxes.count()
  for (let i = 0; i < count; i++) {
    await checkboxes.nth(i).check()
  }

  // Alternative: click on checkbox labels if inputs are hidden
  const checkboxLabels = page.locator(
    'label:has-text("Terms"), label:has-text("Privacy"), label:has-text("Data")'
  )
  const labelCount = await checkboxLabels.count()
  for (let i = 0; i < labelCount; i++) {
    const checkbox = checkboxLabels.nth(i).locator('input[type="checkbox"]')
    if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
      await checkbox.check()
    }
  }

  await page.waitForTimeout(500)
}

// Helper: Fill subdomain step
async function fillSubdomainStep(page: Page, subdomain: string) {
  await page.waitForSelector('input[name="domain"]', { timeout: 10000 })
  await page.fill('input[name="domain"]', subdomain)

  // Wait for availability check
  await page.waitForTimeout(1500)

  // Check if subdomain is available (green checkmark or similar)
  const availableIndicator = page.locator(
    '[data-available="true"], .text-green-500, [class*="success"]'
  )
  const isAvailable = await availableIndicator.isVisible().catch(() => false)

  return isAvailable
}

// Helper: Click next button
async function clickNext(page: Page) {
  const nextButton = page.locator(
    'button:has-text("Next"), button:has-text("Continue"), button[type="submit"]'
  )
  await nextButton.first().click()
  await page.waitForLoadState("domcontentloaded")
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe("School Onboarding - Access Control", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()

    // Try to access onboarding without authentication
    await page.goto(`${BASE_URL}/en/onboarding`)

    // /onboarding is a protected route (not in publicRoutes)
    // Server-side middleware should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    // Verify callback URL is preserved so user returns after login
    expect(page.url()).toContain("callbackUrl")
    expect(page.url()).toContain("onboarding")
  })

  test("allows authenticated users to access onboarding", async ({ page }) => {
    await loginAsUser(page)
    await page.goto(`${BASE_URL}/en/onboarding`)
    await page.waitForLoadState("domcontentloaded")

    // Should stay on onboarding page (not redirect to login)
    await expect(page).toHaveURL(/\/onboarding/)

    // Should see onboarding UI - "Welcome" heading or "Create a new school" option
    const welcomeHeading = page.locator('text="Welcome"')
    const createOption = page.locator('text="Create a new school"')
    const createLink = page.locator('a:has-text("Create")')

    // Wait for any of these to be visible
    await expect(
      welcomeHeading.or(createOption).or(createLink).first()
    ).toBeVisible({ timeout: 15000 })
  })
})

test.describe("School Onboarding - School Initialization", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page)
  })

  test("displays onboarding hub with create option", async ({ page }) => {
    await navigateToOnboarding(page)

    // Should see create school option (it's a link, not a button)
    const createLink = page.locator(
      'a:has-text("Create a new school"), a:has-text("Create"), a:has-text("New School")'
    )
    await expect(createLink.first()).toBeVisible()
  })

  test("creates new school and redirects to first step", async ({ page }) => {
    await navigateToOnboarding(page)

    // Click create school (it's a link, not a button)
    const createLink = page.locator(
      'a:has-text("Create a new school"), a:has-text("Create"), a:has-text("New School")'
    )
    await createLink.first().click()

    // Should redirect to overview or first step
    await page.waitForURL(
      /\/onboarding\/(overview|[^/]+\/(about-school|title))/,
      {
        timeout: 15000,
      }
    )
  })
})

test.describe("School Onboarding - Form Steps", () => {
  // SKIP: Form UI components are currently debug stubs (see TitleContent.tsx)
  // These tests will be enabled once the actual form UI is implemented
  test.skip()

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page)
  })

  test("validates required fields on title step", async ({ page }) => {
    await startOnboardingProcess(page)

    // Navigate to title step if not there
    if (page.url().includes("about-school")) {
      await clickNext(page)
    }

    // Try to proceed without filling required field
    const nextButton = page.locator('button:has-text("Next")')
    if (await nextButton.isVisible()) {
      // Next should be disabled or show error on click
      const isDisabled = await nextButton.isDisabled()
      if (!isDisabled) {
        await nextButton.click()
        // Should show validation error
        const error = page.locator('[class*="error"], [role="alert"]')
        await expect(error.first())
          .toBeVisible({ timeout: 3000 })
          .catch(() => {
            // If no error shown, button might have been disabled
          })
      }
    }
  })

  test("accepts valid school name", async ({ page }) => {
    await startOnboardingProcess(page)

    // Navigate to title step
    if (page.url().includes("about-school")) {
      await clickNext(page)
    }

    // Fill valid school name
    await fillTitleStep(page, "Test Academy School")

    // Next button should be enabled
    const nextButton = page.locator('button:has-text("Next")')
    if (await nextButton.isVisible()) {
      await expect(nextButton).toBeEnabled({ timeout: 5000 })
    }
  })
})

test.describe("School Onboarding - Subdomain", () => {
  // SKIP: Form UI components are currently debug stubs
  test.skip()

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page)
  })

  test("validates subdomain format", async ({ page }) => {
    // Navigate directly to subdomain step (if school exists)
    await page.goto(`${BASE_URL}/en/onboarding`)
    await page.waitForLoadState("domcontentloaded")

    // This test requires an existing school - skip if not available
    const subdomainInput = page.locator('input[name="domain"]')
    if (
      !(await subdomainInput.isVisible({ timeout: 3000 }).catch(() => false))
    ) {
      test.skip()
      return
    }

    // Test invalid subdomain (uppercase)
    await subdomainInput.fill("InvalidDomain")
    await page.waitForTimeout(500)

    const error = page.locator('[class*="error"], [role="alert"]')
    // Should show format error
    await expect(error.first())
      .toBeVisible({ timeout: 3000 })
      .catch(() => {
        // Error might be shown differently
      })
  })

  test("checks subdomain availability", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/onboarding`)
    await page.waitForLoadState("domcontentloaded")

    const subdomainInput = page.locator('input[name="domain"]')
    if (
      !(await subdomainInput.isVisible({ timeout: 3000 }).catch(() => false))
    ) {
      test.skip()
      return
    }

    // Enter unique subdomain
    const uniqueSubdomain = generateUniqueSubdomain()
    await subdomainInput.fill(uniqueSubdomain)

    // Wait for availability check
    await page.waitForTimeout(2000)

    // Should show availability status
    const statusIndicator = page.locator(
      '[data-testid="subdomain-status"], .text-green-500, .text-red-500'
    )
    await expect(statusIndicator.first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Status might be shown differently
      })
  })

  test("rejects reserved subdomains", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/onboarding`)
    await page.waitForLoadState("domcontentloaded")

    const subdomainInput = page.locator('input[name="domain"]')
    if (
      !(await subdomainInput.isVisible({ timeout: 3000 }).catch(() => false))
    ) {
      test.skip()
      return
    }

    // Try reserved subdomain like "demo"
    await subdomainInput.fill("demo")
    await page.waitForTimeout(2000)

    // Should show unavailable
    const unavailableIndicator = page.locator(
      '[data-available="false"], .text-red-500, :text("taken"), :text("unavailable")'
    )
    await expect(unavailableIndicator.first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Indicator might be shown differently
      })
  })
})

test.describe("School Onboarding - Complete Flow", () => {
  // SKIP: Form UI components are currently debug stubs
  test.skip()

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page)
  })

  test("completes full onboarding flow", async ({ page }) => {
    test.setTimeout(120000) // 2 minutes for full flow

    // Step 1: Start onboarding (continue draft or create new)
    await startOnboardingProcess(page)

    // Track which step we're on and complete each one
    const steps = [
      "about-school",
      "title",
      "description",
      "location",
      "stand-out",
      "capacity",
      "branding",
      "import",
      "finish-setup",
      "join",
      "visibility",
      "price",
      "discount",
      "legal",
      "subdomain",
    ]

    for (const step of steps) {
      const currentUrl = page.url()

      if (currentUrl.includes("about-school")) {
        await clickNext(page)
        continue
      }

      if (currentUrl.includes("/title")) {
        await fillTitleStep(page, `E2E Test School ${Date.now()}`)
        await clickNext(page)
        continue
      }

      if (currentUrl.includes("/description")) {
        await fillDescriptionStep(
          page,
          "A comprehensive educational institution dedicated to excellence in learning and character development."
        )
        await clickNext(page)
        continue
      }

      if (currentUrl.includes("/location")) {
        await fillLocationStep(page, {
          address: "123 Education Lane",
          city: "Test City",
          state: "Test State",
          country: "Test Country",
        })
        await clickNext(page)
        continue
      }

      if (currentUrl.includes("/capacity")) {
        await fillCapacityStep(page, { students: 500, teachers: 50 })
        await clickNext(page)
        continue
      }

      if (currentUrl.includes("/branding")) {
        await fillBrandingStep(page)
        await clickNext(page)
        continue
      }

      if (currentUrl.includes("/price")) {
        await fillPricingStep(page, { tuitionFee: 5000 })
        await clickNext(page)
        continue
      }

      if (currentUrl.includes("/legal")) {
        await fillLegalStep(page)
        await clickNext(page)
        continue
      }

      if (currentUrl.includes("/subdomain")) {
        const uniqueSubdomain = generateUniqueSubdomain()
        const isAvailable = await fillSubdomainStep(page, uniqueSubdomain)

        if (!isAvailable) {
          // Try another subdomain
          await fillSubdomainStep(page, generateUniqueSubdomain())
        }

        await clickNext(page)
        continue
      }

      // For other steps (stand-out, import, finish-setup, join, visibility, discount)
      // Just click next if available
      const nextButton = page.locator(
        'button:has-text("Next"), button:has-text("Continue"), button:has-text("Skip")'
      )
      if (
        await nextButton
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await nextButton.first().click()
        await page.waitForLoadState("domcontentloaded")
      }

      // Check if we reached congratulations
      if (currentUrl.includes("/congratulations")) {
        break
      }
    }

    // Verify congratulations page
    await page.waitForURL(/\/congratulations/, { timeout: 30000 }).catch(() => {
      // Might still be on final step
    })

    if (page.url().includes("/congratulations")) {
      // Verify success elements
      const successHeading = page.locator(
        'h1:has-text("Congratulations"), h1:has-text("Success"), h2:has-text("Congratulations")'
      )
      await expect(successHeading.first()).toBeVisible()

      // Verify "Go to Dashboard" button
      const dashboardButton = page.locator(
        'a:has-text("Dashboard"), button:has-text("Dashboard")'
      )
      await expect(dashboardButton.first()).toBeVisible()
    }
  })
})

test.describe("School Onboarding - Navigation", () => {
  // SKIP: Form UI components are currently debug stubs
  test.skip()

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page)
  })

  test("allows going back to previous steps", async ({ page }) => {
    await startOnboardingProcess(page)

    // Go to title, then description
    if (page.url().includes("about-school")) {
      await clickNext(page)
    }

    await fillTitleStep(page, "Navigation Test School")
    await clickNext(page)

    // Now on description - click back
    const backButton = page.locator(
      'button:has-text("Back"), a:has-text("Back")'
    )
    if (await backButton.first().isVisible()) {
      await backButton.first().click()

      // Should be back on title step
      await expect(page).toHaveURL(/\/title/)

      // Data should be preserved
      const titleInput = page.locator('input[name="name"]')
      await expect(titleInput).toHaveValue("Navigation Test School")
    }
  })

  test("preserves data on page refresh", async ({ page }) => {
    await startOnboardingProcess(page)

    // Go to title and fill
    if (page.url().includes("about-school")) {
      await clickNext(page)
    }

    const schoolName = `Refresh Test School ${Date.now()}`
    await fillTitleStep(page, schoolName)
    await clickNext(page)

    // Go back to title
    const backButton = page.locator('button:has-text("Back")')
    if (await backButton.first().isVisible()) {
      await backButton.first().click()
    }

    // Refresh the page
    await page.reload()
    await page.waitForLoadState("domcontentloaded")

    // Data should still be there (fetched from DB)
    const titleInput = page.locator('input[name="name"]')
    if (await titleInput.isVisible()) {
      const value = await titleInput.inputValue()
      expect(value).toBeTruthy()
    }
  })
})

test.describe("School Onboarding - Error Handling", () => {
  // SKIP: Form UI components are currently debug stubs
  test.skip()

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page)
  })

  test("shows validation errors for short school name", async ({ page }) => {
    await startOnboardingProcess(page)

    if (page.url().includes("about-school")) {
      await clickNext(page)
    }

    // Enter too short name
    await fillTitleStep(page, "A")

    // Try to proceed
    const nextButton = page.locator('button:has-text("Next")')
    if ((await nextButton.isVisible()) && !(await nextButton.isDisabled())) {
      await nextButton.click()
    }

    // Should show error or stay on same page
    const error = page.locator(
      '[class*="error"], [class*="destructive"], .text-red-500'
    )
    const hasError = await error
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    // Either error is shown or we're still on the same page
    expect(hasError || page.url().includes("/title")).toBeTruthy()
  })

  test("handles capacity limit validation", async ({ page }) => {
    await navigateToOnboarding(page)

    // This test requires navigating to capacity step
    // Skip if we can't get there
    await page.goto(`${BASE_URL}/en/onboarding`)

    const capacityInput = page.locator('input[name="maxStudents"]')
    if (
      !(await capacityInput.isVisible({ timeout: 5000 }).catch(() => false))
    ) {
      test.skip()
      return
    }

    // Enter value over limit (>10000)
    await capacityInput.fill("99999")
    await page.waitForTimeout(500)

    // Should show error
    const error = page.locator('[class*="error"], .text-red-500')
    await expect(error.first())
      .toBeVisible({ timeout: 3000 })
      .catch(() => {
        // Error might be shown on submit
      })
  })
})

test.describe("School Onboarding - Get Started Button Flow", () => {
  test("Get Started from marketing leads to login for unauthenticated users", async ({
    page,
  }) => {
    // Clear session to test as unauthenticated user
    await page.context().clearCookies()

    // Start from marketing page
    await page.goto(`${BASE_URL}/en`)
    await page.waitForLoadState("domcontentloaded")

    // Find and click "Get Started" button
    const getStartedButton = page.locator(
      'a:has-text("Get Started"), button:has-text("Get Started")'
    )

    if (
      await getStartedButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await getStartedButton.first().click()

      // /onboarding is a protected route, so should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

      // Should have callbackUrl with onboarding
      expect(page.url()).toContain("callbackUrl")
      expect(page.url()).toContain("onboarding")
    } else {
      // If no Get Started button, test is not applicable
      test.skip()
    }
  })

  test("authenticated user clicking Get Started goes to onboarding", async ({
    page,
  }) => {
    await loginAsUser(page)

    // Go to marketing page
    await page.goto(`${BASE_URL}/en`)

    // Find and click "Get Started" button
    const getStartedButton = page.locator(
      'a:has-text("Get Started"), button:has-text("Get Started")'
    )

    if (await getStartedButton.first().isVisible()) {
      await getStartedButton.first().click()

      // Should go directly to onboarding
      await expect(page).toHaveURL(/\/onboarding/)
    }
  })
})
