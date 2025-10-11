"use server";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";

/**
 * Fetches a course by ID for admin editing
 */
export async function adminGetCourse(courseId: string) {
  const course = await db.streamCourse.findUnique({
    where: { id: courseId },
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
