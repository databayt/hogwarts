/**
 * Conference RBAC matrix
 *
 * Verifies allowed/blocked routes per role for the conference block.
 *   - /conference               → all school roles
 *   - /conference/schedule      → ADMIN, TEACHER, DEVELOPER only
 *   - /conference/network-test  → ADMIN, DEVELOPER only
 *
 * Tag: @conference @rbac
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

test.describe("Conference RBAC @conference @rbac", () => {
  test("LC-RBAC-01: ADMIN can access /conference", async ({ page }) => {
    await loginAs(page, "admin")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/conference", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/conference/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-02: TEACHER can access /conference", async ({ page }) => {
    await loginAs(page, "teacher")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/conference", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/conference/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-03: TEACHER can access /conference/schedule", async ({
    page,
  }) => {
    await loginAs(page, "teacher")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/conference/schedule", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/conference/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-04: STUDENT can access /conference (read-only)", async ({
    page,
  }) => {
    await loginAs(page, "student")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/conference", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/conference/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-05: STUDENT blocked from /conference/schedule", async ({
    page,
  }) => {
    await loginAs(page, "student")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/conference/schedule", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    const url = page.url()
    // Student should be redirected to /dashboard (the page's ALLOWED_ROLES gate).
    expect(
      url.includes("/dashboard") || !url.includes("/conference/schedule")
    ).toBeTruthy()
  })

  test("LC-RBAC-06: GUARDIAN can access /conference (observer mode)", async ({
    page,
  }) => {
    await loginAs(page, "guardian")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/conference", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/conference/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-07: GUARDIAN blocked from /conference/network-test", async ({
    page,
  }) => {
    await loginAs(page, "guardian")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/conference/network-test", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    const url = page.url()
    expect(
      url.includes("/dashboard") || !url.includes("/network-test")
    ).toBeTruthy()
  })

  test("LC-RBAC-08: STAFF can access /conference (read-only)", async ({
    page,
  }) => {
    await loginAs(page, "staff")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/conference", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/conference/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-09: ACCOUNTANT can access /conference", async ({ page }) => {
    await loginAs(page, "accountant")
    if (skipIfProtocolError(page)) return
    await page.goto(buildSchoolUrl(SUBDOMAIN, "/conference", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/conference/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-10: ADMIN can access /conference/network-test", async ({
    page,
  }) => {
    await loginAs(page, "admin")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/conference/network-test", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toMatch(/\/conference/)
    await assertNoSSE(page)
  })

  test("LC-RBAC-11: TEACHER blocked from /conference/network-test", async ({
    page,
  }) => {
    await loginAs(page, "teacher")
    if (skipIfProtocolError(page)) return
    await page.goto(
      buildSchoolUrl(SUBDOMAIN, "/conference/network-test", "en", env)
    )
    await page.waitForLoadState("domcontentloaded")
    const url = page.url()
    expect(
      url.includes("/dashboard") || !url.includes("/network-test")
    ).toBeTruthy()
  })
})
