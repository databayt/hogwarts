// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/guardian/children/:childId — child detail
 *
 * Verifies the authenticated user is a guardian of the child.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { childId } = await params

    // Verify guardian relationship
    const guardian = await db.guardian.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!guardian) {
      return NextResponse.json({ error: "Not a guardian" }, { status: 403 })
    }

    const link = await db.studentGuardian.findFirst({
      where: {
        guardianId: guardian.id,
        studentId: childId,
        schoolId: auth.schoolId,
      },
      select: { id: true },
    })

    if (!link) {
      return NextResponse.json(
        { error: "Not authorized for this child" },
        { status: 403 }
      )
    }

    const student = await db.student.findFirst({
      where: { id: childId, schoolId: auth.schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        grNumber: true,
        studentId: true,
        gender: true,
        dateOfBirth: true,
        nationality: true,
        bloodGroup: true,
        status: true,
        profilePhotoUrl: true,
        email: true,
        mobileNumber: true,
        enrollmentDate: true,
        admissionNumber: true,
        section: {
          select: {
            id: true,
            name: true,
            grade: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: student.id,
      given_name: student.firstName,
      family_name: student.lastName,
      gr_number: student.grNumber,
      student_id: student.studentId,
      gender: student.gender,
      date_of_birth: student.dateOfBirth?.toISOString() || null,
      nationality: student.nationality,
      blood_group: student.bloodGroup,
      status: student.status,
      photo_url: student.profilePhotoUrl,
      email: student.email,
      phone: student.mobileNumber,
      enrollment_date: student.enrollmentDate?.toISOString() || null,
      admission_number: student.admissionNumber,
      section: student.section
        ? {
            id: student.section.id,
            name: student.section.name,
            grade: student.section.grade?.name,
          }
        : null,
    })
  } catch (error) {
    console.error("Mobile guardian child detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
