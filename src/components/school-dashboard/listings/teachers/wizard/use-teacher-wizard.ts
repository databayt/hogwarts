// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getTeacherForWizard } from "./actions"

export interface TeacherWizardData {
  id: string
  schoolId: string
  nameFormat: string
  firstName: string
  lastName: string
  gender: string | null
  nationality: string | null
  emailAddress: string
  birthDate: Date | null
  profilePhotoUrl: string | null
  employeeId: string | null
  joiningDate: Date | null
  employmentStatus: string
  employmentType: string
  contractStartDate: Date | null
  contractEndDate: Date | null
  currentAddress: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  wizardStep: string | null
  phoneNumbers: {
    id: string
    phoneNumber: string
    phoneType: string
    isPrimary: boolean
  }[]
  qualifications: {
    id: string
    qualificationType: string
    name: string
    institution: string | null
    major: string | null
    dateObtained: Date
    expiryDate: Date | null
    licenseNumber: string | null
    documentUrl: string | null
  }[]
  experiences: {
    id: string
    institution: string
    position: string
    startDate: Date
    endDate: Date | null
    isCurrent: boolean
    description: string | null
  }[]
  subjectExpertise: {
    id: string
    subjectId: string
    expertiseLevel: string
    subject: { id: string; name: string }
  }[]
}

/**
 * What `getTeacherForWizard` returns for a row `createDraftTeacher` has just
 * written — the wizard opens on this while the INSERT is still in flight.
 * The email is a placeholder of the same kind the server stamps; the steps
 * treat any `@draft.internal` address as empty.
 */
export function emptyTeacherDraft(
  id: string,
  nameFormat: string
): TeacherWizardData {
  return {
    id,
    schoolId: "",
    nameFormat,
    firstName: "",
    lastName: "",
    gender: null,
    nationality: null,
    emailAddress: `draft-${id.slice(-8)}@draft.internal`,
    birthDate: null,
    profilePhotoUrl: null,
    employeeId: null,
    joiningDate: null,
    employmentStatus: "ACTIVE",
    employmentType: "FULL_TIME",
    contractStartDate: null,
    contractEndDate: null,
    currentAddress: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    wizardStep: "information",
    phoneNumbers: [],
    qualifications: [],
    experiences: [],
    subjectExpertise: [],
  }
}

export const {
  Provider: TeacherWizardProvider,
  useWizardData: useTeacherWizard,
} = createWizardProvider<TeacherWizardData>("Teacher", {
  loadFn: getTeacherForWizard,
})
