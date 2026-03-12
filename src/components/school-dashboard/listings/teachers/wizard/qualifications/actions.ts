"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { qualificationsSchema, type QualificationsFormData } from "./validation"

export async function getTeacherQualifications(
  teacherId: string
): Promise<ActionResponse<QualificationsFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const qualifications = await db.teacherQualification.findMany({
      where: { teacherId, schoolId },
      select: {
        qualificationType: true,
        name: true,
        institution: true,
        major: true,
        dateObtained: true,
        expiryDate: true,
        licenseNumber: true,
        documentUrl: true,
      },
    })

    return {
      success: true,
      data: {
        qualifications: qualifications.map((q) => ({
          qualificationType: q.qualificationType as
            | "DEGREE"
            | "CERTIFICATION"
            | "LICENSE",
          name: q.name,
          institution: q.institution ?? undefined,
          major: q.major ?? undefined,
          dateObtained: q.dateObtained ?? undefined,
          expiryDate: q.expiryDate ?? undefined,
          licenseNumber: q.licenseNumber ?? undefined,
          documentUrl: q.documentUrl ?? undefined,
        })),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateTeacherQualifications(
  teacherId: string,
  input: QualificationsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = qualificationsSchema.parse(input)

    await db.$transaction(async (tx) => {
      // Delete existing qualifications
      await tx.teacherQualification.deleteMany({
        where: { teacherId, schoolId },
      })

      // Recreate with new data
      if (parsed.qualifications.length > 0) {
        await tx.teacherQualification.createMany({
          data: parsed.qualifications.map((q) => ({
            teacherId,
            schoolId,
            qualificationType: q.qualificationType,
            name: q.name,
            institution: q.institution ?? null,
            major: q.major ?? null,
            dateObtained: q.dateObtained ?? new Date(),
            expiryDate: q.expiryDate ?? null,
            licenseNumber: q.licenseNumber ?? null,
            documentUrl: q.documentUrl ?? null,
          })),
        })
      }
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
