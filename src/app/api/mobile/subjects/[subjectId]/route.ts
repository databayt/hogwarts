// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/subjects/:subjectId — subject detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { subjectId } = await params

    // Get the catalog subject
    const subject = await db.subject.findFirst({
      where: { id: subjectId },
      select: {
        id: true,
        name: true,
        slug: true,
        lang: true,
        description: true,
        department: true,
        levels: true,
        country: true,
        curriculum: true,
        totalChapters: true,
        totalLessons: true,
        totalContent: true,
        usageCount: true,
        averageRating: true,
        tags: true,
        status: true,
        gradeRange: true,
      },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      lang: subject.lang,
      description: subject.description,
      department: subject.department,
      levels: subject.levels,
      country: subject.country,
      curriculum: subject.curriculum,
      total_chapters: subject.totalChapters,
      total_lessons: subject.totalLessons,
      total_content: subject.totalContent,
      usage_count: subject.usageCount,
      average_rating: subject.averageRating,
      tags: subject.tags,
      status: subject.status,
      grade_range: subject.gradeRange,
    })
  } catch (error) {
    console.error("Mobile subject detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
