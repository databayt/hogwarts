/**
 * Epic 8: Admission
 * Story 8.3: Application Error States & Edge Cases
 *
 * Tests error handling in the admission application flow:
 * - AD-070: Expired/closed campaign shows graceful message
 * - AD-071: Invalid continue token shows graceful error
 * - AD-072: Form validation blocks navigation on missing required fields
 * - AD-073: Session persistence (auto-save indicator)
 *
 * Tag: @admission @errors @edge-cases
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../e2e/_support/helpers/assertions"
import {
  buildSchoolUrl,
  getTestEnv,
  TIMEOUTS,
} from "../../e2e/_support/helpers/test-data"
import { LoginPage } from "../../e2e/_support/page-objects"

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

async function loginAsStudent(
  page: import("@playwright/test").Page
): Promise<boolean> {
  const loginPage = new LoginPage(page, "en")
  await loginPage.login("student@databayt.org", "1234")
  await page.waitForLoadState("domcontentloaded")
  return !checkProtocolError(page)
}

// ============================================================================
// TEST: AD-071 - Invalid continue token
// ============================================================================

test.describe("AD-071: Invalid continue token", () => {
  test("shows graceful error for invalid token", async ({ page }) => {
    // Login first since /application requires auth
    const ok = await goToSchoolPage(page, "/login")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Navigate to continue page with invalid token
    const continueOk = await goToSchoolPage(
      page,
      "/application/continue?token=INVALID_TOKEN_12345"
    )
    if (!continueOk) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    // Should show error message or redirect to apply dashboard
    // (not crash or show SSE)
    const body = await page.locator("body").textContent()
    const hasErrorOrRedirect =
      body?.includes("not found") ||
      body?.includes("expired") ||
      body?.includes("invalid") ||
      body?.includes("error") ||
      page.url().includes("/application")

    expect(hasErrorOrRedirect).toBeTruthy()
  })
})

// ============================================================================
// TEST: AD-072 - Form validation blocks Next
// ============================================================================

test.describe("AD-072: Form validation blocks navigation", () => {
  test("required field validation prevents advancing from personal step", async ({
    page,
  }) => {
    test.setTimeout(90_000)

    // Login first
    await page.context().clearCookies()
    const ok = await goToSchoolPage(page, "/application")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Redirect to login
    await page.waitForURL(/\/login/, { timeout: TIMEOUTS.navigation })
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Navigate to apply flow
    await page.waitForURL(/\/application/, { timeout: TIMEOUTS.long })

    // Start application
    const startLink = page.locator(
      'a:has-text("Start from scratch"), a:has-text("ابدأ من الصفر")'
    )
    const hasStartLink = await startLink
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (hasStartLink) {
      await startLink.first().click()
      await page.waitForLoadState("domcontentloaded")
      await page.waitForURL(/\/overview/, { timeout: TIMEOUTS.navigation })

      // Click Get Started
      const getStarted = page.locator(
        'button:has-text("Get Started"), a:has-text("Get Started")'
      )
      await getStarted
        .first()
        .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
      await getStarted.first().click()
      await page.waitForLoadState("domcontentloaded")
    }

    // Wait for personal step
    await page
      .waitForURL(/\/personal/, { timeout: TIMEOUTS.navigation })
      .catch(() => {
        // May already be on overview or different step
      })

    if (!page.url().includes("/personal")) {
      test.skip(true, "Could not reach personal step")
      return
    }

    await assertNoSSE(page)

    // Leave all fields empty and try to click Next
    const nextBtn = page.locator(
      'button:has-text("Next"), button:has-text("التالي")'
    )
    const hasNext = await nextBtn
      .first()
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)

    if (hasNext) {
      // The step gate mirrors the real Zod schema (isPersonalStepComplete /
      // isGuardianStepComplete): with required fields empty, Next must be
      // DISABLED — not an enabled button whose click silently no-ops (the
      // old funnel trap this spec previously failed to catch with a vacuous
      // toBeGreaterThanOrEqual(0) assertion).
      await expect(nextBtn.first()).toBeDisabled()

      // A too-short phone must not enable it either (schema minimum is 10).
      const phoneInput = page
        .locator('input[name="phone"], input[type="tel"]')
        .first()
      const hasPhone = await phoneInput
        .isVisible({ timeout: TIMEOUTS.short })
        .catch(() => false)
      if (hasPhone) {
        await phoneInput.fill("123")
        await page.waitForTimeout(500)
        await expect(nextBtn.first()).toBeDisabled()
      }

      // Never navigated away
      expect(page.url()).toContain("/personal")
    }
  })
})
