/**
 * Base Page Object
 *
 * Abstract base class for all page objects.
 * Provides common functionality for multi-tenant URL building and page interactions.
 */

import type { Page, Response } from "@playwright/test"

import {
  buildSchoolUrl,
  buildUrl,
  getTestEnv,
  SELECTORS,
  TIMEOUTS,
  type Locale,
  type TestEnv,
} from "../helpers/test-data"

// =============================================================================
// BASE PAGE CLASS
// =============================================================================

export abstract class BasePage {
  protected readonly page: Page
  protected readonly env: TestEnv
  protected locale: Locale

  constructor(page: Page, locale: Locale = "en") {
    this.page = page
    this.env = getTestEnv()
    this.locale = locale
  }

  // ===========================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ===========================================================================

  /**
   * Get the base path for this page (without locale)
   */
  abstract get path(): string

  /**
   * Check if the page is currently displayed
   */
  abstract isDisplayed(): Promise<boolean>

  // ===========================================================================
  // URL BUILDING
  // ===========================================================================

  /**
   * Build URL for main domain
   */
  protected buildMainUrl(path: string = this.path): string {
    return buildUrl(path, this.locale, this.env)
  }

  /**
   * Build URL for school subdomain
   */
  protected buildSchoolUrl(
    subdomain: string,
    path: string = this.path
  ): string {
    return buildSchoolUrl(subdomain, path, this.locale, this.env)
  }

  /**
   * Get full URL for this page
   */
  get url(): string {
    return this.buildMainUrl()
  }

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

  /**
   * Navigate to this page
   */
  async goto(): Promise<Response | null> {
    const response = await this.page.goto(this.url)
    await this.waitForLoad()
    return response
  }

  /**
   * Wait for page to load
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded")
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle", {
        timeout: TIMEOUTS.networkIdle,
      })
    } catch {
      // Fallback to domcontentloaded if networkidle times out
      await this.page.waitForLoadState("domcontentloaded")
    }
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<string> {
    try {
      await this.page.waitForLoadState("networkidle", {
        timeout: TIMEOUTS.navigation,
      })
    } catch {
      await this.page.waitForLoadState("domcontentloaded", {
        timeout: TIMEOUTS.short,
      })
    }
    return this.page.url()
  }

  // ===========================================================================
  // PAGE STATE
  // ===========================================================================

  /**
   * Get current URL
   */
  get currentUrl(): string {
    return this.page.url()
  }

  /**
   * Check if URL contains path
   */
  urlContains(path: string): boolean {
    return this.page.url().includes(path)
  }

  /**
   * Check if URL matches pattern
   */
  urlMatches(pattern: RegExp): boolean {
    return pattern.test(this.page.url())
  }

  /**
   * Set locale and return new URL
   */
  setLocale(locale: Locale): this {
    this.locale = locale
    return this
  }

  // ===========================================================================
  // COMMON ELEMENTS
  // ===========================================================================

  /**
   * Check if sidebar is visible
   */
  async hasSidebar(): Promise<boolean> {
    return this.page
      .locator(SELECTORS.sidebar)
      .first()
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)
  }

  /**
   * Check if main content is visible
   */
  async hasMainContent(): Promise<boolean> {
    return this.page
      .locator(SELECTORS.mainContent)
      .first()
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)
  }

  /**
   * Check if page has server-side exception
   */
  async hasSSE(): Promise<boolean> {
    return this.page
      .locator(SELECTORS.sseError)
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page.title()
  }

  /**
   * Get HTML dir attribute (for RTL/LTR)
   */
  async getHtmlDirection(): Promise<string | null> {
    return this.page.locator("html").getAttribute("dir")
  }

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  /**
   * Click an element
   */
  async click(selector: string): Promise<void> {
    await this.page.click(selector)
  }

  /**
   * Fill an input
   */
  async fill(selector: string, value: string): Promise<void> {
    const input = this.page.locator(selector)
    await input.clear()
    await input.fill(value)
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string | null> {
    return this.page.locator(selector).textContent()
  }

  /**
   * Check if element is visible
   */
  async isVisible(
    selector: string,
    timeout: number = TIMEOUTS.short
  ): Promise<boolean> {
    return this.page
      .locator(selector)
      .isVisible({ timeout })
      .catch(() => false)
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(
    selector: string,
    timeout: number = TIMEOUTS.medium
  ): Promise<void> {
    await this.page.waitForSelector(selector, { state: "visible", timeout })
  }

  // ===========================================================================
  // SCREENSHOT & DEBUG
  // ===========================================================================

  /**
   * Take screenshot
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` })
  }

  /**
   * Get page content for debugging
   */
  async getContent(): Promise<string> {
    return this.page.content()
  }
}

// =============================================================================
// SCHOOL PAGE BASE CLASS
// =============================================================================

/**
 * Base class for pages on school subdomains
 */
export abstract class SchoolBasePage extends BasePage {
  protected subdomain: string

  constructor(page: Page, subdomain: string = "demo", locale: Locale = "en") {
    super(page, locale)
    this.subdomain = subdomain
  }

  /**
   * Get full URL for this page on school subdomain
   */
  override get url(): string {
    return this.buildSchoolUrl(this.subdomain)
  }

  /**
   * Navigate to this page on school subdomain
   */
  override async goto(): Promise<Response | null> {
    const response = await this.page.goto(this.url)
    await this.waitForLoad()
    return response
  }

  /**
   * Change subdomain
   */
  forSchool(subdomain: string): this {
    this.subdomain = subdomain
    return this
  }

  /**
   * Check if on correct subdomain
   */
  isOnCorrectSubdomain(): boolean {
    return this.page.url().includes(`${this.subdomain}.`)
  }
}
