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
    applicationFee: z.number().min(0).default(0),
    offerExpiryDays: z.number().min(1).max(90).default(14),

    // Notification Settings
    autoEmailNotifications: z.boolean().default(true),

    // Payment Settings
    enableOnlinePayment: z.boolean().default(false),
    paymentMethods: z
      .array(z.enum(["stripe", "cash", "bank_transfer"]))
      .default(["stripe", "cash"]),
    bankDetails: bankDetailsSchema.optional().nullable(),
    cashPaymentInstructions: z.string().optional().nullable(),

    // Merit Criteria Weights (must sum to 100)
    academicWeight: z.number().min(0).max(100).default(40),
    entranceWeight: z.number().min(0).max(100).default(35),
    interviewWeight: z.number().min(0).max(100).default(25),
  })
  .refine(
    (data) =>
      data.academicWeight + data.entranceWeight + data.interviewWeight === 100,
    {
      message: "Merit weights must sum to 100%",
      path: ["academicWeight"],
    }
  )

export type AdmissionSettingsFormData = z.infer<typeof admissionSettingsSchema>
