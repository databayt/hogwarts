// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Apply Block Types
// Re-exports and extensions of admission types

import type { ApplyStep } from "./config.client"

// Re-export core types from admission
export type {
  ApplicationFormData,
  DocumentUpload,
  PublicCampaign,
  RequiredDocument,
  EligibilityCriteria,
  ApplicationSession,
  ActionResult,
  SubmitApplicationResult,
  GradeMapping,
} from "@/components/school-marketing/admission/types"

export {
  DEFAULT_GRADES,
  suggestGradeFromDOB,
} from "@/components/school-marketing/admission/types"

// Apply-specific types

export interface ApplyFormRef {
  saveAndNext: () => Promise<void>
}

export interface ApplyStepProps {
  dictionary?: Record<string, unknown>
  sessionToken?: string
  campaignId?: string
  subdomain?: string
  initialData?: Partial<ApplicationStepData>
  onSuccess?: () => void
}

export interface ApplyContentProps {
  dictionary?: Record<string, unknown>
}

// Per-step data types
export interface AttachmentsStepData {
  profilePhotoUrl?: string
  degreeUrl?: string
  transcriptUrl?: string
  idUrl?: string
  resumeUrl?: string
  otherUrl?: string
}

export interface PersonalStepData {
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: "MALE" | "FEMALE" | "OTHER"
  nationality: string
  religion?: string
  category?: string
}

export interface ContactStepData {
  email: string
  phone: string
  alternatePhone?: string
}

export interface LocationStepData {
  address: string
  city: string
  state: string
  postalCode?: string
  country: string
}

export interface GuardianStepData {
  fatherName: string
  fatherOccupation?: string
  fatherPhone?: string
  fatherEmail?: string
  motherName: string
  motherOccupation?: string
  motherPhone?: string
  motherEmail?: string
  guardianName?: string
  guardianRelation?: string
  guardianPhone?: string
  guardianEmail?: string
}

export interface AcademicStepData {
  previousSchool?: string
  previousClass?: string
  previousMarks?: string
  previousPercentage?: string
  achievements?: string
  applyingForClass: string
  preferredStream?: string
  secondLanguage?: string
  thirdLanguage?: string
}

export type ApplicationStepData =
  | AttachmentsStepData
  | PersonalStepData
  | ContactStepData
  | LocationStepData
  | GuardianStepData
  | AcademicStepData

// Session state for context
export interface ApplySessionState {
  sessionToken: string | null
  campaignId: string | null
  formData: Partial<{
    attachments: AttachmentsStepData
    personal: PersonalStepData
    contact: ContactStepData
    location: LocationStepData
    guardian: GuardianStepData
    academic: AcademicStepData
  }>
  currentStep: ApplyStep
  lastSaved: Date | null
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
}
