"use server";

import { db } from "@/lib/db";

/**
 * Fetches all published courses for a school
 * Multi-tenant: Scoped by schoolId
 */
export async function getAllCourses(schoolId: string | null) {
  if (!schoolId) {
    return [];
  }

  const courses = await db.streamCourse.findMany({
    where: {
      schoolId,
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
