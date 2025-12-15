/**
 * School Mock Factories
 *
 * Provides factory functions to create mock school data for testing.
 * Uses faker for realistic test data generation.
 */

import { faker } from "@faker-js/faker"

import type {
  BorderRadius,
  Currency,
  OnboardingSchoolData,
  PaymentSchedule,
  SchoolCategory,
  SchoolType,
  ShadowSize,
} from "../../types"

// ============================================================================
// Type Constants for Random Selection
// ============================================================================

const SCHOOL_TYPES: SchoolType[] = ["primary", "secondary", "both"]
const SCHOOL_CATEGORIES: SchoolCategory[] = [
  "private",
  "public",
  "international",
  "technical",
  "special",
]
const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "CAD", "AUD"]
const PAYMENT_SCHEDULES: PaymentSchedule[] = [
  "monthly",
  "quarterly",
  "semester",
  "annual",
]
const BORDER_RADII: BorderRadius[] = ["none", "sm", "md", "lg", "xl", "full"]
const SHADOW_SIZES: ShadowSize[] = ["none", "sm", "md", "lg", "xl"]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Pick a random item from an array
 */
function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Generate a valid subdomain (lowercase, alphanumeric with hyphens)
 */
function generateValidDomain(): string {
  const prefix = faker.lorem.word({ length: { min: 3, max: 8 } }).toLowerCase()
  const suffix = faker.number.int({ min: 100, max: 999 })
  return `${prefix}${suffix}`
}

/**
 * Generate a valid hex color
 */
function generateHexColor(): string {
  return faker.color.rgb({ format: "hex" })
}

// ============================================================================
// Main Factory Functions
// ============================================================================

/**
 * Create a full mock school with all fields populated
 * @param overrides - Optional partial school data to override defaults
 */
export function createMockSchool(
  overrides: Partial<OnboardingSchoolData> = {}
): OnboardingSchoolData {
  const schoolId = faker.string.cuid()
  const createdAt = faker.date.past()

  return {
    id: schoolId,
    name: faker.company.name() + " School",
    description: faker.lorem.paragraph({ min: 2, max: 4 }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
    domain: generateValidDomain(),
    website: faker.internet.url(),
    logo: faker.image.url(),

    // Capacity
    maxStudents: faker.number.int({ min: 100, max: 5000 }),
    maxTeachers: faker.number.int({ min: 10, max: 500 }),
    maxClasses: faker.number.int({ min: 5, max: 200 }),
    maxFacilities: faker.number.int({ min: 1, max: 50 }),

    // School details
    schoolLevel: randomFrom(SCHOOL_TYPES),
    schoolType: randomFrom(SCHOOL_CATEGORIES),
    planType: faker.helpers.arrayElement(["basic", "pro", "enterprise"]),

    // Pricing
    tuitionFee: faker.number.int({ min: 1000, max: 50000 }),
    registrationFee: faker.number.int({ min: 50, max: 500 }),
    applicationFee: faker.number.int({ min: 10, max: 100 }),
    currency: randomFrom(CURRENCIES),
    paymentSchedule: randomFrom(PAYMENT_SCHEDULES),

    // Branding
    primaryColor: generateHexColor(),
    borderRadius: randomFrom(BORDER_RADII),
    shadow: randomFrom(SHADOW_SIZES),

    // Status
    draft: false,
    isPublished: true,
    isComplete: true,

    // Metadata
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),

    ...overrides,
  }
}

/**
 * Create a minimal mock school with only required fields
 * Useful for quick unit tests that don't need full data
 * @param overrides - Optional partial school data to override defaults
 */
export function createMinimalSchool(
  overrides: Partial<OnboardingSchoolData> = {}
): OnboardingSchoolData {
  return {
    id: faker.string.cuid(),
    name: faker.company.name() + " School",
    description: faker.lorem.sentence(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    maxStudents: faker.number.int({ min: 100, max: 1000 }),
    maxTeachers: faker.number.int({ min: 10, max: 100 }),
    tuitionFee: faker.number.int({ min: 1000, max: 10000 }),
    currency: "USD",
    paymentSchedule: "annual",
    ...overrides,
  }
}

/**
 * Create a draft school (incomplete onboarding state)
 * @param overrides - Optional partial school data to override defaults
 */
export function createDraftSchool(
  overrides: Partial<OnboardingSchoolData> = {}
): OnboardingSchoolData {
  return {
    id: faker.string.cuid(),
    name: faker.company.name() + " School",
    draft: true,
    isPublished: false,
    isComplete: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Create multiple mock schools
 * @param count - Number of schools to create
 * @param overrides - Optional partial school data to apply to all schools
 */
export function createMockSchools(
  count: number,
  overrides: Partial<OnboardingSchoolData> = {}
): OnboardingSchoolData[] {
  return Array.from({ length: count }, () => createMockSchool(overrides))
}

// ============================================================================
// Step-Specific Factories
// ============================================================================

/**
 * Create valid title step data
 */
export function createTitleStepData(overrides: { name?: string } = {}) {
  return {
    name: overrides.name ?? faker.company.name() + " Academy",
  }
}

/**
 * Create valid description step data
 */
export function createDescriptionStepData(
  overrides: Partial<{
    description: string
    schoolLevel: SchoolType
    schoolType: SchoolCategory
  }> = {}
) {
  return {
    description:
      overrides.description ?? faker.lorem.paragraph({ min: 2, max: 4 }),
    schoolLevel: overrides.schoolLevel ?? randomFrom(SCHOOL_TYPES),
    schoolType: overrides.schoolType ?? randomFrom(SCHOOL_CATEGORIES),
  }
}

/**
 * Create valid location step data
 */
export function createLocationStepData(
  overrides: Partial<{
    address: string
    city: string
    state: string
    country: string
  }> = {}
) {
  return {
    address: overrides.address ?? faker.location.streetAddress(),
    city: overrides.city ?? faker.location.city(),
    state: overrides.state ?? faker.location.state(),
    country: overrides.country ?? faker.location.country(),
  }
}

/**
 * Create valid capacity step data
 */
export function createCapacityStepData(
  overrides: Partial<{
    maxStudents: number
    maxTeachers: number
    maxClasses: number
  }> = {}
) {
  return {
    maxStudents:
      overrides.maxStudents ?? faker.number.int({ min: 100, max: 5000 }),
    maxTeachers:
      overrides.maxTeachers ?? faker.number.int({ min: 10, max: 500 }),
    maxClasses: overrides.maxClasses ?? faker.number.int({ min: 5, max: 200 }),
  }
}

/**
 * Create valid price step data
 */
export function createPriceStepData(
  overrides: Partial<{
    tuitionFee: number
    registrationFee: number
    applicationFee: number
    currency: Currency
    paymentSchedule: PaymentSchedule
  }> = {}
) {
  return {
    tuitionFee:
      overrides.tuitionFee ?? faker.number.int({ min: 1000, max: 50000 }),
    registrationFee:
      overrides.registrationFee ?? faker.number.int({ min: 50, max: 500 }),
    applicationFee:
      overrides.applicationFee ?? faker.number.int({ min: 10, max: 100 }),
    currency: overrides.currency ?? randomFrom(CURRENCIES),
    paymentSchedule: overrides.paymentSchedule ?? randomFrom(PAYMENT_SCHEDULES),
  }
}

/**
 * Create valid branding step data
 */
export function createBrandingStepData(
  overrides: Partial<{
    logo: string
    primaryColor: string
    borderRadius: BorderRadius
    shadow: ShadowSize
  }> = {}
) {
  return {
    logo: overrides.logo ?? faker.image.url(),
    primaryColor: overrides.primaryColor ?? generateHexColor(),
    borderRadius: overrides.borderRadius ?? randomFrom(BORDER_RADII),
    shadow: overrides.shadow ?? randomFrom(SHADOW_SIZES),
  }
}

/**
 * Create valid legal step data
 */
export function createLegalStepData(
  overrides: Partial<{
    termsAccepted: boolean
    privacyAccepted: boolean
    dataProcessingAccepted: boolean
  }> = {}
) {
  return {
    termsAccepted: overrides.termsAccepted ?? true,
    privacyAccepted: overrides.privacyAccepted ?? true,
    dataProcessingAccepted: overrides.dataProcessingAccepted ?? true,
  }
}

// ============================================================================
// Invalid Data Factories (for negative testing)
// ============================================================================

/**
 * Create invalid school data for testing validation errors
 */
export function createInvalidSchoolData() {
  return {
    name: "", // Too short
    description: "Short", // Less than 10 chars
    domain: "INVALID--DOMAIN", // Has consecutive hyphens, uppercase
    maxStudents: -1, // Negative
    maxTeachers: 0, // Zero not allowed
    tuitionFee: -100, // Negative
    primaryColor: "not-a-hex", // Invalid hex
  }
}

/**
 * Create school data with edge case values
 */
export function createEdgeCaseSchoolData() {
  return {
    name: "AB", // Exactly 2 chars (minimum)
    description: "1234567890", // Exactly 10 chars (minimum)
    domain: "abc", // Exactly 3 chars (minimum)
    maxStudents: 1, // Minimum
    maxTeachers: 1, // Minimum
    maxClasses: 1, // Minimum
    tuitionFee: 0, // Zero is valid
    primaryColor: "#000000", // Valid black
  }
}
