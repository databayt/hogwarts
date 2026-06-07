/**
 * Classroom Configure Page Object
 *
 * Encapsulates interactions with the Classrooms > Configure tab,
 * including section generation, class generation, and student enrollment.
 */

import type { Locator, Page } from "@playwright/test"

import { TIMEOUTS, type Locale } from "../helpers/test-data"
import { SchoolBasePage } from "./base.page"

export class ClassroomConfigurePage extends SchoolBasePage {
  readonly generateClassesButton: Locator
  readonly enrollStudentsButton: Locator
  readonly termSelect: Locator
  readonly toast: Locator

  constructor(page: Page, subdomain: string, locale: Locale = "en") {
    super(page, subdomain, locale)

    this.generateClassesButton = page.locator(
      'button:has-text("Generate Classes"), button:has-text("توليد الحصص")'
    )
    this.enrollStudentsButton = page.locator(
      'button:has-text("Enroll Students"), button:has-text("تسجيل الطلاب")'
    )
    this.termSelect = page.locator(
      'select, [role="combobox"], [data-slot="select-trigger"]'
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
   * Select a term from the dropdown (first available if no label provided)
   */
  async selectTerm(): Promise<void> {
    const termTrigger = this.termSelect.first()
    const isVisible = await termTrigger
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)

    if (isVisible) {
      await termTrigger.click()
      await this.page.waitForTimeout(500)

      // Click the first option in the dropdown
      const option = this.page.locator(
        '[role="option"], [data-slot="select-item"]'
      )
      const optionCount = await option.count().catch(() => 0)
      if (optionCount > 0) {
        await option.first().click()
        await this.page.waitForTimeout(500)
      }
    }
  }

  /**
   * Click "Generate Classes for All Grades" and wait for completion
   */
  async generateClasses(): Promise<void> {
    await this.generateClassesButton
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await this.generateClassesButton.first().click()

    // Wait for the action to complete (toast or loading state)
    await this.page.waitForTimeout(5000)

    // Wait for any loading spinners to disappear
    await this.page
      .locator(".animate-spin, [data-loading]")
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {})
  }

  /**
   * Click "Enroll Students for All Grades" and wait for completion
   */
  async enrollStudents(): Promise<void> {
    await this.enrollStudentsButton
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await this.enrollStudentsButton.first().click()

    // Wait for the action to complete
    await this.page.waitForTimeout(5000)

    // Wait for any loading spinners to disappear
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
