/**
 * Student Views Own Records
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

test.describe("Attendance — Student Views Records @attendance @rbac", () => {
  test("ATT-020: Student lands on /attendance without SSE", async ({
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

    expect(page.url()).toContain("/attendance")
  })

  test("ATT-021: Student gets blocked from /manual", async ({ page }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("student")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const response = await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/attendance/manual", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const hasDenied = await page
      .getByText(/access denied|unauthorized|forbidden|not found/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)
    const redirected = !url.includes("/manual")

    // Either redirected, shows access-denied, or 404
    expect(hasDenied || redirected || response?.status() === 404).toBeTruthy()
  })
})
