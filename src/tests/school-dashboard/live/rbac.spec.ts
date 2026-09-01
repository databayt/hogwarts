/**
 * Conference RBAC matrix
 *
 * Verifies allowed/blocked routes per role for the conference block.
 *   - /live               → all school roles
 *   - /live/schedule      → ADMIN, TEACHER, DEVELOPER only
 *   - /live/network-test  → ADMIN, DEVELOPER only
 *
 * Tag: @conference @rbac
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../e2e/_support/helpers/assertions"
import {
  buildSchoolUrl,
  getTestEnv,
} from "../../e2e/_support/helpers/test-data"
import { SchoolLoginPage } from "../../e2e/_support/page-objects"

const env = getTestEnv()
const SUBDOMAIN = "demo"

async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

type RoleKey =
  | "admin"
  | "teacher"
  | "student"
  | "guardian"
  | "staff"
  | "accountant"

async function loginAs(page: import("@playwright/test").Page, role: RoleKey) {
  await clearAuthState(page)
  const loginPage = new SchoolLoginPage(page, SUBDOMAIN)
  await loginPage.goto()
  await loginPage.loginAs(role)
}

function skipIfProtocolError(page: import("@playwright/test").Page): boolean {
  if (page.url().includes("chrome-error://")) {
    test.skip(true, "Protocol mismatch in dev environment")
    return true
  }
  return false
}

test.describe("Conference RBAC @conference @rbac", () => {
  test("LC-RBAC-01: ADMIN can access /live", async ({ page }) => {
    await loginAs(page, "admin")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-02: TEACHER can access /live", async ({ page }) => {
    await loginAs(page, "teacher")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-03: TEACHER can access /live/schedule", async ({ page }) => {
    await loginAs(page, "teacher")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live/schedule", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-04: STUDENT can access /live (read-only)", async ({ page }) => {
    await loginAs(page, "student")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-05: STUDENT blocked from /live/schedule", async ({ page }) => {
    await loginAs(page, "student")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live/schedule", "en", env))
    await page.waitForLoadState("domcontentloaded")
    const url = page.url()
    // Student should be redirected to /dashboard (the page's ALLOWED_ROLES gate).
    expect(
      url.includes("/dashboard") || !url.includes("/live/schedule")
    ).toBeTruthy()
  })

  test("LC-RBAC-06: GUARDIAN can access /live (observer mode)", async ({
    page,
  }) => {
    await loginAs(page, "guardian")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-07: GUARDIAN blocked from /live/network-test", async ({
    page,
  }) => {
    await loginAs(page, "guardian")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live/network-test", "en", env))
    await page.waitForLoadState("domcontentloaded")
    const url = page.url()
    expect(
      url.includes("/dashboard") || !url.includes("/network-test")
    ).toBeTruthy()
  })

  test("LC-RBAC-08: STAFF can access /live (read-only)", async ({ page }) => {
    await loginAs(page, "staff")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-09: ACCOUNTANT can access /live", async ({ page }) => {
    await loginAs(page, "accountant")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-10: ADMIN can access /live/network-test", async ({ page }) => {
    await loginAs(page, "admin")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live/network-test", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-11: TEACHER blocked from /live/network-test", async ({
    page,
  }) => {
    await loginAs(page, "teacher")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live/network-test", "en", env))
    await page.waitForLoadState("domcontentloaded")
    const url = page.url()
    expect(
      url.includes("/dashboard") || !url.includes("/network-test")
    ).toBeTruthy()
  })
})
