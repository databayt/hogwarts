"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

type ApiResponse = {
  status: "success" | "error"
  message: string
}

/**
 * Upload a video for a catalog lesson.
 * Creates a LessonVideo record with PENDING approval status.
 */
export async function uploadLessonVideo(data: {
  catalogLessonId: string
  title: string
  videoUrl: string
  provider: "YOUTUBE" | "VIMEO" | "SELF_HOSTED" | "OTHER"
  durationSeconds?: number
}): Promise<ApiResponse> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user) {
    return { status: "error", message: "Authentication required" }
  }

  // Check admin/teacher access
  if (!["ADMIN", "TEACHER", "DEVELOPER"].includes(session.user.role || "")) {
    return { status: "error", message: "Insufficient permissions" }
  }

  if (!schoolId) {
    return { status: "error", message: "School context required" }
  }

  try {
    // Verify the lesson exists
    const lesson = await db.catalogLesson.findUnique({
      where: { id: data.catalogLessonId },
      select: {
        id: true,
        chapter: {
          select: {
            subject: {
              select: { slug: true },
            },
          },
        },
      },
    })

    if (!lesson) {
      return { status: "error", message: "Lesson not found" }
    }

    await db.lessonVideo.create({
      data: {
        catalogLessonId: data.catalogLessonId,
        userId: session.user.id,
        schoolId,
        title: data.title,
        videoUrl: data.videoUrl,
        provider: data.provider,
        durationSeconds: data.durationSeconds ?? null,
        approvalStatus: "PENDING",
        visibility: "SCHOOL",
      },
    })

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${lesson.chapter.subject.slug}`
    )

    return { status: "success", message: "Video uploaded successfully" }
  } catch (error) {
    console.error("Failed to upload lesson video:", error)
    return { status: "error", message: "Failed to upload video" }
  }
}

/**
 * Approve or reject a lesson video.
 */
export async function updateVideoApproval(
  videoId: string,
  status: "APPROVED" | "REJECTED"
): Promise<ApiResponse> {
  const session = await auth()

  if (!session?.user) {
    return { status: "error", message: "Authentication required" }
  }

  if (!["ADMIN", "DEVELOPER"].includes(session.user.role || "")) {
    return { status: "error", message: "Only admins can approve videos" }
  }

  try {
    await db.lessonVideo.update({
      where: { id: videoId },
      data: { approvalStatus: status },
    })

    return {
      status: "success",
      message: `Video ${status.toLowerCase()} successfully`,
    }
  } catch (error) {
    console.error("Failed to update video approval:", error)
    return { status: "error", message: "Failed to update video status" }
  }
}
