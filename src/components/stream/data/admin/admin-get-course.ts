"use server";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";

/**
 * Fetches a course by ID for admin editing
 * Multi-tenant: Scoped by schoolId
 */
export async function adminGetCourse(courseId: string, schoolId: string | null) {
  if (!schoolId) {
    notFound();
  }

  const course = await db.streamCourse.findFirst({
    where: {
      id: courseId,
      schoolId, // IMPORTANT: Multi-tenant scope
    },
    include: {
      category: true,
      chapters: {
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return course;
}
