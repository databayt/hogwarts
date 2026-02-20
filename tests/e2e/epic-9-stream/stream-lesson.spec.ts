/**
 * Epic 9: Stream - Lesson Page Flow
 *
 * Tests the stream dashboard → course → lesson page flow,
 * including the lesson hero, sibling lessons row, and video player.
 * Tag: @stream @lesson @catalog
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import { buildSchoolUrl, getTestEnv, TIMEOUTS } from "../../helpers/test-data"
import { SchoolLoginPage } from "../../page-objects"

const env = getTestEnv()

// Stream pages are heavy — give extra time for login + SSR
test.setTimeout(60_000)

async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

async function loginAsAdmin(page: import("@playwright/test").Page) {
  const loginPage = new SchoolLoginPage(page, "demo")
  await loginPage.goto()
  await loginPage.loginAs("admin")
}

/** Navigate to the first lesson of elementary-arts and wait for it to load */
async function goToFirstLesson(page: import("@playwright/test").Page) {
  await page.goto(
    buildSchoolUrl("demo", "/stream/dashboard/elementary-arts", "en", env)
  )
  // Wait for server-side redirect to the first lesson
  await page
    .waitForURL(/\/stream\/dashboard\/elementary-arts\/\w+/, {
      timeout: TIMEOUTS.medium,
    })
    .catch(() => {})
  await page.waitForLoadState("domcontentloaded")
}

test.describe("Stream Dashboard @stream", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginAsAdmin(page)

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("ST-001: Can access stream dashboard", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/stream/dashboard", "en", env))
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toContain("/stream/dashboard")
    await assertNoSSE(page)
  })

  test("ST-002: Stream dashboard shows enrolled courses", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/stream/dashboard", "en", env))
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toBeEmpty()
    await assertNoSSE(page)
  })
})

test.describe("Stream Course Detail @stream", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginAsAdmin(page)

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("ST-003: Course slug redirects to first lesson", async ({ page }) => {
    // Use domcontentloaded to avoid timeout on server redirect chain
    await page.goto(
      buildSchoolUrl("demo", "/stream/dashboard/elementary-arts", "en", env),
      { waitUntil: "domcontentloaded", timeout: 30_000 }
    )
    // Wait for server redirect to append lessonId
    await page.waitForURL(/\/stream\/dashboard\/elementary-arts\/\w+/, {
      timeout: 20_000,
    })

    expect(page.url()).toMatch(
      /\/stream\/dashboard\/elementary-arts\/[a-zA-Z0-9]+/
    )
    await assertNoSSE(page)
  })
})

test.describe("Stream Lesson Page @stream @lesson", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginAsAdmin(page)

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("ST-004: Lesson page loads with hero", async ({ page }) => {
    await goToFirstLesson(page)

    expect(page.url()).toMatch(/\/stream\/dashboard\/elementary-arts\//)
    await assertNoSSE(page)

    // Hero section: Play button
    const playButton = page.locator("button", { hasText: "Play" })
    await expect(playButton).toBeVisible({ timeout: TIMEOUTS.medium })
  })

  test("ST-005: Lesson page shows breadcrumb navigation", async ({ page }) => {
    await goToFirstLesson(page)

    const backLink = page.locator("a", { hasText: "Back to Course" })
    await expect(backLink).toBeVisible({ timeout: TIMEOUTS.medium })
  })

  test("ST-006: Lesson page shows sibling lessons row", async ({ page }) => {
    await goToFirstLesson(page)

    // Sibling cards are links with group + relative classes
    const siblingCards = page.locator("a.group.relative")
    await expect(siblingCards.first()).toBeVisible({ timeout: TIMEOUTS.medium })

    const cardCount = await siblingCards.count()
    expect(cardCount).toBeGreaterThanOrEqual(1)
  })

  test("ST-007: Sibling lesson cards show title and chapter info", async ({
    page,
  }) => {
    await goToFirstLesson(page)

    const firstCard = page.locator("a.group.relative").first()
    await expect(firstCard).toBeVisible({ timeout: TIMEOUTS.medium })

    // Check for chapter/lesson position text (e.g., "C1, L2")
    const positionText = firstCard.locator("text=/C\\d+, L\\d+/")
    await expect(positionText).toBeVisible()
  })

  test("ST-008: Clicking sibling lesson navigates to that lesson", async ({
    page,
  }) => {
    await goToFirstLesson(page)

    const currentUrl = page.url()

    // Click the first sibling card
    const firstCard = page.locator("a.group.relative").first()
    await expect(firstCard).toBeVisible({ timeout: TIMEOUTS.medium })

    const href = await firstCard.getAttribute("href")
    await firstCard.click()

    // Wait for the URL to change
    if (href) {
      await page.waitForURL(`**${href}`, { timeout: TIMEOUTS.medium })
    } else {
      await page.waitForLoadState("domcontentloaded")
    }

    expect(page.url()).not.toBe(currentUrl)
    expect(page.url()).toMatch(/\/stream\/dashboard\/elementary-arts\//)
    await assertNoSSE(page)
  })

  test("ST-009: Lesson page shows lesson info card", async ({ page }) => {
    await goToFirstLesson(page)

    const completeButton = page.locator("button", {
      hasText: /Mark as Complete|Completed/,
    })
    await expect(completeButton).toBeVisible({ timeout: TIMEOUTS.medium })
  })

  test("ST-010: Lesson page has prev/next navigation", async ({ page }) => {
    await goToFirstLesson(page)

    // The nav buttons are inside <Link><Button> wrappers
    // Text: "Next: {title}" or "Back to Course" for last lesson
    // "Previous: {title}" (hidden label on sm)
    const navSection = page.locator("a", {
      hasText: /Previous|Next|Back to Course/,
    })
    await expect(navSection.first()).toBeVisible({ timeout: TIMEOUTS.medium })
  })
})
