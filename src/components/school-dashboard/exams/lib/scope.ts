// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getStudentScopes } from "@/lib/teaching-scope"

/**
 * Get catalog subject IDs that a student (or guardian's children) are enrolled in.
 * Used to scope catalog-level content (quiz, mock) to relevant subjects.
 *
 * A student studies the subjects their grade teaches (SubjectSelection), plus
 * the subjects of any legacy classes they were enrolled in.
 */
export async function getEnrolledSubjectIds(
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

  const scopes = await getStudentScopes(schoolId, studentIds)
  const gradeIds = [
    ...new Set(scopes.map((s) => s.gradeId).filter((id): id is string => !!id)),
  ]
  const classIds = [...new Set(scopes.flatMap((s) => s.classIds))]

  const [selections, classes] = await Promise.all([
    gradeIds.length > 0
      ? db.subjectSelection.findMany({
          where: { schoolId, gradeId: { in: gradeIds }, isActive: true },
          select: { catalogSubjectId: true },
        })
      : Promise.resolve([]),
    classIds.length > 0
      ? db.class.findMany({
          where: { schoolId, id: { in: classIds } },
          select: { subjectId: true },
        })
      : Promise.resolve([]),
  ])

  const catalogSubjectIds = [
    ...new Set([
      ...selections.map((s) => s.catalogSubjectId),
      ...classes.map((c) => c.subjectId),
    ]),
  ]

  return catalogSubjectIds.length > 0 ? catalogSubjectIds : null
}
