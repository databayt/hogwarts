// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/attendance/class/:classId — class attendance records
 *
 * classId here is treated as sectionId (homeroom section).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { classId } = await params
    const { searchParams } = new URL(request.url)
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0]

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(attendanceDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Get all students in section
    const students = await db.student.findMany({
      where: { schoolId: auth.schoolId, sectionId: classId, status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
      },
      orderBy: { firstName: "asc" },
    })

    // Get attendance records for the date
    const records = await db.attendance.findMany({
      where: {
        schoolId: auth.schoolId,
        sectionId: classId,
        date: { gte: attendanceDate, lt: nextDay },
        deletedAt: null,
      },
      select: { studentId: true, status: true, notes: true },
    })

    const recordMap = new Map(records.map((r) => [r.studentId, r]))

    const data = students.map((s) => {
      const record = recordMap.get(s.id)
      return {
        student_id: s.id,
        student_name: [s.firstName, s.lastName].filter(Boolean).join(" "),
        photo_url: s.profilePhotoUrl,
        status: record?.status || null,
        notes: record?.notes || null,
      }
    })

    return NextResponse.json({
      date,
      section_id: classId,
      total_students: students.length,
      marked: records.length,
      data,
    })
  } catch (error) {
    console.error("Mobile class attendance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
