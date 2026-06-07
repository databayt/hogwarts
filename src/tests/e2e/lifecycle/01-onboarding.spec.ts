/**
 * Epic 12: Full Onboarding with Uploads
 *
 * Tests the complete onboarding flow including:
 * - Account reset (LC-001)
 * - Login as fresh user (LC-002)
 * - All 16 onboarding steps with real data (LC-003)
 * - Branding image upload (LC-004)
 * - CSV import for students and teachers (LC-005)
 * - Remaining steps through legal (LC-006)
 * - Success verification (LC-007)
 * - Dashboard navigation (LC-008)
 *
 * Tag: @lifecycle @onboarding @critical
 */

import { execSync } from "node:child_process"
import path from "node:path"
import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../_support/helpers/assertions"
import {
  clearState,
  loginAndNavigateLifecycle,
  resolveSubdomain,
  saveState,
} from "../_support/helpers/lifecycle-state"
import { TIMEOUTS } from "../_support/helpers/test-data"
import { LoginPage } from "../_support/page-objects"
import { OnboardingFlowPage } from "../_support/page-objects/onboarding.page"

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_DATA_DIR = path.join(process.cwd(), "tests", "test-data")
const CANTEEN_PNG = path.join(TEST_DATA_DIR, "canteen.png")
const STUDENTS_CSV = path.join(TEST_DATA_DIR, "students-import.csv")
const TEACHERS_CSV = path.join(TEST_DATA_DIR, "teachers-import.csv")

const SCHOOL = {
  name: "Lifecycle Test Academy",
  description:
    "A comprehensive test school created during lifecycle E2E testing with modern facilities.",
  location: {
    city: "Riyadh",
    state: "Riyadh Province",
    country: "Saudi Arabia",
  },
  capacity: {
    students: 500,
    teachers: 10,
    classes: 20,
  },
  pricing: {
    tuitionFee: 15000,
  },
}

// ============================================================================
// SUITE: Epic 12 - Full Onboarding with Uploads
// ============================================================================

test.describe
  .serial("Epic 12: Full Onboarding with Uploads @lifecycle @critical", () => {
  let onboarding: OnboardingFlowPage
  let schoolId: string
  let schoolSubdomain: string

  test.beforeAll(() => {
    clearState()
  })

  // ========================================================================
  // Story 12.1: Account Reset and Login
  // ========================================================================

  test("LC-001: Reset test user via CLI", async () => {
    test.setTimeout(90_000)

    // Neon PostgreSQL cold starts can cause transient connection failures.
    // Retry up to 3 times with increasing delays.
    let result = ""
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = execSync("pnpm db:reset-test-user", {
          cwd: process.cwd(),
          encoding: "utf-8",
          timeout: 30_000,
        })
        break
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (attempt === 3)
          throw new Error(`Reset failed after 3 attempts: ${msg}`)
        // Wait before retry — Neon needs time to wake
        execSync(`sleep ${attempt * 5}`)
      }
    }

    expect(result).toBeTruthy()
    saveState({ phase: "reset" })
  })

  test("LC-002: Login as fresh user", async ({ page }) => {
    test.setTimeout(60_000)
    await page.context().clearCookies()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("user@databayt.org", "1234")

    if (page.url().startsWith("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2000)

    // USER without school stays on SaaS marketing
    const url = page.url()
    expect(url).not.toContain("/dashboard")
  })

  // ========================================================================
  // Story 12.2: Onboarding with Real Uploads
  // ========================================================================

  test("LC-003: Complete steps 1-7 (about-school through schedule)", async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await page.context().clearCookies()

    // Login
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("user@databayt.org", "1234")

    if (page.url().startsWith("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2000)

    // Navigate to onboarding and create school
    onboarding = new OnboardingFlowPage(page)
    await onboarding.goto()
    await page.waitForTimeout(2000)
    await assertNoSSE(page)

    const id = await onboarding.createNewSchool()
    expect(id, "Should get a schoolId after creating").toBeTruthy()
    schoolId = id!

    // Step 1: About School (informational)
    await onboarding.expectOnStep("about-school")
    await assertNoSSE(page)
    await onboarding.completeAboutSchool()

    // Step 2: Title
    await onboarding.expectOnStep("title")
    await onboarding.fillTitle(SCHOOL.name)
    const nextEnabled = await onboarding.isNextEnabled()
    expect(
      nextEnabled,
      "Next should be enabled after filling title"
    ).toBeTruthy()
    await onboarding.clickNext()

    // Step 3: Description
    await onboarding.expectOnStep("description")
    await onboarding.completeDescription(SCHOOL.description)

    // Step 4: Location
    await onboarding.expectOnStep("location")
    await onboarding.completeLocation(SCHOOL.location)

    // Step 5: Stand Out
    await onboarding.expectOnStep("stand-out")
    await onboarding.completeStandOut()

    // Step 6: Capacity
    await onboarding.expectOnStep("capacity")
    await onboarding.completeCapacity(SCHOOL.capacity)

    // Step 7: Schedule
    await onboarding.expectOnStep("schedule")
    await onboarding.completeSchedule()

    // Should now be on branding step
    await onboarding.expectOnStep("branding")
    saveState({ schoolId })
  })

  test("LC-004: Upload branding image on step 8", async ({ page }) => {
    test.setTimeout(120_000)
    await page.context().clearCookies()

    // Re-login and navigate to branding step
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("user@databayt.org", "1234")

    if (page.url().startsWith("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    onboarding = new OnboardingFlowPage(page)
    await onboarding.gotoStep(schoolId, "branding")
    await page.waitForTimeout(2000)

    // Upload canteen.png as branding image
    await onboarding.uploadBrandingImage(CANTEEN_PNG)

    // Should advance to import step
    await onboarding.expectOnStep("import")
  })

  test("LC-005: Import CSV files on step 9", async ({ page }) => {
    test.setTimeout(180_000)
    await page.context().clearCookies()

    // Re-login and navigate to import step
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("user@databayt.org", "1234")

    if (page.url().startsWith("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    onboarding = new OnboardingFlowPage(page)
    await onboarding.gotoStep(schoolId, "import")
    await page.waitForTimeout(2000)

    // Import students and teachers
    await onboarding.importCSVFiles(STUDENTS_CSV, TEACHERS_CSV)

    // Should advance to finish-setup step
    await onboarding.expectOnStep("finish-setup")
  })

  // ========================================================================
  // Story 12.3: Complete Remaining Steps and Reach Dashboard
  // ========================================================================

  test("LC-006: Complete steps 10-16 (finish-setup through legal)", async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await page.context().clearCookies()

    // Re-login
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("user@databayt.org", "1234")

    if (page.url().startsWith("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    onboarding = new OnboardingFlowPage(page)
    await onboarding.gotoStep(schoolId, "finish-setup")
    await page.waitForTimeout(2000)

    // Step 10: Finish Setup
    await onboarding.expectOnStep("finish-setup")
    await onboarding.completeFinishSetup()

    // Step 11: Join
    await onboarding.expectOnStep("join")
    await onboarding.completeJoin()

    // Step 12: Visibility
    await onboarding.expectOnStep("visibility")
    await onboarding.completeVisibility()

    // Step 13: Price
    await onboarding.expectOnStep("price")
    await onboarding.completePrice(SCHOOL.pricing)

    // Step 14: Discount
    await onboarding.expectOnStep("discount")
    await onboarding.completeDiscount()

    // Step 15: Legal (triggers completeOnboarding)
    await onboarding.expectOnStep("legal")
    await onboarding.selectOperationalStatus("existing")

    // Toggle safety checkboxes if visible
    for (let i = 0; i < 3; i++) {
      await onboarding.toggleSafetyFeature(i)
    }

    await page.waitForTimeout(500)

    // Click Create button directly (avoid clickNext dialog dismissal interfering)
    const createBtn = page.locator(
      'footer button:has-text("Create"), footer button:has-text("إنشاء")'
    )
    await createBtn
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await createBtn.first().click()

    // Wait for completeOnboarding server action + success modal
    await page.waitForTimeout(5000)

    // Resolve subdomain from DB (most reliable)
    if (schoolId) {
      const resolved = resolveSubdomain(schoolId)
      if (resolved) {
        schoolSubdomain = resolved
        saveState({ schoolId, schoolSubdomain })
      }
    }

    // Check for success modal and dismiss it
    const successModal = page.locator('[data-slot="dialog-content"]')
    const modalVisible = await successModal
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (modalVisible) {
      // Close the modal
      const closeBtn = successModal.locator(
        'button:has-text("×"), button[aria-label*="close"], button:has-text("Close")'
      )
      await closeBtn
        .first()
        .click({ force: true })
        .catch(async () => {
          await page
            .locator('[data-slot="dialog-close"]')
            .first()
            .click({ force: true })
            .catch(() => {})
        })
      await page.waitForTimeout(1000)
    }

    // Handle subdomain step if it appears
    if (page.url().includes("/subdomain")) {
      const uniqueSubdomain = onboarding.generateUniqueSubdomain()
      await onboarding.completeSubdomain(uniqueSubdomain)
      await page.waitForTimeout(3000)
    }
  })

  test("LC-007: Verify success state and extract subdomain", async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.context().clearCookies()

    // Re-login
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("user@databayt.org", "1234")

    if (page.url().startsWith("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    onboarding = new OnboardingFlowPage(page)
    await onboarding.gotoStep(schoolId, "congratulations")
    await page.waitForTimeout(3000)

    // Check for congratulations page or success state
    const url = page.url()
    const hasCongrats = url.includes("/congratulations")
    const hasSuccessHeading = await onboarding.congratulationsHeading
      .isVisible({ timeout: TIMEOUTS.long })
      .catch(() => false)

    expect(
      hasCongrats || hasSuccessHeading,
      `Expected congratulations state. URL: ${url}`
    ).toBeTruthy()

    // Resolve subdomain from DB (most reliable) or page text
    if (!schoolSubdomain && schoolId) {
      schoolSubdomain = resolveSubdomain(schoolId) ?? undefined!
    }

    // Fallback: extract from page text if DB lookup failed
    if (!schoolSubdomain) {
      // Target the domain display element specifically
      const domainEl = page
        .locator("p.font-semibold, span.font-medium")
        .filter({
          hasText: /\.(localhost|databayt\.org)/,
        })
      const domainText = await domainEl
        .first()
        .textContent({ timeout: TIMEOUTS.medium })
        .catch(() => "")
      const subMatch = domainText?.match(
        /^([a-z0-9-]+)\.(?:localhost|databayt\.org)/
      )
      if (subMatch) schoolSubdomain = subMatch[1]
    }

    expect(schoolSubdomain, "Should extract school subdomain").toBeTruthy()

    saveState({ schoolId, schoolSubdomain })

    // The success modal opens full-screen with a 4s "celebration" phase
    // then transitions to "nextSteps" with dashboard button.
    // Wait for the modal's nextSteps phase, then close it.
    const modalDashboardBtn = page.locator(
      'button:has-text("Go to School Dashboard"), button:has-text("Go to Dashboard"), button:has-text("Dashboard")'
    )
    await modalDashboardBtn
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.long })
      .catch(() => {})

    // Close the success modal via "Continue Setup Later" button
    const continueBtn = page.locator(
      'button:has-text("Continue Setup Later"), button:has-text("المتابعة لاحقاً")'
    )
    const continueVisible = await continueBtn
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    if (continueVisible) {
      await continueBtn.first().click()
      await page.waitForTimeout(1000)
    }

    // Verify Go to Dashboard button on the underlying page
    const hasDashboardButton = await page
      .locator(
        'button:has-text("Go to Dashboard"), button:has-text("Go to School Dashboard"), a:has-text("Go to Dashboard")'
      )
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)
    expect(
      hasDashboardButton,
      "Go to Dashboard button should be visible"
    ).toBeTruthy()

    await assertNoSSE(page)
  })

  test("LC-008: Navigate to school dashboard", async ({ page }) => {
    test.setTimeout(60_000)

    const ok = await loginAndNavigateLifecycle(
      page,
      schoolSubdomain,
      "/dashboard"
    )
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Verify dashboard loaded — URL must include subdomain + dashboard path
    const dashboardUrl = page.url()
    expect(
      dashboardUrl.includes(`/s/${schoolSubdomain}/dashboard`),
      `Expected school dashboard URL. Got: ${dashboardUrl}`
    ).toBeTruthy()

    await assertNoSSE(page)

    // Verify page loaded (school dashboard uses sidebar layout with div containers, not <main>)
    const hasMainContent = await page
      .locator("h1")
      .first()
      .isVisible({ timeout: TIMEOUTS.long })
      .catch(() => false)

    expect(
      hasMainContent,
      `Expected h1 heading on dashboard. URL: ${dashboardUrl}`
    ).toBeTruthy()

    saveState({
      schoolId,
      schoolSubdomain,
      phase: "onboarded",
    })
  })
})
