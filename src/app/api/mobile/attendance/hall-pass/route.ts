// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { HallPassDestination, HallPassStatus } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * POST /api/mobile/attendance/hall-pass — create a hall pass
 * GET  /api/mobile/attendance/hall-pass — list hall passes
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      student_id,
      class_id,
      destination,
      destination_note,
      expected_duration,
    } = body

    if (!student_id || !class_id || !destination || !expected_duration) {
      return NextResponse.json(
        {
          error:
            "student_id, class_id, destination, and expected_duration required",
        },
        { status: 400 }
      )
    }

    const now = new Date()
    const expectedReturn = new Date(
      now.getTime() + expected_duration * 60 * 1000
    )

    const pass = await db.hallPass.create({
      data: {
        schoolId: auth.schoolId,
        studentId: student_id,
        classId: class_id,
        destination: destination as HallPassDestination,
        destinationNote: destination_note || null,
        issuedBy: auth.userId,
        issuedAt: now,
        expectedDuration: expected_duration,
        expectedReturn,
        status: "ACTIVE",
      },
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
      },
    })

    return NextResponse.json({
      id: pass.id,
      student_id: pass.studentId,
      class_id: pass.classId,
      destination: pass.destination,
      destination_note: pass.destinationNote,
      issued_by: pass.issuedBy,
      issued_at: pass.issuedAt.toISOString(),
      expected_duration: pass.expectedDuration,
      expected_return: pass.expectedReturn.toISOString(),
      returned_at: null,
      status: pass.status,
    })
  } catch (error) {
    console.error("Mobile create hall pass error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const studentId = searchParams.get("student_id") || undefined

    const passes = await db.hallPass.findMany({
      where: {
        schoolId: auth.schoolId,
        ...(status ? { status: status as HallPassStatus } : {}),
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { issuedAt: "desc" },
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

    const data = passes.map((p) => ({
      id: p.id,
      student_id: p.studentId,
      student_name: `${p.student.firstName} ${p.student.lastName}`,
      class_id: p.classId,
      destination: p.destination,
      destination_note: p.destinationNote,
      issued_by: p.issuedBy,
      issued_at: p.issuedAt.toISOString(),
      expected_duration: p.expectedDuration,
      expected_return: p.expectedReturn.toISOString(),
      returned_at: p.returnedAt?.toISOString() || null,
      status: p.status,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile list hall passes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
