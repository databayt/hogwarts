// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getTeacherForWizard } from "./actions"

export interface TeacherWizardData {
  id: string
  schoolId: string
  givenName: string
  surname: string
  gender: string | null
  emailAddress: string
  birthDate: Date | null
  profilePhotoUrl: string | null
  employeeId: string | null
  joiningDate: Date | null
  employmentStatus: string
  employmentType: string
  contractStartDate: Date | null
  contractEndDate: Date | null
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
    subject: { id: string; subjectName: string }
  }[]
}

export const {
  Provider: TeacherWizardProvider,
  useWizardData: useTeacherWizard,
} = createWizardProvider<TeacherWizardData>("Teacher", {
  loadFn: getTeacherForWizard,
})
