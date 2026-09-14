// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { getStudentSubmission } from "@/components/school-dashboard/listings/assignments/submit-core"

import { authenticate, isAuthError } from "../../lib/authenticate"
import {
  assignmentDto,
  resolveAssignmentAccess,
  submissionDto,
} from "../shared"

/**
 * GET /api/mobile/assignments/:id
 *
 * The assignment, plus — for a STUDENT, or a GUARDIAN with `?student_id=` —
 * that student's submission (`submission`, null when nothing handed in).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const access = await resolveAssignmentAccess(
      auth,
      id,
      new URL(request.url).searchParams.get("student_id")
    )
    if (!access.ok) return access.response

    const body = assignmentDto(access.assignment)
    if (access.mode === "staff") return NextResponse.json(body)

    const submission = await getStudentSubmission(
      auth.schoolId,
      access.studentId,
      id
    )
    // Classmates' submission count is staff information.
    const { submissions_count: _count, ...forFamily } = body
    return NextResponse.json({
      ...forFamily,
      submission: submissionDto(submission),
    })
  } catch (error) {
    console.error("Mobile assignment detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
