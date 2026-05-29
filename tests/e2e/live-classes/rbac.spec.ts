/**
 * Live-classes RBAC matrix
 *
 * Verifies allowed/blocked routes per role for the live-classes block.
 *   - /live-classes               → all school roles
 *   - /live-classes/schedule      → ADMIN, TEACHER, DEVELOPER only
 *   - /live-classes/network-test  → ADMIN, DEVELOPER only
 *
 * Tag: @live-classes @rbac
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import { buildSchoolUrl, getTestEnv } from "../../helpers/test-data"
import { SchoolLoginPage } from "../../page-objects"

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

test.describe("Live-classes RBAC @live-classes @rbac", () => {
  test("LC-RBAC-01: ADMIN can access /live-classes", async ({ page }) => {
    await loginAs(page, "admin")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live-classes", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live-classes/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-02: TEACHER can access /live-classes", async ({ page }) => {
    await loginAs(page, "teacher")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live-classes", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live-classes/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-03: TEACHER can access /live-classes/schedule", async ({
    page,
  }) => {
    await loginAs(page, "teacher")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/live-classes/schedule", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live-classes/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-04: STUDENT can access /live-classes (read-only)", async ({
    page,
  }) => {
    await loginAs(page, "student")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live-classes", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live-classes/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-05: STUDENT blocked from /live-classes/schedule", async ({
    page,
  }) => {
    await loginAs(page, "student")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/live-classes/schedule", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    const url = page.url()
    // Student should be redirected to /dashboard (the page's ALLOWED_ROLES gate).
    expect(
      url.includes("/dashboard") || !url.includes("/live-classes/schedule")
    ).toBeTruthy()
  })

  test("LC-RBAC-06: GUARDIAN can access /live-classes (observer mode)", async ({
    page,
  }) => {
    await loginAs(page, "guardian")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live-classes", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live-classes/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-07: GUARDIAN blocked from /live-classes/network-test", async ({
    page,
  }) => {
    await loginAs(page, "guardian")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/live-classes/network-test", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    const url = page.url()
    expect(
      url.includes("/dashboard") || !url.includes("/network-test")
    ).toBeTruthy()
  })

  test("LC-RBAC-08: STAFF can access /live-classes (read-only)", async ({
    page,
  }) => {
    await loginAs(page, "staff")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live-classes", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live-classes/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-09: ACCOUNTANT can access /live-classes", async ({ page }) => {
    await loginAs(page, "accountant")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/live-classes", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live-classes/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-10: ADMIN can access /live-classes/network-test", async ({
    page,
  }) => {
    await loginAs(page, "admin")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/live-classes/network-test", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/live-classes/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-11: TEACHER blocked from /live-classes/network-test", async ({
    page,
  }) => {
    await loginAs(page, "teacher")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/live-classes/network-test", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    const url = page.url()
    expect(
      url.includes("/dashboard") || !url.includes("/network-test")
    ).toBeTruthy()
  })
})
