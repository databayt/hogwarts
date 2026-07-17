"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { checkCurrentUserPermission } from "../lib/permissions"

export interface PaymentSettingsData {
  bankakEnabled: boolean
  bankakAccountName: string | null
  bankakAccountNumber: string | null
  bankakQrUrl: string | null
  bankakInstructions: string | null
  cashiEnabled: boolean
  cashiAccountName: string | null
  cashiMerchantCode: string | null
  cashiQrUrl: string | null
  cashiInstructions: string | null
  reminderLadderDays: number[]
  overdueLadderDays: number[]
  bursarEscalationDays: number | null
}

/** Normalize "" → null so an emptied field clears the column. */
function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Read the school's payment rails. Row is created on first read (same
 * get-or-create shape as `getAdmissionSettings`), so the form always has
 * something to bind to.
 *
 * Permission-gated on `fees:view`: these fields are the school's own bank
 * account details, not public information.
 */
export async function getPaymentSettings(): Promise<
  ActionResponse<PaymentSettingsData>
> {
  try {
    const session = await auth()
    if (!session?.user?.id) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const canView = await checkCurrentUserPermission(schoolId, "fees", "view")
    if (!canView) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    let settings = await db.schoolPaymentSettings.findUnique({
      where: { schoolId },
    })
    if (!settings) {
      settings = await db.schoolPaymentSettings.create({ data: { schoolId } })
    }

    return {
      success: true,
      data: {
        bankakEnabled: settings.bankakEnabled,
        bankakAccountName: settings.bankakAccountName,
        bankakAccountNumber: settings.bankakAccountNumber,
        bankakQrUrl: settings.bankakQrUrl,
        bankakInstructions: settings.bankakInstructions,
        cashiEnabled: settings.cashiEnabled,
        cashiAccountName: settings.cashiAccountName,
        cashiMerchantCode: settings.cashiMerchantCode,
        cashiQrUrl: settings.cashiQrUrl,
        cashiInstructions: settings.cashiInstructions,
        reminderLadderDays: settings.reminderLadderDays,
        overdueLadderDays: settings.overdueLadderDays,
        bursarEscalationDays: settings.bursarEscalationDays,
      },
    }
  } catch (error) {
    console.error("Error loading payment settings:", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Update the school's payment rails + reminder ladder.
 *
 * Gated on `fees:update` — changing the Bankak account number redirects where
 * every parent's money goes, so it must not be merely view-level.
 */
export async function updatePaymentSettings(
  input: unknown
): Promise<ActionResponse<PaymentSettingsData>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const canUpdate = await checkCurrentUserPermission(schoolId, "fees", "edit")
    if (!canUpdate) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    // Validate with the same schema the form uses, rebuilt server-side from the
    // school's own language so a hostile client can't skip the cross-field
    // "enabled implies an account exists" rule.
    const { createPaymentSettingsSchema } = await import("./validation")
    const { getDictionary } =
      await import("@/components/internationalization/dictionaries")
    const { getValidationMessages } =
      await import("@/components/internationalization/helpers")
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const lang = school?.preferredLanguage === "en" ? "en" : "ar"
    const dictionary = await getDictionary(lang)
    const schema = createPaymentSettingsSchema(
      getValidationMessages(dictionary)
    )

    const parsed = schema.safeParse(input)
    if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    const d = parsed.data

    const data = {
      bankakEnabled: d.bankakEnabled,
      bankakAccountName: blankToNull(d.bankakAccountName),
      bankakAccountNumber: blankToNull(d.bankakAccountNumber),
      bankakQrUrl: blankToNull(d.bankakQrUrl),
      bankakInstructions: blankToNull(d.bankakInstructions),
      cashiEnabled: d.cashiEnabled,
      cashiAccountName: blankToNull(d.cashiAccountName),
      cashiMerchantCode: blankToNull(d.cashiMerchantCode),
      cashiQrUrl: blankToNull(d.cashiQrUrl),
      cashiInstructions: blankToNull(d.cashiInstructions),
      // Descending: T-7 fires before T-3 before T-1.
      reminderLadderDays: [...d.reminderLadderDays].sort((a, b) => b - a),
      overdueLadderDays: [...d.overdueLadderDays].sort((a, b) => a - b),
      bursarEscalationDays: d.bursarEscalationDays,
    }

    const settings = await db.schoolPaymentSettings.upsert({
      where: { schoolId },
      create: { schoolId, ...data },
      update: data,
    })

    // The rails feed the parent-facing picker on every fee assignment.
    revalidatePath("/finance/fees")
    revalidatePath("/finance/banking/payment-methods")

    return {
      success: true,
      data: {
        bankakEnabled: settings.bankakEnabled,
        bankakAccountName: settings.bankakAccountName,
        bankakAccountNumber: settings.bankakAccountNumber,
        bankakQrUrl: settings.bankakQrUrl,
        bankakInstructions: settings.bankakInstructions,
        cashiEnabled: settings.cashiEnabled,
        cashiAccountName: settings.cashiAccountName,
        cashiMerchantCode: settings.cashiMerchantCode,
        cashiQrUrl: settings.cashiQrUrl,
        cashiInstructions: settings.cashiInstructions,
        reminderLadderDays: settings.reminderLadderDays,
        overdueLadderDays: settings.overdueLadderDays,
        bursarEscalationDays: settings.bursarEscalationDays,
      },
    }
  } catch (error) {
    console.error("Error updating payment settings:", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}
