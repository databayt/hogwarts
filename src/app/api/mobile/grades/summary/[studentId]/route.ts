// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/grades/summary/:studentId — GPA / grade summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { studentId } = await params

    const results = await db.result.findMany({
      where: { schoolId: auth.schoolId, studentId },
      select: {
        percentage: true,
        score: true,
        maxScore: true,
        subject: { select: { name: true } },
      },
    })

    const totalResults = results.length
    const averagePercentage =
      totalResults > 0
        ? Math.round(
            (results.reduce((sum, r) => sum + (r.percentage || 0), 0) /
              totalResults) *
              10
          ) / 10
        : 0

    // Group by subject
    const bySubject = new Map<string, { total: number; count: number }>()
    for (const r of results) {
      const name = r.subject?.name || "Other"
      const existing = bySubject.get(name) || { total: 0, count: 0 }
      existing.total += r.percentage || 0
      existing.count += 1
      bySubject.set(name, existing)
    }

    const subjects = Array.from(bySubject.entries()).map(
      ([name, { total, count }]) => ({
        subject_name: name,
        average_percentage: Math.round((total / count) * 10) / 10,
        total_results: count,
      })
    )

    // Get latest report card
    const reportCard = await db.reportCard.findFirst({
      where: { schoolId: auth.schoolId, studentId, isPublished: true },
      orderBy: { publishedAt: "desc" },
      select: {
        overallGPA: true,
        overallGrade: true,
        rank: true,
        totalStudents: true,
      },
    })

    return NextResponse.json({
      total_results: totalResults,
      average_percentage: averagePercentage,
      gpa: reportCard?.overallGPA ? Number(reportCard.overallGPA) : null,
      overall_grade: reportCard?.overallGrade || null,
      rank: reportCard?.rank,
      total_students: reportCard?.totalStudents,
      subjects,
    })
  } catch (error) {
    console.error("Mobile grades summary error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
