/**
 * Epic 8: Admission
 * Story 8.2: Full Application Journey (admission → login → apply → success)
 *
 * Tests the complete application flow mirroring onboarding:
 * - AD-050: Navigate to admissions → click apply → redirect to login
 * - AD-051: Login and redirect back to /apply
 * - AD-052: Campaign selector → Start from scratch → Overview → Get Started
 * - AD-053: Complete 6 steps (personal → contact → guardian → academic → documents → review)
 * - AD-054: Submit and verify success page
 *
 * Tag: @admission @critical @journey
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import { buildSchoolUrl, getTestEnv, TIMEOUTS } from "../../helpers/test-data"
import { LoginPage } from "../../page-objects"

// ============================================================================
// HELPERS
// ============================================================================

function checkProtocolError(page: import("@playwright/test").Page): boolean {
  return page.url().startsWith("chrome-error://")
}

async function goToSchoolPage(
  page: import("@playwright/test").Page,
  path: string,
  locale: "en" | "ar" = "en"
): Promise<boolean> {
  const url = buildSchoolUrl("demo", path, locale, getTestEnv())
  await page.goto(url)
  await page.waitForLoadState("domcontentloaded")
  if (checkProtocolError(page)) return false
  return true
}

/**
 * Helper to select a shadcn Select option by finding the FormItem via label text.
 * shadcn Select uses Radix: find label → click trigger in same FormItem → wait for listbox → click option.
 */
async function selectShadcnByLabel(
  page: import("@playwright/test").Page,
  labelText: string,
  optionText: string
): Promise<void> {
  // Find the FormItem containing the label, then click the trigger within it
  const formItem = page.locator(`label:has-text("${labelText}")`).locator("..")
  const trigger = formItem.locator('button[role="combobox"]')
  await trigger.first().click()

  // Wait for the popover/listbox to appear
  const listbox = page.locator("[role='listbox']")
  await listbox.waitFor({ state: "visible", timeout: TIMEOUTS.short })
  // Click the option by text
  const option = listbox.locator(`[role="option"]:has-text("${optionText}")`)
  await option.click()
  // Wait for listbox to close
  await listbox
    .waitFor({ state: "hidden", timeout: TIMEOUTS.short })
    .catch(() => {})
}

/**
 * Click the Next/Back button in the FormFooter
 */
async function clickFooterNext(
  page: import("@playwright/test").Page
): Promise<void> {
  // FormFooter uses a fixed bottom bar with Next button
  const nextBtn = page.locator(
    'button:has-text("Next"), button:has-text("التالي"), button:has-text("Finish"), button:has-text("Submit Application"), button:has-text("تقديم الطلب")'
  )
  await nextBtn.first().click()
  // Wait for navigation to next step
  await page.waitForLoadState("domcontentloaded")
  await page.waitForTimeout(500)
}

// ============================================================================
// TEST: AD-050 - Admission page redirects to login for /apply
// ============================================================================

test.describe("AD-050: /apply requires authentication", () => {
  test("unauthenticated user is redirected to login when visiting /apply", async ({
    page,
  }) => {
    // Clear cookies to ensure unauthenticated
    await page.context().clearCookies()

    const ok = await goToSchoolPage(page, "/apply")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Should be redirected to login page with callbackUrl
    await page.waitForURL(/\/login/, { timeout: TIMEOUTS.navigation })
    expect(page.url()).toContain("/login")
    expect(page.url()).toContain("callbackUrl")
  })

  test("admissions page (informational) stays public", async ({ page }) => {
    await page.context().clearCookies()

    const ok = await goToSchoolPage(page, "/admissions")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)
    // Should NOT redirect - admissions is public
    expect(page.url()).toContain("/admissions")
    expect(page.url()).not.toContain("/login")
  })
})

// ============================================================================
// TEST: AD-051 to AD-054 - Full application journey
// ============================================================================

test.describe("AD-051 to AD-054: Full application journey", () => {
  test("complete application flow: admissions → login → apply → 6 steps → success", async ({
    page,
  }) => {
    // Increase timeout for this long journey test
    test.setTimeout(120_000)

    // Step 1: Start from admissions page
    await page.context().clearCookies()
    const ok = await goToSchoolPage(page, "/admissions")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
    await assertNoSSE(page)

    // Step 2: Click "Start application" link → should redirect to login
    const applyLink = page.locator(
      'a[href*="/apply"]:has-text("Start application"), a[href*="/apply"]:has-text("ابدأ")'
    )
    const hasApplyLink = await applyLink
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (!hasApplyLink) {
      // If no direct link, navigate manually
      await goToSchoolPage(page, "/apply")
    } else {
      await applyLink.first().click()
      await page.waitForLoadState("domcontentloaded")
    }

    // Should be on login page (proxy redirect for unauthenticated /apply)
    await page.waitForURL(/\/login/, { timeout: TIMEOUTS.navigation })
    expect(page.url()).toContain("/login")

    // Step 3: Login as student
    const loginPage = new LoginPage(page, "en")
    await loginPage.login("student@databayt.org", "1234")

    // After login, should redirect back to /apply (via callbackUrl)
    // K-12 auto-skip: single campaign → auto-redirects to /overview
    await page.waitForURL(/\/apply/, { timeout: TIMEOUTS.long })
    expect(page.url()).toContain("/apply")
    await assertNoSSE(page)

    // Step 4: Application dashboard — click "Start from scratch" link
    // The dashboard always shows (no auto-redirect for single campaign anymore)
    const startFromScratch = page.locator(
      'a:has-text("Start from scratch"), a:has-text("ابدأ من الصفر")'
    )
    await startFromScratch.waitFor({
      state: "visible",
      timeout: TIMEOUTS.medium,
    })
    await startFromScratch.click()
    await page.waitForLoadState("domcontentloaded")
    await page.waitForURL(/\/overview/, { timeout: TIMEOUTS.navigation })

    // Step 5: Overview page - click "Get Started"
    const getStarted = page.locator(
      'button:has-text("Get Started"), button:has-text("ابدأ"), a:has-text("Get Started"), a:has-text("ابدأ")'
    )
    await getStarted
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await getStarted.first().click()
    await page.waitForLoadState("domcontentloaded")

    // Step 6: Should be on personal step
    await page.waitForURL(/\/personal/, { timeout: TIMEOUTS.navigation })
    await assertNoSSE(page)

    // --- STEP 1: Personal Information ---
    await page.locator('input[name="firstName"]').fill("Test")
    await page.locator('input[name="lastName"]').fill("Applicant")
    await page.locator('input[name="dateOfBirth"]').fill("2010-03-15")

    // Select gender (shadcn Select — English labels on /en/ route)
    await selectShadcnByLabel(page, "Gender", "Male")

    // Select nationality
    await selectShadcnByLabel(page, "Nationality", "Sudanese")

    await clickFooterNext(page)

    // --- STEP 2: Contact Information ---
    await page.waitForURL(/\/contact/, { timeout: TIMEOUTS.navigation })
    await assertNoSSE(page)

    await page
      .locator('input[name="email"]')
      .fill("test-e2e-applicant@example.com")
    await page.locator('input[name="phone"]').fill("+249123456789")
    await page.locator('input[name="address"]').fill("123 Test Street")
    await page.locator('input[name="city"]').fill("Khartoum")
    await page.locator('input[name="state"]').fill("Khartoum")
    await page.locator('input[name="postalCode"]').fill("11111")

    // Select country (now bilingual — English labels on /en/ route)
    await selectShadcnByLabel(page, "Country", "Sudan")

    await clickFooterNext(page)

    // --- STEP 3: Guardian Information ---
    await page.waitForURL(/\/guardian/, { timeout: TIMEOUTS.navigation })
    await assertNoSSE(page)

    await page.locator('input[name="fatherName"]').fill("Father Test")
    await page.locator('input[name="motherName"]').fill("Mother Test")

    await clickFooterNext(page)

    // --- STEP 4: Academic Information ---
    await page.waitForURL(/\/academic/, { timeout: TIMEOUTS.navigation })
    await assertNoSSE(page)

    // applyingForClass is a shadcn Select (not text input)
    await selectShadcnByLabel(page, "Applying for Class", "Grade 10")

    await clickFooterNext(page)

    // --- STEP 5: Documents (all optional, skip) ---
    await page.waitForURL(/\/documents/, { timeout: TIMEOUTS.navigation })
    await assertNoSSE(page)

    await clickFooterNext(page)

    // --- STEP 6: Review ---
    await page.waitForURL(/\/review/, { timeout: TIMEOUTS.navigation })
    await assertNoSSE(page)

    // Verify review page has content (summary cards)
    const body = page.locator("body")
    await expect(body).not.toBeEmpty()

    // Click Submit Application (the final button)
    const submitBtn = page.locator(
      'button:has-text("Submit Application"), button:has-text("تقديم الطلب"), button:has-text("Finish")'
    )
    await submitBtn
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await submitBtn.first().click()

    // Wait for submission and redirect to success page
    await page.waitForURL(/\/success/, { timeout: TIMEOUTS.long })
    await assertNoSSE(page)

    // Verify success page shows application reference number
    const successContent = page.locator("body")
    await expect(successContent).not.toBeEmpty()

    // Look for application number pattern (APP-YYYY-XXXXX)
    const hasAppNumber = await page
      .locator("text=/APP-\\d{4}-/")
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    // The success page should show either an application number or a success message
    const hasSuccessIndicator =
      hasAppNumber ||
      (await page
        .locator("text=/success|submitted|congratulations|تم|نجاح/i")
        .first()
        .isVisible({ timeout: TIMEOUTS.short })
        .catch(() => false))

    expect(hasSuccessIndicator).toBeTruthy()
  })
})
