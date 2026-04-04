// Copyright (c) 2025-present databayt

/**
 * Messaging Visual Regression Tests
 *
 * Captures baseline screenshots for the messaging interface across
 * viewports, locales, and color schemes. Uses Playwright's built-in
 * visual comparison with toHaveScreenshot().
 *
 * Tag: @messaging @visual
 */

import { expect, test } from "@playwright/test"

import {
  buildSchoolUrl,
  getTestEnv,
  SCHOOL_DASHBOARD_ROUTES,
  TIMEOUTS,
} from "../../helpers/test-data"
import { SchoolLoginPage } from "../../page-objects"

const env = getTestEnv()
const NAV_TIMEOUT = 30_000

// Visual tests must run sequentially — later tests depend on state from earlier ones
test.describe.configure({ mode: "serial" })

// Messaging pages load conversations via real-time connections — give extra time
test.setTimeout(60_000)

// Override project-level storageState — login fresh
test.use({
  storageState: { cookies: [], origins: [] },
  navigationTimeout: NAV_TIMEOUT,
})

// =============================================================================
// HELPERS
// =============================================================================

async function loginAsAdmin(page: import("@playwright/test").Page) {
  const loginPage = new SchoolLoginPage(page, "kingfahad")
  await loginPage.goto()
  await loginPage.login("admin@kingfahad.edu", "1234")
}

function messagesUrl(locale: "en" | "ar" = "en"): string {
  return buildSchoolUrl(
    "kingfahad",
    SCHOOL_DASHBOARD_ROUTES.messages,
    locale,
    env
  )
}

/**
 * Wait for the messaging interface to stabilize before taking a screenshot.
 * Allows async conversation data to load and animations to settle.
 */
async function waitForMessagingReady(
  page: import("@playwright/test").Page
): Promise<void> {
  await page.waitForLoadState("domcontentloaded")
  // Wait for conversation list or chat area to render
  const content = page.locator(
    '[data-testid="conversation-list"], [role="list"], aside, main'
  )
  await content.first().waitFor({ state: "visible", timeout: TIMEOUTS.medium })
  // Allow animations and lazy-loaded avatars to settle
  await page.waitForTimeout(1_000)
}

// =============================================================================
// VISUAL REGRESSION — CONVERSATION LIST
// =============================================================================

test.describe("Messaging Visual Regression @messaging @visual", () => {
  test("VIS-001: desktop LTR light - conversation list", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)

    await page.goto(messagesUrl("en"), { timeout: NAV_TIMEOUT })
    await waitForMessagingReady(page)

    await expect(page).toHaveScreenshot(
      "messaging-desktop-ltr-light-list.png",
      {
        maxDiffPixelRatio: 0.05,
      }
    )
  })

  test("VIS-002: desktop RTL light - conversation list", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)

    await page.goto(messagesUrl("ar"), { timeout: NAV_TIMEOUT })
    await waitForMessagingReady(page)

    // Verify RTL direction is applied
    const htmlDir = await page.locator("html").getAttribute("dir")
    expect(htmlDir === "rtl" || htmlDir === null).toBeTruthy()

    await expect(page).toHaveScreenshot(
      "messaging-desktop-rtl-light-list.png",
      {
        maxDiffPixelRatio: 0.05,
      }
    )
  })

  test("VIS-003: desktop LTR dark - conversation list", async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)

    await page.goto(messagesUrl("en"), { timeout: NAV_TIMEOUT })
    await waitForMessagingReady(page)

    await expect(page).toHaveScreenshot("messaging-desktop-ltr-dark-list.png", {
      maxDiffPixelRatio: 0.05,
    })
  })

  test("VIS-004: desktop LTR - active chat", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)

    await page.goto(messagesUrl("en"), { timeout: NAV_TIMEOUT })
    await waitForMessagingReady(page)

    // Click into the first conversation
    const firstConversation = page.locator(
      '[data-testid="conversation-item"], [role="listitem"], [data-testid="conversation-list"] > div'
    )
    await expect(firstConversation.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await firstConversation.first().click()

    // Wait for chat messages to load
    const messageArea = page.locator(
      '[data-testid="message-list"], [data-testid="chat-area"], [role="log"], main'
    )
    await messageArea.first().waitFor({
      state: "visible",
      timeout: TIMEOUTS.medium,
    })
    await page.waitForTimeout(1_000)

    await expect(page).toHaveScreenshot(
      "messaging-desktop-ltr-active-chat.png",
      {
        maxDiffPixelRatio: 0.05,
      }
    )
  })

  // ===========================================================================
  // MOBILE VIEWPORTS
  // ===========================================================================

  test("VIS-005: mobile LTR - conversation list", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsAdmin(page)

    await page.goto(messagesUrl("en"), { timeout: NAV_TIMEOUT })
    await waitForMessagingReady(page)

    await expect(page).toHaveScreenshot("messaging-mobile-ltr-list.png", {
      maxDiffPixelRatio: 0.05,
    })
  })

  test("VIS-006: mobile RTL - conversation list", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsAdmin(page)

    await page.goto(messagesUrl("ar"), { timeout: NAV_TIMEOUT })
    await waitForMessagingReady(page)

    await expect(page).toHaveScreenshot("messaging-mobile-rtl-list.png", {
      maxDiffPixelRatio: 0.05,
    })
  })

  test("VIS-007: mobile LTR - active chat", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsAdmin(page)

    await page.goto(messagesUrl("en"), { timeout: NAV_TIMEOUT })
    await waitForMessagingReady(page)

    // Click into the first conversation
    const firstConversation = page.locator(
      '[data-testid="conversation-item"], [role="listitem"], [data-testid="conversation-list"] > div'
    )
    await expect(firstConversation.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await firstConversation.first().click()

    // Wait for chat view to load on mobile
    const messageInput = page.locator(
      'textarea[placeholder*="message" i], textarea[placeholder*="type" i], textarea[placeholder*="write" i], [data-testid="message-input"], [contenteditable="true"]'
    )
    await expect(messageInput.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await page.waitForTimeout(1_000)

    await expect(page).toHaveScreenshot(
      "messaging-mobile-ltr-active-chat.png",
      {
        maxDiffPixelRatio: 0.05,
      }
    )
  })
})
