"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface ChildProgress {
  student: {
    id: string
    givenName: string
    surname: string
  }
  enrollments: Array<{
    id: string
    subjectName: string
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
              givenName: true,
              surname: true,
              userId: true,
            },
          },
        },
      },
    },
  })

  if (!guardian) return []

  const results: ChildProgress[] = []

  for (const sg of guardian.studentGuardians) {
    const student = sg.student
    if (!student.userId) continue

    // Get enrollments for this student (scoped to current school)
    const enrollments = await db.enrollment.findMany({
      where: {
        userId: student.userId,
        isActive: true,
        schoolId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        progress: {
          select: { isCompleted: true },
        },
      },
    })

    // For each enrollment, count total lessons in the subject
    const enriched = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLessons = await db.catalogLesson.count({
          where: {
            chapter: { subjectId: enrollment.subject.id },
            status: "PUBLISHED",
          },
        })

        const completedLessons = enrollment.progress.filter(
          (p) => p.isCompleted
        ).length

        return {
          id: enrollment.id,
          subjectName: enrollment.subject.name,
          subjectSlug: enrollment.subject.slug,
          isActive: enrollment.isActive,
          completedLessons,
          totalLessons,
          progressPercent:
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0,
        }
      })
    )

    results.push({
      student: {
        id: student.id,
        givenName: student.givenName,
        surname: student.surname,
      },
      enrollments: enriched,
    })
  }

  return results
}
