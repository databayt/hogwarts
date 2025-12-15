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
 * - Concatenates: givenName + middleName + surname
 * - Filters out null/empty parts
 * - Arabic names may have 3-4 parts
 *
 * WHY MINIMAL SELECT:
 * - Only fetches name fields (not full student)
 * - Reduces data transfer
 * - Protects sensitive info (DOB, contact, etc.)
 *
 * RESPONSE:
 * - { name: "Ahmed Mohamed Ali" }
 * - 404 if not found or wrong school
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";
import { createErrorResponse } from "@/lib/auth-security";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Apply rate limiting for API endpoints
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.API, 'students');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return NextResponse.json({ error: "School context not found" }, { status: 404 });
    }

    // Use proper Prisma client without unsafe type casting
    const student = await db.student.findFirst({
      where: { 
        id: (await params).id, 
        schoolId 
      },
      select: { 
        givenName: true, 
        middleName: true, 
        surname: true 
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const name = [student.givenName, student.middleName, student.surname]
      .filter(Boolean)
      .join(" ");
      
    return NextResponse.json({ name });
  } catch (error) {
    console.error("Error fetching student:", error);
    return createErrorResponse(error);
  }
}


