/**
 * Compliance Settings — Admin gate
 *
 * Tests that the compliance settings page (ADEK eSIS configuration) is:
 * - reachable by ADMIN
 * - NOT reachable by STUDENT/TEACHER (RBAC)
 *
 * Tag: @attendance @compliance @rbac
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../e2e/_support/helpers/assertions"
import { buildSchoolUrl, getTestEnv } from "../../e2e/_support/helpers/test-data"
import { LoginPage } from "../../e2e/_support/page-objects"

const env = getTestEnv()
const SUBDOMAIN = "demo"

async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Compliance Settings @attendance @compliance @rbac", () => {
  test("CMP-001: ADMIN can reach /compliance page", async ({ page }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await page.goto(buildSchoolUrl(SUBDOMAIN, "/compliance", "en", env))
    await page.waitForLoadState("domcontentloaded")
    await assertNoSSE(page)

    // ADMIN should land on compliance page (URL should still match)
    expect(page.url()).toContain("/compliance")
  })

  test("CMP-002: STUDENT cannot view /compliance", async ({ page }) => {
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
      buildSchoolUrl(SUBDOMAIN, "/compliance", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    // Either redirected away OR shows an unauthorized state OR 404
    const url = page.url()
    const hasUnauthorized = await page
      .getByText(/unauthorized|forbidden|not authorized|404|not found/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)
    const redirected = !url.includes("/compliance")

    expect(
      hasUnauthorized || redirected || response?.status() === 404
    ).toBeTruthy()
  })

  test("CMP-003: TEACHER cannot view /compliance (admin/staff/dev only)", async ({
    page,
  }) => {
    test.setTimeout(60_000)

    await clearAuthState(page)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("teacher")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const response = await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/compliance", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const hasUnauthorized = await page
      .getByText(/unauthorized|forbidden|not authorized|404|not found/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)
    const redirected = !url.includes("/compliance")

    expect(
      hasUnauthorized || redirected || response?.status() === 404
    ).toBeTruthy()
  })
})
