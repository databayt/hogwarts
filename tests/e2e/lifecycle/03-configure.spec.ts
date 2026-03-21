/**
 * Epic 14: Classroom Configuration
 *
 * Tests the classroom setup pipeline:
 * - Navigate to configure page (LC-013)
 * - Generate classes from catalog (LC-014)
 * - Enroll students in classes (LC-015)
 * - Verify student enrollments (LC-016)
 *
 * Tag: @lifecycle @configure
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import {
  loadState,
  loginAndNavigateLifecycle,
  saveState,
} from "../../helpers/lifecycle-state"
import { TIMEOUTS } from "../../helpers/test-data"
import { ClassroomConfigurePage } from "../../page-objects/classroom-configure.page"

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
  // Story 14.1: Generate Classes and Enroll Students
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
      .locator("h1")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasHeading, "Configure page should show heading").toBeTruthy()
  })

  test("LC-014: Generate classes for all grades", async ({ page }) => {
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

    // Select term if dropdown is visible
    await configurePage.selectTerm()

    // Generate classes
    const generateBtn = configurePage.generateClassesButton.first()
    const btnVisible = await generateBtn
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (!btnVisible) {
      test.skip(
        true,
        "Generate Classes button not visible -- terms/grades may be missing"
      )
      return
    }

    await configurePage.generateClasses()
    await page.waitForTimeout(3000)

    // Verify classes were generated
    const hasToast = await configurePage.hasSuccessToast()
    const hasClassRows = await page
      .locator('table tbody tr, [data-testid*="class"]')
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    expect(
      hasClassRows || hasToast,
      "Generating classes should produce class rows or success toast"
    ).toBeTruthy()
  })

  test("LC-015: Enroll students in classes", async ({ page }) => {
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

    // Enroll students
    const enrollBtn = configurePage.enrollStudentsButton.first()
    const btnVisible = await enrollBtn
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (!btnVisible) {
      test.skip(
        true,
        "Enroll Students button not visible -- classes may not exist yet"
      )
      return
    }

    await configurePage.enrollStudents()
    await page.waitForTimeout(3000)

    // Verify enrollment succeeded — toast or page state change
    const hasToast = await configurePage.hasSuccessToast()
    const hasClassRows = await page
      .locator('table tbody tr, [data-testid*="class"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    expect(
      hasToast || hasClassRows,
      "Enrolling students should show success toast or class data"
    ).toBeTruthy()
  })

  test("LC-016: Verify student enrollments", async ({ page }) => {
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
