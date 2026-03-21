/**
 * Epic 15: Teacher Expertise Setup
 *
 * Tests the teacher expertise assignment flow:
 * - Navigate to teacher list (LC-017)
 * - Open expertise wizard (LC-018)
 * - Assign subjects and save (LC-019)
 *
 * Tag: @lifecycle @expertise
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import {
  loadState,
  loginAndNavigateLifecycle,
  loginAsLifecycleUser,
  saveState,
} from "../../helpers/lifecycle-state"
import { TeacherExpertisePage } from "../../page-objects/teacher-expertise.page"

// ============================================================================
// SUITE: Epic 15 - Teacher Expertise Setup
// ============================================================================

test.describe
  .serial("Epic 15: Teacher Expertise Setup @lifecycle @expertise", () => {
  let subdomain: string
  let teacherIds: string[]

  test.beforeAll(() => {
    const state = loadState()
    if (!state.schoolSubdomain) {
      throw new Error(
        "Precondition failed: no school subdomain. Run previous specs first."
      )
    }
    subdomain = state.schoolSubdomain
    teacherIds = state.teacherIds || []
  })

  // ========================================================================
  // Story 15.1: Assign Subject Expertise to Teachers
  // ========================================================================

  test("LC-017: Navigate to teacher list and get IDs", async ({ page }) => {
    test.setTimeout(60_000)

    const ok = await loginAndNavigateLifecycle(page, subdomain, "/teachers")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    // Verify teachers page loaded (school dashboard uses div containers, not <main>)
    const hasHeading = await page
      .locator("h1")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasHeading, "Teachers page should show heading").toBeTruthy()

    // Extract teacher IDs if we don't have them from provisioning
    // CUIDs are 25 chars — require 20+ to exclude "departments", "schedule", etc.
    if (teacherIds.length === 0) {
      const links = page.locator('a[href*="/teachers/"]')
      const linkCount = await links.count().catch(() => 0)
      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const href = await links
          .nth(i)
          .getAttribute("href")
          .catch(() => "")
        if (href) {
          const match = href.match(/\/teachers\/(?:add\/)?([a-z0-9-]{20,})/i)
          if (match) {
            teacherIds.push(match[1])
          }
        }
      }
      teacherIds = [...new Set(teacherIds)]
      saveState({ teacherIds })
    }
  })

  test("LC-018: Open teacher expertise wizard", async ({ page }) => {
    test.setTimeout(60_000)

    if (teacherIds.length === 0) {
      test.skip(true, "No teacher IDs available")
      return
    }

    const ok = await loginAsLifecycleUser(page)
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const expertisePage = new TeacherExpertisePage(page, subdomain)
    await expertisePage.gotoExpertise(teacherIds[0])

    await assertNoSSE(page)

    // Verify expertise page loaded (school dashboard uses div containers, not <main>)
    const hasHeading = await page
      .locator("h1")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasHeading, "Expertise wizard should show heading").toBeTruthy()
  })

  test("LC-019: Assign expertise and save", async ({ page }) => {
    test.setTimeout(120_000)

    if (teacherIds.length === 0) {
      test.skip(true, "No teacher IDs available")
      return
    }

    const ok = await loginAsLifecycleUser(page)
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Assign expertise to the first teacher
    const expertisePage = new TeacherExpertisePage(page, subdomain)
    await expertisePage.gotoExpertise(teacherIds[0])
    await page.waitForTimeout(2000)

    // Select subjects
    await expertisePage.selectSubjects(2)

    // Save
    await expertisePage.save()

    // If we have a second teacher, assign expertise to them too
    if (teacherIds.length > 1) {
      await expertisePage.gotoExpertise(teacherIds[1])
      await page.waitForTimeout(2000)
      await expertisePage.selectSubjects(2)
      await expertisePage.save()
    }

    saveState({ phase: "expertise" })
  })
})
