// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { ensureSubjectSelections } from "@/lib/catalog-setup"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import type { SupportedLanguage } from "@/components/translation/types"

import { verifyToken } from "../auth/jwt"

/**
 * Mobile Subjects API
 *
 * Returns school's adopted catalog subjects formatted for the Subjects feature module.
 * Requires Bearer token with schoolId claim.
 *
 * GET /api/mobile/subjects
 * Query params: search, department, lang
 */
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const department = searchParams.get("department") || undefined
    const lang = (searchParams.get("lang") || "en") as SupportedLanguage

    // Get school's subject selections
    let selections = await db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: {
        catalogSubjectId: true,
        customName: true,
        subject: {
          select: {
            id: true,
            name: true,
            slug: true,
            lang: true,
            department: true,
            description: true,
            thumbnail: true,
            totalChapters: true,
            totalLessons: true,
            usageCount: true,
          },
        },
      },
    })

    // Auto-provision if empty
    if (selections.length === 0) {
      try {
        const { provisioned } = await ensureSubjectSelections(schoolId)
        if (provisioned) {
          selections = await db.subjectSelection.findMany({
            where: { schoolId, isActive: true },
            select: {
              catalogSubjectId: true,
              customName: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  lang: true,
                  department: true,
                  description: true,
                  thumbnail: true,
                  totalChapters: true,
                  totalLessons: true,
                  usageCount: true,
                },
              },
            },
          })
        }
      } catch {
        // Fall through
      }
    }

    // Deduplicate by subject ID
    const seen = new Set<string>()
    const unique = selections.filter((s) => {
      if (seen.has(s.catalogSubjectId)) return false
      seen.add(s.catalogSubjectId)
      return true
    })

    // Translate and map to SubjectDto shape
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
          const srcLang = (s.subject.lang || "ar") as SupportedLanguage
          const [name, desc, dept] = await Promise.all([
            getDisplayText(
              s.customName || s.subject.name,
              srcLang,
              lang,
              schoolId
            ),
            getDisplayText(s.subject.description, srcLang, lang, schoolId),
            getDisplayText(s.subject.department, srcLang, lang, schoolId),
          ])

          return {
            id: s.subject.id,
            name,
            code: s.subject.slug,
            department: dept || s.subject.department,
            description: desc,
            teacher_count: 0,
            student_count: s.subject.usageCount,
            icon_url: getCatalogImageUrl(s.subject.thumbnail, "sm"),
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
