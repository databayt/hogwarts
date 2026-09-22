// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { ensureSubjectSelections } from "@/components/catalog/setup"
import { localize } from "@/components/translation/localize"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import {
  getStudentIdByUserId,
  getSubjectIdsForStudent,
  getSubjectIdsForTeacher,
  getTeacherIdByUserId,
} from "@/components/school-dashboard/listings/subjects/queries"

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
 *
 * Scoped by role, the way the web page is. This used to return every subject
 * the school had adopted to whoever asked, so a grade-12 student on a phone
 * was handed the whole catalogue — 130 subjects down to grade-1 readers —
 * while the same account in a browser saw the 25 of their own grade.
 *
 * The rule is not reimplemented here. `getSubjectIdsForStudent` and
 * `getSubjectIdsForTeacher` are the functions `subjects/content.tsx` filters
 * with, in a module with no `"use server"`, so a route handler can call them
 * directly — as the search and courses routes already call their own cores.
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
  status: true,
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

    // A student or a teacher resolves to their own record. There is no
    // `?studentId` to honour here: the web ignores that prop for those roles
    // precisely so a student cannot widen their own view, and a mobile client
    // is no more trustworthy than a browser.
    let visibleSubjectIds: Set<string> | null = null
    if (auth.role === "STUDENT") {
      const studentId = await getStudentIdByUserId(schoolId, auth.userId)
      // An account with no Student row sees nothing, not everything — the
      // web is explicit about this and it is the safer direction to fail.
      visibleSubjectIds = studentId
        ? await getSubjectIdsForStudent(schoolId, studentId)
        : new Set<string>()
    } else if (auth.role === "TEACHER") {
      const teacherId = await getTeacherIdByUserId(schoolId, auth.userId)
      if (teacherId) {
        visibleSubjectIds = await getSubjectIdsForTeacher(schoolId, teacherId)
      }
    }

    if (visibleSubjectIds !== null) {
      const allowed = visibleSubjectIds
      selections = selections.filter((s) => allowed.has(s.catalogSubjectId))
    }

    // Published catalog subjects only, one card each — `content.tsx` drops a
    // draft or archived subject even when the school still selects it.
    const seen = new Set<string>()
    const unique: {
      catalogSubjectId: string
      customName: string | null
      subject: (typeof selections)[number]["subject"]
    }[] = selections.filter((s) => {
      if (!s.subject || s.subject.status !== "PUBLISHED") return false
      if (seen.has(s.catalogSubjectId)) return false
      seen.add(s.catalogSubjectId)
      return true
    })

    // A student's or teacher's subject can reach them through a class, a
    // timetable slot or a teacher's expertise with no SubjectSelection row
    // behind it. The web fetches those too; without this the phone showed a
    // shorter list than the browser for the same account.
    if (visibleSubjectIds !== null && visibleSubjectIds.size > 0) {
      const missingIds = Array.from(visibleSubjectIds).filter(
        (id) => !seen.has(id)
      )
      if (missingIds.length > 0) {
        const extra = await db.subject.findMany({
          where: { id: { in: missingIds }, status: "PUBLISHED" },
          select: SUBJECT_SELECT,
        })
        for (const subject of extra) {
          if (seen.has(subject.id)) continue
          seen.add(subject.id)
          unique.push({ catalogSubjectId: subject.id, customName: null, subject })
        }
      }
    }

    const filtered = unique.filter((s) => {
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

    // Batch-translate subject name/description (one findMany + one Google call).
    const subjectRows = filtered.map((s) => s.subject)
    const [localizedSubjects, deptLabels, customLabels] = await Promise.all([
      localize("Subject", subjectRows, { schoolId, lang }),
      getLabels(
        filtered.map((s) => s.subject.department),
        lang,
        schoolId
      ),
      getLabels(
        filtered.map((s) => s.customName).filter(Boolean) as string[],
        lang,
        schoolId
      ),
    ])

    const localizedByIndex = new Map(localizedSubjects.map((s, i) => [i, s]))

    const data = filtered.map((s, i) => {
      const loc = localizedByIndex.get(i)!
      const effectiveName = s.customName
        ? (customLabels.get(s.customName) ?? s.customName)
        : (loc.name as string)
      return {
        id: s.subject.id,
        name: effectiveName,
        slug: s.subject.slug,
        department:
          deptLabels.get(s.subject.department) ?? s.subject.department,
        description: (loc.description as string | null) ?? null,
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

    // The web grid's order: lowest grade first, then name in the reader's
    // language (`catalog-subjects-grid.tsx`). Sorting here keeps every client
    // on the same order without each one re-deriving the collation.
    const collator = new Intl.Collator(lang === "ar" ? "ar" : "en")
    data.sort((a, b) => {
      const gradeA = a.grades[0] ?? 0
      const gradeB = b.grades[0] ?? 0
      if (gradeA !== gradeB) return gradeA - gradeB
      return collator.compare(a.name, b.name)
    })

    // The level tabs on `/subjects` depend on how many stages the school runs
    // ((browse)/layout.tsx): one stage means "All" already is that stage, so
    // the web draws no level tabs. The phone needs the same fact to decide.
    const schoolLevels = await db.academicLevel
      .findMany({ where: { schoolId }, select: { level: true } })
      .then((rows) => Array.from(new Set(rows.map((r) => r.level))))
      .catch(() => [] as string[])

    return NextResponse.json({
      data,
      total: data.length,
      school_levels: schoolLevels,
    })
  } catch (error) {
    console.error("Mobile subjects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
