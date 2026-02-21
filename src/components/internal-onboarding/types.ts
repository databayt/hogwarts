import type { OnboardingRole, OnboardingStep } from "./config"

// =============================================================================
// FORM DATA TYPES (per-step)
// =============================================================================

export interface PersonalStepData {
  givenName: string
  middleName?: string
  surname: string
  dateOfBirth: string
  gender: string
  nationality?: string
  profilePhotoUrl?: string
}

export interface ContactStepData {
  email: string
  emailVerified: boolean
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
}

// Teacher-specific
export interface TeacherDetailsData {
  subjects: string[]
  yearsOfExperience?: number
  employmentType: string
  qualificationName?: string
  qualificationInstitution?: string
  qualificationYear?: string
}

// Staff-specific
export interface StaffDetailsData {
  departmentId?: string
  position: string
  employmentType: string
  qualificationName?: string
  qualificationInstitution?: string
  qualificationYear?: string
}

// Admin-specific
export interface AdminDetailsData {
  departmentId?: string
  position: string
  administrativeArea: string
}

// Student-specific
export interface StudentDetailsData {
  gradeLevel: string
  previousSchool?: string
  previousGrade?: string
  studentType: string
}

export type RoleDetailsData =
  | TeacherDetailsData
  | StaffDetailsData
  | AdminDetailsData
  | StudentDetailsData

export interface DocumentUpload {
  type: string
  name: string
  url: string
  uploadedAt: string
}

export interface DocumentsStepData {
  documents: DocumentUpload[]
}

// =============================================================================
// COMBINED FORM DATA
// =============================================================================

export interface OnboardingFormData {
  personal?: PersonalStepData
  contact?: ContactStepData
  roleDetails?: RoleDetailsData
  documents?: DocumentsStepData
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

export interface OnboardingState {
  role: OnboardingRole | null
  currentStep: OnboardingStep
  formData: OnboardingFormData
  applicationData: ApplicationAutoFillData | null
  isLoading: boolean
  error: string | null
}

export interface ApplicationAutoFillData {
  firstName?: string
  middleName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: string
  nationality?: string
  photoUrl?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  applyingForClass?: string
  previousSchool?: string
  previousClass?: string
  documents?: DocumentUpload[]
}

// =============================================================================
// ACTION TYPES
// =============================================================================

export interface SubmitOnboardingResult {
  success: boolean
  error?: string
  data?: {
    userId: string
    status: "pending_approval"
  }
}

export interface CheckApplicationResult {
  success: boolean
  found: boolean
  data?: ApplicationAutoFillData
  error?: string
}
