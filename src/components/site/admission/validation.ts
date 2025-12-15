// Public Admission Portal Validation Schemas

import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"

// ============================================
// Helper Functions
// ============================================

function getValidationMessages(_dictionary?: Dictionary) {
  // Note: admission dictionary keys are not yet added to the Dictionary type
  // Using default messages until they are added
  return {
    required: () => "This field is required",
    invalidEmail: () => "Please enter a valid email address",
    invalidPhone: () => "Please enter a valid phone number",
    minLength: (min: number) => `Must be at least ${min} characters`,
    maxLength: (max: number) => `Must be at most ${max} characters`,
    invalidDate: () => "Please enter a valid date",
    futureDateNotAllowed: () => "Date cannot be in the future",
  }
}

// ============================================
// Application Form Step Schemas
// ============================================

export function createApplicationStepSchemas(dictionary?: Dictionary) {
  const v = getValidationMessages(dictionary)

  return {
    // Step 1: Campaign Selection
    campaign: z.object({
      campaignId: z.string().min(1, v.required()),
    }),

    // Step 2: Personal Information
    personal: z.object({
      firstName: z.string().min(1, v.required()).max(50, v.maxLength(50)),
      middleName: z
        .string()
        .max(50, v.maxLength(50))
        .optional()
        .or(z.literal("")),
      lastName: z.string().min(1, v.required()).max(50, v.maxLength(50)),
      dateOfBirth: z.string().min(1, v.required()),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]),
      nationality: z.string().min(1, v.required()),
      religion: z.string().optional().or(z.literal("")),
      category: z.string().optional().or(z.literal("")),
    }),

    // Step 3: Contact Information
    contact: z.object({
      email: z.string().email(v.invalidEmail()),
      phone: z.string().min(10, v.invalidPhone()),
      alternatePhone: z
        .string()
        .min(10, v.invalidPhone())
        .optional()
        .or(z.literal("")),
      address: z.string().min(1, v.required()),
      city: z.string().min(1, v.required()),
      state: z.string().min(1, v.required()),
      postalCode: z.string().min(1, v.required()),
      country: z.string().default("Sudan"),
    }),

    // Step 4: Guardian Information
    guardian: z.object({
      fatherName: z.string().min(1, v.required()),
      fatherOccupation: z.string().optional().or(z.literal("")),
      fatherPhone: z.string().optional().or(z.literal("")),
      fatherEmail: z
        .string()
        .email(v.invalidEmail())
        .optional()
        .or(z.literal("")),
      motherName: z.string().min(1, v.required()),
      motherOccupation: z.string().optional().or(z.literal("")),
      motherPhone: z.string().optional().or(z.literal("")),
      motherEmail: z
        .string()
        .email(v.invalidEmail())
        .optional()
        .or(z.literal("")),
      guardianName: z.string().optional().or(z.literal("")),
      guardianRelation: z.string().optional().or(z.literal("")),
      guardianPhone: z.string().optional().or(z.literal("")),
      guardianEmail: z
        .string()
        .email(v.invalidEmail())
        .optional()
        .or(z.literal("")),
    }),

    // Step 5: Academic Information
    academic: z.object({
      previousSchool: z.string().optional().or(z.literal("")),
      previousClass: z.string().optional().or(z.literal("")),
      previousMarks: z.string().optional().or(z.literal("")),
      previousPercentage: z.string().optional().or(z.literal("")),
      achievements: z.string().optional().or(z.literal("")),
      applyingForClass: z.string().min(1, v.required()),
      preferredStream: z.string().optional().or(z.literal("")),
      secondLanguage: z.string().optional().or(z.literal("")),
      thirdLanguage: z.string().optional().or(z.literal("")),
    }),

    // Step 6: Documents
    documents: z.object({
      photoUrl: z.string().optional().or(z.literal("")),
      signatureUrl: z.string().optional().or(z.literal("")),
      documents: z
        .array(
          z.object({
            type: z.string(),
            name: z.string(),
            url: z.string(),
            uploadedAt: z.string(),
          })
        )
        .optional(),
    }),
  }
}

// Full application schema (all steps combined)
export function createFullApplicationSchema(dictionary?: Dictionary) {
  const steps = createApplicationStepSchemas(dictionary)
  return z.object({
    ...steps.campaign.shape,
    ...steps.personal.shape,
    ...steps.contact.shape,
    ...steps.guardian.shape,
    ...steps.academic.shape,
    ...steps.documents.shape,
  })
}

// ============================================
// Tour Booking Schema
// ============================================

export function createTourBookingSchema(dictionary?: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    slotId: z.string().min(1, v.required()),
    parentName: z.string().min(1, v.required()).max(100, v.maxLength(100)),
    email: z.string().email(v.invalidEmail()),
    phone: z.string().min(10, v.invalidPhone()).optional().or(z.literal("")),
    studentName: z
      .string()
      .max(100, v.maxLength(100))
      .optional()
      .or(z.literal("")),
    interestedGrade: z.string().optional().or(z.literal("")),
    specialRequests: z
      .string()
      .max(500, v.maxLength(500))
      .optional()
      .or(z.literal("")),
    numberOfAttendees: z.number().min(1).max(5).default(1),
  })
}

// ============================================
// Inquiry Form Schema
// ============================================

export function createInquirySchema(dictionary?: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    parentName: z.string().min(1, v.required()).max(100, v.maxLength(100)),
    email: z.string().email(v.invalidEmail()),
    phone: z.string().min(10, v.invalidPhone()).optional().or(z.literal("")),
    studentName: z
      .string()
      .max(100, v.maxLength(100))
      .optional()
      .or(z.literal("")),
    studentDOB: z.string().optional().or(z.literal("")),
    interestedGrade: z.string().optional().or(z.literal("")),
    source: z.string().optional().or(z.literal("")),
    message: z
      .string()
      .max(1000, v.maxLength(1000))
      .optional()
      .or(z.literal("")),
    subscribeNewsletter: z.boolean().default(false),
  })
}

// ============================================
// OTP Verification Schema
// ============================================

export function createOTPRequestSchema(dictionary?: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    applicationNumber: z.string().min(1, v.required()),
    email: z.string().email(v.invalidEmail()),
  })
}

export function createOTPVerifySchema(dictionary?: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    applicationNumber: z.string().min(1, v.required()),
    otp: z.string().length(6, "OTP must be 6 digits"),
  })
}

// ============================================
// Session Schema
// ============================================

export const sessionDataSchema = z.object({
  formData: z.record(z.string(), z.unknown()),
  currentStep: z.number().min(0).max(6),
  email: z.string().email(),
  campaignId: z.string().optional(),
})

// ============================================
// Type Exports
// ============================================

export type CampaignFormData = z.infer<
  ReturnType<typeof createApplicationStepSchemas>["campaign"]
>
export type PersonalFormData = z.infer<
  ReturnType<typeof createApplicationStepSchemas>["personal"]
>
export type ContactFormData = z.infer<
  ReturnType<typeof createApplicationStepSchemas>["contact"]
>
export type GuardianFormData = z.infer<
  ReturnType<typeof createApplicationStepSchemas>["guardian"]
>
export type AcademicFormData = z.infer<
  ReturnType<typeof createApplicationStepSchemas>["academic"]
>
export type DocumentsFormData = z.infer<
  ReturnType<typeof createApplicationStepSchemas>["documents"]
>
export type FullApplicationFormData = z.infer<
  ReturnType<typeof createFullApplicationSchema>
>
export type TourBookingFormData = z.infer<
  ReturnType<typeof createTourBookingSchema>
>
export type InquiryFormData = z.infer<ReturnType<typeof createInquirySchema>>
export type OTPRequestData = z.infer<ReturnType<typeof createOTPRequestSchema>>
export type OTPVerifyData = z.infer<ReturnType<typeof createOTPVerifySchema>>
