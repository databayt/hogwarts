// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

// Bank details sub-schema
const bankDetailsSchema = z.object({
  bankName: z.string().default(""),
  accountName: z.string().default(""),
  accountNumber: z.string().default(""),
  iban: z.string().optional().default(""),
  swiftCode: z.string().optional().default(""),
})

export type BankDetailsFormData = z.infer<typeof bankDetailsSchema>

// Settings validation schema - matches fields displayed in settings-content.tsx
export const admissionSettingsSchema = z
  .object({
    // General Settings
    allowMultipleApplications: z.boolean().default(false),
    requireDocuments: z.boolean().default(true),
    offerExpiryDays: z.number().min(1).max(90).default(14),

    // Public Portal Settings — gate the 4 public-facing entry points
    // (school-marketing/admission actions read these; see AdmissionSettings
    // Prisma model). Default true to match the schema + prior behavior.
    enablePublicPortal: z.boolean().default(true),
    enableInquiryForm: z.boolean().default(true),
    enableTourBooking: z.boolean().default(true),
    enableStatusTracker: z.boolean().default(true),

    // Notification Settings
    autoEmailNotifications: z.boolean().default(true),

    // Payment Settings
    enableOnlinePayment: z.boolean().default(false),
    paymentMethods: z
      .array(z.enum(["stripe", "cash", "bank_transfer"]))
      .default(["stripe", "cash"]),
    bankDetails: bankDetailsSchema.optional().nullable(),
    cashPaymentInstructions: z.string().optional().nullable(),

    // Merit Criteria Weights. generateMeritList (actions.ts) only ever reads
    // entranceWeight/interviewWeight — there is no academic-score input, so
    // academicWeight is no longer user-editable (settings-content.tsx has no
    // slider for it) and is always saved as 0. The field is kept so the
    // upsert payload / Prisma column stay stable.
    academicWeight: z.number().min(0).max(100).default(0),
    entranceWeight: z.number().min(0).max(100).default(60),
    interviewWeight: z.number().min(0).max(100).default(40),
  })
  .refine((data) => data.entranceWeight + data.interviewWeight === 100, {
    message: "Merit weights must sum to 100%",
    path: ["entranceWeight"],
  })

export type AdmissionSettingsFormData = z.infer<typeof admissionSettingsSchema>
