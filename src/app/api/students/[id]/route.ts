// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Student Name Lookup API
 *
 * Returns formatted name for a specific student ID.
 *
 * USE CASES:
 * - Display student name from ID reference
 * - Autocomplete/select component label lookup
 * - Form field population from foreign key
 *
 * RATE LIMITING:
 * - API tier limits applied
 * - WHY: Prevents enumeration attacks
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - schoolId from tenant context
 * - Student must belong to user's school
 * - Cannot look up students from other schools
 *
 * NAME FORMAT:
 * - Breadcrumb label: the school's short name display (displayName)
 * - "first-second" → given + father's name; "first-last" → given + family
 * - Compound names (عبد الله, نور الدين) stay whole
 *
 * WHY MINIMAL SELECT:
 * - Only fetches name fields (not full student)
 * - Reduces data transfer
 * - Protects sensitive info (DOB, contact, etc.)
 *
 * RESPONSE:
 * - { name: "Ahmed Mohamed" }
 * - 404 if not found or wrong school
 */

import { NextRequest, NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/auth-security"
import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { getTenantContext } from "@/components/saas-dashboard/lib/tenant"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting for API endpoints
    const rateLimitResponse = await rateLimit(
      request,
      RATE_LIMITS.API,
      "students"
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

    // Use proper Prisma client without unsafe type casting
    const student = await db.student.findFirst({
      where: {
        id: (await params).id,
        schoolId,
      },
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const name = displayName(student, await schoolNameDisplay(schoolId))

    return NextResponse.json({ name })
  } catch (error) {
    console.error("Error fetching student:", error)
    return createErrorResponse(error)
  }
}
