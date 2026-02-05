/**
 * Multi-Tenant URL Builder
 *
 * Utilities for constructing URLs across the multi-tenant platform.
 * Handles main domain, school subdomains, locales, and route building.
 */

import {
  buildSchoolUrl,
  buildUrl,
  getBaseUrl,
  getSchoolUrl,
  getTestEnv,
  SAAS_DASHBOARD_ROUTES,
  SAAS_MARKETING_ROUTES,
  SCHOOL_DASHBOARD_ROUTES,
  SCHOOL_MARKETING_ROUTES,
  type Locale,
  type TestEnv,
} from "./test-data"

// =============================================================================
// URL BUILDER CLASS
// =============================================================================

/**
 * Fluent URL builder for multi-tenant testing
 */
export class UrlBuilder {
  private env: TestEnv
  private locale: Locale
  private subdomain: string | null

  constructor(env?: TestEnv) {
    this.env = env ?? getTestEnv()
    this.locale = "en"
    this.subdomain = null
  }

  /**
   * Set locale for URLs
   */
  withLocale(locale: Locale): this {
    this.locale = locale
    return this
  }

  /**
   * Set subdomain for school URLs
   */
  forSchool(subdomain: string): this {
    this.subdomain = subdomain
    return this
  }

  /**
   * Build URL for main domain
   */
  main(path: string = ""): string {
    return buildUrl(path, this.locale, this.env)
  }

  /**
   * Build URL for school subdomain
   */
  school(path: string = ""): string {
    if (!this.subdomain) {
      throw new Error("Must call forSchool() before building school URL")
    }
    return buildSchoolUrl(this.subdomain, path, this.locale, this.env)
  }

  /**
   * Get base URL for main domain
   */
  get base(): string {
    return getBaseUrl(this.env)
  }

  /**
   * Get base URL for school
   */
  get schoolBase(): string {
    if (!this.subdomain) {
      throw new Error("Must call forSchool() before getting school base")
    }
    return getSchoolUrl(this.subdomain, this.env)
  }

  // SaaS Marketing Routes
  get saasMarketing() {
    return {
      home: () => this.main(SAAS_MARKETING_ROUTES.home),
      features: () => this.main(SAAS_MARKETING_ROUTES.features),
      pricing: () => this.main(SAAS_MARKETING_ROUTES.pricing),
      docs: () => this.main(SAAS_MARKETING_ROUTES.docs),
      blog: () => this.main(SAAS_MARKETING_ROUTES.blog),
      login: () => this.main(SAAS_MARKETING_ROUTES.login),
      join: () => this.main(SAAS_MARKETING_ROUTES.join),
      onboarding: () => this.main(SAAS_MARKETING_ROUTES.onboarding),
    }
  }

  // SaaS Dashboard Routes
  get saasDashboard() {
    return {
      dashboard: () => this.main(SAAS_DASHBOARD_ROUTES.dashboard),
      analytics: () => this.main(SAAS_DASHBOARD_ROUTES.analytics),
      tenants: () => this.main(SAAS_DASHBOARD_ROUTES.tenants),
      billing: () => this.main(SAAS_DASHBOARD_ROUTES.billing),
      domains: () => this.main(SAAS_DASHBOARD_ROUTES.domains),
      kanban: () => this.main(SAAS_DASHBOARD_ROUTES.kanban),
      sales: () => this.main(SAAS_DASHBOARD_ROUTES.sales),
      observability: () => this.main(SAAS_DASHBOARD_ROUTES.observability),
      profile: () => this.main(SAAS_DASHBOARD_ROUTES.profile),
    }
  }

  // School Marketing Routes
  get schoolMarketing() {
    return {
      home: () => this.school(SCHOOL_MARKETING_ROUTES.home),
      about: () => this.school(SCHOOL_MARKETING_ROUTES.about),
      academic: () => this.school(SCHOOL_MARKETING_ROUTES.academic),
      admissions: () => this.school(SCHOOL_MARKETING_ROUTES.admissions),
      apply: () => this.school(SCHOOL_MARKETING_ROUTES.apply),
      tour: () => this.school(SCHOOL_MARKETING_ROUTES.tour),
      login: () => this.school(SCHOOL_MARKETING_ROUTES.login),
    }
  }

  // School Dashboard Routes
  get schoolDashboard() {
    return {
      dashboard: () => this.school(SCHOOL_DASHBOARD_ROUTES.dashboard),
      students: () => this.school(SCHOOL_DASHBOARD_ROUTES.students),
      teachers: () => this.school(SCHOOL_DASHBOARD_ROUTES.teachers),
      classes: () => this.school(SCHOOL_DASHBOARD_ROUTES.classes),
      finance: () => this.school(SCHOOL_DASHBOARD_ROUTES.finance),
      attendance: () => this.school(SCHOOL_DASHBOARD_ROUTES.attendance),
      exams: () => this.school(SCHOOL_DASHBOARD_ROUTES.exams),
      settings: () => this.school(SCHOOL_DASHBOARD_ROUTES.settings),
      admission: () => this.school(SCHOOL_DASHBOARD_ROUTES.admission),
      stream: () => this.school(SCHOOL_DASHBOARD_ROUTES.stream),
      timetable: () => this.school(SCHOOL_DASHBOARD_ROUTES.timetable),
      grades: () => this.school(SCHOOL_DASHBOARD_ROUTES.grades),
      messages: () => this.school(SCHOOL_DASHBOARD_ROUTES.messages),
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a URL builder for the current environment
 */
export function createUrlBuilder(env?: TestEnv): UrlBuilder {
  return new UrlBuilder(env)
}

/**
 * Create a URL builder for demo school
 */
export function createDemoSchoolBuilder(
  locale: Locale = "en",
  env?: TestEnv
): UrlBuilder {
  return new UrlBuilder(env).forSchool("demo").withLocale(locale)
}

/**
 * Create a URL builder for main domain
 */
export function createMainDomainBuilder(
  locale: Locale = "en",
  env?: TestEnv
): UrlBuilder {
  return new UrlBuilder(env).withLocale(locale)
}

// =============================================================================
// URL MATCHERS
// =============================================================================

/**
 * URL matching utilities for assertions
 */
export const urlMatchers = {
  /**
   * Check if URL is a login page
   */
  isLoginPage(url: string): boolean {
    return /\/login/.test(url)
  },

  /**
   * Check if URL is a dashboard page
   */
  isDashboardPage(url: string): boolean {
    return /\/dashboard/.test(url)
  },

  /**
   * Check if URL is an onboarding page
   */
  isOnboardingPage(url: string): boolean {
    return /\/onboarding/.test(url)
  },

  /**
   * Check if URL is on a school subdomain
   */
  isSchoolSubdomain(url: string, subdomain?: string): boolean {
    if (subdomain) {
      return url.includes(`${subdomain}.`)
    }
    // Check for common subdomain patterns
    return /\w+\.localhost|[\w-]+\.databayt\.org/.test(url)
  },

  /**
   * Check if URL is on main domain
   */
  isMainDomain(url: string): boolean {
    return (
      (url.includes("localhost:3000") && !this.isSchoolSubdomain(url)) ||
      url.startsWith("https://ed.databayt.org")
    )
  },

  /**
   * Check if URL has specific locale
   */
  hasLocale(url: string, locale: Locale): boolean {
    return new RegExp(`\\/${locale}(\\/|$|\\?)`).test(url)
  },

  /**
   * Check if URL matches a pattern
   */
  matches(url: string, pattern: string | RegExp): boolean {
    if (typeof pattern === "string") {
      return url.includes(pattern)
    }
    return pattern.test(url)
  },

  /**
   * Check if URL is a protected route redirect
   */
  isAuthRedirect(url: string): boolean {
    return (
      this.isLoginPage(url) ||
      url.includes("callbackUrl") ||
      url.includes("error=")
    )
  },

  /**
   * Check if URL indicates protocol mismatch (dev mode issue)
   */
  isProtocolError(url: string): boolean {
    return url.includes("chrome-error://")
  },
}
