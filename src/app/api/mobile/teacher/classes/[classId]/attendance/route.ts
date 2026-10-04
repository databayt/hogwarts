// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { AttendanceStatus, type Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTeacherSectionIds } from "@/components/school-dashboard/attendance/actions/helpers"

import { authenticate, isAuthError } from "../../../../lib/authenticate"
import { hasRole } from "../../../../lib/roles"

const bodySchema = z.object({
  date: z.string().optional(),
  records: z
    .array(
      z.object({
        student_id: z.string().min(1),
        status: z.nativeEnum(AttendanceStatus),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1),
})

/**
 * POST /api/mobile/teacher/classes/:classId/attendance — a section's day of
 * attendance in one batch.
 *
 * `:classId` is the section id `/teacher/classes` returns (the URL keeps its
 * old name for app builds). A teacher may mark their own sections — homeroom,
 * a timetable period or a subject assignment — and every student must be in
 * the section.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (!hasRole(auth, "TEACHER", "ADMIN", "DEVELOPER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { classId: sectionId } = await params
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "records array required" },
        { status: 400 }
      )
    }
    const { records, date } = parsed.data

    const section = await db.section.findFirst({
      where: { id: sectionId, schoolId: auth.schoolId },
      select: { id: true },
    })
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    if (auth.role === "TEACHER") {
      const own = await getTeacherSectionIds(auth.schoolId, auth.userId)
      if (!own.includes(sectionId)) {
        return NextResponse.json(
          { error: "Not assigned to this section" },
          { status: 403 }
        )
      }
    }

    // Every student must be this school's and in the section.
    const studentIds = [...new Set(records.map((r) => r.student_id))]
    const members = await db.student.findMany({
      where: { schoolId: auth.schoolId, sectionId, id: { in: studentIds } },
      select: { id: true },
    })
    if (members.length !== studentIds.length) {
      return NextResponse.json(
        { error: "Some students are not in this section" },
        { status: 400 }
      )
    }

    const attendanceDate = date ? new Date(date) : new Date()
    attendanceDate.setHours(0, 0, 0, 0)

    // A day's mark has no period, and Postgres treats NULL periods as
    // distinct, so the unique key can't upsert it: find the day's rows (a
    // soft-deleted one too — it still holds the key) and update or create.
    const existing = await db.attendance.findMany({
      where: {
        schoolId: auth.schoolId,
        sectionId,
        date: attendanceDate,
        periodId: null,
        studentId: { in: studentIds },
      },
      select: { id: true, studentId: true },
    })
    const existingByStudent = new Map(existing.map((r) => [r.studentId, r.id]))

    const now = new Date()
    await db.$transaction(async (tx) => {
      const toCreate: Prisma.AttendanceCreateManyInput[] = []
      for (const r of records) {
        const id = existingByStudent.get(r.student_id)
        if (id) {
          await tx.attendance.updateMany({
            where: { id, schoolId: auth.schoolId },
            data: {
              status: r.status,
              notes: r.notes || null,
              markedBy: auth.userId,
              markedAt: now,
              deletedAt: null,
            },
          })
        } else {
          toCreate.push({
            schoolId: auth.schoolId,
            studentId: r.student_id,
            sectionId,
            date: attendanceDate,
            status: r.status,
            notes: r.notes || null,
            method: "MANUAL",
            markedBy: auth.userId,
            markedAt: now,
          })
        }
      }
      if (toCreate.length > 0) {
        await tx.attendance.createMany({ data: toCreate })
      }
    })

    const saved = await db.attendance.findMany({
      where: {
        schoolId: auth.schoolId,
        sectionId,
        date: attendanceDate,
        periodId: null,
        studentId: { in: studentIds },
      },
      select: { id: true, studentId: true, status: true },
    })

    return NextResponse.json({
      count: saved.length,
      records: saved.map((r) => ({
        id: r.id,
        student_id: r.studentId,
        status: r.status,
      })),
    })
  } catch (error) {
    console.error("Mobile teacher attendance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
