// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { AttendanceStatus } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

/**
 * POST /api/mobile/teacher/classes/:classId/attendance — batch attendance for a class
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { classId } = await params
    const body = await request.json()
    const { records, date } = body

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "records array required" },
        { status: 400 }
      )
    }

    // Verify teacher is assigned to this class
    if (auth.role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true },
      })

      if (!teacher) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Check via Class or ClassTeacher
      const assigned = await db.class.findFirst({
        where: {
          id: classId,
          schoolId: auth.schoolId,
          OR: [
            { teacherId: teacher.id },
            { classTeachers: { some: { teacherId: teacher.id } } },
          ],
        },
        select: { id: true },
      })

      if (!assigned) {
        return NextResponse.json(
          { error: "Not assigned to this class" },
          { status: 403 }
        )
      }
    }

    // Verify class exists in school
    const classRecord = await db.class.findFirst({
      where: { id: classId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const attendanceDate = date ? new Date(date) : new Date()
    attendanceDate.setHours(0, 0, 0, 0)

    const results = await Promise.all(
      records.map((r: { student_id: string; status: string; notes?: string }) =>
        db.attendance.upsert({
          where: {
            schoolId_studentId_classId_date_periodId: {
              schoolId: auth.schoolId,
              studentId: r.student_id,
              classId,
              date: attendanceDate,
              periodId: "",
            },
          },
          create: {
            schoolId: auth.schoolId,
            studentId: r.student_id,
            classId,
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
    console.error("Mobile teacher attendance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
