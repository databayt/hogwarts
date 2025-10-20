"use server";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";

/**
 * Fetches individual course with full details
 * Multi-tenant: Scoped by schoolId
 */
export async function getIndividualCourse(slug: string, schoolId: string | null) {
  if (!schoolId) {
    notFound();
  }

  const course = await db.streamCourse.findFirst({
    where: {
      slug,
      schoolId,
      isPublished: true,
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      chapters: {
        where: { isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              position: true,
              duration: true,
              isFree: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return course;
}

export type IndividualCourseType = Awaited<ReturnType<typeof getIndividualCourse>>;
