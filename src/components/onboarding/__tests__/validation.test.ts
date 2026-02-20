/**
 * Onboarding Validation Schema Tests
 *
 * Comprehensive tests for all onboarding-related Zod schemas including:
 * - domainSchema
 * - titleStepValidation
 * - descriptionStepValidation
 * - locationStepValidation
 * - capacityStepValidation
 * - priceStepValidation
 * - legalStepValidation
 * - i18n-enabled schema factories
 */

import { describe, expect, it } from "vitest"

import {
  borderRadiusSchema,
  brandingStepValidation,
  capacityStepValidation,
  createBrandingStepValidation,
  createCapacityStepValidation,
  createDescriptionStepValidation,
  // i18n factory functions
  createDomainSchema,
  createEmailSchema,
  createLegalStepValidation,
  createLocationStepValidation,
  createOnboardingValidation,
  createPhoneSchema,
  createPriceStepValidation,
  createTitleStepValidation,
  createUrlSchema,
  currencySchema,
  descriptionStepValidation,
  // Base schemas
  domainSchema,
  emailSchema,
  getRequiredFieldsForStep,
  legalStepValidation,
  locationStepValidation,
  onboardingValidation,
  paymentScheduleSchema,
  phoneSchema,
  priceStepValidation,
  schoolCategorySchema,
  schoolTypeSchema,
  shadowSizeSchema,
  // Step validation schemas
  titleStepValidation,
  urlSchema,
  // Helper functions
  validateStep,
} from "../validation"
import { createMockDictionary } from "./factories/dictionary"
import {
  createBrandingStepData,
  createCapacityStepData,
  createDescriptionStepData,
  createLegalStepData,
  createLocationStepData,
  createPriceStepData,
  createTitleStepData,
} from "./factories/school"

// ============================================================================
// Mock Dictionary for i18n Tests
// ============================================================================

const mockDictionary = createMockDictionary()

// ============================================================================
// Domain Schema Tests
// ============================================================================

describe("domainSchema", () => {
  describe("length validation", () => {
    it("should accept domain with exactly 3 characters", () => {
      const result = domainSchema.safeParse("abc")
      expect(result.success).toBe(true)
    })

    it("should accept domain with 63 characters", () => {
      const domain = "a".repeat(63)
      const result = domainSchema.safeParse(domain)
      expect(result.success).toBe(true)
    })

    it("should reject domain with less than 3 characters", () => {
      const result = domainSchema.safeParse("ab")
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 3")
      }
    })

    it("should reject domain with more than 63 characters", () => {
      const domain = "a".repeat(64)
      const result = domainSchema.safeParse(domain)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("less than 63")
      }
    })
  })

  describe("character validation", () => {
    it("should accept lowercase letters", () => {
      const result = domainSchema.safeParse("myschool")
      expect(result.success).toBe(true)
    })

    it("should accept numbers", () => {
      const result = domainSchema.safeParse("school123")
      expect(result.success).toBe(true)
    })

    it("should accept hyphens in the middle", () => {
      const result = domainSchema.safeParse("my-school")
      expect(result.success).toBe(true)
    })

    it("should accept alphanumeric with hyphens", () => {
      const result = domainSchema.safeParse("my-school-2024")
      expect(result.success).toBe(true)
    })

    it("should reject uppercase letters", () => {
      const result = domainSchema.safeParse("MySchool")
      expect(result.success).toBe(false)
    })

    it("should reject special characters", () => {
      const result = domainSchema.safeParse("my_school")
      expect(result.success).toBe(false)
    })

    it("should reject spaces", () => {
      const result = domainSchema.safeParse("my school")
      expect(result.success).toBe(false)
    })
  })

  describe("start/end validation", () => {
    it("should accept domain starting with letter", () => {
      const result = domainSchema.safeParse("school")
      expect(result.success).toBe(true)
    })

    it("should accept domain starting with number", () => {
      const result = domainSchema.safeParse("123school")
      expect(result.success).toBe(true)
    })

    it("should reject domain starting with hyphen", () => {
      const result = domainSchema.safeParse("-school")
      expect(result.success).toBe(false)
    })

    it("should reject domain ending with hyphen", () => {
      const result = domainSchema.safeParse("school-")
      expect(result.success).toBe(false)
    })
  })

  describe("consecutive hyphen validation", () => {
    it("should accept single hyphens", () => {
      const result = domainSchema.safeParse("my-school-name")
      expect(result.success).toBe(true)
    })

    it("should reject consecutive hyphens", () => {
      const result = domainSchema.safeParse("my--school")
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.message.includes("consecutive"))
        ).toBe(true)
      }
    })

    it("should reject multiple consecutive hyphens", () => {
      const result = domainSchema.safeParse("my---school")
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================================
// Email Schema Tests
// ============================================================================

describe("emailSchema", () => {
  it("should accept valid email", () => {
    const result = emailSchema.safeParse("user@example.com")
    expect(result.success).toBe(true)
  })

  it("should accept email with subdomain", () => {
    const result = emailSchema.safeParse("user@mail.example.com")
    expect(result.success).toBe(true)
  })

  it("should accept email with plus sign", () => {
    const result = emailSchema.safeParse("user+tag@example.com")
    expect(result.success).toBe(true)
  })

  it("should reject invalid email format", () => {
    const result = emailSchema.safeParse("invalid-email")
    expect(result.success).toBe(false)
  })

  it("should reject email without domain", () => {
    const result = emailSchema.safeParse("user@")
    expect(result.success).toBe(false)
  })

  it("should reject email without local part", () => {
    const result = emailSchema.safeParse("@example.com")
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// URL Schema Tests
// ============================================================================

describe("urlSchema", () => {
  it("should accept valid URL", () => {
    const result = urlSchema.safeParse("https://example.com")
    expect(result.success).toBe(true)
  })

  it("should accept URL with path", () => {
    const result = urlSchema.safeParse("https://example.com/path/to/page")
    expect(result.success).toBe(true)
  })

  it("should accept empty string", () => {
    const result = urlSchema.safeParse("")
    expect(result.success).toBe(true)
  })

  it("should accept undefined (optional)", () => {
    const result = urlSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })

  it("should reject invalid URL", () => {
    const result = urlSchema.safeParse("not-a-url")
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Phone Schema Tests
// ============================================================================

describe("phoneSchema", () => {
  it("should accept phone with country code", () => {
    const result = phoneSchema.safeParse("+1 555-123-4567")
    expect(result.success).toBe(true)
  })

  it("should accept phone with parentheses", () => {
    const result = phoneSchema.safeParse("(555) 123-4567")
    expect(result.success).toBe(true)
  })

  it("should accept digits only", () => {
    const result = phoneSchema.safeParse("5551234567")
    expect(result.success).toBe(true)
  })

  it("should accept empty string", () => {
    const result = phoneSchema.safeParse("")
    expect(result.success).toBe(true)
  })

  it("should accept undefined (optional)", () => {
    const result = phoneSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })

  it("should reject phone with letters", () => {
    const result = phoneSchema.safeParse("555-CALL-ME")
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Enum Schema Tests
// ============================================================================

describe("schoolTypeSchema", () => {
  it("should accept primary", () => {
    expect(schoolTypeSchema.safeParse("primary").success).toBe(true)
  })

  it("should accept secondary", () => {
    expect(schoolTypeSchema.safeParse("secondary").success).toBe(true)
  })

  it("should accept both", () => {
    expect(schoolTypeSchema.safeParse("both").success).toBe(true)
  })

  it("should reject invalid type", () => {
    expect(schoolTypeSchema.safeParse("college").success).toBe(false)
  })
})

describe("schoolCategorySchema", () => {
  it("should accept all valid categories", () => {
    const categories = [
      "private",
      "public",
      "international",
      "technical",
      "special",
    ]
    categories.forEach((cat) => {
      expect(schoolCategorySchema.safeParse(cat).success).toBe(true)
    })
  })

  it("should reject invalid category", () => {
    expect(schoolCategorySchema.safeParse("charter").success).toBe(false)
  })
})

describe("currencySchema", () => {
  it("should accept all valid currencies", () => {
    const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"]
    currencies.forEach((currency) => {
      expect(currencySchema.safeParse(currency).success).toBe(true)
    })
  })

  it("should reject invalid currency", () => {
    expect(currencySchema.safeParse("JPY").success).toBe(false)
  })
})

describe("paymentScheduleSchema", () => {
  it("should accept all valid schedules", () => {
    const schedules = ["monthly", "quarterly", "semester", "annual"]
    schedules.forEach((schedule) => {
      expect(paymentScheduleSchema.safeParse(schedule).success).toBe(true)
    })
  })

  it("should reject invalid schedule", () => {
    expect(paymentScheduleSchema.safeParse("weekly").success).toBe(false)
  })
})

describe("borderRadiusSchema", () => {
  it("should accept all valid border radii", () => {
    const radii = ["none", "sm", "md", "lg", "xl", "full"]
    radii.forEach((radius) => {
      expect(borderRadiusSchema.safeParse(radius).success).toBe(true)
    })
  })

  it("should reject invalid radius", () => {
    expect(borderRadiusSchema.safeParse("2xl").success).toBe(false)
  })
})

describe("shadowSizeSchema", () => {
  it("should accept all valid shadow sizes", () => {
    const sizes = ["none", "sm", "md", "lg", "xl"]
    sizes.forEach((size) => {
      expect(shadowSizeSchema.safeParse(size).success).toBe(true)
    })
  })

  it("should reject invalid size", () => {
    expect(shadowSizeSchema.safeParse("2xl").success).toBe(false)
  })
})

// ============================================================================
// Title Step Validation Tests
// ============================================================================

describe("titleStepValidation", () => {
  it("should accept valid title data", () => {
    const data = createTitleStepData()
    const result = titleStepValidation.safeParse(data)
    expect(result.success).toBe(true)
  })

  it("should accept name with exactly 2 characters", () => {
    const result = titleStepValidation.safeParse({ name: "AB" })
    expect(result.success).toBe(true)
  })

  it("should accept name with 100 characters", () => {
    const result = titleStepValidation.safeParse({ name: "A".repeat(100) })
    expect(result.success).toBe(true)
  })

  it("should reject empty name", () => {
    const result = titleStepValidation.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("should reject name with less than 2 characters", () => {
    const result = titleStepValidation.safeParse({ name: "A" })
    expect(result.success).toBe(false)
  })

  it("should reject name with more than 100 characters", () => {
    const result = titleStepValidation.safeParse({ name: "A".repeat(101) })
    expect(result.success).toBe(false)
  })

  it("should reject missing name", () => {
    const result = titleStepValidation.safeParse({})
    expect(result.success).toBe(false)
  })

  it("should trim whitespace from name", () => {
    const result = titleStepValidation.safeParse({ name: "  Test School  " })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Test School")
    }
  })
})

// ============================================================================
// Description Step Validation Tests
// ============================================================================

describe("descriptionStepValidation", () => {
  it("should accept valid description data", () => {
    const data = createDescriptionStepData()
    const result = descriptionStepValidation.safeParse(data)
    expect(result.success).toBe(true)
  })

  it("should accept description with exactly 10 characters", () => {
    const result = descriptionStepValidation.safeParse({
      description: "1234567890",
    })
    expect(result.success).toBe(true)
  })

  it("should accept description with 500 characters", () => {
    const result = descriptionStepValidation.safeParse({
      description: "A".repeat(500),
    })
    expect(result.success).toBe(true)
  })

  it("should reject description with less than 10 characters", () => {
    const result = descriptionStepValidation.safeParse({
      description: "Short",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 10")
    }
  })

  it("should reject description with more than 500 characters", () => {
    const result = descriptionStepValidation.safeParse({
      description: "A".repeat(501),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("less than 500")
    }
  })

  it("should reject missing description", () => {
    const result = descriptionStepValidation.safeParse({})
    expect(result.success).toBe(false)
  })

  it("should accept optional schoolLevel", () => {
    const result = descriptionStepValidation.safeParse({
      description: "A valid description that is long enough",
      schoolLevel: "primary",
    })
    expect(result.success).toBe(true)
  })

  it("should accept optional schoolType", () => {
    const result = descriptionStepValidation.safeParse({
      description: "A valid description that is long enough",
      schoolType: "private",
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// Location Step Validation Tests
// ============================================================================

describe("locationStepValidation", () => {
  it("should accept valid location data", () => {
    const data = createLocationStepData()
    const result = locationStepValidation.safeParse(data)
    expect(result.success).toBe(true)
  })

  it("should require address", () => {
    const data = createLocationStepData()
    delete (data as any).address
    const result = locationStepValidation.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("should require city", () => {
    const data = createLocationStepData()
    delete (data as any).city
    const result = locationStepValidation.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("should require state", () => {
    const data = createLocationStepData()
    delete (data as any).state
    const result = locationStepValidation.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("should accept optional country", () => {
    const result = locationStepValidation.safeParse({
      address: "123 Main Street",
      city: "Test City",
      state: "Test State",
    })
    expect(result.success).toBe(true)
  })

  it("should reject address with less than 5 characters", () => {
    const result = locationStepValidation.safeParse({
      address: "123",
      city: "Test City",
      state: "Test State",
    })
    expect(result.success).toBe(false)
  })

  it("should reject city with less than 2 characters", () => {
    const result = locationStepValidation.safeParse({
      address: "123 Main Street",
      city: "A",
      state: "Test State",
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Capacity Step Validation Tests
// ============================================================================

describe("capacityStepValidation", () => {
  it("should accept valid capacity data", () => {
    const data = createCapacityStepData()
    const result = capacityStepValidation.safeParse(data)
    expect(result.success).toBe(true)
  })

  it("should require maxStudents", () => {
    const result = capacityStepValidation.safeParse({
      maxTeachers: 50,
    })
    expect(result.success).toBe(false)
  })

  it("should require maxTeachers", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: 500,
    })
    expect(result.success).toBe(false)
  })

  it("should accept optional maxClasses", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: 500,
      maxTeachers: 50,
      maxClasses: 20,
    })
    expect(result.success).toBe(true)
  })

  it("should accept minimum maxStudents (1)", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: 1,
      maxTeachers: 1,
    })
    expect(result.success).toBe(true)
  })

  it("should accept maximum maxStudents (10000)", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: 10000,
      maxTeachers: 1,
    })
    expect(result.success).toBe(true)
  })

  it("should reject maxStudents less than 1", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: 0,
      maxTeachers: 1,
    })
    expect(result.success).toBe(false)
  })

  it("should reject maxStudents greater than 10000", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: 10001,
      maxTeachers: 1,
    })
    expect(result.success).toBe(false)
  })

  it("should reject negative maxStudents", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: -1,
      maxTeachers: 1,
    })
    expect(result.success).toBe(false)
  })

  it("should reject non-integer maxStudents", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: 500.5,
      maxTeachers: 50,
    })
    expect(result.success).toBe(false)
  })

  it("should accept maximum maxTeachers (1000)", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: 100,
      maxTeachers: 1000,
    })
    expect(result.success).toBe(true)
  })

  it("should reject maxTeachers greater than 1000", () => {
    const result = capacityStepValidation.safeParse({
      maxStudents: 100,
      maxTeachers: 1001,
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Price Step Validation Tests
// ============================================================================

describe("priceStepValidation", () => {
  it("should accept valid price data", () => {
    const data = createPriceStepData()
    const result = priceStepValidation.safeParse(data)
    expect(result.success).toBe(true)
  })

  it("should require tuitionFee", () => {
    const result = priceStepValidation.safeParse({
      currency: "USD",
      paymentSchedule: "annual",
    })
    expect(result.success).toBe(false)
  })

  it("should require currency", () => {
    const result = priceStepValidation.safeParse({
      tuitionFee: 5000,
      paymentSchedule: "annual",
    })
    expect(result.success).toBe(false)
  })

  it("should require paymentSchedule", () => {
    const result = priceStepValidation.safeParse({
      tuitionFee: 5000,
      currency: "USD",
    })
    expect(result.success).toBe(false)
  })

  it("should accept tuitionFee of 0", () => {
    const result = priceStepValidation.safeParse({
      tuitionFee: 0,
      currency: "USD",
      paymentSchedule: "annual",
    })
    expect(result.success).toBe(true)
  })

  it("should reject negative tuitionFee", () => {
    const result = priceStepValidation.safeParse({
      tuitionFee: -100,
      currency: "USD",
      paymentSchedule: "annual",
    })
    expect(result.success).toBe(false)
  })

  it("should reject tuitionFee greater than 100000", () => {
    const result = priceStepValidation.safeParse({
      tuitionFee: 100001,
      currency: "USD",
      paymentSchedule: "annual",
    })
    expect(result.success).toBe(false)
  })

  it("should accept optional registrationFee", () => {
    const result = priceStepValidation.safeParse({
      tuitionFee: 5000,
      registrationFee: 100,
      currency: "USD",
      paymentSchedule: "annual",
    })
    expect(result.success).toBe(true)
  })

  it("should reject registrationFee greater than 10000", () => {
    const result = priceStepValidation.safeParse({
      tuitionFee: 5000,
      registrationFee: 10001,
      currency: "USD",
      paymentSchedule: "annual",
    })
    expect(result.success).toBe(false)
  })

  it("should accept optional applicationFee", () => {
    const result = priceStepValidation.safeParse({
      tuitionFee: 5000,
      applicationFee: 50,
      currency: "USD",
      paymentSchedule: "annual",
    })
    expect(result.success).toBe(true)
  })

  it("should reject applicationFee greater than 1000", () => {
    const result = priceStepValidation.safeParse({
      tuitionFee: 5000,
      applicationFee: 1001,
      currency: "USD",
      paymentSchedule: "annual",
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Legal Step Validation Tests
// ============================================================================

describe("legalStepValidation", () => {
  it("should accept all terms accepted", () => {
    const data = createLegalStepData()
    const result = legalStepValidation.safeParse(data)
    expect(result.success).toBe(true)
  })

  it("should reject if termsAccepted is false", () => {
    const result = legalStepValidation.safeParse({
      termsAccepted: false,
      privacyAccepted: true,
      dataProcessingAccepted: true,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("terms")
    }
  })

  it("should reject if privacyAccepted is false", () => {
    const result = legalStepValidation.safeParse({
      termsAccepted: true,
      privacyAccepted: false,
      dataProcessingAccepted: true,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("privacy")
    }
  })

  it("should reject if dataProcessingAccepted is false", () => {
    const result = legalStepValidation.safeParse({
      termsAccepted: true,
      privacyAccepted: true,
      dataProcessingAccepted: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("data processing")
    }
  })

  it("should reject if any field is missing", () => {
    const result = legalStepValidation.safeParse({
      termsAccepted: true,
      privacyAccepted: true,
    })
    expect(result.success).toBe(false)
  })

  it("should reject all false values", () => {
    const result = legalStepValidation.safeParse({
      termsAccepted: false,
      privacyAccepted: false,
      dataProcessingAccepted: false,
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Branding Step Validation Tests
// ============================================================================

describe("brandingStepValidation", () => {
  it("should accept valid branding data", () => {
    const data = createBrandingStepData()
    const result = brandingStepValidation.safeParse(data)
    expect(result.success).toBe(true)
  })

  it("should accept empty object (all fields optional)", () => {
    const result = brandingStepValidation.safeParse({})
    expect(result.success).toBe(true)
  })

  it("should accept valid hex color", () => {
    const result = brandingStepValidation.safeParse({
      primaryColor: "#FF5733",
    })
    expect(result.success).toBe(true)
  })

  it("should accept lowercase hex color", () => {
    const result = brandingStepValidation.safeParse({
      primaryColor: "#ff5733",
    })
    expect(result.success).toBe(true)
  })

  it("should reject invalid hex color", () => {
    const result = brandingStepValidation.safeParse({
      primaryColor: "not-a-hex",
    })
    expect(result.success).toBe(false)
  })

  it("should reject 3-character hex color", () => {
    const result = brandingStepValidation.safeParse({
      primaryColor: "#FFF",
    })
    expect(result.success).toBe(false)
  })

  it("should accept valid logo URL", () => {
    const result = brandingStepValidation.safeParse({
      logo: "https://example.com/logo.png",
    })
    expect(result.success).toBe(true)
  })

  it("should accept empty logo", () => {
    const result = brandingStepValidation.safeParse({
      logo: "",
    })
    expect(result.success).toBe(true)
  })

  it("should reject invalid logo URL", () => {
    const result = brandingStepValidation.safeParse({
      logo: "not-a-url",
    })
    expect(result.success).toBe(false)
  })

  it("should accept valid borderRadius", () => {
    const result = brandingStepValidation.safeParse({
      borderRadius: "md",
    })
    expect(result.success).toBe(true)
  })

  it("should accept valid shadow", () => {
    const result = brandingStepValidation.safeParse({
      shadow: "lg",
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// validateStep Helper Function Tests
// ============================================================================

describe("validateStep", () => {
  it("should validate title step correctly", () => {
    const result = validateStep("title", { name: "Test School" })
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it("should return errors for invalid title step", () => {
    const result = validateStep("title", { name: "" })
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveProperty("name")
  })

  it("should validate description step correctly", () => {
    const result = validateStep("description", {
      description:
        "A valid description that meets the minimum length requirement",
    })
    expect(result.isValid).toBe(true)
  })

  it("should validate location step correctly", () => {
    const result = validateStep("location", {
      address: "123 Main Street",
      city: "Test City",
      state: "Test State",
    })
    expect(result.isValid).toBe(true)
  })

  it("should validate capacity step correctly", () => {
    const result = validateStep("capacity", {
      maxStudents: 500,
      maxTeachers: 50,
    })
    expect(result.isValid).toBe(true)
  })

  it("should validate price step correctly", () => {
    const result = validateStep("price", {
      tuitionFee: 5000,
      currency: "USD",
      paymentSchedule: "annual",
    })
    expect(result.isValid).toBe(true)
  })

  it("should validate legal step correctly", () => {
    const result = validateStep("legal", {
      termsAccepted: true,
      privacyAccepted: true,
      dataProcessingAccepted: true,
    })
    expect(result.isValid).toBe(true)
  })

  it("should validate branding step with empty data", () => {
    const result = validateStep("branding", {})
    expect(result.isValid).toBe(true)
  })

  it("should handle unknown steps with partial validation", () => {
    const result = validateStep("unknown-step" as any, { name: "Test" })
    expect(result.isValid).toBe(true)
  })
})

// ============================================================================
// getRequiredFieldsForStep Helper Function Tests
// ============================================================================

describe("getRequiredFieldsForStep", () => {
  it("should return required fields for title step", () => {
    const fields = getRequiredFieldsForStep("title")
    expect(fields).toEqual(["name"])
  })

  it("should return required fields for description step", () => {
    const fields = getRequiredFieldsForStep("description")
    expect(fields).toEqual(["description"])
  })

  it("should return required fields for location step", () => {
    const fields = getRequiredFieldsForStep("location")
    expect(fields).toEqual(["address", "city", "state"])
  })

  it("should return required fields for capacity step", () => {
    const fields = getRequiredFieldsForStep("capacity")
    expect(fields).toEqual(["maxStudents", "maxTeachers"])
  })

  it("should return required fields for price step", () => {
    const fields = getRequiredFieldsForStep("price")
    expect(fields).toEqual(["tuitionFee", "currency", "paymentSchedule"])
  })

  it("should return required fields for legal step", () => {
    const fields = getRequiredFieldsForStep("legal")
    expect(fields).toEqual([
      "termsAccepted",
      "privacyAccepted",
      "dataProcessingAccepted",
    ])
  })

  it("should return empty array for branding step", () => {
    const fields = getRequiredFieldsForStep("branding")
    expect(fields).toEqual([])
  })

  it("should return empty array for unknown step", () => {
    const fields = getRequiredFieldsForStep("unknown" as any)
    expect(fields).toEqual([])
  })
})

// ============================================================================
// i18n Schema Factory Tests
// ============================================================================

describe("i18n Schema Factories", () => {
  describe("createDomainSchema", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createDomainSchema(mockDictionary)
      const result = schema.safeParse("ab")
      expect(result.success).toBe(false)
    })

    it("should validate domain correctly", () => {
      const schema = createDomainSchema(mockDictionary)
      const result = schema.safeParse("valid-domain")
      expect(result.success).toBe(true)
    })
  })

  describe("createEmailSchema", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createEmailSchema(mockDictionary)
      const result = schema.safeParse("invalid")
      expect(result.success).toBe(false)
    })

    it("should validate email correctly", () => {
      const schema = createEmailSchema(mockDictionary)
      const result = schema.safeParse("valid@example.com")
      expect(result.success).toBe(true)
    })
  })

  describe("createTitleStepValidation", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createTitleStepValidation(mockDictionary)
      const result = schema.safeParse({ name: "Valid School Name" })
      expect(result.success).toBe(true)
    })

    it("should reject short name with localized message", () => {
      const schema = createTitleStepValidation(mockDictionary)
      const result = schema.safeParse({ name: "A" })
      expect(result.success).toBe(false)
    })
  })

  describe("createDescriptionStepValidation", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createDescriptionStepValidation(mockDictionary)
      const result = schema.safeParse({
        description: "A valid description that meets the minimum requirements",
      })
      expect(result.success).toBe(true)
    })

    it("should reject short description", () => {
      const schema = createDescriptionStepValidation(mockDictionary)
      const result = schema.safeParse({ description: "Short" })
      expect(result.success).toBe(false)
    })
  })

  describe("createLocationStepValidation", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createLocationStepValidation(mockDictionary)
      const result = schema.safeParse({
        address: "123 Main Street",
        city: "Test City",
        state: "Test State",
      })
      expect(result.success).toBe(true)
    })

    it("should reject missing required fields", () => {
      const schema = createLocationStepValidation(mockDictionary)
      const result = schema.safeParse({ address: "123 Main Street" })
      expect(result.success).toBe(false)
    })
  })

  describe("createCapacityStepValidation", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createCapacityStepValidation(mockDictionary)
      const result = schema.safeParse({
        maxStudents: 500,
        maxTeachers: 50,
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid capacity", () => {
      const schema = createCapacityStepValidation(mockDictionary)
      const result = schema.safeParse({
        maxStudents: -1,
        maxTeachers: 50,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createPriceStepValidation", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createPriceStepValidation(mockDictionary)
      const result = schema.safeParse({
        tuitionFee: 5000,
        currency: "USD",
        paymentSchedule: "annual",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid price", () => {
      const schema = createPriceStepValidation(mockDictionary)
      const result = schema.safeParse({
        tuitionFee: -100,
        currency: "USD",
        paymentSchedule: "annual",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createLegalStepValidation", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createLegalStepValidation(mockDictionary)
      const result = schema.safeParse({
        termsAccepted: true,
        privacyAccepted: true,
        dataProcessingAccepted: true,
      })
      expect(result.success).toBe(true)
    })

    it("should reject unaccepted terms", () => {
      const schema = createLegalStepValidation(mockDictionary)
      const result = schema.safeParse({
        termsAccepted: false,
        privacyAccepted: true,
        dataProcessingAccepted: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createBrandingStepValidation", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createBrandingStepValidation(mockDictionary)
      const result = schema.safeParse({
        primaryColor: "#FF5733",
        borderRadius: "md",
      })
      expect(result.success).toBe(true)
    })

    it("should accept empty object", () => {
      const schema = createBrandingStepValidation(mockDictionary)
      const result = schema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe("createOnboardingValidation", () => {
    it("should create full validation schema", () => {
      const schema = createOnboardingValidation(mockDictionary)
      const result = schema.safeParse({
        name: "Test School",
        description: "A valid description for testing",
        maxStudents: 500,
      })
      expect(result.success).toBe(true)
    })
  })
})

// ============================================================================
// Edge Cases and Boundary Tests
// ============================================================================

describe("Edge Cases", () => {
  describe("whitespace handling", () => {
    it("should trim whitespace from name in title step", () => {
      const result = titleStepValidation.safeParse({ name: "  Test School  " })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Test School")
      }
    })

    it("should trim whitespace from description", () => {
      const result = descriptionStepValidation.safeParse({
        description: "  A valid description that is long enough  ",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe(
          "A valid description that is long enough"
        )
      }
    })
  })

  describe("boundary values", () => {
    it("should accept maxStudents at exactly 10000", () => {
      const result = capacityStepValidation.safeParse({
        maxStudents: 10000,
        maxTeachers: 1,
      })
      expect(result.success).toBe(true)
    })

    it("should accept tuitionFee at exactly 100000", () => {
      const result = priceStepValidation.safeParse({
        tuitionFee: 100000,
        currency: "USD",
        paymentSchedule: "annual",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("special characters", () => {
    it("should accept school name with special characters", () => {
      const result = titleStepValidation.safeParse({
        name: "St. Mary's Academy & School",
      })
      expect(result.success).toBe(true)
    })

    it("should accept description with unicode", () => {
      const result = descriptionStepValidation.safeParse({
        description:
          "A school with international students from around the world.",
      })
      expect(result.success).toBe(true)
    })

    it("should accept address with apartment number", () => {
      const result = locationStepValidation.safeParse({
        address: "123 Main Street, Suite 456",
        city: "Test City",
        state: "Test State",
      })
      expect(result.success).toBe(true)
    })
  })
})
