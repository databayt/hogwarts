// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/students/:studentId — student detail
 * PUT /api/mobile/students/:studentId — update student
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { studentId } = await params

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId: auth.schoolId },
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
    console.error("Mobile student detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/mobile/students/:studentId — delete a student (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { studentId } = await params

    const existing = await db.student.findFirst({
      where: { id: studentId, schoolId: auth.schoolId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Soft delete: set status to INACTIVE
    await db.student.update({
      where: { id: studentId },
      data: { status: "INACTIVE" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile delete student error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { studentId } = await params
    const body = await request.json()

    const existing = await db.student.findFirst({
      where: { id: studentId, schoolId: auth.schoolId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.given_name !== undefined) updateData.firstName = body.given_name
    if (body.family_name !== undefined) updateData.lastName = body.family_name
    if (body.gender !== undefined) updateData.gender = body.gender
    if (body.section_id !== undefined) updateData.sectionId = body.section_id
    if (body.status !== undefined) updateData.status = body.status

    const student = await db.student.update({
      where: { id: studentId },
      data: updateData,
      select: { id: true, firstName: true, lastName: true, status: true },
    })

    return NextResponse.json({
      id: student.id,
      given_name: student.firstName,
      family_name: student.lastName,
      status: student.status,
    })
  } catch (error) {
    console.error("Mobile update student error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
