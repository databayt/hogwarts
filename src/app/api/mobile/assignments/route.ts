// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getAssignmentsForStudent } from "@/components/school-dashboard/listings/assignments/my-assignments"
import {
  getAssignmentList,
  type AssignmentListFilters,
} from "@/components/school-dashboard/listings/assignments/queries"

import { authenticate, isAuthError } from "../lib/authenticate"
import { hasRole } from "../lib/roles"
import { canAccessStudent } from "../lib/student-access"
import { assignmentDto, pageParams, studentAssignmentDto } from "./shared"

const STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "IN_PROGRESS",
  "COMPLETED",
  "GRADED",
] as const

/**
 * GET /api/mobile/assignments
 *
 *  - STUDENT: non-draft assignments of their classes, with their submission
 *  - GUARDIAN: the same for `?student_id=` (a linked child; required)
 *  - TEACHER: assignments of classes they lead or co-teach (drafts included)
 *  - ADMIN / DEVELOPER: every assignment in the school
 *
 * Query: page, per_page; staff lists also take class_id, status, search.
 * Same queries as the web's /my-assignments and /assignments listings.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const url = new URL(request.url)
    const { page, perPage } = pageParams(url)

    if (hasRole(auth, "STUDENT", "GUARDIAN")) {
      let studentId: string | null
      if (hasRole(auth, "STUDENT")) {
        const student = await db.student.findFirst({
          where: { userId: auth.userId, schoolId: auth.schoolId },
          select: { id: true },
        })
        studentId = student?.id ?? null
        if (!studentId) {
          return NextResponse.json({
            data: [],
            total: 0,
            page,
            per_page: perPage,
          })
        }
      } else {
        studentId = url.searchParams.get("student_id")
        if (!studentId) {
          return NextResponse.json(
            { error: "student_id is required" },
            { status: 400 }
          )
        }
        if (!(await canAccessStudent(auth, studentId))) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }

      const all = await getAssignmentsForStudent(auth.schoolId, studentId)
      const start = (page - 1) * perPage
      return NextResponse.json({
        data: all.slice(start, start + perPage).map(studentAssignmentDto),
        total: all.length,
        page,
        per_page: perPage,
      })
    }

    if (!hasRole(auth, "TEACHER", "ADMIN", "DEVELOPER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const filters: AssignmentListFilters = {}
    const classId = url.searchParams.get("class_id")
    if (classId) filters.classId = classId
    const search = url.searchParams.get("search")
    if (search) filters.search = search
    const status = url.searchParams.get("status")
    if (status) {
      if (!(STATUSES as readonly string[]).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      filters.status = status as (typeof STATUSES)[number]
    }

    if (hasRole(auth, "TEACHER")) {
      const teacher = await db.teacher.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true },
      })
      if (!teacher) {
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          per_page: perPage,
        })
      }
      filters.teacherId = teacher.id
    }

    const { rows, count } = await getAssignmentList(auth.schoolId, {
      ...filters,
      page,
      perPage,
    })

    return NextResponse.json({
      data: rows.map(assignmentDto),
      total: count,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error("Mobile assignments list error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
