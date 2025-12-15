"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

type ApiResponse = {
  status: "success" | "error"
  message: string
}

// Validation schemas
const courseUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isPublished: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
})

const chapterSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  courseId: z.string().min(1, "Course ID is required"),
})

const lessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  chapterId: z.string().min(1, "Chapter ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
  description: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  duration: z.number().optional().nullable(),
})

// Helper to verify course ownership and school context
async function verifyCourseAccess(courseId: string) {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (!["ADMIN", "TEACHER", "DEVELOPER"].includes(session.user.role || "")) {
    throw new Error("Insufficient permissions")
  }

  if (!schoolId && session.user.role !== "DEVELOPER") {
    throw new Error("School context required")
  }

  const course = await db.streamCourse.findFirst({
    where: {
      id: courseId,
      schoolId: schoolId || undefined,
    },
  })

  if (!course) {
    throw new Error("Course not found or access denied")
  }

  return { session, schoolId, course }
}

// ============================================
// COURSE UPDATE ACTION
// ============================================

export async function editCourse(
  data: z.infer<typeof courseUpdateSchema>,
  courseId: string
): Promise<ApiResponse> {
  try {
    const { schoolId } = await verifyCourseAccess(courseId)

    const result = courseUpdateSchema.safeParse(data)
    if (!result.success) {
      return {
        status: "error",
        message: result.error.issues[0]?.message || "Invalid data",
      }
    }

    await db.streamCourse.update({
      where: {
        id: courseId,
      },
      data: {
        ...result.data,
      },
    })

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${courseId}/edit`
    )

    return {
      status: "success",
      message: "Course updated successfully",
    }
  } catch (error) {
    console.error("Failed to update course:", error)
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to update course",
    }
  }
}

// ============================================
// CHAPTER ACTIONS
// ============================================

export async function createChapter(
  values: z.infer<typeof chapterSchema>
): Promise<ApiResponse> {
  try {
    await verifyCourseAccess(values.courseId)

    const result = chapterSchema.safeParse(values)
    if (!result.success) {
      return {
        status: "error",
        message: result.error.issues[0]?.message || "Invalid data",
      }
    }

    await db.$transaction(async (tx) => {
      // Get max position
      const maxPos = await tx.streamChapter.findFirst({
        where: {
          courseId: result.data.courseId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      })

      // Create chapter with next position
      await tx.streamChapter.create({
        data: {
          title: result.data.title,
          courseId: result.data.courseId,
          position: (maxPos?.position ?? 0) + 1,
        },
      })
    })

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${values.courseId}/edit`
    )

    return {
      status: "success",
      message: "Chapter created successfully",
    }
  } catch (error) {
    console.error("Failed to create chapter:", error)
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to create chapter",
    }
  }
}

export async function updateChapter(
  chapterId: string,
  data: {
    title?: string
    description?: string
    isPublished?: boolean
    isFree?: boolean
  }
): Promise<ApiResponse> {
  try {
    // Find chapter to get courseId for access verification
    const chapter = await db.streamChapter.findUnique({
      where: { id: chapterId },
      select: { courseId: true },
    })

    if (!chapter) {
      return { status: "error", message: "Chapter not found" }
    }

    await verifyCourseAccess(chapter.courseId)

    await db.streamChapter.update({
      where: { id: chapterId },
      data,
    })

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${chapter.courseId}/edit`
    )

    return {
      status: "success",
      message: "Chapter updated successfully",
    }
  } catch (error) {
    console.error("Failed to update chapter:", error)
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to update chapter",
    }
  }
}

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string
  courseId: string
}): Promise<ApiResponse> {
  try {
    await verifyCourseAccess(courseId)

    const courseWithChapters = await db.streamCourse.findUnique({
      where: { id: courseId },
      select: {
        chapters: {
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        },
      },
    })

    if (!courseWithChapters) {
      return { status: "error", message: "Course not found" }
    }

    const chapters = courseWithChapters.chapters
    const chapterToDelete = chapters.find((c) => c.id === chapterId)

    if (!chapterToDelete) {
      return { status: "error", message: "Chapter not found in this course" }
    }

    // Reorder remaining chapters and delete target
    const remainingChapters = chapters.filter((c) => c.id !== chapterId)
    const updates = remainingChapters.map((c, index) =>
      db.streamChapter.update({
        where: { id: c.id },
        data: { position: index + 1 },
      })
    )

    await db.$transaction([
      ...updates,
      db.streamChapter.delete({
        where: { id: chapterId },
      }),
    ])

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${courseId}/edit`
    )

    return {
      status: "success",
      message: "Chapter deleted successfully",
    }
  } catch (error) {
    console.error("Failed to delete chapter:", error)
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to delete chapter",
    }
  }
}

export async function reorderChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  try {
    await verifyCourseAccess(courseId)

    if (!chapters || chapters.length === 0) {
      return { status: "error", message: "No chapters provided for reordering" }
    }

    const updates = chapters.map((chapter) =>
      db.streamChapter.update({
        where: { id: chapter.id, courseId },
        data: { position: chapter.position },
      })
    )

    await db.$transaction(updates)

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${courseId}/edit`
    )

    return {
      status: "success",
      message: "Chapters reordered successfully",
    }
  } catch (error) {
    console.error("Failed to reorder chapters:", error)
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to reorder chapters",
    }
  }
}

// ============================================
// LESSON ACTIONS
// ============================================

export async function createLesson(
  values: z.infer<typeof lessonSchema>
): Promise<ApiResponse> {
  try {
    await verifyCourseAccess(values.courseId)

    const result = lessonSchema.safeParse(values)
    if (!result.success) {
      return {
        status: "error",
        message: result.error.issues[0]?.message || "Invalid data",
      }
    }

    await db.$transaction(async (tx) => {
      // Get max position for this chapter
      const maxPos = await tx.streamLesson.findFirst({
        where: {
          chapterId: result.data.chapterId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      })

      // Create lesson with next position
      await tx.streamLesson.create({
        data: {
          title: result.data.title,
          description: result.data.description,
          videoUrl: result.data.videoUrl,
          duration: result.data.duration,
          chapterId: result.data.chapterId,
          position: (maxPos?.position ?? 0) + 1,
        },
      })
    })

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${values.courseId}/edit`
    )

    return {
      status: "success",
      message: "Lesson created successfully",
    }
  } catch (error) {
    console.error("Failed to create lesson:", error)
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to create lesson",
    }
  }
}

export async function updateLesson(
  lessonId: string,
  data: {
    title?: string
    description?: string | null
    videoUrl?: string | null
    duration?: number | null
    isPublished?: boolean
    isFree?: boolean
  }
): Promise<ApiResponse> {
  try {
    // Find lesson to get courseId for access verification
    const lesson = await db.streamLesson.findUnique({
      where: { id: lessonId },
      select: {
        chapter: {
          select: { courseId: true },
        },
      },
    })

    if (!lesson) {
      return { status: "error", message: "Lesson not found" }
    }

    await verifyCourseAccess(lesson.chapter.courseId)

    await db.streamLesson.update({
      where: { id: lessonId },
      data,
    })

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${lesson.chapter.courseId}/edit`
    )

    return {
      status: "success",
      message: "Lesson updated successfully",
    }
  } catch (error) {
    console.error("Failed to update lesson:", error)
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to update lesson",
    }
  }
}

export async function deleteLesson({
  lessonId,
  chapterId,
  courseId,
}: {
  lessonId: string
  chapterId: string
  courseId: string
}): Promise<ApiResponse> {
  try {
    await verifyCourseAccess(courseId)

    const chapterWithLessons = await db.streamChapter.findUnique({
      where: { id: chapterId },
      select: {
        lessons: {
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        },
      },
    })

    if (!chapterWithLessons) {
      return { status: "error", message: "Chapter not found" }
    }

    const lessons = chapterWithLessons.lessons
    const lessonToDelete = lessons.find((l) => l.id === lessonId)

    if (!lessonToDelete) {
      return { status: "error", message: "Lesson not found in this chapter" }
    }

    // Reorder remaining lessons and delete target
    const remainingLessons = lessons.filter((l) => l.id !== lessonId)
    const updates = remainingLessons.map((l, index) =>
      db.streamLesson.update({
        where: { id: l.id },
        data: { position: index + 1 },
      })
    )

    await db.$transaction([
      ...updates,
      db.streamLesson.delete({
        where: { id: lessonId },
      }),
    ])

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${courseId}/edit`
    )

    return {
      status: "success",
      message: "Lesson deleted successfully",
    }
  } catch (error) {
    console.error("Failed to delete lesson:", error)
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to delete lesson",
    }
  }
}

export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  try {
    await verifyCourseAccess(courseId)

    if (!lessons || lessons.length === 0) {
      return { status: "error", message: "No lessons provided for reordering" }
    }

    const updates = lessons.map((lesson) =>
      db.streamLesson.update({
        where: { id: lesson.id, chapterId },
        data: { position: lesson.position },
      })
    )

    await db.$transaction(updates)

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${courseId}/edit`
    )

    return {
      status: "success",
      message: "Lessons reordered successfully",
    }
  } catch (error) {
    console.error("Failed to reorder lessons:", error)
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to reorder lessons",
    }
  }
}
