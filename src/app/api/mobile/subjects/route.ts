// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { ensureSubjectSelections } from "@/components/catalog/setup"
import { getText } from "@/components/translation/display"
import type { Lang } from "@/components/translation/types"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * Mobile Subjects API
 *
 * Returns the school's adopted catalog subjects. Response mirrors the
 * fields used by the web Subjects grid (catalog-subjects-grid.tsx) so the
 * mobile UI can render the same cards: thumbnail, level/grade badges, rating.
 *
 * GET /api/mobile/subjects
 * Query params: search, department, lang
 */
const SUBJECT_SELECT = {
  id: true,
  name: true,
  slug: true,
  lang: true,
  department: true,
  description: true,
  thumbnail: true,
  color: true,
  levels: true,
  grades: true,
  totalChapters: true,
  totalLessons: true,
  usageCount: true,
  averageRating: true,
  ratingCount: true,
} as const

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId } = auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const department = searchParams.get("department") || undefined
    const lang = (searchParams.get("lang") || "en") as Lang

    let selections = await db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: {
        catalogSubjectId: true,
        customName: true,
        subject: { select: SUBJECT_SELECT },
      },
    })

    // Schools created before catalog setup ran land here with zero selections;
    // provisioning on first request keeps the feature usable without a manual step.
    if (selections.length === 0) {
      try {
        const { provisioned } = await ensureSubjectSelections(schoolId)
        if (provisioned) {
          selections = await db.subjectSelection.findMany({
            where: { schoolId, isActive: true },
            select: {
              catalogSubjectId: true,
              customName: true,
              subject: { select: SUBJECT_SELECT },
            },
          })
        }
      } catch {
        // Fall through with empty list
      }
    }

    const seen = new Set<string>()
    const unique = selections.filter((s) => {
      if (seen.has(s.catalogSubjectId)) return false
      seen.add(s.catalogSubjectId)
      return true
    })

    const data = await Promise.all(
      unique
        .filter((s) => {
          if (department && s.subject.department !== department) return false
          if (search) {
            const q = search.toLowerCase()
            if (
              !s.subject.name.toLowerCase().includes(q) &&
              !(s.customName || "").toLowerCase().includes(q)
            )
              return false
          }
          return true
        })
        .map(async (s) => {
          const srcLang = (s.subject.lang || "ar") as Lang
          const [name, desc, dept] = await Promise.all([
            getText(s.customName || s.subject.name, srcLang, lang, schoolId),
            getText(s.subject.description, srcLang, lang, schoolId),
            getText(s.subject.department, srcLang, lang, schoolId),
          ])

          return {
            id: s.subject.id,
            name,
            slug: s.subject.slug,
            department: dept || s.subject.department,
            description: desc,
            thumbnail_url: getCatalogImageUrl(s.subject.thumbnail, "sm"),
            color: s.subject.color,
            levels: s.subject.levels,
            grades: s.subject.grades,
            total_chapters: s.subject.totalChapters,
            total_lessons: s.subject.totalLessons,
            average_rating: s.subject.averageRating,
            rating_count: s.subject.ratingCount,
          }
        })
    )

    return NextResponse.json({
      data,
      total: data.length,
    })
  } catch (error) {
    console.error("Mobile subjects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
