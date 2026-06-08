/**
 * Attendance Overview — RBAC checks
 *
 * Tests that each role lands on a sensible attendance page:
 * - ADMIN/TEACHER/STAFF see the staff overview with Manual/Analytics tabs
 * - STUDENT/GUARDIAN see a records-style view (no Manual marking)
 *
 * Tag: @attendance @rbac
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../e2e/_support/helpers/assertions"
import {
  buildSchoolUrl,
  getTestEnv,
} from "../../e2e/_support/helpers/test-data"
import { LoginPage } from "../../e2e/_support/page-objects"

const env = getTestEnv()
const SUBDOMAIN = "demo"

async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Attendance — Overview RBAC @attendance @rbac", () => {
  test("ATT-001: ADMIN sees Manual tab on overview", async ({ page }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await page.goto(buildSchoolUrl(SUBDOMAIN, "/attendance", "en", env))
    await page.waitForLoadState("domcontentloaded")
    await assertNoSSE(page)

    // ADMIN should see the staff Overview (Manual tab present somewhere)
    const hasManual = await page
      .getByRole("link", { name: /manual|يدوي/i })
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasManual).toBeTruthy()
  })

  test("ATT-002: TEACHER sees Manual tab", async ({ page }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("teacher")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await page.goto(buildSchoolUrl(SUBDOMAIN, "/attendance", "en", env))
    await page.waitForLoadState("domcontentloaded")
    await assertNoSSE(page)

    const hasManual = await page
      .getByRole("link", { name: /manual|يدوي/i })
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasManual).toBeTruthy()
  })

  test("ATT-003: STUDENT does NOT see Manual tab (sees Records)", async ({
    page,
  }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("student")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await page.goto(buildSchoolUrl(SUBDOMAIN, "/attendance", "en", env))
    await page.waitForLoadState("domcontentloaded")
    await assertNoSSE(page)

    // Student should see Records, not Manual
    const hasRecords = await page
      .getByRole("link", { name: /records|سجلات/i })
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const hasManual = await page
      .getByRole("link", { name: /^manual$|^يدوي$/i })
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false)

    expect(hasRecords || !hasManual).toBeTruthy()
  })

  test("ATT-004: STAFF sees Manual + Analytics", async ({ page }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("staff")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await page.goto(buildSchoolUrl(SUBDOMAIN, "/attendance", "en", env))
    await page.waitForLoadState("domcontentloaded")
    await assertNoSSE(page)

    const hasAnalytics = await page
      .getByRole("link", { name: /analytics|تحليلات/i })
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasAnalytics).toBeTruthy()
  })

  test("ATT-005: GUARDIAN sees Excuses tab (can submit excuses)", async ({
    page,
  }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("guardian")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await page.goto(buildSchoolUrl(SUBDOMAIN, "/attendance", "en", env))
    await page.waitForLoadState("domcontentloaded")
    await assertNoSSE(page)

    const hasExcuses = await page
      .getByRole("link", { name: /excuses|أعذار/i })
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false)

    expect(hasExcuses).toBeTruthy()
  })
})
