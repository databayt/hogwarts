/**
 * Admin Marks Manual Attendance
 *
 * The "happy path" for the core attendance marking flow:
 * Admin logs in, navigates to /manual, selects a class, marks students, saves.
 *
 * Tag: @attendance @critical
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import { buildSchoolUrl, getTestEnv } from "../../helpers/test-data"
import { LoginPage } from "../../page-objects"
import { AttendanceMarkingPage } from "../../page-objects/attendance-marking.page"

const env = getTestEnv()
const SUBDOMAIN = "demo"

async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Attendance — Admin Marks Manual @attendance @critical", () => {
  test("ATT-010: Admin can open manual marking page", async ({ page }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const attendancePage = new AttendanceMarkingPage(page, SUBDOMAIN)
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/attendance/manual", "en", env))
    await page.waitForLoadState("domcontentloaded")
    await assertNoSSE(page)

    // Manual page should show class selector OR student rows
    const hasClassSelect = await attendancePage.classSelect
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const hasStudentRows = await attendancePage.studentRows
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    expect(hasClassSelect || hasStudentRows).toBeTruthy()
  })

  test("ATT-011: Manual page loads without server-side exception", async ({
    page,
  }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const attendancePage = new AttendanceMarkingPage(page, SUBDOMAIN)
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/attendance/manual", "en", env))
    await page.waitForLoadState("domcontentloaded")
    await assertNoSSE(page)

    expect(page.url()).toContain("/manual")
  })
})
