/**
 * Login Page Object
 *
 * Page object for the login page.
 * Works on both main domain and school subdomains.
 */

import type { Page } from "@playwright/test"

import {
  SELECTORS,
  TEST_USERS,
  TIMEOUTS,
  type Locale,
  type TestUserKey,
} from "../../helpers/test-data"
import { BasePage, SchoolBasePage } from "../base.page"

// =============================================================================
// MAIN DOMAIN LOGIN PAGE
// =============================================================================

export class LoginPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return "/login"
  }

  async isDisplayed(): Promise<boolean> {
    const hasEmailInput = await this.isVisible(SELECTORS.emailInput)
    const hasPasswordInput = await this.isVisible(SELECTORS.passwordInput)
    return hasEmailInput && hasPasswordInput
  }

  // ===========================================================================
  // FORM INTERACTIONS
  // ===========================================================================

  /**
   * Get email input
   */
  get emailInput() {
    return this.page.locator(SELECTORS.emailInput)
  }

  /**
   * Get password input
   */
  get passwordInput() {
    return this.page.locator(SELECTORS.passwordInput)
  }

  /**
   * Get submit button
   */
  get submitButton() {
    return this.page.locator(SELECTORS.submitButton)
  }

  /**
   * Get Google OAuth button
   */
  get googleButton() {
    return this.page.locator(SELECTORS.googleOAuth)
  }

  /**
   * Get Facebook OAuth button
   */
  get facebookButton() {
    return this.page.locator(SELECTORS.facebookOAuth)
  }

  /**
   * Fill email
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.medium,
    })
    await this.emailInput.clear()
    await this.emailInput.fill(email)

    // Wait for value to be set
    await this.page.waitForFunction(
      (expectedEmail) => {
        const input = document.querySelector(
          'input[name="email"]'
        ) as HTMLInputElement
        return input && input.value === expectedEmail
      },
      email,
      { timeout: TIMEOUTS.short }
    )
  }

  /**
   * Fill password
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.medium,
    })
    await this.passwordInput.clear()
    await this.passwordInput.fill(password)
  }

  /**
   * Submit login form
   */
  async submit(): Promise<void> {
    await this.page.waitForTimeout(100) // Ensure form state is updated

    await Promise.all([
      this.page
        .waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: TIMEOUTS.navigation,
        })
        .catch(() => null),
      this.submitButton.click(),
    ])
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string): Promise<string> {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
    return this.waitForNavigation()
  }

  /**
   * Login as test user
   */
  async loginAs(userKey: TestUserKey): Promise<string> {
    const user = TEST_USERS[userKey]
    return this.login(user.email, user.password)
  }

  // ===========================================================================
  // VALIDATION STATES
  // ===========================================================================

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    const errorLocator = this.page.locator(SELECTORS.formError)
    return errorLocator
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    const errorLocator = this.page.locator(SELECTORS.formError)
    if (await errorLocator.isVisible().catch(() => false)) {
      return errorLocator.textContent()
    }
    return null
  }

  /**
   * Check for invalid credentials error
   */
  async hasInvalidCredentialsError(): Promise<boolean> {
    const errorText = await this.getErrorMessage()
    if (!errorText) return false
    return /invalid credentials|email does not exist/i.test(errorText)
  }

  // ===========================================================================
  // NAVIGATION LINKS
  // ===========================================================================

  /**
   * Get register link
   */
  get registerLink() {
    return this.page.locator('a[href*="/join"]')
  }

  /**
   * Get forgot password link
   */
  get forgotPasswordLink() {
    return this.page.locator('a[href*="/reset"]')
  }

  /**
   * Has social login options
   */
  async hasSocialLogin(): Promise<boolean> {
    const hasGoogle = await this.googleButton
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)
    const hasFacebook = await this.facebookButton
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)
    return hasGoogle || hasFacebook
  }
}

// =============================================================================
// SCHOOL SUBDOMAIN LOGIN PAGE
// =============================================================================

export class SchoolLoginPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return "/login"
  }

  async isDisplayed(): Promise<boolean> {
    const hasEmailInput = await this.isVisible(SELECTORS.emailInput)
    const hasPasswordInput = await this.isVisible(SELECTORS.passwordInput)
    return hasEmailInput && hasPasswordInput
  }

  /**
   * Get email input
   */
  get emailInput() {
    return this.page.locator(SELECTORS.emailInput)
  }

  /**
   * Get password input
   */
  get passwordInput() {
    return this.page.locator(SELECTORS.passwordInput)
  }

  /**
   * Get submit button
   */
  get submitButton() {
    return this.page.locator(SELECTORS.submitButton)
  }

  /**
   * Fill email
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.medium,
    })
    await this.emailInput.clear()
    await this.emailInput.fill(email)

    await this.page.waitForFunction(
      (expectedEmail) => {
        const input = document.querySelector(
          'input[name="email"]'
        ) as HTMLInputElement
        return input && input.value === expectedEmail
      },
      email,
      { timeout: TIMEOUTS.short }
    )
  }

  /**
   * Fill password
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.medium,
    })
    await this.passwordInput.clear()
    await this.passwordInput.fill(password)
  }

  /**
   * Submit login form
   */
  async submit(): Promise<void> {
    await this.page.waitForTimeout(100)

    await Promise.all([
      this.page
        .waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: TIMEOUTS.navigation,
        })
        .catch(() => null),
      this.submitButton.click(),
    ])
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string): Promise<string> {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
    return this.waitForNavigation()
  }

  /**
   * Login as test user
   */
  async loginAs(userKey: TestUserKey): Promise<string> {
    const user = TEST_USERS[userKey]
    return this.login(user.email, user.password)
  }
}
