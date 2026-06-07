/**
 * Teacher Expertise Page Object
 *
 * Encapsulates interactions with the teacher expertise wizard step,
 * where subject qualifications are assigned to teachers.
 */

import type { Locator, Page } from "@playwright/test"

import { TIMEOUTS, type Locale } from "../helpers/test-data"
import { SchoolBasePage } from "./base.page"

export class TeacherExpertisePage extends SchoolBasePage {
  readonly subjectCheckboxes: Locator
  readonly saveButton: Locator
  readonly nextButton: Locator
  readonly toast: Locator

  constructor(page: Page, subdomain: string, locale: Locale = "en") {
    super(page, subdomain, locale)

    this.subjectCheckboxes = page.locator(
      'input[type="checkbox"], [role="checkbox"]'
    )
    this.saveButton = page.locator(
      'button:has-text("Save"), button:has-text("حفظ")'
    )
    this.nextButton = page.locator(
      'button:has-text("Next"), button:has-text("التالي")'
    )
    this.toast = page.locator("[data-sonner-toast]")
  }

  get path(): string {
    return "/teachers"
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/teachers")
  }

  /**
   * Navigate to the expertise tab for a specific teacher
   */
  async gotoExpertise(teacherId: string): Promise<void> {
    await this.page.goto(
      `http://localhost:3000/en/s/${this.subdomain}/teachers/add/${teacherId}/expertise`,
      { timeout: 30_000 }
    )
    await this.page.waitForLoadState("domcontentloaded")
    await this.page.waitForTimeout(3000)
  }

  /**
   * Select N subject checkboxes (first N available)
   */
  async selectSubjects(count: number = 2): Promise<void> {
    const checkboxes = this.subjectCheckboxes
    const total = await checkboxes.count().catch(() => 0)
    const toSelect = Math.min(count, total)

    for (let i = 0; i < toSelect; i++) {
      const checkbox = checkboxes.nth(i)
      const isChecked = await checkbox.isChecked().catch(() => false)
      if (!isChecked) {
        await checkbox.click({ force: true })
        await this.page.waitForTimeout(300)
      }
    }
  }

  /**
   * Save expertise by clicking Save or Next button
   */
  async save(): Promise<void> {
    // Try Save button first, then Next
    const saveVisible = await this.saveButton
      .first()
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)

    if (saveVisible) {
      await this.saveButton.first().click()
    } else {
      const nextVisible = await this.nextButton
        .first()
        .isVisible({ timeout: TIMEOUTS.short })
        .catch(() => false)
      if (nextVisible) {
        await this.nextButton.first().click()
      }
    }

    await this.page.waitForTimeout(3000)
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
