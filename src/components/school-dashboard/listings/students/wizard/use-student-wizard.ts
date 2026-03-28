// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getStudentForWizard } from "./actions"

export interface StudentWizardData {
  id: string
  schoolId: string
  // School config
  nameFormat: string
  // Personal
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: Date
  gender: string
  nationality: string | null
  profilePhotoUrl: string | null
  // Contact
  email: string | null
  mobileNumber: string | null
  alternatePhone: string | null
  currentAddress: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  // Emergency
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelation: string | null
  // Enrollment
  enrollmentDate: Date
  admissionNumber: string | null
  status: string
  studentType: string
  category: string | null
  academicGradeId: string | null
  sectionId: string | null
  // Health
  medicalConditions: string | null
  allergies: string | null
  medicationRequired: string | null
  doctorName: string | null
  doctorContact: string | null
  insuranceProvider: string | null
  insuranceNumber: string | null
  bloodGroup: string | null
  // Previous Education
  previousSchoolName: string | null
  previousSchoolAddress: string | null
  previousGrade: string | null
  transferCertificateNo: string | null
  transferDate: Date | null
  previousAcademicRecord: string | null
  // Guardians
  guardians: Array<{
    guardianId: string
    firstName: string
    lastName: string
    typeName: string
    isPrimary: boolean
    phone: string | null
    email: string | null
    occupation: string | null
  }>
  // Admission back-reference
  applicationId: string | null
  application: {
    applicationNumber: string
    campaignId: string
    status: string
    submittedAt: Date | null
    confirmationDate: Date | null
    campaign: { name: string; academicYear: string }
  } | null
  // AI auto-fill results from document extraction
  autoFillResults?: {
    personal?: Record<string, string>
    contact?: Record<string, string>
    previousEducation?: Record<string, string>
  }
  // Wizard
  wizardStep: string | null
}

export const {
  Provider: StudentWizardProvider,
  useWizardData: useStudentWizard,
} = createWizardProvider<StudentWizardData>("Student", {
  loadFn: getStudentForWizard,
})
