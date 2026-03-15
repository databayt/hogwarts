"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { attachmentsSchema, type AttachmentsFormData } from "./validation"

export async function getTeacherAttachments(
  teacherId: string
): Promise<ActionResponse<AttachmentsFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: {
        profilePhotoUrl: true,
        qualifications: {
          where: { schoolId },
          select: { qualificationType: true, documentUrl: true },
        },
      },
    })

    if (!teacher) return { success: false, error: "Teacher not found" }

    // Map qualifications to attachment slots
    const degreeDoc = teacher.qualifications.find(
      (q) => q.qualificationType === "DEGREE"
    )
    const certDoc = teacher.qualifications.find(
      (q) => q.qualificationType === "CERTIFICATION"
    )
    const idDoc = teacher.qualifications.find(
      (q) => q.qualificationType === "ID"
    )
    const cvDoc = teacher.qualifications.find(
      (q) => q.qualificationType === "CV"
    )
    const otherDoc = teacher.qualifications.find(
      (q) => q.qualificationType === "OTHER"
    )

    return {
      success: true,
      data: {
        profilePhotoUrl: teacher.profilePhotoUrl ?? "",
        degreeUrl: degreeDoc?.documentUrl ?? "",
        cvUrl: cvDoc?.documentUrl ?? "",
        idUrl: idDoc?.documentUrl ?? "",
        certificationUrl: certDoc?.documentUrl ?? "",
        otherUrl: otherDoc?.documentUrl ?? "",
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateTeacherAttachments(
  teacherId: string,
  input: AttachmentsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = attachmentsSchema.parse(input)

    await db.$transaction(async (tx) => {
      // Update profile photo
      await tx.teacher.updateMany({
        where: { id: teacherId, schoolId },
        data: { profilePhotoUrl: parsed.profilePhotoUrl || null },
      })

      // Delete existing qualifications and recreate with attachment data
      await tx.teacherQualification.deleteMany({
        where: { teacherId, schoolId },
      })

      const qualifications: {
        teacherId: string
        schoolId: string
        qualificationType: string
        name: string
        documentUrl: string
        dateObtained: Date
      }[] = []

      if (parsed.degreeUrl) {
        qualifications.push({
          teacherId,
          schoolId,
          qualificationType: "DEGREE",
          name: "Degree",
          documentUrl: parsed.degreeUrl,
          dateObtained: new Date(),
        })
      }
      if (parsed.cvUrl) {
        qualifications.push({
          teacherId,
          schoolId,
          qualificationType: "CV",
          name: "CV",
          documentUrl: parsed.cvUrl,
          dateObtained: new Date(),
        })
      }
      if (parsed.idUrl) {
        qualifications.push({
          teacherId,
          schoolId,
          qualificationType: "ID",
          name: "ID Document",
          documentUrl: parsed.idUrl,
          dateObtained: new Date(),
        })
      }
      if (parsed.certificationUrl) {
        qualifications.push({
          teacherId,
          schoolId,
          qualificationType: "CERTIFICATION",
          name: "Certification",
          documentUrl: parsed.certificationUrl,
          dateObtained: new Date(),
        })
      }
      if (parsed.otherUrl) {
        qualifications.push({
          teacherId,
          schoolId,
          qualificationType: "OTHER",
          name: "Other Document",
          documentUrl: parsed.otherUrl,
          dateObtained: new Date(),
        })
      }

      if (qualifications.length > 0) {
        await tx.teacherQualification.createMany({ data: qualifications })
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
