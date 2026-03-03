// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

/**
 * Get class IDs assigned to a teacher (primary + co-teacher via ClassTeacher bridge).
 * Returns null for non-teachers (meaning "all classes").
 */
export async function getTeacherClassIds(
  schoolId: string,
  userId: string
): Promise<string[] | null> {
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!teacher) return null

  // Combine primary classes (Class.teacherId) and co-teacher assignments (ClassTeacher)
  const [primaryClasses, bridgeClasses] = await Promise.all([
    db.class.findMany({
      where: { schoolId, teacherId: teacher.id },
      select: { id: true },
    }),
    db.classTeacher.findMany({
      where: { schoolId, teacherId: teacher.id },
      select: { classId: true },
    }),
  ])

  const ids = new Set([
    ...primaryClasses.map((c) => c.id),
    ...bridgeClasses.map((ct) => ct.classId),
  ])

  return [...ids]
}

/**
 * Get class IDs filtered by grade, optionally intersected with teacher's classes.
 */
export async function getClassIdsByGrade(
  schoolId: string,
  gradeId: string,
  teacherClassIds?: string[] | null
): Promise<string[]> {
  const where: { schoolId: string; gradeId: string; id?: { in: string[] } } = {
    schoolId,
    gradeId,
  }

  // If teacher scoping is active, only return classes the teacher owns
  if (teacherClassIds && teacherClassIds.length > 0) {
    where.id = { in: teacherClassIds }
  }

  const classes = await db.class.findMany({
    where,
    select: { id: true },
  })

  return classes.map((c) => c.id)
}
