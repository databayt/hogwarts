// Copyright (c) 2025-present databayt

/**
 * Messaging Flow - E2E User Journey
 *
 * Tests the messaging system's core user interactions:
 * - Conversation list display and navigation
 * - Sending and replying to messages
 * - Emoji picker, message actions, timestamps
 * - Mobile responsive back navigation
 *
 * Tag: @messaging @flow
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import {
  buildSchoolUrl,
  getTestEnv,
  SCHOOL_DASHBOARD_ROUTES,
  TIMEOUTS,
} from "../../helpers/test-data"
import { SchoolLoginPage } from "../../page-objects"

const env = getTestEnv()
const NAV_TIMEOUT = 30_000

// Messaging pages load conversations via real-time connections — give extra time
test.setTimeout(60_000)

// Override project-level storageState — login fresh per describe block
test.use({
  storageState: { cookies: [], origins: [] },
  navigationTimeout: NAV_TIMEOUT,
})

// Allow 1 retry for hydration race conditions on dev server
test.describe.configure({ retries: 1 })

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

// =============================================================================
// MESSAGING FLOW
// =============================================================================

test.describe("Messaging Flow @messaging @flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }
  })

  test("MSG-001: should display conversation list", async ({ page }) => {
    await page.goto(messagesUrl(), { timeout: NAV_TIMEOUT })
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).toContain("/messages")
    await assertNoSSE(page)

    // Sidebar or panel with conversation list should be visible
    const conversationList = page.locator(
      '[data-testid="conversation-list"], [role="list"], aside'
    )
    await expect(conversationList.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
  })

  test("MSG-002: should open a conversation", async ({ page }) => {
    await page.goto(messagesUrl(), { timeout: NAV_TIMEOUT })
    await page.waitForLoadState("domcontentloaded")

    // Click the first conversation card/item
    const firstConversation = page.locator(
      '[data-testid="conversation-item"], [role="listitem"], [data-testid="conversation-list"] > div'
    )
    await expect(firstConversation.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await firstConversation.first().click()

    // Verify chat interface loads — look for message input area
    const messageInput = page.locator(
      'textarea[placeholder*="message" i], textarea[placeholder*="type" i], textarea[placeholder*="write" i], [data-testid="message-input"], [contenteditable="true"]'
    )
    await expect(messageInput.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await assertNoSSE(page)
  })

  test("MSG-003: should send a text message", async ({ page }) => {
    await page.goto(messagesUrl(), { timeout: NAV_TIMEOUT })
    await page.waitForLoadState("domcontentloaded")

    // Open first conversation
    const firstConversation = page.locator(
      '[data-testid="conversation-item"], [role="listitem"], [data-testid="conversation-list"] > div'
    )
    await expect(firstConversation.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await firstConversation.first().click()

    // Wait for message input to appear
    const messageInput = page.locator(
      'textarea[placeholder*="message" i], textarea[placeholder*="type" i], textarea[placeholder*="write" i], [data-testid="message-input"], [contenteditable="true"]'
    )
    await expect(messageInput.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })

    // Type a test message
    const testMessage = `E2E test message ${Date.now()}`
    await messageInput.first().fill(testMessage)

    // Send via Enter key or send button
    const sendButton = page.locator(
      'button[aria-label*="send" i], button[data-testid="send-button"], button:has(svg)'
    )
    const hasSendButton = await sendButton
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false)

    if (hasSendButton) {
      await sendButton.first().click()
    } else {
      await messageInput.first().press("Enter")
    }

    // Verify message appears in the chat
    await expect(page.getByText(testMessage)).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await assertNoSSE(page)
  })

  test("MSG-004: should reply to a message", async ({ page }) => {
    await page.goto(messagesUrl(), { timeout: NAV_TIMEOUT })
    await page.waitForLoadState("domcontentloaded")

    // Open first conversation
    const firstConversation = page.locator(
      '[data-testid="conversation-item"], [role="listitem"], [data-testid="conversation-list"] > div'
    )
    await expect(firstConversation.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await firstConversation.first().click()

    // Wait for messages to load
    await page.waitForLoadState("domcontentloaded")

    // Hover over a message bubble to reveal actions
    const messageBubble = page.locator(
      '[data-testid="message-bubble"], [data-testid="message"], .message-bubble, [class*="message"]'
    )
    await expect(messageBubble.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await messageBubble.first().hover()

    // Click the reply action from the dropdown/menu
    const replyButton = page.locator(
      'button:has-text("Reply"), [data-testid="reply-button"], button[aria-label*="reply" i], [role="menuitem"]:has-text("Reply")'
    )
    await expect(replyButton.first()).toBeVisible({ timeout: TIMEOUTS.short })
    await replyButton.first().click()

    // Verify reply context appears near the input area
    const replyContext = page.locator(
      '[data-testid="reply-context"], [data-testid="reply-preview"], [class*="reply"]'
    )
    await expect(replyContext.first()).toBeVisible({
      timeout: TIMEOUTS.short,
    })
    await assertNoSSE(page)
  })

  test("MSG-005: should show emoji picker", async ({ page }) => {
    await page.goto(messagesUrl(), { timeout: NAV_TIMEOUT })
    await page.waitForLoadState("domcontentloaded")

    // Open first conversation
    const firstConversation = page.locator(
      '[data-testid="conversation-item"], [role="listitem"], [data-testid="conversation-list"] > div'
    )
    await expect(firstConversation.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await firstConversation.first().click()

    // Wait for chat interface to load
    const messageInput = page.locator(
      'textarea[placeholder*="message" i], textarea[placeholder*="type" i], textarea[placeholder*="write" i], [data-testid="message-input"], [contenteditable="true"]'
    )
    await expect(messageInput.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })

    // Click the emoji/smiley button
    const emojiButton = page.locator(
      'button[aria-label*="emoji" i], button[data-testid="emoji-button"], button:has(svg[class*="smile" i])'
    )
    await expect(emojiButton.first()).toBeVisible({ timeout: TIMEOUTS.short })
    await emojiButton.first().click()

    // Verify picker opens
    const emojiPicker = page.locator(
      '[data-testid="emoji-picker"], [class*="emoji-picker"], em-emoji-picker, [role="dialog"]:has([class*="emoji"])'
    )
    await expect(emojiPicker.first()).toBeVisible({ timeout: TIMEOUTS.short })
    await assertNoSSE(page)
  })

  test("MSG-006: should show message actions on hover", async ({ page }) => {
    await page.goto(messagesUrl(), { timeout: NAV_TIMEOUT })
    await page.waitForLoadState("domcontentloaded")

    // Open first conversation
    const firstConversation = page.locator(
      '[data-testid="conversation-item"], [role="listitem"], [data-testid="conversation-list"] > div'
    )
    await expect(firstConversation.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await firstConversation.first().click()

    // Wait for messages to load
    const messageBubble = page.locator(
      '[data-testid="message-bubble"], [data-testid="message"], .message-bubble, [class*="message"]'
    )
    await expect(messageBubble.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })

    // Hover over the message bubble
    await messageBubble.first().hover()

    // Verify action trigger (chevron/dropdown) appears on hover
    const actionTrigger = page.locator(
      '[data-testid="message-actions"], button[aria-label*="more" i], button[aria-label*="actions" i], [class*="chevron"], [data-testid="message-menu"]'
    )
    await expect(actionTrigger.first()).toBeVisible({
      timeout: TIMEOUTS.short,
    })
    await assertNoSSE(page)
  })

  test("MSG-007: should display message timestamps", async ({ page }) => {
    await page.goto(messagesUrl(), { timeout: NAV_TIMEOUT })
    await page.waitForLoadState("domcontentloaded")

    // Open first conversation
    const firstConversation = page.locator(
      '[data-testid="conversation-item"], [role="listitem"], [data-testid="conversation-list"] > div'
    )
    await expect(firstConversation.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await firstConversation.first().click()

    // Wait for messages to load
    await page.waitForLoadState("domcontentloaded")

    // Verify timestamps are visible on messages
    // Timestamps typically use <time>, data-testid, or recognizable time patterns
    const timestamp = page.locator(
      'time, [data-testid="message-timestamp"], [class*="timestamp"], [class*="time"]'
    )
    await expect(timestamp.first()).toBeVisible({ timeout: TIMEOUTS.medium })
    await assertNoSSE(page)
  })

  test("MSG-008: should navigate back on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })

    await page.goto(messagesUrl(), { timeout: NAV_TIMEOUT })
    await page.waitForLoadState("domcontentloaded")

    // Open first conversation
    const firstConversation = page.locator(
      '[data-testid="conversation-item"], [role="listitem"], [data-testid="conversation-list"] > div'
    )
    await expect(firstConversation.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await firstConversation.first().click()

    // Verify chat view is showing (input should be visible)
    const messageInput = page.locator(
      'textarea[placeholder*="message" i], textarea[placeholder*="type" i], textarea[placeholder*="write" i], [data-testid="message-input"], [contenteditable="true"]'
    )
    await expect(messageInput.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })

    // Click back arrow to return to conversation list
    const backButton = page.locator(
      'button[aria-label*="back" i], a[aria-label*="back" i], [data-testid="back-button"], button:has(svg[class*="arrow-left" i]), button:has(svg[class*="chevron-left" i])'
    )
    await expect(backButton.first()).toBeVisible({ timeout: TIMEOUTS.short })
    await backButton.first().click()

    // Verify conversation list is visible again
    const conversationList = page.locator(
      '[data-testid="conversation-list"], [role="list"], aside'
    )
    await expect(conversationList.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
    await assertNoSSE(page)
  })
})
