"use server";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";

/**
 * Fetches course data for sidebar navigation
 */
export async function getCourseSidebarData(slug: string) {
  const course = await db.streamCourse.findFirst({
    where: {
      slug,
      isPublished: true
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
  });

  if (!course) {
    notFound();
  }

  return {
    course: {
      ...course,
      chapter: course.chapters, // Map chapters to chapter for backward compatibility
    },
  };
}
