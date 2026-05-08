// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { ExcuseStatus } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * PUT /api/mobile/attendance/excuses/:id — review an excuse
 *
 * Body: { status: "APPROVED" | "REJECTED", review_notes? }
 * If approved, optionally updates the linked attendance status to EXCUSED.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    // Authorization: matches central attendance permission matrix (manage_excuse)
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
    const { status, review_notes } = body

    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
      return NextResponse.json(
        { error: "status must be APPROVED or REJECTED" },
        { status: 400 }
      )
    }

    // Verify the excuse belongs to this school
    const existing = await db.attendanceExcuse.findFirst({
      where: { id, schoolId: auth.schoolId },
      select: { id: true, attendanceId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Excuse not found" }, { status: 404 })
    }

    // Update excuse and optionally the attendance status in a transaction
    const updated = await db.$transaction(async (tx) => {
      const excuse = await tx.attendanceExcuse.update({
        where: { id },
        data: {
          status: status as ExcuseStatus,
          reviewedBy: auth.userId,
          reviewedAt: new Date(),
          reviewNotes: review_notes || null,
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
          reviewedBy: true,
          reviewedAt: true,
          reviewNotes: true,
        },
      })

      // If approved, update attendance status to EXCUSED
      if (status === "APPROVED") {
        await tx.attendance.update({
          where: { id: existing.attendanceId },
          data: { status: "EXCUSED" },
        })
      }

      return excuse
    })

    return NextResponse.json({
      id: updated.id,
      attendance_id: updated.attendanceId,
      reason: updated.reason,
      description: updated.description,
      attachments: updated.attachments,
      status: updated.status,
      submitted_by: updated.submittedBy,
      submitted_at: updated.submittedAt.toISOString(),
      reviewed_by: updated.reviewedBy,
      reviewed_at: updated.reviewedAt?.toISOString() || null,
      review_notes: updated.reviewNotes,
    })
  } catch (error) {
    console.error("Mobile review excuse error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
