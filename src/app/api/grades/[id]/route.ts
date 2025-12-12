import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";
import { createErrorResponse } from "@/lib/auth-security";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting for API endpoints
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.API, "grades");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return NextResponse.json(
        { error: "School context not found" },
        { status: 404 }
      );
    }

    const { id } = await params;

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
    });

    if (!result) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    // Build name: "Student Name - Assignment/Exam Title"
    const studentName = result.student
      ? `${result.student.givenName} ${result.student.surname}`
      : "Unknown Student";

    const itemTitle =
      result.assignment?.title ||
      result.exam?.title ||
      result.title ||
      "Grade";

    const name = `${studentName} - ${itemTitle}`;

    return NextResponse.json({ name });
  } catch (error) {
    console.error("Error fetching grade:", error);
    return createErrorResponse(error);
  }
}
