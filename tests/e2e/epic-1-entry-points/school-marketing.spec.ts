/**
 * Epic 1: Entry Points - School Marketing
 * Story 1.3: School Marketing Public Access
 *
 * Tests public accessibility of school subdomain marketing pages.
 * Tag: @smoke @entry-points @multi-tenant
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE, assertRtlDirection } from "../../helpers/assertions"
import { buildSchoolUrl, getTestEnv } from "../../helpers/test-data"
import {
  SchoolAboutPage,
  SchoolAcademicPage,
  SchoolAdmissionsPage,
  SchoolApplyPage,
  SchoolHomePage,
  SchoolTourPage,
} from "../../page-objects"

const env = getTestEnv()

test.describe("Story 1.3: School Marketing Public Access @smoke @entry-points @multi-tenant", () => {
  test("EP-026: School home page loads", async ({ page }) => {
    const homePage = new SchoolHomePage(page, "demo")
    const response = await homePage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toContain("demo")
    await assertNoSSE(page)
  })

  test("EP-027: School about page loads", async ({ page }) => {
    const aboutPage = new SchoolAboutPage(page, "demo")
    const response = await aboutPage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toMatch(/\/about/)
    expect(page.url()).toContain("demo")
    await assertNoSSE(page)
  })

  test("EP-028: School academic page loads", async ({ page }) => {
    const academicPage = new SchoolAcademicPage(page, "demo")
    const response = await academicPage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toMatch(/\/academic/)
    await assertNoSSE(page)
  })

  test("EP-029: School admissions page loads", async ({ page }) => {
    const admissionsPage = new SchoolAdmissionsPage(page, "demo")
    const response = await admissionsPage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toMatch(/\/admissions/)
    await assertNoSSE(page)
  })

  test("EP-030: School apply page loads", async ({ page }) => {
    const applyPage = new SchoolApplyPage(page, "demo")
    const response = await applyPage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toMatch(/\/apply/)
    await assertNoSSE(page)
  })

  test("EP-031: School tour page loads", async ({ page }) => {
    const tourPage = new SchoolTourPage(page, "demo")
    const response = await tourPage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toMatch(/\/tour/)
    await assertNoSSE(page)
  })
})

test.describe("Story 1.3: School Marketing Locale Support", () => {
  test("EP-032: Arabic locale on school subdomain", async ({ page }) => {
    const homePage = new SchoolHomePage(page, "demo", "ar")
    const response = await homePage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toMatch(/\/ar/)
    expect(page.url()).toContain("demo")
    await assertRtlDirection(page)
  })

  test("EP-033: English locale on school subdomain", async ({ page }) => {
    const homePage = new SchoolHomePage(page, "demo", "en")
    const response = await homePage.goto()

    expect(response?.status()).toBeLessThan(400)
    expect(page.url()).toMatch(/\/en/)
    expect(page.url()).toContain("demo")
  })
})

test.describe("Story 1.3: School Marketing Content", () => {
  test("EP-034: School home has content", async ({ page }) => {
    const homePage = new SchoolHomePage(page, "demo")
    await homePage.goto()

    await expect(page.locator("body")).not.toBeEmpty()
    await expect(
      page.locator("h1, h2, [data-testid='hero'], main").first()
    ).toBeVisible({ timeout: 10000 })
  })

  test("EP-035: School login link accessible from marketing", async ({
    page,
  }) => {
    await page.goto(buildSchoolUrl("demo", "/login", "en", env))

    expect(page.url()).toMatch(/\/login/)
    expect(page.url()).toContain("demo")
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test("EP-036: No SSE on any school marketing page", async ({ page }) => {
    const pages = [
      new SchoolHomePage(page, "demo"),
      new SchoolAboutPage(page, "demo"),
      new SchoolAdmissionsPage(page, "demo"),
    ]

    for (const pageObj of pages) {
      await pageObj.goto()
      await assertNoSSE(page)
    }
  })
})
