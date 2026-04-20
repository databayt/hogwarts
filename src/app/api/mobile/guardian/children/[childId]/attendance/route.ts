// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

/**
 * GET /api/mobile/guardian/children/:childId/attendance — child attendance records
 *
 * Verifies guardian relationship before returning data.
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

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from") || undefined
    const to = searchParams.get("to") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "50")
    const skip = (page - 1) * perPage

    const where = {
      schoolId: auth.schoolId,
      studentId: childId,
      deletedAt: null,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    }

    const [records, total] = await Promise.all([
      db.attendance.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          date: true,
          status: true,
          notes: true,
          method: true,
          checkInTime: true,
          checkOutTime: true,
          periodName: true,
          section: {
            select: { name: true, grade: { select: { name: true } } },
          },
        },
      }),
      db.attendance.count({ where }),
    ])

    const data = records.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      status: r.status,
      notes: r.notes,
      method: r.method,
      check_in_time: r.checkInTime?.toISOString() || null,
      check_out_time: r.checkOutTime?.toISOString() || null,
      period_name: r.periodName,
      section: r.section?.name || null,
      grade: r.section?.grade?.name || null,
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile guardian child attendance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
