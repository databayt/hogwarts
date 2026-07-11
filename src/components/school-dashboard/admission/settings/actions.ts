"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import { assertAdmissionPermission, isPermissionDenied } from "../authorization"
import {
  admissionSettingsSchema,
  type AdmissionSettingsFormData,
} from "./validation"

export async function getAdmissionSettings(): Promise<
  ActionResponse<AdmissionSettingsFormData>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Settings include bank account details (IBAN/SWIFT) — admin-only read
    assertAdmissionPermission(session.user.role ?? "", "manageSettings")

    // Get or create settings for this school
    let settings = await db.admissionSettings.findUnique({
      where: { schoolId },
    })

    // If no settings exist, create default ones
    if (!settings) {
      settings = await db.admissionSettings.create({
        data: {
          schoolId,
          // All other fields will use Prisma defaults
        },
      })
    }

    return {
      success: true,
      data: {
        allowMultipleApplications: settings.allowMultipleApplications,
        requireDocuments: settings.requireDocuments,
        applicationFee: settings.defaultApplicationFee?.toNumber() ?? 0,
        offerExpiryDays: settings.offerExpiryDays,
        autoEmailNotifications: settings.autoEmailNotifications,
        enableOnlinePayment: settings.enableOnlinePayment,
        paymentMethods: ((settings.paymentMethods as string[]) ?? [
          "stripe",
          "cash",
        ]) as ("stripe" | "cash" | "bank_transfer")[],
        bankDetails: settings.bankDetails
          ? {
              bankName:
                (settings.bankDetails as Record<string, string>).bankName ?? "",
              accountName:
                (settings.bankDetails as Record<string, string>).accountName ??
                "",
              accountNumber:
                (settings.bankDetails as Record<string, string>)
                  .accountNumber ?? "",
              iban: (settings.bankDetails as Record<string, string>).iban ?? "",
              swiftCode:
                (settings.bankDetails as Record<string, string>).swiftCode ??
                "",
            }
          : null,
        cashPaymentInstructions: settings.cashPaymentInstructions ?? null,
        academicWeight: settings.academicWeight,
        entranceWeight: settings.entranceWeight,
        interviewWeight: settings.interviewWeight,
      },
    }
  } catch (error) {
    console.error("[getAdmissionSettings]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

export async function saveAdmissionSettings(
  data: AdmissionSettingsFormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // RBAC: Only ADMIN and DEVELOPER can modify admission settings
    assertAdmissionPermission(session.user.role ?? "", "manageSettings")

    // Validate input
    const validated = admissionSettingsSchema.safeParse(data)
    if (!validated.success) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Upsert settings
    const settingsData = {
      allowMultipleApplications: validated.data.allowMultipleApplications,
      requireDocuments: validated.data.requireDocuments,
      defaultApplicationFee: validated.data.applicationFee || null,
      offerExpiryDays: validated.data.offerExpiryDays,
      autoEmailNotifications: validated.data.autoEmailNotifications,
      enableOnlinePayment: validated.data.enableOnlinePayment,
      paymentMethods: validated.data.paymentMethods ?? ["stripe", "cash"],
      bankDetails: validated.data.bankDetails ?? undefined,
      cashPaymentInstructions: validated.data.cashPaymentInstructions ?? null,
      academicWeight: validated.data.academicWeight,
      entranceWeight: validated.data.entranceWeight,
      interviewWeight: validated.data.interviewWeight,
    }

    await db.admissionSettings.upsert({
      where: { schoolId },
      create: { schoolId, ...settingsData },
      update: settingsData,
    })

    revalidatePath("/admission/settings")
    return { success: true, data: null }
  } catch (error) {
    console.error("[saveAdmissionSettings]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
