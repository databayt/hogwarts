/**
 * Shared validation helpers for apply steps
 * Centralized validation logic to reduce duplication across step content components
 */

import type {
  AcademicStepData,
  ContactStepData,
  DocumentsStepData,
  GuardianStepData,
  PersonalStepData,
} from "./types"

/**
 * Validate personal step data
 * Required: firstName, lastName, dateOfBirth, gender, nationality
 */
export function validatePersonalStep(
  data: PersonalStepData | undefined
): boolean {
  if (!data) return false
  return !!(
    data.firstName &&
    data.lastName &&
    data.dateOfBirth &&
    data.gender &&
    data.nationality
  )
}

/**
 * Validate contact step data
 * Required: email, phone, address, city, state, country
 */
export function validateContactStep(
  data: ContactStepData | undefined
): boolean {
  if (!data) return false
  return !!(
    data.email &&
    data.phone &&
    data.address &&
    data.city &&
    data.state &&
    data.country
  )
}

/**
 * Validate guardian step data
 * Required: fatherName, motherName
 */
export function validateGuardianStep(
  data: GuardianStepData | undefined
): boolean {
  if (!data) return false
  return !!(data.fatherName && data.motherName)
}

/**
 * Validate academic step data
 * Required: applyingForClass
 */
export function validateAcademicStep(
  data: AcademicStepData | undefined
): boolean {
  if (!data) return false
  return !!data.applyingForClass
}

/**
 * Validate documents step data
 * Optional - allows proceeding without uploads
 */
export function validateDocumentsStep(
  data: DocumentsStepData | undefined
): boolean {
  // Documents are optional, so always valid
  return true
}

/**
 * Check if all required steps are complete for review
 */
export function validateAllSteps(formData: {
  personal?: PersonalStepData
  contact?: ContactStepData
  guardian?: GuardianStepData
  academic?: AcademicStepData
  documents?: DocumentsStepData
}): boolean {
  return (
    validatePersonalStep(formData.personal) &&
    validateContactStep(formData.contact) &&
    validateGuardianStep(formData.guardian) &&
    validateAcademicStep(formData.academic) &&
    validateDocumentsStep(formData.documents)
  )
}

/**
 * Get validation status for each step
 */
export function getStepValidationStatus(formData: {
  personal?: PersonalStepData
  contact?: ContactStepData
  guardian?: GuardianStepData
  academic?: AcademicStepData
  documents?: DocumentsStepData
}): Record<string, boolean> {
  return {
    personal: validatePersonalStep(formData.personal),
    contact: validateContactStep(formData.contact),
    guardian: validateGuardianStep(formData.guardian),
    academic: validateAcademicStep(formData.academic),
    documents: validateDocumentsStep(formData.documents),
  }
}

/**
 * Email validation helper
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Phone validation helper (basic)
 */
export function isValidPhone(phone: string): boolean {
  // Basic validation - at least 8 digits
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 8
}

/**
 * Date validation helper
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Age validation helper
 * Returns age in years from date of birth
 */
export function getAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
