"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  countVisibleLessonsBySubject,
  hiddenLessonExclusion,
} from "@/components/lumos/lib/content-hidden"

export interface ChildProgress {
  student: {
    id: string
    firstName: string
    lastName: string
  }
  enrollments: Array<{
    id: string
    name: string
    subjectSlug: string
    isActive: boolean
    completedLessons: number
    totalLessons: number
    progressPercent: number
  }>
}

/**
 * Get the children linked to the current guardian and their learning progress.
 */
export async function getChildrenProgress(): Promise<ChildProgress[]> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user || !schoolId) return []

  // Find the guardian record for this user
  const guardian = await db.guardian.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      studentGuardians: {
        where: { schoolId },
        select: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userId: true,
            },
          },
        },
      },
    },
  })

  if (!guardian) return []

  // Map each child's userId → student record. Skip children with no user account.
  const studentsByUserId = new Map<
    string,
    { id: string; firstName: string; lastName: string }
  >()
  for (const sg of guardian.studentGuardians) {
    const s = sg.student
    if (s.userId) {
      studentsByUserId.set(s.userId, {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
      })
    }
  }

  const childUserIds = [...studentsByUserId.keys()]
  if (childUserIds.length === 0) return []

  // ONE query for all children's active enrollments (was per-child) — scoped
  // to the current school for tenant safety.
  const enrollments = await db.enrollment.findMany({
    where: {
      userId: { in: childUserIds },
      isActive: true,
      schoolId,
    },
    include: {
      subject: { select: { id: true, name: true, slug: true } },
      // Numerator excludes lessons the school has hidden, so it agrees with the
      // denominator below — otherwise a child could read past 100%.
      progress: {
        where: hiddenLessonExclusion(schoolId),
        select: { isCompleted: true },
      },
    },
  })

  // ONE query for the VISIBLE-lesson counts across every subject in play (was a
  // per-enrollment count, and counted lessons this school has hidden — so a
  // guardian saw a permanently capped percentage that disagreed with the one
  // the student saw on the course page).
  const subjectIds = [...new Set(enrollments.map((e) => e.subject.id))]
  const lessonCountBySubject = await countVisibleLessonsBySubject(
    schoolId,
    subjectIds
  )

  // Group enrollments by child and shape the result.
  const byUser = new Map<string, ChildProgress["enrollments"]>()
  for (const enrollment of enrollments) {
    const totalLessons = lessonCountBySubject.get(enrollment.subject.id) ?? 0
    const completedLessons = enrollment.progress.filter(
      (p) => p.isCompleted
    ).length
    const row = {
      id: enrollment.id,
      name: enrollment.subject.name,
      subjectSlug: enrollment.subject.slug,
      isActive: enrollment.isActive,
      completedLessons,
      totalLessons,
      progressPercent:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
    }
    const list = byUser.get(enrollment.userId) ?? []
    list.push(row)
    byUser.set(enrollment.userId, list)
  }

  // Preserve the original child ordering (guardian.studentGuardians order).
  const results: ChildProgress[] = []
  for (const [userId, student] of studentsByUserId) {
    results.push({ student, enrollments: byUser.get(userId) ?? [] })
  }

  return results
}
