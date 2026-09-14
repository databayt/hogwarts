// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { gradeSubmissionCore } from "@/components/school-dashboard/listings/assignments/grade-core"

import { authenticate, isAuthError } from "../../../../lib/authenticate"
import { hasRole } from "../../../../lib/roles"
import { resolveAssignmentAccess } from "../../../shared"

/**
 * PUT /api/mobile/assignments/:id/submissions/:submissionId — grade
 *
 * Body: { score: number, feedback?: string }. TEACHER (of the class), ADMIN
 * or DEVELOPER. Same core as the web `gradeSubmission` action: score must be
 * 0..total_points and the student is notified.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (!hasRole(auth, "TEACHER", "ADMIN", "DEVELOPER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, submissionId } = await params
    const access = await resolveAssignmentAccess(auth, id, null)
    if (!access.ok) return access.response

    let body: { score?: unknown; feedback?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    const score = body.score
    const feedback = body.feedback
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
      return NextResponse.json(
        { error: "score must be a non-negative number" },
        { status: 400 }
      )
    }
    if (
      feedback !== undefined &&
      feedback !== null &&
      (typeof feedback !== "string" || feedback.length > 10_000)
    ) {
      return NextResponse.json({ error: "Invalid feedback" }, { status: 400 })
    }

    const out = await gradeSubmissionCore({
      schoolId: auth.schoolId,
      graderUserId: auth.userId,
      assignmentId: id,
      submissionId,
      score,
      feedback: (feedback as string | null | undefined) ?? null,
    })

    if (out.status === "notFound") {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }
    if (out.status === "scoreAboveTotal") {
      return NextResponse.json(
        { error: "SCORE_ABOVE_TOTAL", total_points: out.totalPoints },
        { status: 400 }
      )
    }

    return NextResponse.json({
      id: out.submissionId,
      assignment_id: out.assignmentId,
      status: "GRADED",
      score: out.score,
      total_points: out.totalPoints,
      feedback: (feedback as string | null | undefined) || null,
      graded_at: out.gradedAt,
    })
  } catch (error) {
    console.error("Mobile grade submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
