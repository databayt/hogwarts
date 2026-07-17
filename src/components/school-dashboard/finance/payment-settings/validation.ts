// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

/**
 * School payment rails + reminder ladder.
 *
 * Cross-field rule: a rail can only be switched ON once it has an account to
 * pay to. Without this the picker would render a "Pay with Bankak" card with
 * no account number on it — the failure mode the whole gating layer exists to
 * prevent, so it's enforced here as well as in `filterConfiguredManualRails`.
 */
export function createPaymentSettingsSchema(v: ValidationHelper) {
  return z
    .object({
      bankakEnabled: z.boolean(),
      bankakAccountName: z.string().trim().max(120).optional().nullable(),
      bankakAccountNumber: z.string().trim().max(64).optional().nullable(),
      bankakQrUrl: z
        .string()
        .trim()
        .url(v.get("url"))
        .optional()
        .nullable()
        .or(z.literal("")),
      bankakInstructions: z.string().trim().max(500).optional().nullable(),

      cashiEnabled: z.boolean(),
      cashiAccountName: z.string().trim().max(120).optional().nullable(),
      cashiMerchantCode: z.string().trim().max(64).optional().nullable(),
      cashiQrUrl: z
        .string()
        .trim()
        .url(v.get("url"))
        .optional()
        .nullable()
        .or(z.literal("")),
      cashiInstructions: z.string().trim().max(500).optional().nullable(),

      // Days BEFORE the due date (descending) and AFTER it that reminders fire.
      reminderLadderDays: z.array(z.number().int().min(0).max(90)).max(8),
      overdueLadderDays: z.array(z.number().int().min(0).max(365)).max(8),
      bursarEscalationDays: z.number().int().min(1).max(365).nullable(),
    })
    .refine(
      (data) => !data.bankakEnabled || Boolean(data.bankakAccountNumber),
      {
        message: v.required(),
        path: ["bankakAccountNumber"],
      }
    )
    .refine((data) => !data.cashiEnabled || Boolean(data.cashiMerchantCode), {
      message: v.required(),
      path: ["cashiMerchantCode"],
    })
}

export type PaymentSettingsFormData = z.infer<
  ReturnType<typeof createPaymentSettingsSchema>
>
