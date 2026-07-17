"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkStudentPermission,
  getAuthContext,
  type AuthContext,
  type StudentAction,
} from "@/components/school-dashboard/listings/students/authorization"

import { attachmentsSchema, type AttachmentsFormData } from "./validation"

/**
 * Shared guard — `getTenantContext()` resolves schoolId from the subdomain
 * header before the session, so these photo/document read/write actions must
 * assert an authenticated, role-permitted session too (not schoolId alone).
 * See the matching guard in the personal wizard actions.
 */
async function authorizeWizardAction(
  action: StudentAction
): Promise<
  | { ok: true; schoolId: string; authContext: AuthContext }
  | { ok: false; response: ActionResponse }
> {
  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext) {
    return { ok: false, response: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, response: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }
  if (!checkStudentPermission(authContext, action, { schoolId })) {
    return { ok: false, response: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  return { ok: true, schoolId, authContext }
}

const DOC_TYPES = [
  { key: "degreeUrl", type: "DEGREE", name: "Degree" },
  { key: "transcriptUrl", type: "TRANSCRIPT", name: "Transcript" },
  { key: "idUrl", type: "ID", name: "ID Document" },
  { key: "resumeUrl", type: "RESUME", name: "Resume" },
  { key: "otherUrl", type: "OTHER", name: "Other Document" },
] as const

export async function getStudentAttachments(
  studentId: string
): Promise<ActionResponse<AttachmentsFormData>> {
  try {
    const authz = await authorizeWizardAction("read")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

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

    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

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
        resumeUrl: docMap.get("RESUME") ?? docMap.get("CV") ?? "",
        otherUrl: docMap.get("OTHER") ?? "",
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function updateStudentAttachments(
  studentId: string,
  input: AttachmentsFormData
): Promise<ActionResponse> {
  try {
    const authz = await authorizeWizardAction("update")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

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
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
