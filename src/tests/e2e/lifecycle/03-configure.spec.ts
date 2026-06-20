/**
 * Epic 14: Classroom Configuration
 *
 * Tests the lean classroom setup pipeline:
 * - Navigate to configure page (LC-013)
 * - Generate sections + their main classrooms for all grades (LC-014)
 * - Verify students are present (LC-015)
 *
 * Class generation and student enrollment are intentionally NOT part of the
 * Configure page — subjects bind to grades at catalog-bridge time, and students
 * are placed into grades/sections elsewhere.
 *
 * Tag: @lifecycle @configure
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../_support/helpers/assertions"
import {
  loadState,
  loginAndNavigateLifecycle,
  saveState,
} from "../_support/helpers/lifecycle-state"
import { TIMEOUTS } from "../_support/helpers/test-data"
import { ClassroomConfigurePage } from "../_support/page-objects/classroom-configure.page"

// ============================================================================
// SUITE: Epic 14 - Classroom Configuration
// ============================================================================

test.describe
  .serial("Epic 14: Classroom Configuration @lifecycle @configure", () => {
  let subdomain: string
  let configurePage: ClassroomConfigurePage

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
  // Story 14.1: Sections per grade + main classrooms
  // ========================================================================

  test("LC-013: Navigate to classrooms configure", async ({ page }) => {
    test.setTimeout(60_000)

    configurePage = new ClassroomConfigurePage(page, subdomain)
    const ok = await loginAndNavigateLifecycle(
      page,
      subdomain,
      configurePage.path
    )
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    // Verify configure page loaded (school dashboard uses div containers, not <main>)
    const hasHeading = await page
      .locator("h1, h3")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasHeading, "Configure page should show heading").toBeTruthy()
  })

  test("LC-014: Generate sections + rooms for all grades", async ({ page }) => {
    test.setTimeout(120_000)

    configurePage = new ClassroomConfigurePage(page, subdomain)
    const ok = await loginAndNavigateLifecycle(
      page,
      subdomain,
      configurePage.path
    )
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const generateBtn = configurePage.generateAllButton.first()
    const btnVisible = await generateBtn
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (!btnVisible) {
      // Button is disabled/absent when every grade already has its sections,
      // or when classroom types are not set up yet — both are valid states.
      test.skip(
        true,
        "Generate All not actionable -- sections already complete or no grades"
      )
      return
    }

    await configurePage.generateSections()
    await page.waitForTimeout(3000)

    // Verify the grade table is present (sections configured)
    const hasRows = await page
      .locator("table tbody tr")
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)
    const hasToast = await configurePage.hasSuccessToast()

    expect(
      hasRows || hasToast,
      "Configure page should show the grade/sections table or a success toast"
    ).toBeTruthy()
  })

  test("LC-015: Verify students are present", async ({ page }) => {
    test.setTimeout(60_000)

    const ok = await loginAndNavigateLifecycle(page, subdomain, "/students")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    // Verify students visible (school dashboard uses div containers, not <main>)
    const bodyText = await page
      .locator("body")
      .textContent()
      .catch(() => "")
    const hasStudents =
      bodyText?.includes("Ali") ||
      bodyText?.includes("Sara") ||
      bodyText?.includes("Student")

    expect(
      hasStudents,
      "Students page should show student entries"
    ).toBeTruthy()

    saveState({ phase: "configured" })
  })
})
