import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * GET /api/stream/courses/[courseId]
 * Fetches a course by ID for admin editing
 * Multi-tenant: Scoped by schoolId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check role
    if (!["ADMIN", "TEACHER", "DEVELOPER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId && session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "School context required" },
        { status: 400 }
      )
    }

    const { courseId } = await params

    const course = await db.streamCourse.findFirst({
      where: {
        id: courseId,
        schoolId: schoolId || undefined,
      },
      include: {
        category: true,
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error("Failed to fetch course:", error)
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    )
  }
}
