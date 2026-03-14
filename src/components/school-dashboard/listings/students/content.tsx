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

/**
 * Format grade for display:
 * - Arabic: strip "الصف " prefix → "الثالث" (KG keeps full name "الروضة الأولى")
 * - English: "Grade 3", "KG", "Pre-K"
 */
function formatGradeLabel(
  grade: { name?: string; lang?: string; gradeNumber?: number | null } | null,
  targetLang?: string,
  translations?: Map<string, string>
): string | null {
  if (!grade) return null
  if (grade.name) {
    if (targetLang && translations && grade.lang !== targetLang) {
      return translations.get(grade.name) || grade.name
    }
    if (targetLang === "ar") {
      return grade.name
        .replace(/^الروضة الأولى$/, "أولى روضة")
        .replace(/^الروضة الثانية$/, "ثانية روضة")
        .replace(/^الصف /, "")
    }
    return grade.name
  }
  if (grade.gradeNumber == null) return null
  const n = grade.gradeNumber
  if (n < 0) return "Pre-K"
  if (n === 0) return "KG"
  return `Grade ${n}`
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
            select: {
              name: true,
              lang: true,
              classroom: {
                select: { roomName: true, lang: true },
              },
            },
          },
          academicGrade: {
            select: { name: true, lang: true, gradeNumber: true },
          },
        },
      }),
      studentModel.count({ where }),
    ])

    const classroomTranslations = new Map<string, string>()
    const gradeTranslations = new Map<string, string>()
    const nameTranslations = new Map<string, string>()

    const uniqueClassrooms = new Set<string>()
    const uniqueGrades = new Set<string>()
    const uniqueNames = new Map<string, string>()
    for (const s of rows as any[]) {
      if (s.section?.classroom?.roomName && s.section.classroom.lang !== lang)
        uniqueClassrooms.add(s.section.classroom.roomName)
      if (s.academicGrade?.name && s.academicGrade.lang !== lang)
        uniqueGrades.add(s.academicGrade.name)
      if (s.lang && s.lang !== lang) {
        const rawName = `${s.givenName} ${s.surname}`.trim()
        uniqueNames.set(rawName, s.lang)
      }
    }

    // Translate unique classroom/grade/name values in parallel
    await Promise.all([
      ...Array.from(uniqueClassrooms).map(async (name) => {
        const translated = await getDisplayText(
          name,
          "ar",
          lang,
          effectiveSchoolId!
        )
        classroomTranslations.set(name, translated)
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
      ...Array.from(uniqueNames.entries()).map(async ([name, contentLang]) => {
        const translated = await getDisplayText(
          name,
          contentLang as "ar" | "en",
          lang,
          effectiveSchoolId!
        )
        nameTranslations.set(name, translated)
      }),
    ])

    // Collect unique grade options for faceted filter
    const gradeSet = new Set<string>()
    for (const s of rows as any[]) {
      const label = formatGradeLabel(s.academicGrade, lang, gradeTranslations)
      if (label) gradeSet.add(label)
    }
    gradeOptions = Array.from(gradeSet).map((g) => ({ label: g, value: g }))

    data = (rows as any[]).map((s) => {
      const rawName = `${s.givenName} ${s.surname}`.trim()
      const name =
        s.lang && s.lang !== lang
          ? nameTranslations.get(rawName) || rawName
          : rawName

      const classroom = s.section?.classroom?.roomName
        ? s.section.classroom.lang !== lang
          ? classroomTranslations.get(s.section.classroom.roomName) ||
            s.section.classroom.roomName
          : s.section.classroom.roomName
        : null

      const gradeName = formatGradeLabel(
        s.academicGrade,
        lang,
        gradeTranslations
      )

      return {
        id: s.id,
        userId: s.userId,
        name,
        studentId: s.studentId || null,
        classroom,
        gradeName,
        status: deriveDisplayStatus(s),
        createdAt: (s.createdAt as Date).toISOString(),
        email: s.email || null,
        dateOfBirth: s.dateOfBirth
          ? (s.dateOfBirth as Date).toISOString()
          : null,
        enrollmentDate: s.enrollmentDate
          ? (s.enrollmentDate as Date).toISOString()
          : null,
        wizardStep: s.wizardStep || null,
        profilePhotoUrl: s.profilePhotoUrl || null,
      }
    })
    total = count as number
  }
  return (
    <div className="space-y-6">
      <StudentsTable
        initialData={data}
        total={total}
        dictionary={dictionary?.students}
        lang={lang}
        perPage={sp.perPage}
        gradeOptions={gradeOptions}
      />
    </div>
  )
}
