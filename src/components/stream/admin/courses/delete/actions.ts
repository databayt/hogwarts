"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

type ApiResponse = {
  status: "success" | "error"
  message: string
}

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  // Check authentication
  if (!session?.user) {
    return {
      status: "error",
      message: "Unauthorized",
    }
  }

  // Check school context
  if (!schoolId) {
    return {
      status: "error",
      message: "School context required",
    }
  }

  // Check admin/teacher access
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "TEACHER" &&
    session.user.role !== "DEVELOPER"
  ) {
    return {
      status: "error",
      message: "Insufficient permissions",
    }
  }

  try {
    // Verify course belongs to this school before deleting (CRITICAL for multi-tenant security)
    const course = await db.streamCourse.findFirst({
      where: {
        id: courseId,
        schoolId, // IMPORTANT: Multi-tenant scope
      },
    })

    if (!course) {
      return {
        status: "error",
        message: "Course not found or access denied",
      }
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
