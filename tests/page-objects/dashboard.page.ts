/**
 * Dashboard Page Objects
 *
 * Page objects for SaaS dashboard and School dashboard pages.
 */

import type { Page } from "@playwright/test"

import {
  SAAS_DASHBOARD_ROUTES,
  SCHOOL_DASHBOARD_ROUTES,
  SELECTORS,
  TIMEOUTS,
  type Locale,
} from "../helpers/test-data"
import { BasePage, SchoolBasePage } from "./base.page"

// =============================================================================
// SAAS DASHBOARD PAGES (Main Domain - DEVELOPER Only)
// =============================================================================

/**
 * SaaS Dashboard Page (main domain)
 */
export class SaasDashboardPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_DASHBOARD_ROUTES.dashboard
  }

  async isDisplayed(): Promise<boolean> {
    return (
      this.urlContains("/dashboard") &&
      !this.page.url().includes("demo.") &&
      (await this.hasSidebar())
    )
  }

  /**
   * Check if has analytics widget
   */
  async hasAnalyticsWidget(): Promise<boolean> {
    return this.isVisible('[data-testid="analytics-widget"], .analytics-widget')
  }

  /**
   * Check if has tenants list
   */
  async hasTenantsList(): Promise<boolean> {
    return this.isVisible('[data-testid="tenants-list"], .tenants-list')
  }
}

/**
 * SaaS Analytics Page
 */
export class SaasAnalyticsPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_DASHBOARD_ROUTES.analytics
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/analytics")
  }
}

/**
 * SaaS Tenants Page
 */
export class SaasTenantsPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_DASHBOARD_ROUTES.tenants
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/tenants")
  }
}

/**
 * SaaS Billing Page
 */
export class SaasBillingPage extends BasePage {
  constructor(page: Page, locale: Locale = "en") {
    super(page, locale)
  }

  get path(): string {
    return SAAS_DASHBOARD_ROUTES.billing
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/billing")
  }
}

// =============================================================================
// SCHOOL DASHBOARD PAGES (School Subdomain)
// =============================================================================

/**
 * School Dashboard Page
 */
export class SchoolDashboardPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_DASHBOARD_ROUTES.dashboard
  }

  async isDisplayed(): Promise<boolean> {
    return (
      this.urlContains("/dashboard") &&
      this.isOnCorrectSubdomain() &&
      (await this.hasSidebar())
    )
  }

  /**
   * Check if has quick stats
   */
  async hasQuickStats(): Promise<boolean> {
    return this.isVisible('[data-testid="quick-stats"], .quick-stats')
  }
}

/**
 * School Students Page
 */
export class SchoolStudentsPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_DASHBOARD_ROUTES.students
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/students")
  }

  /**
   * Get student count from table
   */
  async getStudentCount(): Promise<number> {
    await this.waitForElement(SELECTORS.tableBody, TIMEOUTS.medium).catch(
      () => null
    )
    return this.page.locator(SELECTORS.tableRow).count()
  }

  /**
   * Search students
   */
  async search(query: string): Promise<void> {
    await this.fill(SELECTORS.searchInput, query)
    await this.page.waitForTimeout(500) // Debounce
  }
}

/**
 * School Teachers Page
 */
export class SchoolTeachersPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_DASHBOARD_ROUTES.teachers
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/teachers")
  }
}

/**
 * School Classes Page
 */
export class SchoolClassesPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_DASHBOARD_ROUTES.classes
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/classes")
  }
}

/**
 * School Finance Page
 */
export class SchoolFinancePage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_DASHBOARD_ROUTES.finance
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/finance")
  }
}

/**
 * School Attendance Page
 */
export class SchoolAttendancePage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_DASHBOARD_ROUTES.attendance
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/attendance")
  }
}

/**
 * School Exams Page
 */
export class SchoolExamsPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_DASHBOARD_ROUTES.exams
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/exams")
  }
}

/**
 * School Settings Page
 */
export class SchoolSettingsPage extends SchoolBasePage {
  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, subdomain, locale)
  }

  get path(): string {
    return SCHOOL_DASHBOARD_ROUTES.settings
  }

  async isDisplayed(): Promise<boolean> {
    return this.urlContains("/settings")
  }
}
