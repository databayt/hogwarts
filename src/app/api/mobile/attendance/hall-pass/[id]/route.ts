// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { HallPassStatus } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * PUT /api/mobile/attendance/hall-pass/:id — update a hall pass
 *
 * Body: { status?, returned_at? }
 * If status is "RETURNED", sets returned_at to now automatically.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    // Authorization: hall passes are managed by classroom staff.
    // "SUPER_ADMIN" is dead code → "DEVELOPER"; STAFF added.
    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "STAFF" &&
      auth.role !== "DEVELOPER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, returned_at } = body

    // Verify the pass belongs to this school
    const existing = await db.hallPass.findFirst({
      where: { id, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Hall pass not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status as HallPassStatus
    }
    if (status === "RETURNED") {
      updateData.returnedAt = returned_at ? new Date(returned_at) : new Date()
    } else if (returned_at) {
      updateData.returnedAt = new Date(returned_at)
    }

    // MULTI-TENANT: scope the write by schoolId (updateMany allows a non-unique
    // where; a bare-PK update could touch another school's row in a TOCTOU race),
    // then re-read the scoped row for the response.
    const writeResult = await db.hallPass.updateMany({
      where: { id, schoolId: auth.schoolId },
      data: updateData,
    })

    if (writeResult.count === 0) {
      return NextResponse.json(
        { error: "Hall pass not found" },
        { status: 404 }
      )
    }

    const updated = await db.hallPass.findFirst({
      where: { id, schoolId: auth.schoolId },
      select: {
        id: true,
        studentId: true,
        classId: true,
        destination: true,
        destinationNote: true,
        issuedBy: true,
        issuedAt: true,
        expectedDuration: true,
        expectedReturn: true,
        returnedAt: true,
        status: true,
        student: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    if (!updated) {
      return NextResponse.json(
        { error: "Hall pass not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: updated.id,
      student_id: updated.studentId,
      student_name: `${updated.student.firstName} ${updated.student.lastName}`,
      class_id: updated.classId,
      destination: updated.destination,
      destination_note: updated.destinationNote,
      issued_by: updated.issuedBy,
      issued_at: updated.issuedAt.toISOString(),
      expected_duration: updated.expectedDuration,
      expected_return: updated.expectedReturn.toISOString(),
      returned_at: updated.returnedAt?.toISOString() || null,
      status: updated.status,
    })
  } catch (error) {
    console.error("Mobile update hall pass error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
