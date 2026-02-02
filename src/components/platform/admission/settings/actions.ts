"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import {
  admissionSettingsSchema,
  type AdmissionSettingsFormData,
} from "./validation"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getAdmissionSettings(): Promise<
  ActionResult<AdmissionSettingsFormData>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

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
        academicWeight: settings.academicWeight,
        entranceWeight: settings.entranceWeight,
        interviewWeight: settings.interviewWeight,
      },
    }
  } catch (error) {
    console.error("[getAdmissionSettings]", error)
    return { success: false, error: "Failed to fetch settings" }
  }
}

export async function saveAdmissionSettings(
  data: AdmissionSettingsFormData
): Promise<ActionResult> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    const validated = admissionSettingsSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message ?? "Invalid data",
      }
    }

    // Upsert settings
    await db.admissionSettings.upsert({
      where: { schoolId },
      create: {
        schoolId,
        allowMultipleApplications: validated.data.allowMultipleApplications,
        requireDocuments: validated.data.requireDocuments,
        defaultApplicationFee: validated.data.applicationFee || null,
        offerExpiryDays: validated.data.offerExpiryDays,
        autoEmailNotifications: validated.data.autoEmailNotifications,
        enableOnlinePayment: validated.data.enableOnlinePayment,
        academicWeight: validated.data.academicWeight,
        entranceWeight: validated.data.entranceWeight,
        interviewWeight: validated.data.interviewWeight,
      },
      update: {
        allowMultipleApplications: validated.data.allowMultipleApplications,
        requireDocuments: validated.data.requireDocuments,
        defaultApplicationFee: validated.data.applicationFee || null,
        offerExpiryDays: validated.data.offerExpiryDays,
        autoEmailNotifications: validated.data.autoEmailNotifications,
        enableOnlinePayment: validated.data.enableOnlinePayment,
        academicWeight: validated.data.academicWeight,
        entranceWeight: validated.data.entranceWeight,
        interviewWeight: validated.data.interviewWeight,
      },
    })

    revalidatePath("/admission/settings")
    return { success: true, data: null }
  } catch (error) {
    console.error("[saveAdmissionSettings]", error)
    return { success: false, error: "Failed to save settings" }
  }
}
