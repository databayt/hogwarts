/**
 * Marketing Page Objects
 *
 * Page objects for SaaS marketing and School marketing pages.
 */

import type { Page } from "@playwright/test"

import {
  SAAS_MARKETING_ROUTES,
  SCHOOL_MARKETING_ROUTES,
  type Locale,
} from "../helpers/test-data"
import { BasePage, SchoolBasePage } from "./base.page"

// =============================================================================
// SAAS MARKETING PAGES (Main Domain)
// =============================================================================

/**
 * SaaS Home Page (Landing)
 */
export class SaasHomePage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_MARKETING_ROUTES.home
  }

  async isDisplayed(): Promise<boolean> {
    // Landing page should have hero section
    return this.isVisible("main, [data-testid='hero'], .hero")
  }

  /**
   * Get Started button
   */
  get getStartedButton() {
    return this.page.locator(
      'button:has-text("Get Started"), a:has-text("Get Started")'
    )
  }

  /**
   * Live Demo button
   */
  get liveDemoButton() {
    return this.page.locator(
      'button:has-text("Live Demo"), a:has-text("Live Demo")'
    )
  }

  /**
   * Check if Get Started button is visible
   */
  async hasGetStartedButton(): Promise<boolean> {
    return this.getStartedButton
      .first()
      .isVisible()
      .catch(() => false)
  }

  /**
   * Check if Live Demo button is visible
   */
  async hasLiveDemoButton(): Promise<boolean> {
    return this.liveDemoButton
      .first()
      .isVisible()
      .catch(() => false)
  }

  /**
   * Click Get Started
   */
  async clickGetStarted(): Promise<void> {
    await this.getStartedButton.first().click()
  }

  /**
   * Click Live Demo
   */
  async clickLiveDemo(): Promise<void> {
    await this.liveDemoButton.first().click()
  }
}

/**
 * SaaS Features Page
 */
export class SaasFeaturesPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_MARKETING_ROUTES.features
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/features")
  }
}

/**
 * SaaS Pricing Page
 */
export class SaasPricingPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_MARKETING_ROUTES.pricing
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/pricing")
  }

  /**
   * Check if has pricing plans
   */
  async hasPricingPlans(): Promise<boolean> {
    return this.isVisible('[data-testid="pricing-plans"], .pricing-plans')
  }
}

/**
 * SaaS Docs Page
 */
export class SaasDocsPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_MARKETING_ROUTES.docs
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/docs")
  }
}

/**
 * SaaS Blog Page
 */
export class SaasBlogPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_MARKETING_ROUTES.blog
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/blog")
  }
}

/**
 * Onboarding Page
 */
export class OnboardingPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_MARKETING_ROUTES.onboarding
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/onboarding")
  }

  /**
   * Check if has wizard steps
   */
  async hasWizardSteps(): Promise<boolean> {
    return this.isVisible(
      '[data-testid="wizard-steps"], .wizard-steps, [role="progressbar"]'
    )
  }

  /**
   * Get current step number
   */
  async getCurrentStep(): Promise<number | null> {
    const stepIndicator = this.page.locator("[data-current-step]")
    if (await stepIndicator.isVisible().catch(() => false)) {
      const step = await stepIndicator.getAttribute("data-current-step")
      return step ? parseInt(step, 10) : null
    }
    return null
  }
}

// =============================================================================
// SCHOOL MARKETING PAGES (School Subdomain)
// =============================================================================

/**
 * School Home Page
 */
export class SchoolHomePage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_MARKETING_ROUTES.home
  }

  async isDisplayed(): Promise<boolean> {
    return this.isOnCorrectSubdomain()
  }

  /**
   * Check if has school branding
   */
  async hasSchoolBranding(): Promise<boolean> {
    return this.isVisible(
      '[data-testid="school-logo"], .school-logo, header img'
    )
  }
}

/**
 * School About Page
 */
export class SchoolAboutPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_MARKETING_ROUTES.about
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/about") && this.isOnCorrectSubdomain()
  }
}

/**
 * School Academic Page
 */
export class SchoolAcademicPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_MARKETING_ROUTES.academic
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/academic") && this.isOnCorrectSubdomain()
  }
}

/**
 * School Admissions Page
 */
export class SchoolAdmissionsPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_MARKETING_ROUTES.admissions
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/admissions") && this.isOnCorrectSubdomain()
  }
}

/**
 * School Apply Page
 */
export class SchoolApplyPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_MARKETING_ROUTES.apply
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/apply") && this.isOnCorrectSubdomain()
  }

  /**
   * Check if has application form
   */
  async hasApplicationForm(): Promise<boolean> {
    return this.isVisible("form")
  }
}

/**
 * School Tour Page
 */
export class SchoolTourPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_MARKETING_ROUTES.tour
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/tour") && this.isOnCorrectSubdomain()
  }
}
