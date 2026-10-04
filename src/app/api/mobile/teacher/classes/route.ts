// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/teacher/classes — teacher's assigned classes/sections
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const teacher = await db.teacher.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!teacher) {
      return NextResponse.json({ data: [] })
    }

    // What this teacher teaches: subject assignments (SubjectTeacher, the
    // source of truth) plus any timetable periods they hold, one entry per
    // (section, subject).
    const { term } = await resolveActiveTerm(auth.schoolId)
    const sectionSelect = {
      id: true,
      name: true,
      grade: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    } as const
    const [assignments, timetableEntries] = await Promise.all([
      term
        ? db.subjectTeacher.findMany({
            where: {
              schoolId: auth.schoolId,
              termId: term.id,
              teacherId: teacher.id,
            },
            select: {
              section: { select: sectionSelect },
              subject: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
      db.timetable.findMany({
        where: { schoolId: auth.schoolId, teacherId: teacher.id },
        select: {
          section: { select: sectionSelect },
          subject: { select: { id: true, name: true } },
        },
        distinct: ["sectionId", "subjectId"],
      }),
    ])

    const seen = new Set<string>()
    const data = [...assignments, ...timetableEntries]
      .filter((e) => {
        if (!e.section) return false
        const key = `${e.section.id}:${e.subject?.id ?? ""}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((e) => ({
        section_id: e.section!.id,
        section_name: e.section!.name,
        grade_name: e.section!.grade?.name || null,
        subject_id: e.subject?.id || null,
        subject_name: e.subject?.name || null,
        student_count: e.section!._count.students,
      }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile teacher classes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
