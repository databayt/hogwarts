/**
 * Timetable Generate Page Object
 *
 * Encapsulates interactions with the timetable generation UI,
 * including preview generation and application.
 */

import type { Locator, Page } from "@playwright/test"

import { TIMEOUTS, type Locale } from "../helpers/test-data"
import { SchoolBasePage } from "./base.page"

export class TimetableGeneratePage extends SchoolBasePage {
  readonly generateButton: Locator
  readonly applyButton: Locator
  readonly previewGrid: Locator
  readonly termSelect: Locator
  readonly statsSection: Locator
  readonly toast: Locator

  constructor(page: Page, subdomain: string, locale: Locale = "en") {
    super(page, subdomain, locale)

    this.generateButton = page.locator(
      'button:has-text("Generate"), button:has-text("توليد")'
    )
    this.applyButton = page.locator(
      'button:has-text("Apply"), button:has-text("Save"), button:has-text("تطبيق"), button:has-text("حفظ")'
    )
    this.previewGrid = page.locator(
      'table, [role="grid"], [data-testid*="timetable"]'
    )
    this.termSelect = page.locator(
      'select, [role="combobox"], [data-slot="select-trigger"]'
    )
    this.statsSection = page.locator(
      '[class*="stat"], [class*="card"], [data-testid*="stats"]'
    )
    this.toast = page.locator("[data-sonner-toast]")
  }

  get path(): string {
    return "/timetable/generate"
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/timetable")
  }

  /**
   * Select the first available term from the dropdown
   */
  async selectTerm(): Promise<void> {
    const trigger = this.termSelect.first()
    const isVisible = await trigger
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)

    if (isVisible) {
      await trigger.click()
      await this.page.waitForTimeout(500)

      const option = this.page.locator(
        '[role="option"], [data-slot="select-item"]'
      )
      const count = await option.count().catch(() => 0)
      if (count > 0) {
        await option.first().click()
        await this.page.waitForTimeout(500)
      }
    }
  }

  /**
   * Click Generate and wait for the algorithm to complete (long timeout)
   */
  async generatePreview(): Promise<void> {
    await this.generateButton
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await this.generateButton.first().click()

    // The algorithm can take 10-60 seconds
    // Wait for loading state to appear and then disappear
    await this.page.waitForTimeout(3000)

    // Wait for spinner/loading to finish
    await this.page
      .locator(".animate-spin, [data-loading]")
      .first()
      .waitFor({ state: "hidden", timeout: 120_000 })
      .catch(() => {})

    await this.page.waitForTimeout(2000)
  }

  /**
   * Click Apply to save the generated timetable
   */
  async applyTimetable(): Promise<void> {
    const applyVisible = await this.applyButton
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (applyVisible) {
      await this.applyButton.first().click()
      await this.page.waitForTimeout(5000)
    }
  }

  /**
   * Check if preview has generated slots
   */
  async hasPreviewSlots(): Promise<boolean> {
    return this.previewGrid
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)
  }
}
