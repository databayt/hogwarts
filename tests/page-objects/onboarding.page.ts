import { expect, type Locator, type Page } from "@playwright/test"

import { TIMEOUTS, type Locale } from "../helpers/test-data"

/**
 * Onboarding Steps in order (matching ONBOARDING_CONFIG from form/footer.tsx)
 */
export const ONBOARDING_STEPS = [
  "about-school",
  "title",
  "description",
  "location",
  "stand-out",
  "capacity",
  "branding",
  "import",
  "finish-setup",
  "join",
  "visibility",
  "price",
  "discount",
  "legal",
  "subdomain",
] as const

export type OnboardingStepName = (typeof ONBOARDING_STEPS)[number]

/**
 * Page Object: School Onboarding Flow
 *
 * Encapsulates all onboarding page interactions for cleaner tests.
 * Supports the 15-step onboarding wizard plus congratulations page.
 */
export class OnboardingFlowPage {
  readonly page: Page
  readonly baseUrl: string
  readonly locale: Locale

  // =========================================================================
  // LOCATORS - Onboarding Dashboard (entry point)
  // =========================================================================

  /** "Create a new school" link on the onboarding dashboard */
  readonly createNewSchoolLink: Locator
  /** "Create from template" link on the onboarding dashboard */
  readonly createFromTemplateLink: Locator

  // =========================================================================
  // LOCATORS - Form Footer Navigation
  // =========================================================================

  /** Next button in the form footer */
  readonly nextButton: Locator
  /** Back button in the form footer */
  readonly backButton: Locator
  /** Skip button (if available) */
  readonly skipButton: Locator

  // =========================================================================
  // LOCATORS - Title Step
  // =========================================================================

  /** Title textarea (school name) */
  readonly titleTextarea: Locator
  /** Subdomain input on title step */
  readonly titleSubdomainInput: Locator

  // =========================================================================
  // LOCATORS - Description Step
  // =========================================================================

  readonly descriptionTextarea: Locator
  readonly schoolLevelSelect: Locator
  readonly schoolTypeSelect: Locator

  // =========================================================================
  // LOCATORS - Location Step (Mapbox Location Picker)
  // =========================================================================

  /** Search input inside the Mapbox location picker */
  readonly locationSearchInput: Locator
  /** Result buttons in the search dropdown */
  readonly locationSearchResults: Locator
  /** Address preview text below the map */
  readonly locationAddressPreview: Locator

  // =========================================================================
  // LOCATORS - Capacity Step (uses +/- stepper buttons, not inputs)
  // =========================================================================

  // =========================================================================
  // LOCATORS - Branding Step
  // =========================================================================

  readonly logoInput: Locator
  readonly primaryColorInput: Locator

  // =========================================================================
  // LOCATORS - Pricing Step
  // =========================================================================

  readonly tuitionFeeInput: Locator
  readonly currencySelect: Locator
  readonly paymentScheduleSelect: Locator

  // =========================================================================
  // LOCATORS - Legal Step
  // =========================================================================

  /** Radio buttons for operational status */
  readonly existingSchoolRadio: Locator
  readonly newSchoolRadio: Locator
  /** Safety feature checkboxes */
  readonly safetyCheckboxes: Locator

  // =========================================================================
  // LOCATORS - Subdomain Step
  // =========================================================================

  readonly subdomainInput: Locator
  readonly subdomainValidationMessage: Locator
  readonly regenerateButton: Locator
  readonly saveSubdomainButton: Locator
  readonly subdomainSuggestions: Locator

  // =========================================================================
  // LOCATORS - Congratulations / Success Modal
  // =========================================================================

  readonly congratulationsHeading: Locator
  readonly successModal: Locator
  readonly goToDashboardButton: Locator

  // =========================================================================
  // LOCATORS - Error States
  // =========================================================================

  readonly validationError: Locator
  readonly formMessage: Locator
  readonly toastMessage: Locator

  constructor(
    page: Page,
    locale: Locale = "en",
    baseUrl = "http://localhost:3000"
  ) {
    this.page = page
    this.baseUrl = baseUrl
    this.locale = locale

    // Onboarding dashboard
    this.createNewSchoolLink = page.locator(
      'a:has-text("Create a new school"), a:has-text("Create New School")'
    )
    this.createFromTemplateLink = page.locator(
      'a:has-text("Create from template")'
    )

    // Form footer navigation
    this.nextButton = page.locator(
      'footer button:has-text("Next"), footer button:has-text("Finish")'
    )
    this.backButton = page.locator('footer button:has-text("Back")')
    this.skipButton = page.locator('button:has-text("Skip")')

    // Title step - uses textarea, not input
    this.titleTextarea = page.locator("textarea")
    this.titleSubdomainInput = page.locator(
      'input[placeholder="your-school"], input[placeholder*="school"]'
    )

    // Description step
    this.descriptionTextarea = page.locator('textarea[name="description"]')
    this.schoolLevelSelect = page.locator('[name="schoolLevel"]')
    this.schoolTypeSelect = page.locator('[name="schoolType"]')

    // Location step (Mapbox Location Picker)
    this.locationSearchInput = page.locator(
      'input[placeholder*="Search for an address"], input[placeholder*="search"], input[placeholder*="بحث"]'
    )
    this.locationSearchResults = page.locator(".bg-popover button")
    this.locationAddressPreview = page
      .locator(".text-blue-600")
      .locator("..")
      .locator("p")

    // Capacity step - uses counter/stepper controls, no input fields

    // Branding step
    this.logoInput = page.locator('input[name="logo"]')
    this.primaryColorInput = page.locator('input[name="primaryColor"]')

    // Pricing step
    this.tuitionFeeInput = page.locator('input[name="tuitionFee"]')
    this.currencySelect = page.locator('[name="currency"]')
    this.paymentScheduleSelect = page.locator('[name="paymentSchedule"]')

    // Legal step - radio buttons and checkboxes
    this.existingSchoolRadio = page.locator('input[value="private-individual"]')
    this.newSchoolRadio = page.locator('input[value="business"]')
    this.safetyCheckboxes = page.locator('input[type="checkbox"]')

    // Subdomain step
    this.subdomainInput = page.locator("#subdomain")
    this.subdomainValidationMessage = page.locator(
      ".text-green-600, .text-red-600"
    )
    this.regenerateButton = page.locator(
      'button:has-text("Regenerate from school name")'
    )
    this.saveSubdomainButton = page.locator('button:has-text("Save subdomain")')
    this.subdomainSuggestions = page.locator(
      '.cursor-pointer >> [class*="badge"]'
    )

    // Congratulations / Success modal
    this.congratulationsHeading = page.locator(
      'h2:has-text("Congratulations"), h1:has-text("Congratulations"), h1:has-text("Success")'
    )
    this.successModal = page.locator('[class*="modal"]')
    this.goToDashboardButton = page.locator(
      'button:has-text("Go to Dashboard"), a:has-text("Go to Dashboard"), button:has-text("Dashboard")'
    )

    // Error states
    this.validationError = page.locator(
      '[class*="error"], [role="alert"], .text-red-500, [class*="destructive"], [data-slot="form-message"]'
    )
    this.formMessage = page.locator('[data-slot="form-message"]')
    this.toastMessage = page.locator("[data-sonner-toast]")
  }

  // =========================================================================
  // NAVIGATION - Core
  // =========================================================================

  /**
   * Navigate to onboarding dashboard (entry point)
   */
  async goto(): Promise<void> {
    await this.page.goto(`${this.baseUrl}/${this.locale}/onboarding`)
    await this.page.waitForLoadState("domcontentloaded")
    // Wait for auth check and schools to load
    await this.page.waitForTimeout(2000)
  }

  /**
   * Navigate to a specific onboarding step
   */
  async gotoStep(
    schoolId: string,
    step: OnboardingStepName | "congratulations"
  ): Promise<void> {
    await this.page.goto(
      `${this.baseUrl}/${this.locale}/onboarding/${schoolId}/${step}`
    )
    await this.page.waitForLoadState("domcontentloaded")
  }

  /**
   * Navigate to onboarding with a different locale
   */
  async gotoWithLocale(locale: Locale): Promise<void> {
    await this.page.goto(`${this.baseUrl}/${locale}/onboarding`)
    await this.page.waitForLoadState("domcontentloaded")
    await this.page.waitForTimeout(2000)
  }

  /**
   * Click "Create a new school" to start onboarding flow.
   * Handles the overview page intermediary step:
   *   1. Click "Create a new school" → navigates to /onboarding/overview
   *   2. Click "Get Started" button on overview page → creates school → /about-school
   * Returns the schoolId extracted from the URL
   */
  async createNewSchool(): Promise<string | null> {
    await this.createNewSchoolLink.first().click()
    await this.page.waitForLoadState("domcontentloaded")

    // Handle overview page if we land there
    if (this.page.url().includes("/overview")) {
      // Wait for the overview page to fully render
      await this.page.waitForTimeout(1000)

      // Click the "Get Started" button in the footer
      const getStartedButton = this.page.locator(
        'footer button:not([disabled]), button:has-text("Get Started"), button:has-text("ابدأ")'
      )
      await getStartedButton.first().waitFor({
        state: "visible",
        timeout: TIMEOUTS.medium,
      })
      await getStartedButton.first().click()
    }

    // Wait for school creation (server action) and navigation to about-school
    await this.page.waitForURL(/\/onboarding\/[^/]+\/about-school/, {
      timeout: TIMEOUTS.long,
    })

    // Handle error boundary (session may not be synced yet after school creation)
    await this.page.waitForTimeout(2000)
    const hasError = await this.page
      .locator('text="Something went wrong"')
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (hasError) {
      // Click "Try Again" to retry loading with synced session
      const tryAgainButton = this.page.locator('button:has-text("Try Again")')
      if (await tryAgainButton.isVisible().catch(() => false)) {
        await tryAgainButton.click()
        await this.page.waitForTimeout(3000)
      }

      // If still broken, reload the page
      const stillHasError = await this.page
        .locator('text="Something went wrong"')
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      if (stillHasError) {
        await this.page.reload()
        await this.page.waitForLoadState("domcontentloaded")
        await this.page.waitForTimeout(3000)
      }
    }

    return this.getSchoolIdFromUrl()
  }

  /**
   * Extract schoolId from the current onboarding URL
   */
  getSchoolIdFromUrl(): string | null {
    const match = this.page.url().match(/\/onboarding\/([^/]+)/)
    return match ? match[1] : null
  }

  /**
   * Get the current step name from URL
   */
  getCurrentStep(): OnboardingStepName | "congratulations" | null {
    const url = this.page.url()
    const match = url.match(/\/onboarding\/[^/]+\/([^/?]+)/)
    return match ? (match[1] as OnboardingStepName | "congratulations") : null
  }

  /**
   * Get the index of the current step (0-based)
   */
  getCurrentStepIndex(): number {
    const step = this.getCurrentStep()
    if (!step || step === "congratulations") return -1
    return ONBOARDING_STEPS.indexOf(step as OnboardingStepName)
  }

  // =========================================================================
  // NAVIGATION - Footer Buttons
  // =========================================================================

  /**
   * Click Next in the form footer.
   * Automatically recovers from error boundaries before attempting to click.
   */
  async clickNext(): Promise<void> {
    // Recover from error boundary if present (e.g., transient session sync issues)
    await this.recoverFromError()

    await this.nextButton
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await this.nextButton.first().click()
    // Wait for navigation or action to complete
    await this.page.waitForLoadState("domcontentloaded")
    await this.page.waitForTimeout(500)
  }

  /**
   * Attempt to recover from error boundary ("Something went wrong").
   * Tries "Try Again" first, then "Refresh Page", then full page reload.
   */
  async recoverFromError(): Promise<void> {
    const errorText = this.page.locator('text="Something went wrong"')
    const hasError = await errorText
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (!hasError) return

    // Try "Try Again" button
    const tryAgainButton = this.page.locator('button:has-text("Try Again")')
    if (await tryAgainButton.isVisible().catch(() => false)) {
      await tryAgainButton.click()
      await this.page.waitForTimeout(3000)
    }

    // If still has error, try "Refresh Page"
    const stillHasError = await errorText
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    if (stillHasError) {
      const refreshButton = this.page.locator('button:has-text("Refresh Page")')
      if (await refreshButton.isVisible().catch(() => false)) {
        await refreshButton.click()
        await this.page.waitForLoadState("domcontentloaded")
        await this.page.waitForTimeout(3000)
      }
    }

    // Last resort: full page reload
    const finalError = await errorText
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    if (finalError) {
      await this.page.reload()
      await this.page.waitForLoadState("domcontentloaded")
      await this.page.waitForTimeout(3000)
    }
  }

  /**
   * Click Back in the form footer
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
   * Check if the Next button is enabled (not disabled)
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

  /**
   * Check if the Back button is enabled
   */
  async isBackEnabled(): Promise<boolean> {
    try {
      await this.backButton
        .first()
        .waitFor({ state: "visible", timeout: TIMEOUTS.short })
      return !(await this.backButton.first().isDisabled())
    } catch {
      return false
    }
  }

  // =========================================================================
  // STEP INTERACTIONS - About School (Step 1)
  // =========================================================================

  /**
   * About School is an informational page - just verify content and click next
   */
  async completeAboutSchool(): Promise<void> {
    // This is an informational step; Next should auto-enable
    await this.page.waitForTimeout(500)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Title (Step 2)
  // =========================================================================

  /**
   * Fill in the school title
   */
  async fillTitle(name: string): Promise<void> {
    await this.titleTextarea
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.medium })
    await this.titleTextarea.first().clear()
    await this.titleTextarea.first().fill(name)
    await this.page.waitForTimeout(500) // Wait for subdomain auto-generation
  }

  async completeTitle(name: string): Promise<void> {
    await this.fillTitle(name)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Description (Step 3)
  // =========================================================================

  /**
   * Fill in the school description / type.
   * The description step shows a school type radio selector (Private, Public, etc.)
   * and may optionally have a textarea for additional description.
   */
  async fillDescription(description: string): Promise<void> {
    // The description step uses a radio group for school type selection.
    // Try textarea first (some layouts may include one), fall back to radio selection.
    const textarea = this.page.locator("textarea").first()
    const hasTextarea = await textarea
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasTextarea) {
      await textarea.clear()
      await textarea.fill(description)
      await this.page.waitForTimeout(300)
    } else {
      // Select a school type via radio button if available
      // "Private" is typically selected by default, so this step may auto-enable Next
      const radioGroup = this.page.locator('[role="radiogroup"]')
      const hasRadio = await radioGroup
        .isVisible({ timeout: 2000 })
        .catch(() => false)

      if (hasRadio) {
        // Click the first radio option if none is selected
        const firstRadio = radioGroup.locator("input[type='radio']").first()
        const isChecked = await firstRadio.isChecked().catch(() => false)
        if (!isChecked) {
          await firstRadio.click()
        }
      }
      await this.page.waitForTimeout(300)
    }
  }

  async completeDescription(description: string): Promise<void> {
    await this.fillDescription(description)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Location (Step 4)
  // =========================================================================

  /**
   * Fill in location using Mapbox Location Picker.
   * Types a search query, waits for results, and clicks the first result.
   */
  async fillLocation(location: {
    address?: string
    city?: string
    state?: string
    country?: string
  }): Promise<void> {
    // Build search query from location parts
    const query =
      [location.city, location.state, location.country]
        .filter(Boolean)
        .join(", ") ||
      location.address ||
      "Riyadh"

    // Wait for the Mapbox search input to be visible (dynamically loaded)
    await this.locationSearchInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.long,
    })
    await this.locationSearchInput.fill(query)

    // Wait for debounced search results (300ms debounce + API call)
    await this.page.waitForTimeout(2500)

    // Click the first search result if available.
    // Try multiple strategies since the dropdown class may not match CSS selectors.
    const cityPart = location.city || query.split(",")[0].trim()
    let resultClicked = false

    // Strategy 1: Pre-defined CSS class locator
    let firstResult = this.locationSearchResults.first()
    let hasResults = await firstResult
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    // Strategy 2: Role-based locator matching location text
    if (!hasResults) {
      firstResult = this.page
        .getByRole("button", { name: new RegExp(cityPart, "i") })
        .first()
      hasResults = await firstResult
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    }

    if (hasResults) {
      await firstResult.click()
      resultClicked = true
      // Wait for map fly-to animation + address preview to appear
      await this.page.waitForTimeout(2000)
    }

    // Strategy 3: Click directly on the map to trigger reverse geocoding.
    // This sets address via the map click handler even if search API fails.
    if (!resultClicked) {
      const mapCanvas = this.page.locator("canvas.mapboxgl-canvas").first()
      const canvasVisible = await mapCanvas
        .isVisible({ timeout: 5000 })
        .catch(() => false)
      if (canvasVisible) {
        await mapCanvas.click({ position: { x: 200, y: 160 } })
        // Wait for reverse geocode API to resolve and set address
        await this.page.waitForTimeout(3000)
      }
    }

    // Wait for Next to become enabled (address must be set)
    await this.page.waitForTimeout(1000)
  }

  async completeLocation(location: {
    address?: string
    city?: string
    state?: string
    country?: string
  }): Promise<void> {
    await this.fillLocation(location)

    // Verify Next is enabled before clicking; if not, retry with map click
    const nextEnabled = await this.isNextEnabled()
    if (!nextEnabled) {
      // Fallback: click the map center to trigger reverse geocode
      const mapCanvas = this.page.locator("canvas.mapboxgl-canvas").first()
      const canvasVisible = await mapCanvas
        .isVisible({ timeout: 3000 })
        .catch(() => false)
      if (canvasVisible) {
        await mapCanvas.click({ position: { x: 250, y: 180 } })
        await this.page.waitForTimeout(3000)
      }
    }

    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Stand Out (Step 5)
  // =========================================================================

  /**
   * Stand Out step - select features or just proceed
   */
  async completeStandOut(): Promise<void> {
    await this.page.waitForTimeout(500)
    // Click any available selection cards or just proceed
    const selectionCards = this.page.locator(
      '[class*="selection-card"], [data-testid*="feature"]'
    )
    if (
      await selectionCards
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await selectionCards.first().click()
      await this.page.waitForTimeout(300)
    }
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Capacity (Step 6)
  // =========================================================================

  /**
   * Fill in capacity details.
   * The capacity step uses counter/stepper controls (+/- buttons), not regular inputs.
   * Default values are loaded from DB with fallbacks (400 students, 10 teachers, etc.).
   * Next auto-enables once capacity data is fetched.
   */
  async fillCapacity(capacity: {
    students?: number
    teachers?: number
    classes?: number
  }): Promise<void> {
    // Wait for the capacity form to fully render (skeleton → form transition)
    const studentsLabel = this.page.locator("text=Students").first()
    await studentsLabel.waitFor({
      state: "visible",
      timeout: TIMEOUTS.medium,
    })
    // Wait for the useEffect to call enableNext after data fetch
    await this.page.waitForTimeout(2000)

    // If Next is still disabled, click a stepper button to trigger auto-save
    if (!(await this.isNextEnabled())) {
      // Stepper buttons inside the form: [minus, plus, minus, plus, ...]
      const formButtons = this.page.locator('form button[type="button"]')
      const count = await formButtons.count()
      if (count > 1) {
        // Click Students + button (index 1) to trigger auto-save
        await formButtons.nth(1).click()
        await this.page.waitForTimeout(2000)
      }
      // If still disabled, reload to re-fetch capacity data
      if (!(await this.isNextEnabled())) {
        await this.page.reload()
        await this.page.waitForLoadState("domcontentloaded")
        await this.page.waitForTimeout(3000)
      }
    }
  }

  async completeCapacity(capacity: {
    students?: number
    teachers?: number
    classes?: number
  }): Promise<void> {
    await this.fillCapacity(capacity)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Branding (Step 7)
  // =========================================================================

  /**
   * Branding step is optional - can just proceed.
   * Includes error recovery since the page may hit an error boundary.
   */
  async completeBranding(): Promise<void> {
    await this.page.waitForTimeout(1000)

    // Check if footer is visible; if not, the page may be in error state
    const footerVisible = await this.nextButton
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (!footerVisible) {
      // Error boundary hides the footer - recover and retry
      await this.recoverFromError()
      await this.page.waitForTimeout(2000)
    }

    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Import (Step 8)
  // =========================================================================

  /**
   * Import step - skip or proceed
   */
  async completeImport(): Promise<void> {
    await this.page.waitForTimeout(500)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Finish Setup (Step 9)
  // =========================================================================

  /**
   * Finish setup step - proceed
   */
  async completeFinishSetup(): Promise<void> {
    await this.page.waitForTimeout(500)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Join (Step 10)
  // =========================================================================

  /**
   * Join step - proceed
   */
  async completeJoin(): Promise<void> {
    await this.page.waitForTimeout(500)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Visibility (Step 11)
  // =========================================================================

  /**
   * Visibility step - select options or proceed
   */
  async completeVisibility(): Promise<void> {
    await this.page.waitForTimeout(500)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Price (Step 12)
  // =========================================================================

  /**
   * Fill in pricing details
   */
  async fillPricing(pricing: {
    tuitionFee?: number
    currency?: string
    schedule?: string
  }): Promise<void> {
    if (
      pricing.tuitionFee &&
      (await this.tuitionFeeInput.isVisible().catch(() => false))
    ) {
      await this.tuitionFeeInput.clear()
      await this.tuitionFeeInput.fill(pricing.tuitionFee.toString())
    }
    if (
      pricing.currency &&
      (await this.currencySelect.isVisible().catch(() => false))
    ) {
      await this.currencySelect.selectOption(pricing.currency)
    }
    if (
      pricing.schedule &&
      (await this.paymentScheduleSelect.isVisible().catch(() => false))
    ) {
      await this.paymentScheduleSelect.selectOption(pricing.schedule)
    }
    await this.page.waitForTimeout(300)
  }

  async completePrice(pricing?: {
    tuitionFee?: number
    currency?: string
    schedule?: string
  }): Promise<void> {
    if (pricing) {
      await this.fillPricing(pricing)
    }
    await this.page.waitForTimeout(500)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Discount (Step 13)
  // =========================================================================

  /**
   * Discount step - proceed (optional)
   */
  async completeDiscount(): Promise<void> {
    await this.page.waitForTimeout(500)
    await this.clickNext()
  }

  // =========================================================================
  // STEP INTERACTIONS - Legal (Step 14, final step with publish action)
  // =========================================================================

  /**
   * Select operational status on legal step
   */
  async selectOperationalStatus(
    type: "existing" | "new" = "existing"
  ): Promise<void> {
    const radio =
      type === "existing" ? this.existingSchoolRadio : this.newSchoolRadio
    // These are sr-only inputs, click the parent label
    const label = radio.locator("..")
    if (await label.isVisible().catch(() => false)) {
      await label.click()
    }
    await this.page.waitForTimeout(300)
  }

  /**
   * Toggle safety features on legal step
   */
  async toggleSafetyFeature(index: number): Promise<void> {
    const checkboxLabel = this.safetyCheckboxes.nth(index).locator("..")
    if (await checkboxLabel.isVisible().catch(() => false)) {
      await checkboxLabel.click()
    }
    await this.page.waitForTimeout(200)
  }

  /**
   * Complete legal step (this triggers completeOnboarding and shows success modal)
   */
  async completeLegal(): Promise<void> {
    await this.selectOperationalStatus("existing")
    await this.page.waitForTimeout(500)
    await this.clickNext()
    // Legal step triggers completeOnboarding which shows success modal
    await this.page.waitForTimeout(2000)
  }

  // =========================================================================
  // STEP INTERACTIONS - Subdomain (Step 15)
  // =========================================================================

  /**
   * Fill in the subdomain
   */
  async fillSubdomain(subdomain: string): Promise<void> {
    await this.subdomainInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.medium,
    })
    await this.subdomainInput.clear()
    await this.subdomainInput.fill(subdomain)
    // Wait for availability check debounce
    await this.page.waitForTimeout(2000)
  }

  /**
   * Check if subdomain is shown as available (green text)
   */
  async isSubdomainAvailable(): Promise<boolean> {
    const greenMessage = this.page.locator(".text-green-600")
    return greenMessage
      .isVisible({ timeout: TIMEOUTS.short })
      .catch(() => false)
  }

  /**
   * Check if subdomain is shown as unavailable (red text)
   */
  async isSubdomainUnavailable(): Promise<boolean> {
    const redMessage = this.page.locator(".text-red-600")
    return redMessage.isVisible({ timeout: TIMEOUTS.short }).catch(() => false)
  }

  /**
   * Generate a unique subdomain for testing
   */
  generateUniqueSubdomain(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 6)
    return `test-${timestamp}-${random}`
  }

  /**
   * Click "Save subdomain" button
   */
  async clickSaveSubdomain(): Promise<void> {
    await this.saveSubdomainButton.click()
    await this.page.waitForTimeout(1000)
  }

  /**
   * Complete subdomain step with a unique subdomain
   */
  async completeSubdomain(subdomain?: string): Promise<void> {
    const domain = subdomain || this.generateUniqueSubdomain()
    await this.fillSubdomain(domain)

    // If available, save it
    if (await this.isSubdomainAvailable()) {
      if (await this.saveSubdomainButton.isVisible().catch(() => false)) {
        await this.clickSaveSubdomain()
      }
    }

    await this.clickNext()
  }

  // =========================================================================
  // ASSERTIONS
  // =========================================================================

  /**
   * Assert the current URL is on a specific step
   */
  async expectOnStep(
    stepName: OnboardingStepName | "congratulations"
  ): Promise<void> {
    await expect(this.page).toHaveURL(
      new RegExp(`/onboarding/[^/]+/${stepName}`),
      { timeout: TIMEOUTS.navigation }
    )
  }

  /**
   * Assert congratulations/success state is visible
   */
  async expectSuccess(): Promise<void> {
    // Legal step shows success modal (not a separate page)
    await expect(this.congratulationsHeading).toBeVisible({
      timeout: TIMEOUTS.long,
    })
  }

  /**
   * Assert a validation error is visible
   */
  async expectValidationError(): Promise<void> {
    await expect(this.validationError.first()).toBeVisible({
      timeout: TIMEOUTS.short,
    })
  }

  /**
   * Assert the onboarding dashboard is visible (entry point)
   */
  async expectDashboardVisible(): Promise<void> {
    // Should show "Welcome" heading and create options
    await expect(
      this.page.locator("h3, h1, h2").filter({ hasText: /Welcome|مرحبا/ })
    ).toBeVisible({ timeout: TIMEOUTS.medium })
  }

  /**
   * Assert page has no server-side exception
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
   * Assert the progress bar is visible in the footer
   */
  async expectProgressBarVisible(): Promise<void> {
    const progressBar = this.page.locator(
      'footer [role="progressbar"], footer [class*="progress"]'
    )
    await expect(progressBar.first()).toBeVisible({ timeout: TIMEOUTS.medium })
  }

  // =========================================================================
  // FULL FLOW HELPERS
  // =========================================================================

  /**
   * Complete the entire onboarding flow from about-school through legal
   * (legal is the actual final step that triggers publish)
   */
  async completeFullFlow(schoolData: {
    name: string
    description?: string
    location?: {
      address?: string
      city?: string
      state?: string
      country?: string
    }
    capacity?: { students?: number; teachers?: number; classes?: number }
    pricing?: { tuitionFee?: number }
    subdomain?: string
  }): Promise<void> {
    for (const step of ONBOARDING_STEPS) {
      const currentStep = this.getCurrentStep()
      if (!currentStep || currentStep === "congratulations") break

      switch (currentStep) {
        case "about-school":
          await this.completeAboutSchool()
          break
        case "title":
          await this.completeTitle(schoolData.name)
          break
        case "description":
          await this.completeDescription(
            schoolData.description ||
              "A modern school for the future of education with excellent facilities."
          )
          break
        case "location":
          await this.completeLocation(
            schoolData.location || {
              address: "123 Test Street",
              city: "Test City",
              state: "Test State",
            }
          )
          break
        case "stand-out":
          await this.completeStandOut()
          break
        case "capacity":
          await this.completeCapacity(
            schoolData.capacity || { students: 500, teachers: 30 }
          )
          break
        case "branding":
          await this.completeBranding()
          break
        case "import":
          await this.completeImport()
          break
        case "finish-setup":
          await this.completeFinishSetup()
          break
        case "join":
          await this.completeJoin()
          break
        case "visibility":
          await this.completeVisibility()
          break
        case "price":
          await this.completePrice(schoolData.pricing)
          break
        case "discount":
          await this.completeDiscount()
          break
        case "legal":
          await this.completeLegal()
          break
        case "subdomain":
          await this.completeSubdomain(schoolData.subdomain)
          break
        default:
          // Unknown step, try clicking next
          await this.clickNext()
      }

      // Check if success modal appeared (legal step triggers this)
      const hasSuccess = await this.congratulationsHeading
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      if (hasSuccess) break

      // Check if URL moved to congratulations
      if (this.page.url().includes("/congratulations")) break
    }
  }

  /**
   * Navigate step-by-step from current to target step using Next
   */
  async navigateToStep(targetStep: OnboardingStepName): Promise<void> {
    const targetIndex = ONBOARDING_STEPS.indexOf(targetStep)
    let currentIndex = this.getCurrentStepIndex()

    while (currentIndex < targetIndex && currentIndex >= 0) {
      await this.clickNext()
      await this.page.waitForTimeout(500)
      currentIndex = this.getCurrentStepIndex()
      if (currentIndex === -1) break
    }
  }

  // =========================================================================
  // CHROME ERROR HELPER
  // =========================================================================

  /**
   * Check if page hit a chrome-error:// protocol mismatch
   */
  isProtocolError(): boolean {
    return this.page.url().startsWith("chrome-error://")
  }
}
