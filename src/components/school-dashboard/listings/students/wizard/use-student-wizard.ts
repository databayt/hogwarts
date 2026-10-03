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
  academicStreamId: string | null
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

/**
 * What `getStudentForWizard` returns for a row `createDraftStudent` has just
 * written (its stub DOB and gender, the schema defaults) — the wizard opens
 * on this while the INSERT is still in flight.
 */
export function emptyStudentDraft(
  id: string,
  nameFormat: string
): StudentWizardData {
  return {
    id,
    schoolId: "",
    nameFormat,
    firstName: "",
    middleName: null,
    lastName: "",
    dateOfBirth: new Date("2000-01-01"),
    gender: "male",
    nationality: "SD",
    profilePhotoUrl: null,
    email: null,
    mobileNumber: null,
    alternatePhone: null,
    currentAddress: null,
    city: null,
    state: null,
    postalCode: null,
    country: "SD",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    enrollmentDate: new Date(),
    admissionNumber: null,
    status: "ACTIVE",
    studentType: "REGULAR",
    category: null,
    academicGradeId: null,
    academicStreamId: null,
    sectionId: null,
    medicalConditions: null,
    allergies: null,
    medicationRequired: null,
    doctorName: null,
    doctorContact: null,
    insuranceProvider: null,
    insuranceNumber: null,
    bloodGroup: null,
    previousSchoolName: null,
    previousSchoolAddress: null,
    previousGrade: null,
    transferCertificateNo: null,
    transferDate: null,
    previousAcademicRecord: null,
    guardians: [],
    applicationId: null,
    application: null,
    wizardStep: "attachments",
  }
}

export const {
  Provider: StudentWizardProvider,
  useWizardData: useStudentWizard,
} = createWizardProvider<StudentWizardData>("Student", {
  loadFn: getStudentForWizard,
})
