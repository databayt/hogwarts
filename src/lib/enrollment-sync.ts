// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { PrismaClient } from "@prisma/client"

import { db } from "@/lib/db"
import { audienceRosterWhere, offeredToStream } from "@/lib/teaching-audience"

type EnrollmentClient = Pick<
  PrismaClient,
  "student" | "subjectSelection" | "enrollment"
>

/**
 * LMS access follows placement: a student gets an active Enrollment in every
 * subject their grade studies — the section's grade, else the grade they
 * were placed in. Run it whenever a student is placed or changes grade.
 *
 * Adds only. An Enrollment also holds lesson progress, a certificate or a
 * paid course, so moving grade never takes last year's subjects away. A row
 * the student has but can't use (pending checkout, cancelled, expired) is
 * switched on, because the school now grants it; a completed one is left.
 *
 * Safe inside a transaction (inserts skip duplicates rather than fail) and
 * never throws: a failed sync logs and leaves placement alone.
 */
export async function syncStudentSubjectEnrollments(
  schoolId: string,
  studentId: string,
  client: EnrollmentClient = db
): Promise<{ subjectIds: string[]; created: number }> {
  try {
    const student = await client.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        userId: true,
        academicGradeId: true,
        academicStreamId: true,
        section: { select: { gradeId: true } },
      },
    })
    const gradeId = student?.section?.gradeId ?? student?.academicGradeId
    if (!student?.userId || !gradeId) return { subjectIds: [], created: 0 }

    const selections = await client.subjectSelection.findMany({
      where: { schoolId, gradeId, isActive: true },
      select: { catalogSubjectId: true, streamId: true },
    })
    const subjectIds = [
      ...new Set(
        selections
          .filter((s) => offeredToStream(s.streamId, student.academicStreamId))
          .map((s) => s.catalogSubjectId)
      ),
    ]
    if (subjectIds.length === 0) return { subjectIds, created: 0 }

    const userId = student.userId
    await client.enrollment.updateMany({
      where: {
        userId,
        catalogSubjectId: { in: subjectIds },
        status: { not: "COMPLETED" },
        OR: [{ isActive: false }, { status: { not: "ACTIVE" } }],
      },
      data: { isActive: true, status: "ACTIVE" },
    })
    const { count: created } = await client.enrollment.createMany({
      data: subjectIds.map((catalogSubjectId) => ({
        userId,
        catalogSubjectId,
        schoolId,
        isActive: true,
        status: "ACTIVE" as const,
      })),
      skipDuplicates: true,
    })
    return { subjectIds, created }
  } catch (error) {
    console.warn(
      `[syncStudentSubjectEnrollments] Failed for student=${studentId}:`,
      error
    )
    return { subjectIds: [], created: 0 }
  }
}

/**
 * The same, for a whole grade at once — run when a subject joins a grade (or
 * comes back), so the grade's active students find it in Lumos. Adds only.
 */
export async function syncGradeSubjectEnrollments(
  schoolId: string,
  gradeId: string,
  client: EnrollmentClient = db
): Promise<{ created: number }> {
  try {
    const [students, selections] = await Promise.all([
      client.student.findMany({
        where: {
          ...audienceRosterWhere(schoolId, {
            classId: null,
            gradeId,
            sectionId: null,
          }),
          status: "ACTIVE",
          userId: { not: null },
        },
        select: { userId: true, academicStreamId: true },
      }),
      client.subjectSelection.findMany({
        where: { schoolId, gradeId, isActive: true },
        select: { catalogSubjectId: true, streamId: true },
      }),
    ])

    const rows = new Map<string, { userId: string; catalogSubjectId: string }>()
    for (const student of students) {
      if (!student.userId) continue
      for (const selection of selections) {
        if (!offeredToStream(selection.streamId, student.academicStreamId))
          continue
        rows.set(`${student.userId}|${selection.catalogSubjectId}`, {
          userId: student.userId,
          catalogSubjectId: selection.catalogSubjectId,
        })
      }
    }

    let created = 0
    const all = [...rows.values()]
    for (let i = 0; i < all.length; i += 1000) {
      const { count } = await client.enrollment.createMany({
        data: all.slice(i, i + 1000).map((row) => ({
          ...row,
          schoolId,
          isActive: true,
          status: "ACTIVE" as const,
        })),
        skipDuplicates: true,
      })
      created += count
    }
    return { created }
  } catch (error) {
    console.warn(
      `[syncGradeSubjectEnrollments] Failed for grade=${gradeId}:`,
      error
    )
    return { created: 0 }
  }
}
