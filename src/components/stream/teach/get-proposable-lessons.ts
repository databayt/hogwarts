"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

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
 * Catalog (Lesson/Chapter/Subject) is platform-global, but school roles may
 * only propose for subjects their school has actually SELECTED (active
 * SubjectSelection). DEVELOPER (platform, no school) may enumerate everything.
 */
export async function getProposableLessons(): Promise<ProposableLesson[]> {
  const session = await auth()
  const role = session?.user?.role
  if (!session?.user?.id || !role) return []
  if (!PROPOSER_ROLES.includes(role as (typeof PROPOSER_ROLES)[number])) {
    return []
  }

  // Scope to the school's selected subjects for non-platform roles, so a
  // teacher can't propose videos for subjects the school never offers.
  let subjectWhere: Prisma.SubjectWhereInput = { status: "PUBLISHED" }
  if (role !== "DEVELOPER") {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return []
    const selections = await db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: { catalogSubjectId: true },
    })
    const selectedIds = selections.map((s) => s.catalogSubjectId)
    if (selectedIds.length === 0) return []
    subjectWhere = { status: "PUBLISHED", id: { in: selectedIds } }
  }

  const lessons = await db.lesson.findMany({
    where: {
      chapter: {
        subject: subjectWhere,
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
    // Safety cap: this enumerates the entire global catalog for the propose
    // dialog. Bound the payload; a future iteration should add server-side
    // search + cursor pagination for catalogs that exceed this.
    take: 500,
  })

  return lessons.map((l) => ({
    id: l.id,
    name: l.name,
    chapterName: l.chapter.name,
    subjectName: l.chapter.subject.name,
    subjectSlug: l.chapter.subject.slug,
  }))
}
