/**
 * Classroom Configure Page Object
 *
 * Encapsulates interactions with the Classrooms > Configure tab.
 * The tab is intentionally lean: sections-per-grade + capacity + each
 * section's main classroom. Class generation and student enrollment are NOT
 * part of this page (subjects bind to grades at catalog-bridge time; students
 * are placed into grades/sections elsewhere).
 */

import type { Locator, Page } from "@playwright/test"

import { TIMEOUTS, type Locale } from "../helpers/test-data"
import { SchoolBasePage } from "./base.page"

export class ClassroomConfigurePage extends SchoolBasePage {
  readonly generateAllButton: Locator
  readonly toast: Locator

  constructor(page: Page, subdomain: string, locale: Locale = "en") {
    super(page, subdomain, locale)

    this.generateAllButton = page.locator(
      'button:has-text("Generate All"), button:has-text("إنشاء الكل")'
    )
    this.toast = page.locator("[data-sonner-toast]")
  }

  get path(): string {
    return "/classrooms/configure"
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/classrooms")
  }

  /**
   * Click "Generate All" to create the configured sections + their rooms.
   */
  async generateSections(): Promise<void> {
    const btn = this.generateAllButton.first()
    const visible = await btn
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)
    if (!visible) return

    await btn.click()
    await this.page.waitForTimeout(5000)
    await this.page
      .locator(".animate-spin, [data-loading]")
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {})
  }

  /**
   * Check if a success toast appeared
   */
  async hasSuccessToast(): Promise<boolean> {
    return this.toast
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)
  }
}
