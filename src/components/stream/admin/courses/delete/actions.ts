"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type ApiResponse = {
  status: "success" | "error";
  message: string;
};

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    return {
      status: "error",
      message: "Unauthorized",
    };
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
    };
  }

  try {
    await db.streamCourse.delete({
      where: {
        id: courseId,
      },
    });

    revalidatePath("/stream/admin/courses");

    return {
      status: "success",
      message: "Course deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete course:", error);
    return {
      status: "error",
      message: "Failed to delete course",
    };
  }
}
