// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/grades/student/:studentId — student grades/results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { studentId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "50")
    const skip = (page - 1) * perPage

    const where = {
      schoolId: auth.schoolId,
      studentId,
    }

    const [results, total] = await Promise.all([
      db.result.findMany({
        where,
        orderBy: { gradedAt: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          title: true,
          description: true,
          score: true,
          maxScore: true,
          percentage: true,
          grade: true,
          feedback: true,
          submittedAt: true,
          gradedAt: true,
          subject: { select: { id: true, name: true } },
        },
      }),
      db.result.count({ where }),
    ])

    const data = results.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      score: r.score ? Number(r.score) : null,
      max_score: r.maxScore ? Number(r.maxScore) : null,
      percentage: r.percentage,
      grade: r.grade,
      feedback: r.feedback,
      submitted_at: r.submittedAt?.toISOString() || null,
      graded_at: r.gradedAt?.toISOString() || null,
      subject_name: r.subject?.name || null,
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile student grades error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
