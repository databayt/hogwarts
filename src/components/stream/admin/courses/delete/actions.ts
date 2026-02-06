"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkStreamPermission,
  getAuthContext,
} from "@/components/stream/authorization"

type ApiResponse = {
  status: "success" | "error"
  message: string
}

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  // Check authentication
  const authCtx = getAuthContext(session)
  if (!authCtx) {
    return { status: "error", message: "Unauthorized" }
  }
  authCtx.schoolId = schoolId

  // Check school context
  if (!schoolId) {
    return { status: "error", message: "School context required" }
  }

  try {
    // Verify course belongs to this school before deleting
    const course = await db.streamCourse.findFirst({
      where: {
        id: courseId,
        schoolId,
      },
    })

    if (!course) {
      return { status: "error", message: "Course not found or access denied" }
    }

    // Check delete permission with ownership context
    if (
      !checkStreamPermission(authCtx, "delete", {
        id: course.id,
        userId: course.userId,
        schoolId: course.schoolId,
      })
    ) {
      return { status: "error", message: "Insufficient permissions" }
    }

    await db.streamCourse.delete({
      where: {
        id: courseId,
      },
    })

    revalidatePath("/stream/admin/courses")

    return {
      status: "success",
      message: "Course deleted successfully",
    }
  } catch (error) {
    console.error("Failed to delete course:", error)
    return {
      status: "error",
      message: "Failed to delete course",
    }
  }
}
