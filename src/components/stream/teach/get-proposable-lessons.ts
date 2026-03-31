"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"

/**
 * Fetch lessons that a teacher can propose videos for.
 * Returns a flat list of lessons with their chapter and subject context.
 */
export async function getProposableLessons() {
  const lessons = await db.lesson.findMany({
    where: {
      chapter: {
        subject: { status: "PUBLISHED" },
      },
    },
    select: {
      id: true,
      name: true,
      chapter: {
        select: {
          name: true,
          subject: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: [
      { chapter: { subject: { name: "asc" } } },
      { chapter: { sequenceOrder: "asc" } },
      { sequenceOrder: "asc" },
    ],
  })

  return lessons.map((l) => ({
    id: l.id,
    name: l.name,
    chapterName: l.chapter.name,
    subjectName: l.chapter.subject.name,
    subjectSlug: l.chapter.subject.slug,
  }))
}
