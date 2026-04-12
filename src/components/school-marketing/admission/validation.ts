// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
  email: z.string().email().or(z.literal("")),
  campaignId: z.string().optional(),
})

// ============================================
// Type Exports
// ============================================

export type TourBookingFormData = z.infer<
  ReturnType<typeof createTourBookingSchema>
>
export type InquiryFormData = z.infer<ReturnType<typeof createInquirySchema>>
export type OTPRequestData = z.infer<ReturnType<typeof createOTPRequestSchema>>
export type OTPVerifyData = z.infer<ReturnType<typeof createOTPVerifySchema>>
