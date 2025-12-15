/**
 * Grade Display Name API
 *
 * Returns formatted display name for a grade/result ID.
 *
 * USE CASES:
 * - Display grade reference in tables
 * - Breadcrumb navigation labels
 * - Report headers
 *
 * RATE LIMITING:
 * - API tier limits applied
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Result must belong to user's school
 *
 * NAME FORMAT:
 * - "Student Name - Assessment Title"
 * - Assessment: assignment OR exam OR standalone title
 * - Example: "Ahmed Ali - Math Quiz 1"
 *
 * WHY COMPLEX JOIN:
 * - Result can be for assignment OR exam
 * - Student name requires join
 * - Title from whichever assessment type exists
 *
 * FALLBACK LOGIC:
 * 1. assignment.title (if assignment grade)
 * 2. exam.title (if exam grade)
 * 3. result.title (standalone grade)
 * 4. "Grade" (default)
 *
 * RESPONSE:
 * - { name: "Ahmed Ali - Midterm Exam" }
 * - 404 if not found
 */

import { NextRequest, NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/auth-security"
import { db } from "@/lib/db"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"
import { getTenantContext } from "@/components/operator/lib/tenant"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting for API endpoints
    const rateLimitResponse = await rateLimit(
      request,
      RATE_LIMITS.API,
      "grades"
    )
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return NextResponse.json(
        { error: "School context not found" },
        { status: 404 }
      )
    }

    const { id } = await params

    // Query result with student and assignment/exam relations
    const result = await db.result.findFirst({
      where: {
        id,
        schoolId,
      },
      select: {
        student: {
          select: {
            givenName: true,
            surname: true,
          },
        },
        assignment: {
          select: {
            title: true,
          },
        },
        exam: {
          select: {
            title: true,
          },
        },
        title: true, // Standalone grade title
      },
    })

    if (!result) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 })
    }

    // Build name: "Student Name - Assignment/Exam Title"
    const studentName = result.student
      ? `${result.student.givenName} ${result.student.surname}`
      : "Unknown Student"

    const itemTitle =
      result.assignment?.title || result.exam?.title || result.title || "Grade"

    const name = `${studentName} - ${itemTitle}`

    return NextResponse.json({ name })
  } catch (error) {
    console.error("Error fetching grade:", error)
    return createErrorResponse(error)
  }
}
