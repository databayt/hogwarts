// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { ExcuseReason, ExcuseStatus, Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { excuseReasonSchema } from "@/components/school-dashboard/attendance/shared/validation"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { canAccessStudent } from "../../lib/student-access"

const STAFF_ROLES = ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"]

// snake_case body the iOS client sends; bounded + enum-validated.
const mobileExcuseSchema = z.object({
  attendance_id: z.string().min(1),
  reason: excuseReasonSchema,
  description: z.string().max(2000).optional(),
  attachments: z.array(z.string().url()).max(5).optional().default([]),
})

/**
 * GET  /api/mobile/attendance/excuses — list excuses
 * POST /api/mobile/attendance/excuses — submit an excuse
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const studentId = searchParams.get("student_id") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "50")
    const skip = (page - 1) * perPage

    // Access scoping: staff see all school excuses; a STUDENT/GUARDIAN may only
    // see excuses for students they own / are linked to. Without this, any
    // authenticated caller could list every student's excuse (with names).
    const isStaff = STAFF_ROLES.includes(auth.role)
    let attendanceFilter: Prisma.AttendanceWhereInput
    if (studentId) {
      if (!(await canAccessStudent(auth, studentId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      attendanceFilter = { studentId }
    } else if (isStaff) {
      attendanceFilter = {}
    } else if (auth.role === "STUDENT") {
      attendanceFilter = { student: { userId: auth.userId } }
    } else if (auth.role === "GUARDIAN") {
      attendanceFilter = {
        student: {
          studentGuardians: { some: { guardian: { userId: auth.userId } } },
        },
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const where = {
      schoolId: auth.schoolId,
      ...(status ? { status: status as ExcuseStatus } : {}),
      attendance: attendanceFilter,
    }

    const [excuses, total] = await Promise.all([
      db.attendanceExcuse.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          attendanceId: true,
          reason: true,
          description: true,
          attachments: true,
          status: true,
          submittedBy: true,
          submittedAt: true,
          reviewedBy: true,
          reviewedAt: true,
          reviewNotes: true,
          attendance: {
            select: {
              date: true,
              status: true,
              studentId: true,
              student: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      db.attendanceExcuse.count({ where }),
    ])

    const data = excuses.map((e) => ({
      id: e.id,
      attendance_id: e.attendanceId,
      attendance_date: e.attendance.date.toISOString(),
      attendance_status: e.attendance.status,
      student_id: e.attendance.studentId,
      student_name: `${e.attendance.student.firstName} ${e.attendance.student.lastName}`,
      reason: e.reason,
      description: e.description,
      attachments: e.attachments,
      status: e.status,
      submitted_by: e.submittedBy,
      submitted_at: e.submittedAt.toISOString(),
      reviewed_by: e.reviewedBy,
      reviewed_at: e.reviewedAt?.toISOString() || null,
      review_notes: e.reviewNotes,
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile list excuses error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const parsed = mobileExcuseSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400 }
      )
    }
    const { attendance_id, reason, description, attachments } = parsed.data

    // Verify the attendance record belongs to this school (+ get its student)
    const attendance = await db.attendance.findFirst({
      where: { id: attendance_id, schoolId: auth.schoolId, deletedAt: null },
      select: { id: true, studentId: true },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      )
    }

    // Authorization: only staff, the student, or a linked guardian may submit
    // an excuse for this student — NOT any authenticated user in the school.
    if (!(await canAccessStudent(auth, attendance.studentId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check no existing excuse for this attendance
    const existingExcuse = await db.attendanceExcuse.findUnique({
      where: { attendanceId: attendance_id },
      select: { id: true },
    })

    if (existingExcuse) {
      return NextResponse.json(
        { error: "Excuse already exists for this attendance record" },
        { status: 409 }
      )
    }

    const excuse = await db.attendanceExcuse.create({
      data: {
        schoolId: auth.schoolId,
        attendanceId: attendance_id,
        reason: reason as ExcuseReason,
        description: description || null,
        attachments: attachments || [],
        status: "PENDING",
        submittedBy: auth.userId,
      },
      select: {
        id: true,
        attendanceId: true,
        reason: true,
        description: true,
        attachments: true,
        status: true,
        submittedBy: true,
        submittedAt: true,
      },
    })

    return NextResponse.json(
      {
        id: excuse.id,
        attendance_id: excuse.attendanceId,
        reason: excuse.reason,
        description: excuse.description,
        attachments: excuse.attachments,
        status: excuse.status,
        submitted_by: excuse.submittedBy,
        submitted_at: excuse.submittedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Mobile submit excuse error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
