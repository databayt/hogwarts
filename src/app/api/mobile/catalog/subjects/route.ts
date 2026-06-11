// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { ensureSubjectSelections } from "@/components/catalog/setup"
import { localize } from "@/components/translation/localize"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import { verifyToken } from "../../auth/jwt"

/**
 * Mobile Catalog Subjects API
 *
 * Returns the school's adopted catalog subjects (via SubjectSelection).
 * Requires Bearer token with schoolId claim.
 *
 * GET /api/mobile/catalog/subjects
 * Query params: search, category (department), page, per_page, lang
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let payload
    try {
      const result = await verifyToken(token)
      payload = result.payload
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const schoolId = payload.schoolId as string | null
    if (!schoolId) {
      return NextResponse.json({ error: "No school context" }, { status: 400 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const category = searchParams.get("category") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "50")
    const lang = (searchParams.get("lang") || "en") as Lang
    const skip = (page - 1) * perPage

    // Get school's subject selections
    let selections = await db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: { catalogSubjectId: true, customName: true },
    })

    // Auto-provision if empty
    if (selections.length === 0) {
      try {
        const { provisioned } = await ensureSubjectSelections(schoolId)
        if (provisioned) {
          selections = await db.subjectSelection.findMany({
            where: { schoolId, isActive: true },
            select: { catalogSubjectId: true, customName: true },
          })
        }
      } catch {
        // Fall through with empty
      }
    }

    const subjectIds = [...new Set(selections.map((s) => s.catalogSubjectId))]
    const customNames = new Map(
      selections
        .filter((s) => s.customName)
        .map((s) => [s.catalogSubjectId, s.customName!])
    )

    if (subjectIds.length === 0) {
      return NextResponse.json([])
    }

    // Query catalog subjects
    const where = {
      id: { in: subjectIds },
      status: "PUBLISHED" as const,
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(category ? { department: category } : {}),
    }

    const [subjects, total] = await Promise.all([
      db.subject.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip,
        take: perPage,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          thumbnail: true,
          banner: true,
          color: true,
          lang: true,
          department: true,
          levels: true,
          grades: true,
          totalChapters: true,
          totalLessons: true,
          usageCount: true,
          averageRating: true,
        },
      }),
      db.subject.count({ where }),
    ])

    // Translate and map to mobile DTO (snake_case)
    const rows = await Promise.all(
      subjects.map(async (s) => {
        const srcLang = (s.lang || "ar") as Lang
        const [title, description, departmentName] = await Promise.all([
          getText(customNames.get(s.id) || s.name, srcLang, lang, schoolId),
          getText(s.description, srcLang, lang, schoolId),
          getText(s.department, srcLang, lang, schoolId),
        ])

        return {
          id: s.id,
          school_id: schoolId,
          title,
          slug: s.slug,
          description: description || "",
          instructor_name: "",
          thumbnail_url: getCatalogImageUrl(s.thumbnail, "sm"),
          category: departmentName || s.department,
          enrollment_count: s.usageCount,
          lesson_count: s.totalLessons,
          total_duration: "",
          status: "PUBLISHED",
          progress: 0,
          color: s.color,
          total_chapters: s.totalChapters,
          average_rating: s.averageRating,
          levels: s.levels,
          grades: s.grades,
        }
      })
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Mobile catalog subjects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
