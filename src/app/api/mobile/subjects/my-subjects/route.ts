// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { localize } from "@/components/translation/localize"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

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
 * Batch-translate a list of subject summaries (name + department) into the
 * caller's UI language using one localize + one getLabels call. Mirrors the
 * sibling list route so localized names stay consistent across list / detail
 * / my-subjects.
 */
async function localizeSubjects(
  subjects: SubjectSummary[],
  lang: Lang,
  schoolId: string
) {
  const [localizedRows, deptLabels] = await Promise.all([
    localize("Subject", subjects, { schoolId, lang }),
    getLabels(
      subjects.map((s) => s.department),
      lang,
      schoolId
    ),
  ])
  return localizedRows.map((loc, i) => ({
    id: subjects[i].id,
    name: loc.name as string,
    slug: subjects[i].slug,
    department:
      deptLabels.get(subjects[i].department) ?? subjects[i].department,
    thumbnail_url: getCatalogImageUrl(subjects[i].thumbnail, "sm"),
  }))
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
    const lang = (searchParams.get("lang") || "en") as Lang

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
      const uniqueClasses = studentClasses.filter((sc) => {
        if (seen.has(sc.class.subject.id)) return false
        seen.add(sc.class.subject.id)
        return true
      })
      const localizedBases = await localizeSubjects(
        uniqueClasses.map((sc) => sc.class.subject),
        lang,
        auth.schoolId
      )
      const data = uniqueClasses.map((sc, i) => ({
        ...localizedBases[i],
        teacher_name: sc.class.teacher
          ? `${sc.class.teacher.firstName} ${sc.class.teacher.lastName}`
          : null,
      }))

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

      const teacherSubjects = timetableEntries
        .filter((e) => e.subject)
        .map((e) => e.subject!)
      const localizedTeacher = await localizeSubjects(
        teacherSubjects,
        lang,
        auth.schoolId
      )
      const data = localizedTeacher.map((base) => ({
        ...base,
        teacher_name: null,
      }))

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
    const uniqueSelections = selections.filter((s) => {
      if (seen.has(s.subject.id)) return false
      seen.add(s.subject.id)
      return true
    })
    const localizedAdmin = await localizeSubjects(
      uniqueSelections.map((s) => s.subject),
      lang,
      auth.schoolId
    )
    const data = localizedAdmin.map((base) => ({ ...base, teacher_name: null }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile my subjects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
