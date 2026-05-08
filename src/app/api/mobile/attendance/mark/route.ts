// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { AttendanceMethod, AttendanceStatus } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * POST /api/mobile/attendance/mark — mark attendance for a student
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
    const {
      student_id,
      section_id,
      date,
      status,
      notes,
      method = "MANUAL",
    } = body

    if (!student_id || !status) {
      return NextResponse.json(
        { error: "student_id and status required" },
        { status: 400 }
      )
    }

    // Verify the referenced student belongs to this tenant. Without this,
    // a teacher in school A could pass school B's studentId and pollute
    // school A's attendance ledger with a foreign student reference.
    const student = await db.student.findFirst({
      where: { id: student_id, schoolId: auth.schoolId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json(
        { error: "student_id is not a member of this school" },
        { status: 404 }
      )
    }

    // If a section is specified, verify it also belongs to this tenant.
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

    const record = await db.attendance.upsert({
      where: {
        schoolId_studentId_sectionId_date_periodId: {
          schoolId: auth.schoolId,
          studentId: student_id,
          sectionId: section_id || "",
          date: attendanceDate,
          periodId: "",
        },
      },
      create: {
        schoolId: auth.schoolId,
        studentId: student_id,
        sectionId: section_id || null,
        date: attendanceDate,
        status: status as AttendanceStatus,
        notes: notes || null,
        method: method as AttendanceMethod,
        markedBy: auth.userId,
        markedAt: new Date(),
      },
      update: {
        status: status as AttendanceStatus,
        notes: notes || null,
        method: method as AttendanceMethod,
        markedBy: auth.userId,
        markedAt: new Date(),
      },
      select: { id: true, studentId: true, date: true, status: true },
    })

    return NextResponse.json({
      id: record.id,
      student_id: record.studentId,
      date: record.date.toISOString(),
      status: record.status,
    })
  } catch (error) {
    console.error("Mobile mark attendance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
