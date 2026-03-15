"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { attachmentsSchema, type AttachmentsFormData } from "./validation"

const DOC_TYPES = [
  { key: "degreeUrl", type: "DEGREE", name: "Degree" },
  { key: "transcriptUrl", type: "TRANSCRIPT", name: "Transcript" },
  { key: "idUrl", type: "ID", name: "ID Document" },
  { key: "cvUrl", type: "CV", name: "CV" },
  { key: "otherUrl", type: "OTHER", name: "Other Document" },
] as const

export async function getStudentAttachments(
  studentId: string
): Promise<ActionResponse<AttachmentsFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        profilePhotoUrl: true,
        documents: {
          where: { schoolId },
          select: { documentType: true, fileUrl: true },
        },
      },
    })

    if (!student) return { success: false, error: "Student not found" }

    const docMap = new Map(
      student.documents.map((d) => [d.documentType, d.fileUrl])
    )

    return {
      success: true,
      data: {
        profilePhotoUrl: student.profilePhotoUrl ?? "",
        degreeUrl: docMap.get("DEGREE") ?? "",
        transcriptUrl: docMap.get("TRANSCRIPT") ?? "",
        idUrl: docMap.get("ID") ?? "",
        cvUrl: docMap.get("CV") ?? "",
        otherUrl: docMap.get("OTHER") ?? "",
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateStudentAttachments(
  studentId: string,
  input: AttachmentsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = attachmentsSchema.parse(input)

    await db.$transaction(async (tx) => {
      // Update profile photo
      await tx.student.updateMany({
        where: { id: studentId, schoolId },
        data: { profilePhotoUrl: parsed.profilePhotoUrl || null },
      })

      // Replace document records
      await tx.studentDocument.deleteMany({
        where: { studentId, schoolId },
      })

      const documents: {
        studentId: string
        schoolId: string
        documentType: string
        documentName: string
        fileUrl: string
      }[] = []

      for (const { key, type, name } of DOC_TYPES) {
        const url = parsed[key]
        if (url) {
          documents.push({
            studentId,
            schoolId,
            documentType: type,
            documentName: name,
            fileUrl: url,
          })
        }
      }

      if (documents.length > 0) {
        await tx.studentDocument.createMany({ data: documents })
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
