/**
 * Admission Page Objects
 *
 * Page objects for the public admission portal, application form wizard,
 * and admin admission dashboard.
 */

import type { Page } from "@playwright/test"

import {
  SCHOOL_DASHBOARD_ROUTES,
  SCHOOL_MARKETING_ROUTES,
  SELECTORS,
  TIMEOUTS,
  type Locale,
} from "../helpers/test-data"
import { SchoolBasePage } from "./base.page"

// =============================================================================
// APPLICATION FORM STEPS
// =============================================================================

export const APPLICATION_STEPS = [
  "personal",
  "contact",
  "guardian",
  "academic",
  "documents",
  "review",
] as const

export type ApplicationStepName = (typeof APPLICATION_STEPS)[number]

// =============================================================================
// ADMISSION PORTAL PAGE (Public - /admissions)
// =============================================================================

/**
 * Public admissions landing page for a school
 */
export class AdmissionPortalPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_MARKETING_ROUTES.admissions
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/admissions") && this.isOnCorrectSubdomain()
  }

  /**
   * Check if admission content is loaded (no SSE, has main content)
   */
  async hasAdmissionContent(): Promise<boolean> {
    const hasSSE = await this.hasSSE()
    if (hasSSE) return false
    return this.isVisible("main, .school-content, [data-school-id]")
  }

  /**
   * Check if Apply Now button/link is visible
   */
  async hasApplyLink(): Promise<boolean> {
    return this.isVisible(
      'a[href*="/apply"], button:has-text("Apply"), button:has-text("تقدم")'
    )
  }

  /**
   * Click Apply Now to go to apply page
   */
  async clickApply(): Promise<void> {
    const link = this.page.locator(
      'a[href*="/apply"], button:has-text("Apply"), button:has-text("تقدم")'
    )
    await link.first().click()
    await this.waitForLoad()
  }

  /**
   * Check if tour booking link is visible
   */
  async hasTourLink(): Promise<boolean> {
    return this.isVisible('a[href*="/tour"]')
  }

  /**
   * Check if inquiry/contact link is visible
   */
  async hasInquiryLink(): Promise<boolean> {
    return this.isVisible('a[href*="/inquiry"]')
  }

  /**
   * Check if status tracker link is visible
   */
  async hasStatusLink(): Promise<boolean> {
    return this.isVisible('a[href*="/apply/status"]')
  }
}

// =============================================================================
// CAMPAIGN SELECTOR PAGE (Public - /apply)
// =============================================================================

/**
 * Campaign selection page before starting an application
 */
export class CampaignSelectorPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_MARKETING_ROUTES.apply
  }

  async isDisplayed(): Promise<boolean> {
    return (
      this.urlContains("/apply") &&
      !this.urlContains("/apply/") &&
      this.isOnCorrectSubdomain()
    )
  }

  /**
   * Check if campaigns are displayed
   */
  async hasCampaigns(): Promise<boolean> {
    // Look for campaign cards or list items
    return this.isVisible(
      '[data-testid="campaign-card"], .campaign-card, [role="listitem"], button'
    )
  }

  /**
   * Get count of visible campaigns
   */
  async getCampaignCount(): Promise<number> {
    const campaigns = this.page.locator(
      '[data-testid="campaign-card"], .campaign-card'
    )
    return campaigns.count()
  }

  /**
   * Select the first available campaign
   */
  async selectFirstCampaign(): Promise<void> {
    const campaign = this.page.locator(
      '[data-testid="campaign-card"] button, .campaign-card button, button:has-text("Apply"), button:has-text("تقدم")'
    )
    await campaign.first().click()
    await this.waitForLoad()
  }
}

// =============================================================================
// APPLICATION FORM PAGE (Public - /apply/[id]/[step])
// =============================================================================

/**
 * 6-step application form wizard
 */
export class ApplicationFormPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return "/apply"
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/apply/") && this.isOnCorrectSubdomain()
  }

  /**
   * Get current step from URL
   */
  getCurrentStep(): ApplicationStepName | null {
    const url = this.page.url()
    for (const step of APPLICATION_STEPS) {
      if (url.includes(`/${step}`)) return step
    }
    return null
  }

  /**
   * Check if on a specific step
   */
  isOnStep(step: ApplicationStepName): boolean {
    return this.page.url().includes(`/${step}`)
  }

  /**
   * Navigate to a specific step by URL
   */
  async goToStep(campaignId: string, step: ApplicationStepName): Promise<void> {
    const url = this.buildSchoolUrl(
      this.subdomain,
      `/apply/${campaignId}/${step}`
    )
    await this.page.goto(url)
    await this.waitForLoad()
  }

  /**
   * Check if form is displayed on current step
   */
  async hasForm(): Promise<boolean> {
    return this.isVisible("form, [data-testid='step-form']")
  }

  /**
   * Check if Next/Continue button is visible
   */
  async hasNextButton(): Promise<boolean> {
    return this.isVisible(
      'button:has-text("Next"), button:has-text("Continue"), button:has-text("التالي"), button[type="submit"]'
    )
  }

  /**
   * Check if Back button is visible
   */
  async hasBackButton(): Promise<boolean> {
    return this.isVisible(
      'button:has-text("Back"), button:has-text("Previous"), button:has-text("السابق")'
    )
  }

  /**
   * Click Next/Continue button
   */
  async clickNext(): Promise<void> {
    const next = this.page.locator(
      'button:has-text("Next"), button:has-text("Continue"), button:has-text("التالي"), button[type="submit"]'
    )
    await next.first().click()
    await this.page.waitForTimeout(500) // Wait for navigation/validation
  }

  /**
   * Click Back button
   */
  async clickBack(): Promise<void> {
    const back = this.page.locator(
      'button:has-text("Back"), button:has-text("Previous"), button:has-text("السابق")'
    )
    await back.first().click()
    await this.page.waitForTimeout(500)
  }

  // ---------------------------------------------------------------------------
  // Step-specific form fillers
  // ---------------------------------------------------------------------------

  /**
   * Fill personal information step
   */
  async fillPersonalStep(data?: {
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    gender?: string
    nationality?: string
  }): Promise<void> {
    const d = {
      firstName: "Test",
      lastName: "Student",
      dateOfBirth: "2010-01-15",
      gender: "Male",
      nationality: "Saudi",
      ...data,
    }

    await this.fillIfExists('input[name="firstName"]', d.firstName)
    await this.fillIfExists('input[name="lastName"]', d.lastName)
    await this.fillIfExists('input[name="dateOfBirth"]', d.dateOfBirth)
    await this.selectIfExists('select[name="gender"]', d.gender)
    await this.fillIfExists('input[name="nationality"]', d.nationality)
  }

  /**
   * Fill contact information step
   */
  async fillContactStep(data?: {
    email?: string
    phone?: string
    address?: string
    city?: string
  }): Promise<void> {
    const d = {
      email: "test-applicant@example.com",
      phone: "+966501234567",
      address: "123 Test Street",
      city: "Riyadh",
      ...data,
    }

    await this.fillIfExists('input[name="email"]', d.email)
    await this.fillIfExists('input[name="phone"]', d.phone)
    await this.fillIfExists('input[name="address"]', d.address)
    await this.fillIfExists('input[name="city"]', d.city)
  }

  /**
   * Fill guardian information step
   */
  async fillGuardianStep(data?: {
    fatherName?: string
    fatherPhone?: string
    motherName?: string
  }): Promise<void> {
    const d = {
      fatherName: "Father Test",
      fatherPhone: "+966509876543",
      motherName: "Mother Test",
      ...data,
    }

    await this.fillIfExists('input[name="fatherName"]', d.fatherName)
    await this.fillIfExists('input[name="fatherPhone"]', d.fatherPhone)
    await this.fillIfExists('input[name="motherName"]', d.motherName)
  }

  /**
   * Fill academic information step
   */
  async fillAcademicStep(data?: {
    applyingForClass?: string
    previousSchool?: string
  }): Promise<void> {
    const d = {
      applyingForClass: "Grade 10",
      previousSchool: "Previous School Name",
      ...data,
    }

    await this.fillIfExists(
      'input[name="applyingForClass"]',
      d.applyingForClass
    )
    await this.selectIfExists(
      'select[name="applyingForClass"]',
      d.applyingForClass
    )
    await this.fillIfExists('input[name="previousSchool"]', d.previousSchool)
  }

  /**
   * Check if review step shows all sections
   */
  async reviewHasAllSections(): Promise<boolean> {
    // Review step should show cards for each section
    const cards = this.page.locator("[class*='card'], [data-testid*='review']")
    const count = await cards.count()
    return count >= 3 // At minimum: personal, contact, guardian
  }

  /**
   * Click Submit Application button on review step
   */
  async clickSubmit(): Promise<void> {
    const submit = this.page.locator(
      'button:has-text("Submit"), button:has-text("إرسال"), button[type="submit"]'
    )
    await submit.first().click()
    await this.page.waitForTimeout(1000) // Wait for submission
  }

  // ---------------------------------------------------------------------------
  // Helper methods
  // ---------------------------------------------------------------------------

  private async fillIfExists(selector: string, value: string): Promise<void> {
    const el = this.page.locator(selector)
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.clear()
      await el.fill(value)
    }
  }

  private async selectIfExists(selector: string, value: string): Promise<void> {
    const el = this.page.locator(selector)
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.selectOption({ label: value })
    }
  }
}

// =============================================================================
// STATUS TRACKER PAGE (Public - /apply/status)
// =============================================================================

/**
 * Application status tracker with OTP verification
 */
export class StatusTrackerPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return "/apply/status"
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/apply/status") && this.isOnCorrectSubdomain()
  }

  /**
   * Check if OTP input is visible
   */
  async hasOtpInput(): Promise<boolean> {
    return this.isVisible(
      'input[name="otp"], input[placeholder*="OTP"], input[type="text"], input[inputmode="numeric"]'
    )
  }

  /**
   * Check if application number input is visible
   */
  async hasApplicationNumberInput(): Promise<boolean> {
    return this.isVisible(
      'input[name="applicationNumber"], input[placeholder*="APP-"], input[placeholder*="application"]'
    )
  }

  /**
   * Enter application number
   */
  async enterApplicationNumber(number: string): Promise<void> {
    await this.fillIfExists(
      'input[name="applicationNumber"], input[placeholder*="APP-"]',
      number
    )
  }

  /**
   * Click verify/check status button
   */
  async clickVerify(): Promise<void> {
    const btn = this.page.locator(
      'button:has-text("Verify"), button:has-text("Check"), button:has-text("تحقق"), button[type="submit"]'
    )
    await btn.first().click()
    await this.page.waitForTimeout(500)
  }

  private async fillIfExists(selector: string, value: string): Promise<void> {
    const el = this.page.locator(selector)
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.clear()
      await el.fill(value)
    }
  }
}

// =============================================================================
// TOUR BOOKING PAGE (Public - /tour)
// =============================================================================

/**
 * School tour booking page
 */
export class TourBookingPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return "/tour"
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/tour") && this.isOnCorrectSubdomain()
  }

  /**
   * Check if tour booking form exists
   */
  async hasBookingForm(): Promise<boolean> {
    return this.isVisible("form")
  }

  /**
   * Check if calendar is visible
   */
  async hasCalendar(): Promise<boolean> {
    return this.isVisible('[role="grid"], .rdp, table')
  }

  /**
   * Click a non-disabled calendar day. Returns true if a day was clicked.
   */
  async selectAvailableDate(): Promise<boolean> {
    // Wait for calendar to render
    await this.page
      .locator('[role="grid"], .rdp, table')
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
      .catch(() => null)

    // Find enabled day buttons (not disabled, not outside current month)
    const days = this.page.locator(
      'button[name="day"]:not([disabled]), td[role="gridcell"] button:not([disabled])'
    )
    const count = await days.count()

    for (let i = 0; i < count; i++) {
      const day = days.nth(i)
      const isDisabled = await day.getAttribute("disabled")
      const ariaDisabled = await day.getAttribute("aria-disabled")
      if (isDisabled === null && ariaDisabled !== "true") {
        await day.click()
        return true
      }
    }
    return false
  }

  /**
   * Click first available time slot button. Returns true if a slot was clicked.
   */
  async selectFirstSlot(): Promise<boolean> {
    // Wait for slots to load (spinner gone)
    await this.page
      .locator(".animate-spin")
      .waitFor({ state: "hidden", timeout: TIMEOUTS.medium })
      .catch(() => null)

    // Look for slot buttons — they have time text like "09:00 - 10:00"
    const slots = this.page.locator('button:has-text(":"):not([disabled])')
    const count = await slots.count()
    if (count > 0) {
      await slots.first().click()
      return true
    }
    return false
  }

  /**
   * Fill booking form fields
   */
  async fillBookingForm(data: {
    parentName: string
    email: string
    phone?: string
    studentName?: string
    grade?: string
  }): Promise<void> {
    const nameInput = this.page.locator('input[name="parentName"]')
    if (
      await nameInput.isVisible({ timeout: TIMEOUTS.short }).catch(() => false)
    ) {
      await nameInput.clear()
      await nameInput.fill(data.parentName)
    }

    const emailInput = this.page.locator('input[name="email"]')
    if (
      await emailInput.isVisible({ timeout: TIMEOUTS.short }).catch(() => false)
    ) {
      await emailInput.clear()
      await emailInput.fill(data.email)
    }

    if (data.phone) {
      const phoneInput = this.page.locator('input[name="phone"]')
      if (
        await phoneInput
          .isVisible({ timeout: TIMEOUTS.short })
          .catch(() => false)
      ) {
        await phoneInput.clear()
        await phoneInput.fill(data.phone)
      }
    }

    if (data.studentName) {
      const studentInput = this.page.locator('input[name="studentName"]')
      if (
        await studentInput
          .isVisible({ timeout: TIMEOUTS.short })
          .catch(() => false)
      ) {
        await studentInput.clear()
        await studentInput.fill(data.studentName)
      }
    }
  }

  /**
   * Click "Confirm Booking" submit button
   */
  async submitBooking(): Promise<void> {
    const submit = this.page.locator(
      'button:has-text("Confirm Booking"), button:has-text("تأكيد الحجز"), button[type="submit"]'
    )
    await submit.first().click()
    await this.page.waitForTimeout(1000)
  }

  /**
   * Check if confirmation card is visible (booking number shown)
   */
  async hasConfirmation(): Promise<boolean> {
    return this.isVisible(
      "text=/TOUR-/, text=/Tour Booked/i, text=/تم حجز الجولة/i",
      TIMEOUTS.medium
    )
  }

  /**
   * Get booking number from confirmation
   */
  async getBookingNumber(): Promise<string | null> {
    const el = this.page.locator(".font-mono, text=/TOUR-\\w+/")
    if (
      await el
        .first()
        .isVisible({ timeout: TIMEOUTS.short })
        .catch(() => false)
    ) {
      return el.first().textContent()
    }
    return null
  }

  /**
   * Check if "Back to Home" button is visible on confirmation
   */
  async hasBackToHomeButton(): Promise<boolean> {
    return this.isVisible(
      'button:has-text("Back to Home"), button:has-text("العودة")'
    )
  }

  /**
   * Check if "Apply Now" button is visible on confirmation
   */
  async hasApplyNowButton(): Promise<boolean> {
    return this.isVisible(
      'button:has-text("Apply Now"), button:has-text("قدم الآن")'
    )
  }
}

// =============================================================================
// INQUIRY PAGE (Public - /inquiry)
// =============================================================================

/**
 * School inquiry/contact form page
 */
export class InquiryPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return "/inquiry"
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/inquiry") && this.isOnCorrectSubdomain()
  }

  /**
   * Check if inquiry form is visible
   */
  async hasInquiryForm(): Promise<boolean> {
    return this.isVisible("form")
  }

  /**
   * Fill inquiry form
   */
  async fillInquiryForm(data?: {
    name?: string
    email?: string
    phone?: string
    message?: string
  }): Promise<void> {
    const d = {
      name: "Test Parent",
      email: "parent-inquiry@example.com",
      phone: "+966501234567",
      message: "I am interested in admissions for my child.",
      ...data,
    }

    const nameInput = this.page.locator(
      'input[name="name"], input[name="parentName"]'
    )
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.clear()
      await nameInput.fill(d.name)
    }

    const emailInput = this.page.locator('input[name="email"]')
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.clear()
      await emailInput.fill(d.email)
    }

    const phoneInput = this.page.locator('input[name="phone"]')
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.clear()
      await phoneInput.fill(d.phone)
    }

    const messageInput = this.page.locator(
      'textarea[name="message"], textarea[name="inquiry"]'
    )
    if (await messageInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await messageInput.clear()
      await messageInput.fill(d.message)
    }
  }

  /**
   * Submit inquiry form
   */
  async submitInquiry(): Promise<void> {
    const submit = this.page.locator(
      'button:has-text("Submit"), button:has-text("Send"), button:has-text("إرسال"), button[type="submit"]'
    )
    await submit.first().click()
    await this.page.waitForTimeout(500)
  }
}

// =============================================================================
// ADMISSION DASHBOARD PAGE (Admin - /admission)
// =============================================================================

/**
 * Admin admission dashboard with campaigns, applications, merit, enrollment
 */
export class AdmissionDashboardPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_DASHBOARD_ROUTES.admission
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/admission") && this.isOnCorrectSubdomain()
  }

  /**
   * Check if campaigns table/list is visible
   */
  async hasCampaignsTable(): Promise<boolean> {
    return this.isVisible(
      `${SELECTORS.tableBody}, [data-testid="campaigns-list"]`
    )
  }

  /**
   * Check if create campaign button exists
   */
  async hasCreateCampaignButton(): Promise<boolean> {
    return this.isVisible('button:has-text("Create"), button:has-text("إنشاء")')
  }

  /**
   * Click create campaign
   */
  async clickCreateCampaign(): Promise<void> {
    const btn = this.page.locator(
      'button:has-text("Create"), button:has-text("إنشاء")'
    )
    await btn.first().click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Navigate to applications sub-page
   */
  async goToApplications(): Promise<void> {
    const url = this.buildSchoolUrl(this.subdomain, "/admission/applications")
    await this.page.goto(url)
    await this.waitForLoad()
  }

  /**
   * Navigate to merit sub-page
   */
  async goToMerit(): Promise<void> {
    const url = this.buildSchoolUrl(this.subdomain, "/admission/merit")
    await this.page.goto(url)
    await this.waitForLoad()
  }

  /**
   * Navigate to enrollment sub-page
   */
  async goToEnrollment(): Promise<void> {
    const url = this.buildSchoolUrl(this.subdomain, "/admission/enrollment")
    await this.page.goto(url)
    await this.waitForLoad()
  }

  /**
   * Navigate to settings sub-page
   */
  async goToSettings(): Promise<void> {
    const url = this.buildSchoolUrl(this.subdomain, "/admission/settings")
    await this.page.goto(url)
    await this.waitForLoad()
  }

  /**
   * Check if applications list has rows
   */
  async hasApplicationRows(): Promise<boolean> {
    return this.isVisible(SELECTORS.tableRow)
  }

  /**
   * Get count of table rows
   */
  async getTableRowCount(): Promise<number> {
    await this.page
      .waitForSelector(SELECTORS.tableBody, {
        state: "visible",
        timeout: TIMEOUTS.medium,
      })
      .catch(() => null)
    return this.page.locator(SELECTORS.tableRow).count()
  }

  /**
   * Search in the current table
   */
  async search(query: string): Promise<void> {
    const input = this.page.locator(SELECTORS.searchInput)
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.clear()
      await input.fill(query)
      await this.page.waitForTimeout(500) // Debounce
    }
  }

  /**
   * Check if stat cards are visible (merit/enrollment pages)
   */
  async hasStatCards(): Promise<boolean> {
    const cards = this.page.locator("[class*='card']")
    const count = await cards.count()
    return count >= 2
  }
}
