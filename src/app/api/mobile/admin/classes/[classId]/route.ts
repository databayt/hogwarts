// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/admin/classes/:classId — section detail with roster
 *
 * Admin/Super Admin only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
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

    const { classId } = await params

    const section = await db.section.findFirst({
      where: { id: classId, schoolId: auth.schoolId },
      select: {
        id: true,
        name: true,
        letter: true,
        maxCapacity: true,
        grade: { select: { id: true, name: true, gradeNumber: true } },
        homeroomTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            emailAddress: true,
            profilePhotoUrl: true,
          },
        },
        classroom: { select: { id: true, roomName: true, capacity: true } },
        students: {
          where: { status: "ACTIVE" },
          orderBy: { firstName: "asc" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grNumber: true,
            studentId: true,
            gender: true,
            status: true,
            profilePhotoUrl: true,
          },
        },
      },
    })

    if (!section) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: section.id,
      name: section.name,
      letter: section.letter,
      max_capacity: section.maxCapacity,
      student_count: section.students.length,
      grade: section.grade
        ? {
            id: section.grade.id,
            name: section.grade.name,
            number: section.grade.gradeNumber,
          }
        : null,
      homeroom_teacher: section.homeroomTeacher
        ? {
            id: section.homeroomTeacher.id,
            name: [
              section.homeroomTeacher.firstName,
              section.homeroomTeacher.lastName,
            ]
              .filter(Boolean)
              .join(" "),
            email: section.homeroomTeacher.emailAddress,
            photo_url: section.homeroomTeacher.profilePhotoUrl,
          }
        : null,
      classroom: section.classroom
        ? {
            id: section.classroom.id,
            name: section.classroom.roomName,
            capacity: section.classroom.capacity,
          }
        : null,
      students: section.students.map((s) => ({
        id: s.id,
        given_name: s.firstName,
        family_name: s.lastName,
        gr_number: s.grNumber,
        student_id: s.studentId,
        gender: s.gender,
        status: s.status,
        photo_url: s.profilePhotoUrl,
      })),
    })
  } catch (error) {
    console.error("Mobile admin class detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
