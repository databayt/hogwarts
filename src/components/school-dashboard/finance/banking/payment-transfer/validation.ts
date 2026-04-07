// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export const createTransferSchema = (v: ValidationHelper) =>
  z
    .object({
      fromAccountId: z.string().min(1, v.required()),
      toAccountId: z.string().optional(),
      recipientEmail: z.string().email(v.email()).optional(),
      amount: z.number().min(0.01, v.min(0.01)).max(100000, v.max(100000)),
      description: z.string().min(1, v.required()).max(500, v.maxLength(500)),
    })
    .refine((data) => data.toAccountId || data.recipientEmail, {
      message: "Either destination account or recipient email is required", // TODO: add custom validation key
      path: ["toAccountId"],
    })

// ============================================================================
// Static Schemas (server-side fallback)
// ============================================================================

export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Source account is required"),
    toAccountId: z.string().optional(),
    recipientEmail: z.string().email("Invalid email address").optional(),
    amount: z
      .number()
      .min(0.01, "Amount must be at least $0.01")
      .max(100000, "Amount cannot exceed $100,000"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(500, "Description is too long"),
  })
  .refine((data) => data.toAccountId || data.recipientEmail, {
    message: "Either destination account or recipient email is required",
    path: ["toAccountId"],
  })

export type TransferFormData = z.infer<typeof transferSchema>
