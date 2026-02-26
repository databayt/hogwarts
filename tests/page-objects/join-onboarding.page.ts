import { expect, type Locator, type Page } from "@playwright/test"

import {
  buildSchoolUrl,
  getTestEnv,
  TIMEOUTS,
  type Locale,
} from "../helpers/test-data"

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Internal onboarding steps (matches INTERNAL_ONBOARDING_STEPS from config.ts)
 */
export const INTERNAL_ONBOARDING_STEPS = [
  "personal",
  "contact",
  "role-details",
  "documents",
  "review",
] as const

export type InternalOnboardingStep = (typeof INTERNAL_ONBOARDING_STEPS)[number]

/**
 * Available roles on the join landing page
 */
export const JOIN_ROLES = ["Teacher", "Staff", "Admin", "Student"] as const
export type JoinRole = (typeof JOIN_ROLES)[number]

// =============================================================================
// PAGE OBJECT
// =============================================================================

/**
 * Page Object: Internal Onboarding (/join) Flow
 *
 * Encapsulates the multi-step internal onboarding flow on a school subdomain.
 *
 * URL structure:
 * - Landing:  /{locale}/s/{subdomain}/join
 * - Steps:    /{locale}/s/{subdomain}/join/{step}
 * - Welcome:  /{locale}/s/{subdomain}/join/welcome?ref=...&name=...&role=...&phone=...
 *
 * Note: Browser URLs use subdomain routing (e.g. demo.localhost:3000/en/join),
 * NOT path-based /s/demo/join. The middleware rewrites subdomain to /s/{subdomain}.
 */
export class JoinOnboardingPage {
  readonly page: Page
  readonly locale: Locale
  readonly subdomain: string

  // =========================================================================
  // LOCATORS - Landing Page
  // =========================================================================

  /** Role selection cards (Teacher, Staff, Admin, Student) */
  readonly roleCards: Locator
  /** Continue button (appears after selecting a role) */
  readonly continueButton: Locator

  // =========================================================================
  // LOCATORS - Step Form Navigation (footer)
  // =========================================================================

  /** Next/Submit button in the form footer */
  readonly nextButton: Locator
  /** Back button in the form footer */
  readonly backButton: Locator

  // =========================================================================
  // LOCATORS - Personal Step
  // =========================================================================

  readonly givenNameInput: Locator
  readonly middleNameInput: Locator
  readonly surnameInput: Locator
  readonly dateOfBirthInput: Locator
  readonly genderSelect: Locator
  readonly nationalityInput: Locator

  // =========================================================================
  // LOCATORS - Contact Step
  // =========================================================================

  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly verifyEmailButton: Locator

  // =========================================================================
  // LOCATORS - Review Step
  // =========================================================================

  readonly agreeCheckbox: Locator
  readonly submittingIndicator: Locator

  // =========================================================================
  // LOCATORS - Welcome Page
  // =========================================================================

  readonly welcomeTitle: Locator
  readonly refCodeText: Locator
  readonly refLabel: Locator
  readonly copyButton: Locator
  readonly shareLink: Locator
  readonly checkYourPhone: Locator
  readonly pendingApproval: Locator

  // =========================================================================
  // LOCATORS - Error States
  // =========================================================================

  readonly validationError: Locator
  readonly toastMessage: Locator

  constructor(page: Page, locale: Locale = "en", subdomain: string = "demo") {
    this.page = page
    this.locale = locale
    this.subdomain = subdomain

    // Landing page
    this.roleCards = page.locator("[class*='cursor-pointer']").filter({
      has: page.locator("[class*='CardTitle'], [class*='card-title']"),
    })
    this.continueButton = page.locator('button:has-text("Continue")')

    // Step form navigation (footer)
    this.nextButton = page.locator(
      'footer button:has-text("Next"), footer button:has-text("Submit"), footer button:has-text("التالي")'
    )
    this.backButton = page.locator(
      'footer button:has-text("Back"), footer button:has-text("رجوع")'
    )

    // Personal step fields
    this.givenNameInput = page.locator('input[name="givenName"]')
    this.middleNameInput = page.locator('input[name="middleName"]')
    this.surnameInput = page.locator('input[name="surname"]')
    this.dateOfBirthInput = page.locator('input[name="dateOfBirth"]')
    this.genderSelect = page.locator('[name="gender"]')
    this.nationalityInput = page.locator('input[name="nationality"]')

    // Contact step fields
    this.emailInput = page.locator('input[name="email"], input[type="email"]')
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"]')
    this.verifyEmailButton = page.locator('button:has-text("Verify")')

    // Review step
    this.agreeCheckbox = page.locator("#agree")
    this.submittingIndicator = page.locator(
      'text="Submitting your application..."'
    )

    // Welcome page
    this.welcomeTitle = page.locator('text="Welcome Aboard!"')
    this.refLabel = page.locator('text="Application Reference"')
    this.refCodeText = page.locator(".font-mono")
    this.copyButton = page.locator('button:has-text("Copy")')
    this.shareLink = page.locator('a:has-text("Share")')
    this.checkYourPhone = page.locator('text="Check your phone"')
    this.pendingApproval = page.locator('text="Pending admin approval"')

    // Error states
    this.validationError = page.locator(
      '[class*="error"], [role="alert"], .text-red-500, [class*="destructive"], [data-slot="form-message"]'
    )
    this.toastMessage = page.locator("[data-sonner-toast]")
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  /**
   * Navigate to the join landing page on the school subdomain.
   */
  async goto(): Promise<void> {
    const url = buildSchoolUrl(
      this.subdomain,
      "/join",
      this.locale,
      getTestEnv()
    )
    await this.page.goto(url)
    await this.page.waitForLoadState("domcontentloaded")
  }

  /**
   * Navigate to a specific step in the join flow.
   */
  async gotoStep(step: InternalOnboardingStep): Promise<void> {
    const url = buildSchoolUrl(
      this.subdomain,
      `/join/${step}`,
      this.locale,
      getTestEnv()
    )
    await this.page.goto(url)
    await this.page.waitForLoadState("domcontentloaded")
  }

  /**
   * Navigate directly to the welcome page with query params.
   */
  async gotoWelcome(params: {
    ref?: string
    name?: string
    role?: string
    phone?: string
  }): Promise<void> {
    const searchParams = new URLSearchParams()
    if (params.ref) searchParams.set("ref", params.ref)
    if (params.name) searchParams.set("name", params.name)
    if (params.role) searchParams.set("role", params.role)
    if (params.phone) searchParams.set("phone", params.phone)

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const url = buildSchoolUrl(
      this.subdomain,
      `/join/welcome${qs}`,
      this.locale,
      getTestEnv()
    )
    await this.page.goto(url)
    await this.page.waitForLoadState("domcontentloaded")
  }

  // =========================================================================
  // LANDING PAGE ACTIONS
  // =========================================================================

  /**
   * Select a role on the join landing page.
   */
  async selectRole(role: JoinRole): Promise<void> {
    const card = this.page.locator(`text="${role}"`).first()
    await card.click()
    await this.page.waitForTimeout(300)
  }

  /**
   * Click the Continue button (visible after selecting a role).
   */
  async clickContinue(): Promise<void> {
    await this.continueButton
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await this.continueButton.first().click()
    await this.page.waitForLoadState("domcontentloaded")
    await this.page.waitForTimeout(500)
  }

  // =========================================================================
  // STEP ACTIONS
  // =========================================================================

  /**
   * Fill in the personal step form fields.
   */
  async completePersonalStep(data: {
    givenName: string
    surname: string
    dateOfBirth?: string
    gender?: string
    nationality?: string
  }): Promise<void> {
    await this.page.waitForTimeout(1000)

    // Given name
    if (
      await this.givenNameInput
        .first()
        .isVisible({ timeout: TIMEOUTS.medium })
        .catch(() => false)
    ) {
      await this.givenNameInput.first().fill(data.givenName)
    }

    // Surname
    if (
      await this.surnameInput
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await this.surnameInput.first().fill(data.surname)
    }

    // Date of birth
    if (data.dateOfBirth) {
      if (
        await this.dateOfBirthInput
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await this.dateOfBirthInput.first().fill(data.dateOfBirth)
      }
    }

    // Gender (Select component)
    if (data.gender) {
      const selectTrigger = this.page
        .locator('[data-slot="select-trigger"]')
        .first()
      if (await selectTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await selectTrigger.click()
        await this.page.waitForTimeout(300)
        const option = this.page.locator(`text="${data.gender}"`).last()
        if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
          await option.click()
        }
      }
    }

    await this.page.waitForTimeout(300)
  }

  /**
   * Fill in the contact step form fields.
   */
  async completeContactStep(data: {
    email: string
    phone?: string
  }): Promise<void> {
    await this.page.waitForTimeout(1000)

    if (
      await this.emailInput
        .first()
        .isVisible({ timeout: TIMEOUTS.medium })
        .catch(() => false)
    ) {
      await this.emailInput.first().fill(data.email)
    }

    if (data.phone) {
      if (
        await this.phoneInput
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await this.phoneInput.first().fill(data.phone)
      }
    }

    await this.page.waitForTimeout(300)
  }

  /**
   * Click Next in the form footer.
   */
  async clickNext(): Promise<void> {
    const btn = this.page
      .locator(
        'footer button:not([disabled]):has-text("Next"), footer button:not([disabled]):has-text("Submit"), footer button:not([disabled]):has-text("التالي")'
      )
      .first()
    await btn.waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await btn.click()
    await this.page.waitForLoadState("domcontentloaded")
    await this.page.waitForTimeout(500)
  }

  /**
   * Click Back in the form footer.
   */
  async clickBack(): Promise<void> {
    await this.backButton
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await this.backButton.first().click()
    await this.page.waitForLoadState("domcontentloaded")
    await this.page.waitForTimeout(500)
  }

  /**
   * Check if the Next button is enabled (not disabled).
   */
  async isNextEnabled(): Promise<boolean> {
    try {
      await this.nextButton
        .first()
        .waitFor({ state: "visible", timeout: TIMEOUTS.short })
      return !(await this.nextButton.first().isDisabled())
    } catch {
      return false
    }
  }

  // =========================================================================
  // ASSERTIONS
  // =========================================================================

  /**
   * Assert that the welcome page title is visible.
   */
  async expectWelcomePage(): Promise<void> {
    await expect(this.welcomeTitle).toBeVisible({ timeout: TIMEOUTS.long })
  }

  /**
   * Assert that the application reference code is visible.
   */
  async expectRefCode(): Promise<void> {
    await expect(this.refCodeText.first()).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
  }

  /**
   * Assert that the "Application Reference" label is visible.
   */
  async expectRefLabel(): Promise<void> {
    await expect(this.refLabel).toBeVisible({ timeout: TIMEOUTS.medium })
  }

  /**
   * Assert that "Check your phone" step is visible.
   */
  async expectCheckYourPhone(): Promise<void> {
    await expect(this.checkYourPhone).toBeVisible({ timeout: TIMEOUTS.medium })
  }

  /**
   * Assert that "Check your phone" step is NOT visible.
   */
  async expectNoCheckYourPhone(): Promise<void> {
    const visible = await this.checkYourPhone
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    expect(visible).toBeFalsy()
  }

  /**
   * Assert that "Pending admin approval" step is visible.
   */
  async expectPendingApproval(): Promise<void> {
    await expect(this.pendingApproval).toBeVisible({
      timeout: TIMEOUTS.medium,
    })
  }

  /**
   * Assert the current URL is on a specific step.
   */
  async expectOnStep(step: InternalOnboardingStep): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/join/${step}`), {
      timeout: TIMEOUTS.navigation,
    })
  }

  /**
   * Assert page has no server-side exception.
   */
  async assertNoSSE(): Promise<void> {
    const sseError = this.page.locator(
      "text=/server-side exception|application error/i"
    )
    const hasSSE = await sseError
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)
    expect(hasSSE, "Page should not have server-side exceptions").toBeFalsy()
  }

  /**
   * Get the current step name from the URL.
   */
  getCurrentStep(): InternalOnboardingStep | "welcome" | null {
    const url = this.page.url()
    const match = url.match(/\/join\/([^/?]+)/)
    return match ? (match[1] as InternalOnboardingStep | "welcome") : null
  }

  // =========================================================================
  // CHROME ERROR HELPER
  // =========================================================================

  /**
   * Check if page hit a chrome-error:// protocol mismatch.
   */
  isProtocolError(): boolean {
    return this.page.url().startsWith("chrome-error://")
  }
}
