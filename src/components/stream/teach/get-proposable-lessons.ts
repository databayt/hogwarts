"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"

const PROPOSER_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"] as const

export type ProposableLesson = {
  id: string
  name: string
  chapterName: string
  subjectName: string
  subjectSlug: string
}

/**
 * Fetch lessons that a teacher can propose videos for.
 * Returns a flat list of lessons with their chapter and subject context.
 *
 * Catalog (Lesson/Chapter/Subject) is platform-global — no schoolId scope —
 * but only authenticated proposer roles may enumerate it.
 */
export async function getProposableLessons(): Promise<ProposableLesson[]> {
  const session = await auth()
  const role = session?.user?.role
  if (!session?.user?.id || !role) return []
  if (!PROPOSER_ROLES.includes(role as (typeof PROPOSER_ROLES)[number])) {
    return []
  }

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
