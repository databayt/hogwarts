/**
 * Attendance Marking Page Object
 *
 * Encapsulates interactions with the attendance overview and
 * manual marking UI, including class selection and status toggling.
 */

import type { Locator, Page } from "@playwright/test"

import { TIMEOUTS, type Locale } from "../helpers/test-data"
import { SchoolBasePage } from "./base.page"

export class AttendanceMarkingPage extends SchoolBasePage {
  readonly classSelect: Locator
  readonly dateInput: Locator
  readonly studentRows: Locator
  readonly saveButton: Locator
  readonly presentButton: Locator
  readonly absentButton: Locator
  readonly lateButton: Locator
  readonly toast: Locator

  constructor(page: Page, subdomain: string, locale: Locale = "en") {
    super(page, subdomain, locale)

    this.classSelect = page.locator(
      'select, [role="combobox"], [data-slot="select-trigger"]'
    )
    this.dateInput = page.locator('input[type="date"]')
    this.studentRows = page.locator("table tbody tr, [data-testid*='student']")
    this.saveButton = page.locator(
      'button:has-text("Save"), button:has-text("حفظ")'
    )
    this.presentButton = page.locator("button:has-text('P')")
    this.absentButton = page.locator("button:has-text('A')")
    this.lateButton = page.locator("button:has-text('L')")
    this.toast = page.locator("[data-sonner-toast]")
  }

  get path(): string {
    return "/attendance"
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/attendance")
  }

  /**
   * Navigate to the manual attendance marking page
   */
  async gotoManual(): Promise<void> {
    await this.page.goto(
      `http://localhost:3000/en/s/${this.subdomain}/attendance/manual`
    )
    await this.page.waitForLoadState("domcontentloaded")
    await this.page.waitForTimeout(3000)
  }

  /**
   * Select the first available class from the dropdown
   */
  async selectClass(): Promise<void> {
    const trigger = this.classSelect.first()
    const isVisible = await trigger
      .isVisible({ timeout: TIMEOUTS.medium })
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
        await this.page.waitForTimeout(2000)
      }
    }
  }

  /**
   * Check if the student list has loaded with rows
   */
  async hasStudentRows(): Promise<boolean> {
    await this.page.waitForTimeout(2000)
    const count = await this.studentRows.count().catch(() => 0)
    return count > 0
  }

  /**
   * Mark a student row with a given status using the P/A/L/E buttons
   */
  async markStudent(
    rowIndex: number,
    status: "P" | "A" | "L" | "E"
  ): Promise<void> {
    const row = this.studentRows.nth(rowIndex)
    const btn = row.locator(`button:has-text("${status}")`)
    const visible = await btn
      .first()
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)

    if (visible) {
      await btn.first().click()
      await this.page.waitForTimeout(300)
    }
  }

  /**
   * Click Mark All Present button
   */
  async markAllPresent(): Promise<void> {
    const btn = this.page.locator(
      'button:has-text("All Present"), button:has-text("الكل حاضر")'
    )
    const visible = await btn
      .first()
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)

    if (visible) {
      await btn.first().click()
      await this.page.waitForTimeout(1000)
    }
  }

  /**
   * Save attendance by clicking the Save button
   */
  async save(): Promise<void> {
    const saveVisible = await this.saveButton
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (saveVisible) {
      await this.saveButton.first().click()
      await this.page.waitForTimeout(3000)
    }
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
