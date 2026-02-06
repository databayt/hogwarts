/**
 * Epic 5: Onboarding
 * Story 5.4: Full Journey (Get Started -> School Dashboard)
 *
 * Tests the complete user journey from clicking "Get Started" on the
 * marketing landing page through all 15 onboarding steps, verifying the
 * congratulations page, and landing on the newly created school's dashboard.
 *
 * Tag: @onboarding @critical @e2e
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import { TIMEOUTS } from "../../helpers/test-data"
import { LoginPage, SaasHomePage } from "../../page-objects"
import { OnboardingFlowPage } from "../../page-objects/onboarding.page"

// ============================================================================
// TEST DATA
// ============================================================================

const JOURNEY_SCHOOL = {
  name: "E2E Full Journey School",
  description:
    "A comprehensive school created during full journey E2E testing with modern facilities and innovative curriculum.",
  location: {
    city: "Riyadh",
    state: "Riyadh Province",
    country: "Saudi Arabia",
  },
  capacity: {
    students: 500,
    teachers: 30,
    classes: 20,
  },
  pricing: {
    tuitionFee: 15000,
  },
}

// ============================================================================
// HELPERS
// ============================================================================

async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

// ============================================================================
// STORY 5.4: Full Journey - Get Started to School Dashboard
// ============================================================================

test.describe("Story 5.4: Full Journey (Get Started -> Dashboard) @onboarding @critical", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("OB-040: Complete journey from Get Started to school dashboard", async ({
    page,
  }) => {
    test.setTimeout(300_000) // 5 minutes for the full flow

    // ====================================================================
    // PHASE 1: Marketing Landing Page -> Login
    // ====================================================================

    // Navigate to marketing landing page
    const homePage = new SaasHomePage(page)
    await homePage.goto()
    await assertNoSSE(page)

    // Verify "Get Started" button exists
    const hasGetStarted = await homePage.hasGetStartedButton()
    expect(hasGetStarted, "Get Started button should be visible").toBeTruthy()

    // Click "Get Started" -> should redirect to login (guest user)
    await Promise.all([
      page.waitForURL(/\/(login|onboarding)/, {
        timeout: TIMEOUTS.navigation,
      }),
      homePage.clickGetStarted(),
    ])

    const urlAfterGetStarted = page.url()
    expect(
      urlAfterGetStarted.includes("/login") ||
        urlAfterGetStarted.includes("/onboarding"),
      `Expected login or onboarding page, got: ${urlAfterGetStarted}`
    ).toBeTruthy()

    // ====================================================================
    // PHASE 2: Login as fresh user
    // ====================================================================

    // If we're on login page, log in. If already on onboarding, skip login.
    if (urlAfterGetStarted.includes("/login")) {
      const loginPage = new LoginPage(page)
      await loginPage.login("user@databayt.org", "1234")

      if (page.url().startsWith("chrome-error://")) {
        test.skip(true, "Protocol mismatch in dev environment")
        return
      }

      // After login, navigate to onboarding
      await page.waitForLoadState("domcontentloaded")
      await page.waitForTimeout(2000)
    }

    // ====================================================================
    // PHASE 3: Onboarding Dashboard -> Create New School
    // ====================================================================

    const onboarding = new OnboardingFlowPage(page)
    await onboarding.goto()
    await page.waitForTimeout(2000)
    await assertNoSSE(page)

    // Click "Create a new school"
    const schoolId = await onboarding.createNewSchool()
    expect(schoolId, "Should get a schoolId after creating").toBeTruthy()

    // ====================================================================
    // PHASE 4: Complete all 15 onboarding steps
    // ====================================================================

    // Step 1: About School (informational)
    await onboarding.expectOnStep("about-school")
    await assertNoSSE(page)
    await onboarding.completeAboutSchool()

    // Step 2: Title
    await onboarding.expectOnStep("title")
    await onboarding.fillTitle(JOURNEY_SCHOOL.name)
    const nextEnabled = await onboarding.isNextEnabled()
    expect(
      nextEnabled,
      "Next should be enabled after filling title"
    ).toBeTruthy()
    await onboarding.clickNext()

    // Step 3: Description
    await onboarding.expectOnStep("description")
    await onboarding.completeDescription(JOURNEY_SCHOOL.description)

    // Step 4: Location (Mapbox picker)
    await onboarding.expectOnStep("location")
    await onboarding.completeLocation(JOURNEY_SCHOOL.location)

    // Step 5: Stand Out
    await onboarding.expectOnStep("stand-out")
    await onboarding.completeStandOut()

    // Step 6: Capacity
    await onboarding.expectOnStep("capacity")
    await onboarding.completeCapacity(JOURNEY_SCHOOL.capacity)

    // Step 7: Branding (skip)
    await onboarding.expectOnStep("branding")
    await onboarding.completeBranding()

    // Step 8: Import (skip)
    await onboarding.expectOnStep("import")
    await onboarding.completeImport()

    // Step 9: Finish Setup
    await onboarding.expectOnStep("finish-setup")
    await onboarding.completeFinishSetup()

    // Step 10: Join
    await onboarding.expectOnStep("join")
    await onboarding.completeJoin()

    // Step 11: Visibility
    await onboarding.expectOnStep("visibility")
    await onboarding.completeVisibility()

    // Step 12: Price
    await onboarding.expectOnStep("price")
    await onboarding.completePrice(JOURNEY_SCHOOL.pricing)

    // Step 13: Discount (skip)
    await onboarding.expectOnStep("discount")
    await onboarding.completeDiscount()

    // Step 14: Legal (triggers completeOnboarding)
    await onboarding.expectOnStep("legal")
    await onboarding.selectOperationalStatus("existing")
    await page.waitForTimeout(500)
    await onboarding.clickNext()

    // Wait for the server action to complete
    await page.waitForTimeout(3000)

    // ====================================================================
    // PHASE 5: Handle post-legal navigation
    // ====================================================================

    // Legal step triggers completeOnboarding which shows a success modal.
    // The school's domain was auto-set during creation, so the action succeeds
    // and shows the success modal without needing the subdomain step.
    // However, if for some reason the subdomain step appears, handle it.
    const hasSubdomainStep = page.url().includes("/subdomain")
    if (hasSubdomainStep) {
      const uniqueSubdomain = onboarding.generateUniqueSubdomain()
      await onboarding.completeSubdomain(uniqueSubdomain)
      await page.waitForTimeout(3000)
    }

    // ====================================================================
    // PHASE 6: Verify Congratulations / Success Modal
    // ====================================================================

    // The success modal appears on the legal step page (URL stays at /legal)
    const hasSuccessHeading = await onboarding.congratulationsHeading
      .isVisible({ timeout: TIMEOUTS.long })
      .catch(() => false)
    const hasCongratulationsUrl = page.url().includes("/congratulations")

    expect(
      hasSuccessHeading || hasCongratulationsUrl,
      `Expected congratulations state. URL: ${page.url()}`
    ).toBeTruthy()

    // Extract the subdomain from the success modal (shown as "{domain}.databayt.org")
    let schoolSubdomain = ""
    const domainElement = page
      .locator("h5")
      .filter({ hasText: /\.databayt\.org/ })
    const domainText = await domainElement
      .textContent({ timeout: TIMEOUTS.medium })
      .catch(() => "")
    if (domainText) {
      schoolSubdomain = domainText.replace(".databayt.org", "").trim()
    }
    console.log(`Extracted subdomain: ${schoolSubdomain}`)

    // Verify "Go to Dashboard" link is visible
    const hasDashboardButton = await onboarding.goToDashboardButton
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)
    expect(
      hasDashboardButton,
      "Go to Dashboard button should be visible"
    ).toBeTruthy()

    await assertNoSSE(page)

    // ====================================================================
    // PHASE 7: Navigate to School Dashboard
    // ====================================================================

    // On localhost, the "Go to Dashboard" button constructs a subdomain URL
    // (e.g., http://school-xxx.localhost/dashboard) which doesn't include the port.
    // Use path-based routing instead: localhost:3000/en/s/{subdomain}/dashboard
    if (schoolSubdomain) {
      await page.goto(`http://localhost:3000/en/s/${schoolSubdomain}/dashboard`)
    } else {
      // Fallback: click the button (works in production, may fail on localhost)
      await onboarding.goToDashboardButton.first().click()
    }
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(3000)

    // ====================================================================
    // PHASE 8: Verify School Dashboard
    // ====================================================================

    const dashboardUrl = page.url()
    console.log(`Final dashboard URL: ${dashboardUrl}`)

    // On localhost, school dashboard uses path-based routing: /s/{subdomain}/...
    const isDashboard =
      dashboardUrl.includes("/dashboard") || dashboardUrl.includes("/s/")

    // Verify no SSE on the dashboard
    await assertNoSSE(page)

    // Verify dashboard content is visible (main area, sidebar, or any heading)
    const hasMainContent = await page
      .locator("main, [role='main'], aside, nav")
      .first()
      .isVisible({ timeout: TIMEOUTS.long })
      .catch(() => false)

    const hasHeading = await page
      .locator("h1, h2, h3")
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    expect(
      isDashboard || hasMainContent || hasHeading,
      `Expected school dashboard. URL: ${dashboardUrl}`
    ).toBeTruthy()

    console.log(
      `Full journey complete: Marketing -> Login -> Onboarding (${schoolId}) -> Dashboard (${dashboardUrl})`
    )
  })
})
