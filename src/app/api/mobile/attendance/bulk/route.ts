// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { AttendanceStatus } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * POST /api/mobile/attendance/bulk — bulk mark attendance for a class
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    // Authorization: matches central attendance permission matrix (mark action)
    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "STAFF" &&
      auth.role !== "DEVELOPER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { records, section_id, date } = body

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "records array required" },
        { status: 400 }
      )
    }

    // Cap bulk size to prevent abuse and runaway transactions.
    const MAX_BULK_SIZE = 500
    if (records.length > MAX_BULK_SIZE) {
      return NextResponse.json(
        { error: `bulk limit ${MAX_BULK_SIZE} records` },
        { status: 400 }
      )
    }

    // Pre-validate every studentId belongs to this tenant before any write.
    const studentIds = records
      .map((r: { student_id?: string }) => r.student_id)
      .filter(Boolean) as string[]
    const validStudents = await db.student.findMany({
      where: { id: { in: studentIds }, schoolId: auth.schoolId },
      select: { id: true },
    })
    const validIds = new Set(validStudents.map((s) => s.id))
    const foreignIds = studentIds.filter((id) => !validIds.has(id))
    if (foreignIds.length > 0) {
      return NextResponse.json(
        {
          error: "one or more student_id values are not in this school",
          foreign_ids: foreignIds,
        },
        { status: 404 }
      )
    }

    if (section_id) {
      const section = await db.section.findFirst({
        where: { id: section_id, schoolId: auth.schoolId },
        select: { id: true },
      })
      if (!section) {
        return NextResponse.json(
          { error: "section_id is not a member of this school" },
          { status: 404 }
        )
      }
    }

    const attendanceDate = date ? new Date(date) : new Date()
    attendanceDate.setHours(0, 0, 0, 0)

    const results = await Promise.all(
      records.map((r: { student_id: string; status: string; notes?: string }) =>
        db.attendance.upsert({
          where: {
            schoolId_studentId_sectionId_date_periodId: {
              schoolId: auth.schoolId,
              studentId: r.student_id,
              sectionId: section_id || "",
              date: attendanceDate,
              periodId: "",
            },
          },
          create: {
            schoolId: auth.schoolId,
            studentId: r.student_id,
            sectionId: section_id || null,
            date: attendanceDate,
            status: r.status as AttendanceStatus,
            notes: r.notes || null,
            method: "MANUAL",
            markedBy: auth.userId,
            markedAt: new Date(),
          },
          update: {
            status: r.status as AttendanceStatus,
            notes: r.notes || null,
            markedBy: auth.userId,
            markedAt: new Date(),
          },
          select: { id: true, studentId: true, status: true },
        })
      )
    )

    return NextResponse.json({
      count: results.length,
      records: results.map((r) => ({
        id: r.id,
        student_id: r.studentId,
        status: r.status,
      })),
    })
  } catch (error) {
    console.error("Mobile bulk attendance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
