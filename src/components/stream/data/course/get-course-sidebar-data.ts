"use server"

import { notFound } from "next/navigation"

import { db } from "@/lib/db"

/**
 * Fetches course data for sidebar navigation
 * Multi-tenant: Scoped by schoolId
 */
export async function getCourseSidebarData(
  slug: string,
  schoolId: string | null
) {
  if (!schoolId) {
    notFound()
  }

  const course = await db.streamCourse.findFirst({
    where: {
      slug,
      schoolId,
      isPublished: true,
    },
    include: {
      chapters: {
        where: { isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  })

  if (!course) {
    notFound()
  }

  return {
    course: {
      ...course,
      chapter: course.chapters, // Map chapters to chapter for backward compatibility
    },
  }
}
