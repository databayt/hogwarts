// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * GET /api/mobile/exams — list exams for the school
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const upcoming = searchParams.get("upcoming") === "true"
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "30")
    const skip = (page - 1) * perPage

    const where: Prisma.SchoolExamWhereInput = {
      schoolId: auth.schoolId,
      ...(status ? { status: status as Prisma.EnumExamStatusFilter } : {}),
      ...(upcoming
        ? {
            examDate: { gte: new Date() },
            status: { not: "CANCELLED" as const },
          }
        : {}),
    }

    const [exams, total] = await Promise.all([
      db.schoolExam.findMany({
        where,
        orderBy: { examDate: "asc" },
        skip,
        take: perPage,
        include: {
          subject: { select: { id: true, name: true } },
        },
      }),
      db.schoolExam.count({ where }),
    ])

    const data = exams.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      exam_date: e.examDate?.toISOString() || null,
      start_time: e.startTime,
      end_time: e.endTime,
      duration: e.duration,
      total_marks: e.totalMarks,
      passing_marks: e.passingMarks,
      exam_type: e.examType,
      status: e.status,
      instructions: e.instructions,
      subject_name: e.subject?.name || null,
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile exams error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
