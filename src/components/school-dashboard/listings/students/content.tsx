// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { getDisplayText } from "@/lib/content-display"
import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type StudentRow } from "@/components/school-dashboard/listings/students/columns"
import { studentsSearchParams } from "@/components/school-dashboard/listings/students/list-params"
import { StudentsTable } from "@/components/school-dashboard/listings/students/table"

interface Props {
  searchParams: Promise<SearchParams>
  school?: any
  dictionary?: Dictionary["school"]
  lang: Locale
}

/**
 * Derive display status from DB status + data completeness.
 * Names are proper nouns — never translated.
 */
function deriveDisplayStatus(s: any): string {
  // Hard statuses from DB enum (override everything)
  if (s.status === "SUSPENDED") return "suspended"
  if (s.status === "GRADUATED") return "graduated"
  if (s.status === "TRANSFERRED") return "transferred"
  if (s.status === "DROPPED_OUT") return "dropped_out"
  if (s.status === "INACTIVE") return "inactive"

  // Soft statuses derived from data completeness (ACTIVE students only)
  if (!s.academicGradeId && !s.sectionId) return "unassigned"
  if (!s._count?.studentGuardians) return "incomplete"

  return "active"
}

/**
 * Build status filter for Prisma WHERE clause
 */
function buildStatusFilter(status: string): Record<string, any> {
  switch (status) {
    case "active":
      return {
        status: "ACTIVE",
        OR: [{ academicGradeId: { not: null } }, { sectionId: { not: null } }],
      }
    case "unassigned":
      return {
        status: "ACTIVE",
        academicGradeId: null,
        sectionId: null,
      }
    case "incomplete":
      // ACTIVE + has grade/section but no guardians (post-filtered)
      return { status: "ACTIVE" }
    case "inactive":
      return { status: "INACTIVE" }
    case "suspended":
      return { status: "SUSPENDED" }
    case "graduated":
      return { status: "GRADUATED" }
    case "transferred":
      return { status: "TRANSFERRED" }
    case "dropped_out":
      return { status: "DROPPED_OUT" }
    default:
      return {}
  }
}

export default async function StudentsContent({
  searchParams,
  school,
  dictionary,
  lang,
}: Props) {
  const sp = await studentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()

  const effectiveSchoolId = school?.id || schoolId

  let data: StudentRow[] = []
  let total = 0
  let gradeOptions: Array<{ label: string; value: string }> = []
  const studentModel = getModel("student")
  if (effectiveSchoolId && studentModel) {
    const where: any = {
      schoolId: effectiveSchoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
              { studentId: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.status ? buildStatusFilter(sp.status) : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]
    const [rows, count] = await Promise.all([
      studentModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: {
            select: {
              studentClasses: true,
              results: true,
              studentGuardians: true,
            },
          },
          section: {
            select: { name: true, lang: true },
          },
          academicGrade: {
            select: { name: true, lang: true },
          },
        },
      }),
      studentModel.count({ where }),
    ])

    // Translate section/grade names only (not student names — those are proper nouns)
    // Max unique section/grade names is small (~18), so individual calls are fine
    const sectionTranslations = new Map<string, string>()
    const gradeTranslations = new Map<string, string>()

    const uniqueSections = new Set<string>()
    const uniqueGrades = new Set<string>()
    for (const s of rows as any[]) {
      if (s.section?.name && s.section.lang !== lang)
        uniqueSections.add(s.section.name)
      if (s.academicGrade?.name && s.academicGrade.lang !== lang)
        uniqueGrades.add(s.academicGrade.name)
    }

    // Translate unique section/grade names in parallel
    await Promise.all([
      ...Array.from(uniqueSections).map(async (name) => {
        const translated = await getDisplayText(
          name,
          "ar",
          lang,
          effectiveSchoolId!
        )
        sectionTranslations.set(name, translated)
      }),
      ...Array.from(uniqueGrades).map(async (name) => {
        const translated = await getDisplayText(
          name,
          "ar",
          lang,
          effectiveSchoolId!
        )
        gradeTranslations.set(name, translated)
      }),
    ])

    // Map rows — names always display as-is (proper nouns)
    // Collect unique grade options for faceted filter
    const gradeSet = new Set<string>()
    for (const s of rows as any[]) {
      if (s.academicGrade?.name) {
        const translated =
          s.academicGrade.lang !== lang
            ? gradeTranslations.get(s.academicGrade.name) ||
              s.academicGrade.name
            : s.academicGrade.name
        gradeSet.add(translated)
      }
    }
    gradeOptions = Array.from(gradeSet).map((g) => ({ label: g, value: g }))

    data = (rows as any[]).map((s) => {
      const name = `${s.givenName} ${s.surname}`.trim()

      const sectionName = s.section?.name
        ? s.section.lang !== lang
          ? sectionTranslations.get(s.section.name) || s.section.name
          : s.section.name
        : "-"

      const gradeName = s.academicGrade?.name
        ? s.academicGrade.lang !== lang
          ? gradeTranslations.get(s.academicGrade.name) || s.academicGrade.name
          : s.academicGrade.name
        : null

      return {
        id: s.id,
        userId: s.userId,
        name,
        studentId: s.studentId || null,
        sectionName: sectionName !== "-" ? sectionName : gradeName || "-",
        gradeName,
        status: deriveDisplayStatus(s),
        createdAt: (s.createdAt as Date).toISOString(),
        classCount: s._count?.studentClasses || 0,
        gradeCount: s._count?.results || 0,
        email: s.email || null,
        dateOfBirth: s.dateOfBirth
          ? (s.dateOfBirth as Date).toISOString()
          : null,
        enrollmentDate: s.enrollmentDate
          ? (s.enrollmentDate as Date).toISOString()
          : null,
        wizardStep: s.wizardStep || null,
      }
    })
    total = count as number
  }
  return (
    <StudentsTable
      initialData={data}
      total={total}
      dictionary={dictionary?.students}
      lang={lang}
      perPage={sp.perPage}
      gradeOptions={gradeOptions}
    />
  )
}
