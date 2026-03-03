// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

/**
 * Get catalog subject IDs that a student (or guardian's children) are enrolled in.
 * Used to scope catalog-level content (quiz, mock) to relevant subjects.
 *
 * Chain: Student → StudentClass → Class → Subject → catalogSubjectId
 */
export async function getEnrolledCatalogSubjectIds(
  role: string | undefined,
  userId: string | undefined,
  schoolId: string
): Promise<string[] | null> {
  if (!userId) return null

  let studentIds: string[] = []

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (!student) return null
    studentIds = [student.id]
  } else if (role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (!guardian) return null
    const sgs = await db.studentGuardian.findMany({
      where: { guardianId: guardian.id, schoolId },
      select: { studentId: true },
    })
    studentIds = sgs.map((sg) => sg.studentId)
  } else {
    return null
  }

  if (studentIds.length === 0) return null

  // Get class enrollments → subjects → catalogSubjectId
  const classes = await db.studentClass.findMany({
    where: { studentId: { in: studentIds }, schoolId },
    include: {
      class: {
        select: {
          subject: { select: { catalogSubjectId: true } },
        },
      },
    },
  })

  const catalogSubjectIds = [
    ...new Set(
      classes
        .map((sc) => sc.class.subject?.catalogSubjectId)
        .filter(Boolean) as string[]
    ),
  ]

  return catalogSubjectIds.length > 0 ? catalogSubjectIds : null
}
