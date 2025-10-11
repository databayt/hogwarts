"use server";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";

/**
 * Fetches a lesson by ID for admin editing
 */
export async function adminGetLesson(lessonId: string) {
  const lesson = await db.streamLesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: {
        include: {
          course: true,
        },
      },
      attachments: true,
    },
  });

  if (!lesson) {
    notFound();
  }

  return lesson;
}
