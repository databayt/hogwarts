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


