// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import type { SupportedLanguage } from "@/components/translation/types"

import { authenticate, isAuthError } from "../../lib/authenticate"

const SUBJECT_SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  lang: true,
  department: true,
  thumbnail: true,
} as const

type SubjectSummary = {
  id: string
  name: string
  slug: string
  lang: string | null
  department: string
  thumbnail: string | null
}

/**
 * Translate a pair of subject summary fields (name + department) into the
 * caller's UI language. Mirrors the sibling list route so localized names
 * stay consistent across list / detail / my-subjects.
 */
async function localizeSubject(
  subject: SubjectSummary,
  lang: SupportedLanguage,
  schoolId: string
) {
  const srcLang = (subject.lang || "ar") as SupportedLanguage
  const [name, department] = await Promise.all([
    getDisplayText(subject.name, srcLang, lang, schoolId),
    getDisplayText(subject.department, srcLang, lang, schoolId),
  ])
  return {
    id: subject.id,
    name,
    slug: subject.slug,
    department,
    thumbnail_url: getCatalogImageUrl(subject.thumbnail, "sm"),
  }
}

/**
 * GET /api/mobile/subjects/my-subjects — subjects the user is enrolled in or teaches
 * Query params: lang
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const lang = (searchParams.get("lang") || "en") as SupportedLanguage

    if (auth.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true, sectionId: true },
      })

      if (!student) {
        return NextResponse.json({ data: [] })
      }

      const studentClasses = await db.studentClass.findMany({
        where: { studentId: student.id, schoolId: auth.schoolId },
        select: {
          class: {
            select: {
              subject: { select: SUBJECT_SUMMARY_SELECT },
              teacher: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      })

      const seen = new Set<string>()
      const data = await Promise.all(
        studentClasses
          .filter((sc) => {
            if (seen.has(sc.class.subject.id)) return false
            seen.add(sc.class.subject.id)
            return true
          })
          .map(async (sc) => {
            const base = await localizeSubject(
              sc.class.subject,
              lang,
              auth.schoolId
            )
            return {
              ...base,
              teacher_name: sc.class.teacher
                ? `${sc.class.teacher.firstName} ${sc.class.teacher.lastName}`
                : null,
            }
          })
      )

      return NextResponse.json({ data })
    }

    if (auth.role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true },
      })

      if (!teacher) {
        return NextResponse.json({ data: [] })
      }

      const timetableEntries = await db.timetable.findMany({
        where: {
          schoolId: auth.schoolId,
          teacherId: teacher.id,
          subjectId: { not: null },
        },
        select: {
          subject: { select: SUBJECT_SUMMARY_SELECT },
        },
        distinct: ["subjectId"],
      })

      const data = await Promise.all(
        timetableEntries
          .filter((e) => e.subject)
          .map(async (e) => ({
            ...(await localizeSubject(e.subject!, lang, auth.schoolId)),
            teacher_name: null,
          }))
      )

      return NextResponse.json({ data })
    }

    // ADMIN / fallback: school's adopted catalog subjects
    const selections = await db.subjectSelection.findMany({
      where: { schoolId: auth.schoolId, isActive: true },
      select: {
        subject: { select: SUBJECT_SUMMARY_SELECT },
      },
    })

    const seen = new Set<string>()
    const data = await Promise.all(
      selections
        .filter((s) => {
          if (seen.has(s.subject.id)) return false
          seen.add(s.subject.id)
          return true
        })
        .map(async (s) => ({
          ...(await localizeSubject(s.subject, lang, auth.schoolId)),
          teacher_name: null,
        }))
    )

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile my subjects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
