// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * What `{classId}` names in the mobile teacher routes. The class list
 * (`GET /api/mobile/teacher/classes`) returns sections, so it is a section id;
 * a legacy class id still resolves for one release of the Android app.
 *
 * Returns the exam audience a teacher may work with there: for a section,
 * its own exams and its grade's whole-grade exams, narrowed for a TEACHER to
 * the work they teach (`teacherExamsWhere`); for a legacy class, that class's
 * exams, if they lead or co-teach it.
 */

import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTeacherPairs, getTeacherSectionIds } from "@/lib/teaching-scope"
import { teacherExamsWhere } from "@/components/school-dashboard/exams/lib/audience"

import type { MobileAuthContext } from "../../../lib/authenticate"

export type ClassTarget =
  | {
      ok: true
      /** The section, when `{classId}` is one. */
      sectionId: string | null
      /** Exams the caller may open here. */
      examWhere: Prisma.SchoolExamWhereInput
    }
  | { ok: false; response: NextResponse }

const deny = (status: number, error: string): ClassTarget => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
})

export async function resolveClassTarget(
  auth: MobileAuthContext,
  classId: string
): Promise<ClassTarget> {
  const schoolId = auth.schoolId
  const [section, legacyClass, teacher] = await Promise.all([
    db.section.findFirst({
      where: { id: classId, schoolId },
      select: { id: true, gradeId: true },
    }),
    db.class.findFirst({
      where: { id: classId, schoolId },
      select: {
        id: true,
        teacherId: true,
        classTeachers: { select: { teacherId: true } },
      },
    }),
    auth.role === "TEACHER"
      ? db.teacher.findFirst({
          where: { userId: auth.userId, schoolId },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  if (!section && !legacyClass) return deny(404, "Class not found")
  if (auth.role === "TEACHER" && !teacher) return deny(403, "Forbidden")

  if (section) {
    const audience: Prisma.SchoolExamWhereInput = {
      OR: [
        { sectionId: section.id },
        { sectionId: null, gradeId: section.gradeId },
      ],
    }
    if (!teacher) {
      return { ok: true, sectionId: section.id, examWhere: audience }
    }
    const [sectionIds, pairs] = await Promise.all([
      getTeacherSectionIds(schoolId, auth.userId),
      getTeacherPairs(schoolId, teacher.id),
    ])
    if (!sectionIds.includes(section.id)) {
      return deny(403, "Not assigned to this class")
    }
    return {
      ok: true,
      sectionId: section.id,
      examWhere: {
        AND: [
          audience,
          teacherExamsWhere({
            teacherId: teacher.id,
            userId: auth.userId,
            pairs,
          }),
        ],
      },
    }
  }

  // Legacy class (one release)
  const cls = legacyClass!
  if (
    teacher &&
    cls.teacherId !== teacher.id &&
    !cls.classTeachers.some((ct) => ct.teacherId === teacher.id)
  ) {
    return deny(403, "Not assigned to this class")
  }
  return { ok: true, sectionId: null, examWhere: { classId: cls.id } }
}
