"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { notFound } from "next/navigation"

import { db } from "@/lib/db"

/**
 * Fetches a lesson by ID for admin editing
 * Multi-tenant: Scoped by schoolId through course relationship
 */
export async function adminGetLesson(
  lessonId: string,
  schoolId: string | null
) {
  if (!schoolId) {
    notFound()
  }

  const lesson = await db.streamLesson.findFirst({
    where: {
      id: lessonId,
      chapter: {
        course: {
          schoolId, // IMPORTANT: Multi-tenant scope through relationship
        },
      },
    },
    include: {
      chapter: {
        include: {
          course: true,
        },
      },
      attachments: true,
    },
  })

  if (!lesson) {
    notFound()
  }

  return lesson
}
