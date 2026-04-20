// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

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

    // Get unique sections from timetable
    const timetableEntries = await db.timetable.findMany({
      where: { schoolId: auth.schoolId, teacherId: teacher.id },
      select: {
        sectionId: true,
        section: {
          select: {
            id: true,
            name: true,
            grade: { select: { id: true, name: true } },
            _count: { select: { students: true } },
          },
        },
        subject: { select: { id: true, name: true } },
      },
      distinct: ["sectionId", "subjectId"],
    })

    const data = timetableEntries
      .filter((e) => e.section)
      .map((e) => ({
        section_id: e.section!.id,
        section_name: e.section!.name,
        grade_name: e.section!.grade?.name || null,
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
