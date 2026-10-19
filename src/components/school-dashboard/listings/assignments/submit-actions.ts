"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { getTenantContext } from "@/lib/tenant-context"
import { isTenantStorageUrl } from "@/lib/tenant-storage"
import { presignUpload } from "@/lib/upload/presign"

import {
  submitAssignmentCore,
  submitAssignmentSchema,
  type AssignmentSubmitOutcome,
  type SubmitAssignmentInput,
} from "./submit-core"

/**
 * Student-facing: hand in an assignment. The teacher-facing actions live in
 * `actions.ts`; this file is separate so the student surface never imports
 * the grading/export machinery.
 */

const OUTCOME_CODES: Record<
  Exclude<AssignmentSubmitOutcome["status"], "submitted">,
  { code: string; error: string }
> = {
  stale: { code: "STALE", error: ACTION_ERRORS.VALIDATION_ERROR },
  notStudent: { code: "NOT_STUDENT", error: ACTION_ERRORS.FORBIDDEN },
  notFound: { code: "NOT_FOUND", error: ACTION_ERRORS.NOT_FOUND },
  notInClass: { code: "NOT_IN_CLASS", error: ACTION_ERRORS.FORBIDDEN },
  notOpen: { code: "NOT_OPEN", error: ACTION_ERRORS.FORBIDDEN },
  alreadyGraded: { code: "ALREADY_GRADED", error: ACTION_ERRORS.FORBIDDEN },
}

export async function submitAssignment(
  input: SubmitAssignmentInput
): Promise<ActionResponse<{ status: "SUBMITTED" | "LATE_SUBMITTED" }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: ACTION_ERRORS.UNAUTHORIZED }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: ACTION_ERRORS.MISSING_SCHOOL }
  }

  const parsed = submitAssignmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: ACTION_ERRORS.VALIDATION_ERROR }
  }
  // Only objects in THIS school's bucket — the rule the mobile route already
  // had. A bare `.url()` admits a javascript: link or another school's file,
  // and the teacher is the one who opens it.
  if (
    !(parsed.data.attachments ?? []).every((u) =>
      isTenantStorageUrl(u, schoolId)
    )
  ) {
    return { success: false, error: ACTION_ERRORS.VALIDATION_ERROR }
  }

  const outcome = await submitAssignmentCore({
    userId: session.user.id,
    schoolId,
    assignmentId: parsed.data.assignmentId,
    content: parsed.data.content?.trim() || null,
    attachments: parsed.data.attachments ?? [],
    submittedAt: new Date(),
  })

  if (outcome.status !== "submitted") {
    const mapped = OUTCOME_CODES[outcome.status]
    return { success: false, error: mapped.error, code: mapped.code }
  }

  return { success: true, data: { status: outcome.submissionStatus } }
}

/**
 * A short-lived upload URL for one file of a hand-in (photo of work, PDF,
 * document, audio). The web card could only take typed text, while the
 * server always accepted attachments — a fully online school hands in
 * photographed work. Students only; the file lands under this school's
 * prefix, and `submitAssignment` accepts nothing else.
 */
export async function presignSubmissionUpload(input: {
  assignmentId: string
  filename: string
  contentType: string
  size: number
}): Promise<
  | { success: true; data: { uploadUrl: string; fileUrl: string } }
  | { success: false; error: string }
> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { success: false, error: ACTION_ERRORS.UNAUTHORIZED }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: ACTION_ERRORS.MISSING_SCHOOL }
  }
  const scope = `submissions-${String(input?.assignmentId ?? "").replace(
    /[^a-zA-Z0-9-]/g,
    ""
  )}`
  const out = await presignUpload({
    kind: "attachment",
    schoolId,
    filename: input?.filename,
    contentType: input?.contentType,
    size: input?.size,
    scope,
  })
  if (!out.ok) return { success: false, error: out.error }
  return {
    success: true,
    data: { uploadUrl: out.presignedUrl, fileUrl: out.finalUrl },
  }
}
