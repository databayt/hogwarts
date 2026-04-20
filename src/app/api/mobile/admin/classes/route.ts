// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/admin/classes — list sections with student counts
 *
 * Admin/Super Admin only.
 * Query params: page, per_page
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (
      auth.role !== "ADMIN" &&
      auth.role !== "SUPER_ADMIN" &&
      auth.role !== "DEVELOPER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "50")
    const skip = (page - 1) * perPage

    const where = { schoolId: auth.schoolId }

    const [sections, total] = await Promise.all([
      db.section.findMany({
        where,
        orderBy: [{ grade: { gradeNumber: "asc" } }, { letter: "asc" }],
        skip,
        take: perPage,
        select: {
          id: true,
          name: true,
          letter: true,
          maxCapacity: true,
          grade: { select: { id: true, name: true, gradeNumber: true } },
          homeroomTeacher: {
            select: { id: true, firstName: true, lastName: true },
          },
          classroom: { select: { id: true, roomName: true } },
          _count: {
            select: {
              students: { where: { status: "ACTIVE" } },
            },
          },
        },
      }),
      db.section.count({ where }),
    ])

    const data = sections.map((s) => ({
      id: s.id,
      name: s.name,
      letter: s.letter,
      max_capacity: s.maxCapacity,
      student_count: s._count.students,
      grade: s.grade
        ? {
            id: s.grade.id,
            name: s.grade.name,
            number: s.grade.gradeNumber,
          }
        : null,
      homeroom_teacher: s.homeroomTeacher
        ? {
            id: s.homeroomTeacher.id,
            name: [s.homeroomTeacher.firstName, s.homeroomTeacher.lastName]
              .filter(Boolean)
              .join(" "),
          }
        : null,
      classroom: s.classroom
        ? { id: s.classroom.id, name: s.classroom.roomName }
        : null,
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile admin classes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
