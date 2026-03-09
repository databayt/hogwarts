"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

interface SaveCertificateCompositionInput {
  id?: string
  name: string
  type: string
  description?: string
  templateStyle: string
  orientation: string
  pageSize: string
  titleText: string
  titleTextAr?: string
  bodyTemplate: string
  bodyTemplateAr?: string
  minPercentage?: number | null
  minGrade?: string
  topPercentile?: number | null
  signatures: Array<{ name: string; title: string; signatureUrl?: string }>
  useSchoolLogo: boolean
  borderStyle: string
  enableVerification: boolean
  verificationPrefix?: string
  compositionConfig: Prisma.InputJsonValue
  regionPreset?: string | null
}

export async function saveCertificateComposition(
  input: SaveCertificateCompositionInput
): Promise<{ success: boolean; error?: string; configId?: string }> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const role = session.user.role
    if (
      !role ||
      ["STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF"].includes(role)
    ) {
      return { success: false, error: "Unauthorized" }
    }

    if (!input.name) {
      return { success: false, error: "Name is required" }
    }

    const data = {
      name: input.name,
      type: input.type as
        | "ACHIEVEMENT"
        | "COMPLETION"
        | "PARTICIPATION"
        | "MERIT"
        | "EXCELLENCE"
        | "CUSTOM",
      description: input.description || null,
      templateStyle: input.templateStyle,
      orientation: input.orientation,
      pageSize: input.pageSize,
      titleText: input.titleText,
      titleTextAr: input.titleTextAr || null,
      bodyTemplate: input.bodyTemplate,
      bodyTemplateAr: input.bodyTemplateAr || null,
      minPercentage: input.minPercentage ?? null,
      minGrade: input.minGrade || null,
      topPercentile: input.topPercentile ?? null,
      signatures: input.signatures as Prisma.InputJsonValue,
      useSchoolLogo: input.useSchoolLogo,
      borderStyle: input.borderStyle,
      enableVerification: input.enableVerification,
      verificationPrefix: input.verificationPrefix || null,
      compositionConfig: input.compositionConfig,
      regionPreset: input.regionPreset || null,
    }

    if (input.id) {
      // Update existing config
      const existing = await db.examCertificateConfig.findUnique({
        where: { id: input.id, schoolId },
      })
      if (!existing) {
        return { success: false, error: "Config not found" }
      }

      await db.examCertificateConfig.update({
        where: { id: input.id },
        data,
      })

      revalidatePath("/exams/certificates")
      return { success: true, configId: input.id }
    }

    // Create new config
    const config = await db.examCertificateConfig.create({
      data: {
        ...data,
        schoolId,
      },
    })

    revalidatePath("/exams/certificates")
    return { success: true, configId: config.id }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save certificate config",
    }
  }
}
