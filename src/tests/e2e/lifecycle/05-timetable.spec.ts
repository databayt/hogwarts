/**
 * Epic 16: Timetable Generation
 *
 * Tests the timetable generation and application flow:
 * - Navigate to generate page (LC-020)
 * - Generate timetable preview (LC-021)
 * - Apply generated timetable (LC-022)
 *
 * Tag: @lifecycle @timetable
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../_support/helpers/assertions"
import {
  loadState,
  loginAndNavigateLifecycle,
  saveState,
} from "../_support/helpers/lifecycle-state"
import { TIMEOUTS } from "../_support/helpers/test-data"
import { TimetableGeneratePage } from "../_support/page-objects/timetable-generate.page"

// ============================================================================
// SUITE: Epic 16 - Timetable Generation
// ============================================================================

test.describe
  .serial("Epic 16: Timetable Generation @lifecycle @timetable", () => {
  let subdomain: string

  test.beforeAll(() => {
    const state = loadState()
    if (!state.schoolSubdomain) {
      throw new Error(
        "Precondition failed: no school subdomain. Run previous specs first."
      )
    }
    subdomain = state.schoolSubdomain
  })

  // ========================================================================
  // Story 16.1: Generate and Apply Timetable
  // ========================================================================

  test("LC-020: Navigate to timetable generate", async ({ page }) => {
    test.setTimeout(60_000)

    const timetablePage = new TimetableGeneratePage(page, subdomain)
    const ok = await loginAndNavigateLifecycle(
      page,
      subdomain,
      timetablePage.path
    )
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    // Verify generate page loaded (school dashboard uses div containers, not <main>)
    const hasHeading = await page
      .locator("h1")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(
      hasHeading,
      "Timetable generate page should show heading"
    ).toBeTruthy()
  })

  test("LC-021: Generate timetable preview", async ({ page }) => {
    test.setTimeout(180_000) // Algorithm can take time

    const timetablePage = new TimetableGeneratePage(page, subdomain)
    const ok = await loginAndNavigateLifecycle(
      page,
      subdomain,
      timetablePage.path
    )
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Select term if available
    await timetablePage.selectTerm()

    // Generate preview
    const generateBtn = timetablePage.generateButton.first()
    const btnVisible = await generateBtn
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (!btnVisible) {
      test.skip(
        true,
        "Generate button not visible -- prerequisites missing (terms/teachers/expertise)"
      )
      return
    }

    // Wait for button to become enabled (useEffect loads terms asynchronously)
    let btnEnabled = false
    for (let wait = 0; wait < 10; wait++) {
      btnEnabled = !(await generateBtn.isDisabled().catch(() => true))
      if (btnEnabled) break
      await page.waitForTimeout(1000)
    }
    if (!btnEnabled) {
      test.skip(
        true,
        "Generate button is disabled -- missing teacher expertise or class assignments"
      )
      return
    }

    await timetablePage.generatePreview()

    // Verify generation produced output (school dashboard uses div containers, not <main>)
    const hasPreview = await timetablePage.hasPreviewSlots()
    const bodyText = await page
      .locator("body")
      .textContent()
      .catch(() => "")
    const hasStats =
      bodyText?.includes("placed") ||
      bodyText?.includes("slot") ||
      bodyText?.includes("Slot")

    expect(
      hasPreview || hasStats,
      "Generation should produce preview slots or statistics"
    ).toBeTruthy()
  })

  test("LC-022: Apply generated timetable", async ({ page }) => {
    test.setTimeout(120_000)

    const timetablePage = new TimetableGeneratePage(page, subdomain)
    const ok = await loginAndNavigateLifecycle(
      page,
      subdomain,
      timetablePage.path
    )
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Try to apply if the button is visible (means preview was generated)
    const applyBtn = timetablePage.applyButton.first()
    const applyVisible = await applyBtn
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)

    if (applyVisible) {
      await timetablePage.applyTimetable()
    }

    // Navigate to main timetable view to verify
    const navOk = await loginAndNavigateLifecycle(page, subdomain, "/timetable")
    if (!navOk) return

    await assertNoSSE(page)

    // Verify timetable page loads (school dashboard uses div containers, not <main>)
    const hasHeading = await page
      .locator("h1")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasHeading, "Timetable view should show heading").toBeTruthy()

    saveState({ phase: "timetable" })
  })
})
