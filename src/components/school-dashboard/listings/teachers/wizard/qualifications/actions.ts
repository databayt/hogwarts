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
        documentUrl: true,
      },
    })

    // Map structured DB records back to flat document URL fields
    const data: QualificationsFormData = {
      degrees: "",
      certifications: "",
      cv: "",
      id: "",
      licenses: "",
      other: "",
    }

    for (const q of qualifications) {
      const url = q.documentUrl ?? ""
      switch (q.qualificationType) {
        case "DEGREE":
          data.degrees = url
          break
        case "CERTIFICATION":
          data.certifications = url
          break
        case "LICENSE":
          data.licenses = url
          break
      }
    }

    return { success: true, data }
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

      // Create qualification records from flat document URL fields
      const entries: { type: string; url: string }[] = [
        { type: "DEGREE", url: parsed.degrees },
        { type: "CERTIFICATION", url: parsed.certifications },
        { type: "LICENSE", url: parsed.licenses },
      ].filter((e) => e.url)

      if (entries.length > 0) {
        await tx.teacherQualification.createMany({
          data: entries.map((e) => ({
            teacherId,
            schoolId,
            qualificationType: e.type,
            name: e.type,
            documentUrl: e.url,
            dateObtained: new Date(),
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
