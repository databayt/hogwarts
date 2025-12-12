"use server";

import { db } from "@/lib/db";

/**
 * Fetches all published courses for a school filtered by language
 * Multi-tenant: Scoped by schoolId
 * @param schoolId - The school ID for multi-tenant filtering
 * @param lang - Language code ("en" or "ar") to filter courses by
 */
export async function getAllCourses(schoolId: string | null, lang: string = "en") {
  if (!schoolId) {
    return [];
  }

  const courses = await db.streamCourse.findMany({
    where: {
      schoolId,
      lang,
      isPublished: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      imageUrl: true,
      price: true,
      lang: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          chapters: {
            where: { isPublished: true },
          },
          enrollments: true,
        },
      },
    },
  });

  return courses;
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];
