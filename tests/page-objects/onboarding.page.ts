import { expect, type Locator, type Page } from "@playwright/test"

/**
 * Page Object: School Onboarding
 *
 * Encapsulates all onboarding page interactions for cleaner tests.
 */
export class OnboardingPage {
  readonly page: Page
  readonly baseUrl: string

  // Common elements
  readonly createSchoolButton: Locator
  readonly nextButton: Locator
  readonly backButton: Locator
  readonly skipButton: Locator

  // Title step
  readonly schoolNameInput: Locator

  // Description step
  readonly descriptionTextarea: Locator
  readonly schoolLevelSelect: Locator
  readonly schoolTypeSelect: Locator

  // Location step
  readonly addressInput: Locator
  readonly cityInput: Locator
  readonly stateInput: Locator
  readonly countryInput: Locator

  // Capacity step
  readonly maxStudentsInput: Locator
  readonly maxTeachersInput: Locator
  readonly maxClassesInput: Locator

  // Branding step
  readonly logoInput: Locator
  readonly primaryColorInput: Locator

  // Pricing step
  readonly tuitionFeeInput: Locator
  readonly currencySelect: Locator
  readonly paymentScheduleSelect: Locator

  // Legal step
  readonly termsCheckbox: Locator
  readonly privacyCheckbox: Locator
  readonly dataProcessingCheckbox: Locator

  // Subdomain step
  readonly subdomainInput: Locator
  readonly subdomainStatus: Locator
  readonly regenerateButton: Locator

  // Congratulations
  readonly congratulationsHeading: Locator
  readonly goToDashboardButton: Locator

  constructor(page: Page, baseUrl = "http://localhost:3000") {
    this.page = page
    this.baseUrl = baseUrl

    // Common elements
    this.createSchoolButton = page.locator(
      'button:has-text("Create"), button:has-text("New School"), button:has-text("Create New School")'
    )
    this.nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Continue")'
    )
    this.backButton = page.locator(
      'button:has-text("Back"), a:has-text("Back")'
    )
    this.skipButton = page.locator('button:has-text("Skip")')

    // Title step
    this.schoolNameInput = page.locator('input[name="name"]')

    // Description step
    this.descriptionTextarea = page.locator('textarea[name="description"]')
    this.schoolLevelSelect = page.locator('[name="schoolLevel"]')
    this.schoolTypeSelect = page.locator('[name="schoolType"]')

    // Location step
    this.addressInput = page.locator('input[name="address"]')
    this.cityInput = page.locator('input[name="city"]')
    this.stateInput = page.locator('input[name="state"]')
    this.countryInput = page.locator('input[name="country"]')

    // Capacity step
    this.maxStudentsInput = page.locator('input[name="maxStudents"]')
    this.maxTeachersInput = page.locator('input[name="maxTeachers"]')
    this.maxClassesInput = page.locator('input[name="maxClasses"]')

    // Branding step
    this.logoInput = page.locator('input[name="logo"]')
    this.primaryColorInput = page.locator('input[name="primaryColor"]')

    // Pricing step
    this.tuitionFeeInput = page.locator('input[name="tuitionFee"]')
    this.currencySelect = page.locator('[name="currency"]')
    this.paymentScheduleSelect = page.locator('[name="paymentSchedule"]')

    // Legal step
    this.termsCheckbox = page.locator(
      'input[name="termsAccepted"], input[type="checkbox"]:near(:text("Terms"))'
    )
    this.privacyCheckbox = page.locator(
      'input[name="privacyAccepted"], input[type="checkbox"]:near(:text("Privacy"))'
    )
    this.dataProcessingCheckbox = page.locator(
      'input[name="dataProcessingAccepted"], input[type="checkbox"]:near(:text("Data"))'
    )

    // Subdomain step
    this.subdomainInput = page.locator('input[name="domain"]')
    this.subdomainStatus = page.locator(
      '[data-testid="subdomain-status"], [data-available]'
    )
    this.regenerateButton = page.locator(
      'button:has-text("Regenerate"), button:has-text("Suggest")'
    )

    // Congratulations
    this.congratulationsHeading = page.locator(
      'h1:has-text("Congratulations"), h2:has-text("Congratulations"), h1:has-text("Success")'
    )
    this.goToDashboardButton = page.locator(
      'a:has-text("Dashboard"), button:has-text("Dashboard"), a:has-text("Go to Dashboard")'
    )
  }

  // Navigation methods
  async goto() {
    await this.page.goto(`${this.baseUrl}/en/onboarding`)
    await this.page.waitForLoadState("networkidle")
  }

  async gotoStep(schoolId: string, step: string) {
    await this.page.goto(`${this.baseUrl}/en/onboarding/${schoolId}/${step}`)
    await this.page.waitForLoadState("networkidle")
  }

  async createNewSchool() {
    if (await this.createSchoolButton.first().isVisible()) {
      await this.createSchoolButton.first().click()
      await this.page.waitForURL(/\/onboarding\/[^/]+/, { timeout: 15000 })
    }
    return this.getSchoolIdFromUrl()
  }

  getSchoolIdFromUrl(): string | null {
    const match = this.page.url().match(/\/onboarding\/([^/]+)/)
    return match ? match[1] : null
  }

  getCurrentStep(): string | null {
    const url = this.page.url()
    const match = url.match(/\/onboarding\/[^/]+\/([^/?]+)/)
    return match ? match[1] : null
  }

  // Step completion methods
  async fillTitle(name: string) {
    await this.schoolNameInput.waitFor({ timeout: 10000 })
    await this.schoolNameInput.fill(name)
    await this.page.waitForTimeout(300)
  }

  async fillDescription(description: string, level?: string, type?: string) {
    await this.descriptionTextarea.waitFor({ timeout: 10000 })
    await this.descriptionTextarea.fill(description)

    if (level && (await this.schoolLevelSelect.isVisible())) {
      await this.schoolLevelSelect.selectOption(level)
    }
    if (type && (await this.schoolTypeSelect.isVisible())) {
      await this.schoolTypeSelect.selectOption(type)
    }
    await this.page.waitForTimeout(300)
  }

  async fillLocation(location: {
    address: string
    city: string
    state: string
    country?: string
  }) {
    await this.addressInput.waitFor({ timeout: 10000 })
    await this.addressInput.fill(location.address)
    await this.cityInput.fill(location.city)
    await this.stateInput.fill(location.state)
    if (location.country && (await this.countryInput.isVisible())) {
      await this.countryInput.fill(location.country)
    }
    await this.page.waitForTimeout(300)
  }

  async fillCapacity(capacity: {
    students: number
    teachers: number
    classes?: number
  }) {
    await this.maxStudentsInput.waitFor({ timeout: 10000 })
    await this.maxStudentsInput.fill(capacity.students.toString())
    await this.maxTeachersInput.fill(capacity.teachers.toString())
    if (capacity.classes && (await this.maxClassesInput.isVisible())) {
      await this.maxClassesInput.fill(capacity.classes.toString())
    }
    await this.page.waitForTimeout(300)
  }

  async fillBranding(branding?: { logo?: string; primaryColor?: string }) {
    if (branding?.logo && (await this.logoInput.isVisible())) {
      await this.logoInput.fill(branding.logo)
    }
    if (branding?.primaryColor && (await this.primaryColorInput.isVisible())) {
      await this.primaryColorInput.fill(branding.primaryColor)
    }
    await this.page.waitForTimeout(300)
  }

  async fillPricing(pricing: {
    tuitionFee: number
    currency?: string
    schedule?: string
  }) {
    await this.tuitionFeeInput.waitFor({ timeout: 10000 })
    await this.tuitionFeeInput.fill(pricing.tuitionFee.toString())

    if (pricing.currency && (await this.currencySelect.isVisible())) {
      await this.currencySelect.selectOption(pricing.currency)
    }
    if (pricing.schedule && (await this.paymentScheduleSelect.isVisible())) {
      await this.paymentScheduleSelect.selectOption(pricing.schedule)
    }
    await this.page.waitForTimeout(300)
  }

  async acceptLegal() {
    // Check all required checkboxes
    const checkboxes = [
      this.termsCheckbox,
      this.privacyCheckbox,
      this.dataProcessingCheckbox,
    ]

    for (const checkbox of checkboxes) {
      if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
        await checkbox.check()
      }
    }
    await this.page.waitForTimeout(300)
  }

  async fillSubdomain(subdomain: string): Promise<boolean> {
    await this.subdomainInput.waitFor({ timeout: 10000 })
    await this.subdomainInput.fill(subdomain)

    // Wait for availability check
    await this.page.waitForTimeout(1500)

    // Check if available
    const isAvailable = await this.isSubdomainAvailable()
    return isAvailable
  }

  async isSubdomainAvailable(): Promise<boolean> {
    const availableIndicator = this.page.locator(
      '[data-available="true"], .text-green-500:near(input[name="domain"])'
    )
    return availableIndicator.isVisible({ timeout: 3000 }).catch(() => false)
  }

  async generateUniqueSubdomain(): Promise<string> {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 6)
    return `test-${timestamp}-${random}`
  }

  // Navigation
  async clickNext() {
    await this.nextButton.first().click()
    await this.page.waitForLoadState("networkidle")
  }

  async clickBack() {
    await this.backButton.first().click()
    await this.page.waitForLoadState("networkidle")
  }

  async clickSkip() {
    if (await this.skipButton.isVisible()) {
      await this.skipButton.click()
      await this.page.waitForLoadState("networkidle")
    }
  }

  async isNextEnabled(): Promise<boolean> {
    return !(await this.nextButton.first().isDisabled())
  }

  // Assertions
  async expectOnStep(stepName: string) {
    await expect(this.page).toHaveURL(new RegExp(`/${stepName}`))
  }

  async expectCongratulations() {
    await expect(this.congratulationsHeading).toBeVisible({ timeout: 30000 })
  }

  async expectValidationError() {
    const error = this.page.locator(
      '[class*="error"], [role="alert"], .text-red-500, [class*="destructive"]'
    )
    await expect(error.first()).toBeVisible({ timeout: 5000 })
  }

  // Complete flow helper
  async completeFullOnboarding(schoolData: {
    name: string
    description: string
    location: { address: string; city: string; state: string; country?: string }
    capacity: { students: number; teachers: number }
    pricing: { tuitionFee: number }
    subdomain?: string
  }) {
    // Create school
    await this.createNewSchool()

    // Complete each step
    const steps = [
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
    ]

    for (const step of steps) {
      const currentStep = this.getCurrentStep()
      if (!currentStep) continue

      switch (currentStep) {
        case "about-school":
          await this.clickNext()
          break
        case "title":
          await this.fillTitle(schoolData.name)
          await this.clickNext()
          break
        case "description":
          await this.fillDescription(schoolData.description)
          await this.clickNext()
          break
        case "location":
          await this.fillLocation(schoolData.location)
          await this.clickNext()
          break
        case "capacity":
          await this.fillCapacity(schoolData.capacity)
          await this.clickNext()
          break
        case "branding":
          // Skip branding (optional)
          await this.clickNext()
          break
        case "price":
          await this.fillPricing(schoolData.pricing)
          await this.clickNext()
          break
        case "legal":
          await this.acceptLegal()
          await this.clickNext()
          break
        case "subdomain":
          const subdomain =
            schoolData.subdomain || (await this.generateUniqueSubdomain())
          let isAvailable = await this.fillSubdomain(subdomain)
          if (!isAvailable) {
            // Try with generated subdomain
            isAvailable = await this.fillSubdomain(
              await this.generateUniqueSubdomain()
            )
          }
          await this.clickNext()
          break
        default:
          // For optional steps, just click next or skip
          if (await this.nextButton.first().isVisible()) {
            await this.clickNext()
          } else if (await this.skipButton.isVisible()) {
            await this.clickSkip()
          }
      }

      // Check if we've reached congratulations
      if (this.page.url().includes("/congratulations")) {
        break
      }
    }
  }
}
