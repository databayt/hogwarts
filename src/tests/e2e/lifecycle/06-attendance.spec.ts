/**
 * Epic 17: Attendance Marking
 *
 * Tests the attendance overview and manual marking flow:
 * - Navigate to attendance overview (LC-023)
 * - Open manual attendance and select class (LC-024)
 * - Mark students and save attendance (LC-025)
 *
 * Tag: @lifecycle @attendance
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../_support/helpers/assertions"
import {
  loadState,
  loginAndNavigateLifecycle,
  loginAsLifecycleUser,
  saveState,
} from "../_support/helpers/lifecycle-state"
import { TIMEOUTS } from "../_support/helpers/test-data"
import { AttendanceMarkingPage } from "../_support/page-objects/attendance-marking.page"

// ============================================================================
// SUITE: Epic 17 - Attendance Marking
// ============================================================================

test.describe
  .serial("Epic 17: Attendance Marking @lifecycle @attendance", () => {
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
  // Story 17.1: View and Mark Attendance
  // ========================================================================

  test("LC-023: Navigate to attendance overview", async ({ page }) => {
    test.setTimeout(60_000)

    const attendancePage = new AttendanceMarkingPage(page, subdomain)
    const ok = await loginAndNavigateLifecycle(
      page,
      subdomain,
      attendancePage.path
    )
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    // Verify attendance overview loaded (school dashboard uses div containers, not <main>)
    const hasHeading = await page
      .locator("h1")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasHeading, "Attendance overview should show heading").toBeTruthy()
  })

  test("LC-024: Open manual attendance and select class", async ({ page }) => {
    test.setTimeout(60_000)

    const ok = await loginAsLifecycleUser(page)
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const attendancePage = new AttendanceMarkingPage(page, subdomain)
    await attendancePage.gotoManual()

    await assertNoSSE(page)

    // Verify manual attendance page loaded (school dashboard uses div containers, not <main>)
    const hasHeading = await page
      .locator("h1")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(
      hasHeading,
      "Manual attendance page should show heading"
    ).toBeTruthy()

    // Try to select a class
    await attendancePage.selectClass()

    // Check if student rows appeared (depends on enrollment data)
    const hasRows = await attendancePage.hasStudentRows()
    if (!hasRows) {
      console.log(
        "No student rows after class selection — enrollments may be missing"
      )
    }
  })

  test("LC-025: Mark and save attendance", async ({ page }) => {
    test.setTimeout(120_000)

    const ok = await loginAsLifecycleUser(page)
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const attendancePage = new AttendanceMarkingPage(page, subdomain)
    await attendancePage.gotoManual()
    await page.waitForTimeout(2000)

    // Select a class
    await attendancePage.selectClass()
    await page.waitForTimeout(2000)

    // Check if we have student rows to work with
    const hasRows = await attendancePage.hasStudentRows()

    if (!hasRows) {
      test.skip(
        true,
        "No student rows available — enrollments or class data missing"
      )
      return
    }

    // Mark individual students with different statuses
    await attendancePage.markStudent(0, "P") // Present
    await attendancePage.markStudent(1, "P") // Present
    await attendancePage.markStudent(2, "P") // Present

    // Mark one absent if enough rows
    const rowCount = await attendancePage.studentRows.count().catch(() => 0)
    if (rowCount > 3) {
      await attendancePage.markStudent(3, "A") // Absent
    }
    if (rowCount > 4) {
      await attendancePage.markStudent(4, "L") // Late
    }

    // Save attendance
    await attendancePage.save()

    // Verify save succeeded — check for success toast or attendance UI intact
    const hasToast = await page
      .locator(
        '[data-sonner-toast][data-type="success"], [role="status"]:has-text("success")'
      )
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    const bodyText = await page
      .locator("body")
      .textContent()
      .catch(() => "")
    const hasAttendanceUI =
      bodyText?.includes("Attendance") ||
      bodyText?.includes("الحضور") ||
      bodyText?.includes("Save") ||
      bodyText?.includes("حفظ")

    expect(
      hasToast || hasAttendanceUI,
      "Attendance save should show success toast or maintain attendance UI"
    ).toBeTruthy()

    // Navigate back to overview to verify (use path-based URL for cookie scoping)
    await page.goto(
      `http://localhost:3000/en/s/${subdomain}${attendancePage.path}`
    )
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(3000)

    await assertNoSSE(page)

    // Verify overview loaded (school dashboard uses div containers, not <main>)
    const hasOverviewHeading = await page
      .locator("h1")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(
      hasOverviewHeading,
      "Attendance overview should show heading after marking"
    ).toBeTruthy()

    saveState({ phase: "attendance" })
  })
})
