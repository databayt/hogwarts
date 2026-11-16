"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Decimal } from "@prisma/client/runtime/library"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { isTenantStorageUrl } from "@/lib/tenant-storage"
import { presignUpload } from "@/lib/upload/presign"

import { wizardEditor } from "../guard"
import { detailsSchema, type DetailsFormData } from "./validation"

export async function getAssignmentDetails(
  assignmentId: string
): Promise<ActionResponse<DetailsFormData>> {
  try {
    const editor = await wizardEditor("update")
    if (!editor) return actionError(ACTION_ERRORS.UNAUTHORIZED)
    const { schoolId } = editor

    const assignment = await db.schoolAssignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: {
        totalPoints: true,
        weight: true,
        dueDate: true,
        instructions: true,
        attachments: true,
      },
    })

    if (!assignment) return actionError(ACTION_ERRORS.NOT_FOUND)

    return {
      success: true,
      data: {
        totalPoints: Number(assignment.totalPoints),
        weight: Number(assignment.weight),
        dueDate: assignment.dueDate,
        instructions: assignment.instructions ?? undefined,
        attachments: assignment.attachments ?? [],
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function updateAssignmentDetails(
  assignmentId: string,
  input: DetailsFormData
): Promise<ActionResponse> {
  try {
    const editor = await wizardEditor("update")
    if (!editor) return actionError(ACTION_ERRORS.UNAUTHORIZED)
    const { schoolId } = editor

    const parsed = detailsSchema.parse(input)
    // Only objects this school's storage produced — a bare URL could be a
    // javascript: link or another school's file, and students open these.
    if (!parsed.attachments.every((u) => isTenantStorageUrl(u, schoolId))) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    await db.schoolAssignment.updateMany({
      where: { id: assignmentId, schoolId },
      data: {
        totalPoints: new Decimal(parsed.totalPoints),
        weight: new Decimal(parsed.weight),
        dueDate: parsed.dueDate,
        instructions: parsed.instructions ?? null,
        attachments: parsed.attachments,
      },
    })

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Teacher-facing: a short-lived upload URL for one file attached to an
 * assignment (a photo of the worksheet, a PDF). Mirrors the student's
 * `presignSubmissionUpload`; images and PDFs only, under this school's
 * prefix — `updateAssignmentDetails` accepts nothing else.
 */
export async function presignAssignmentAttachment(input: {
  assignmentId: string
  filename: string
  contentType: string
  size: number
}): Promise<
  | { success: true; data: { uploadUrl: string; fileUrl: string } }
  | { success: false; error: string }
> {
  const editor = await wizardEditor("update")
  if (!editor) return { success: false, error: ACTION_ERRORS.UNAUTHORIZED }
  const contentType = String(input?.contentType ?? "")
  if (
    !(contentType.startsWith("image/") || contentType === "application/pdf")
  ) {
    return { success: false, error: ACTION_ERRORS.VALIDATION_ERROR }
  }
  const scope = `assignments-${String(input?.assignmentId ?? "").replace(
    /[^a-zA-Z0-9-]/g,
    ""
  )}`
  const out = await presignUpload({
    kind: "attachment",
    schoolId: editor.schoolId,
    filename: input?.filename,
    contentType,
    size: input?.size,
    scope,
  })
  if (!out.ok) return { success: false, error: out.error }
  return {
    success: true,
    data: { uploadUrl: out.presignedUrl, fileUrl: out.finalUrl },
  }
}
