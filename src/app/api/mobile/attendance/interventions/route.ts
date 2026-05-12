// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { InterventionStatus } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/attendance/interventions — list attendance interventions
 *
 * Query params:
 *   status     — filter by intervention status
 *   student_id — filter by student
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    // Authorization: read access broadens to TEACHER/STAFF; mutations elsewhere
    // are admin-only per matrix. "SUPER_ADMIN" is dead code → "DEVELOPER".
    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "STAFF" &&
      auth.role !== "DEVELOPER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const studentId = searchParams.get("student_id") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "50")
    const skip = (page - 1) * perPage

    const where = {
      schoolId: auth.schoolId,
      ...(status ? { status: status as InterventionStatus } : {}),
      ...(studentId ? { studentId } : {}),
    }

    const [interventions, total] = await Promise.all([
      db.attendanceIntervention.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          studentId: true,
          type: true,
          title: true,
          description: true,
          outcome: true,
          status: true,
          priority: true,
          scheduledDate: true,
          completedDate: true,
          followUpDate: true,
          initiatedBy: true,
          assignedTo: true,
          parentNotified: true,
          contactMethod: true,
          contactResult: true,
          tags: true,
          createdAt: true,
          student: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      db.attendanceIntervention.count({ where }),
    ])

    const data = interventions.map((i) => ({
      id: i.id,
      student_id: i.studentId,
      student_name: `${i.student.firstName} ${i.student.lastName}`,
      type: i.type,
      title: i.title,
      description: i.description,
      outcome: i.outcome,
      status: i.status,
      priority: i.priority,
      scheduled_date: i.scheduledDate?.toISOString() || null,
      completed_date: i.completedDate?.toISOString() || null,
      follow_up_date: i.followUpDate?.toISOString() || null,
      initiated_by: i.initiatedBy,
      assigned_to: i.assignedTo,
      parent_notified: i.parentNotified,
      contact_method: i.contactMethod,
      contact_result: i.contactResult,
      tags: i.tags,
      created_at: i.createdAt.toISOString(),
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile interventions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
