// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { withArchiveScope } from "@/lib/archive-scope"
import { getDisplayText } from "@/lib/content-display"
import { getGradeLabel } from "@/lib/grade-label"
import { getModel } from "@/lib/prisma-guards"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type StudentRow } from "@/components/school-dashboard/listings/students/columns"
import { studentsSearchParams } from "@/components/school-dashboard/listings/students/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/listings/students/permissions"
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
// Transliterate Latin letters to Arabic in room codes (Google Translate skips these)
const LATIN_TO_AR: Record<string, string> = {
  A: "أ",
  B: "ب",
  C: "ج",
  D: "د",
  E: "هـ",
  F: "و",
  G: "ز",
  H: "ح",
}

function transliterateRoomCode(code: string, lang: string): string {
  if (lang !== "ar") return code
  return code.replace(/^[A-Z]/g, (ch) => LATIN_TO_AR[ch] || ch)
}

export default async function StudentsContent({
  searchParams,
  school,
  dictionary,
  lang,
}: Props) {
  const sp = await studentsSearchParams.parse(await searchParams)
  const { schoolId, role } = await getTenantContext()
  const permissions = getUIConfigForRole(role as Role | null | undefined)

  const effectiveSchoolId = school?.id || schoolId

  let data: StudentRow[] = []
  let total = 0
  let gradeOptions: Array<{ label: string; value: string }> = []
  const studentModel = getModel("student")
  if (effectiveSchoolId && studentModel) {
    const baseFilters = {
      schoolId: effectiveSchoolId,
      ...(sp.name
        ? {
            OR: [
              { firstName: { contains: sp.name, mode: "insensitive" } },
              { lastName: { contains: sp.name, mode: "insensitive" } },
              { studentId: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.status ? buildStatusFilter(sp.status) : {}),
    }
    const where: any = withArchiveScope(baseFilters, sp.scope)
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
    const nameTranslations = new Map<string, string>()

    const uniqueClassrooms = new Set<string>()
    const uniqueNames = new Map<string, string>()
    // Detect if a string contains Latin letters (needs translation to Arabic)
    const hasLatin = (s: string) => /[a-zA-Z]/.test(s)

    for (const s of rows as any[]) {
      if (
        s.section?.classroom?.roomName &&
        (s.section.classroom.lang !== lang ||
          (lang === "ar" && hasLatin(s.section.classroom.roomName)))
      )
        uniqueClassrooms.add(s.section.classroom.roomName)
      // Detect actual content language from text — override lang field when
      // text clearly doesn't match (e.g. lang="ar" but name is Latin characters)
      const rawName = `${s.firstName} ${s.lastName}`.trim()
      const textLang = hasLatin(rawName) ? "en" : "ar"
      const contentLang = textLang !== s.lang ? textLang : s.lang || textLang
      if (contentLang !== lang) {
        uniqueNames.set(rawName, contentLang)
      }
    }

    // Translate unique classroom/grade/name values in parallel
    await Promise.all([
      ...Array.from(uniqueClassrooms).map(async (name) => {
        // Room codes like "B102" — transliterate letters directly
        // (Google Translate returns them unchanged)
        if (/^[A-Z]\d/.test(name)) {
          classroomTranslations.set(name, transliterateRoomCode(name, lang))
        } else {
          const sourceLang = hasLatin(name) ? "en" : "ar"
          const translated = await getDisplayText(
            name,
            sourceLang,
            lang,
            effectiveSchoolId!
          )
          classroomTranslations.set(name, translated)
        }
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
      if (s.academicGrade?.gradeNumber != null) {
        gradeSet.add(getGradeLabel(s.academicGrade.gradeNumber, lang))
      }
    }
    gradeOptions = Array.from(gradeSet).map((g) => ({ label: g, value: g }))

    data = (rows as any[]).map((s) => {
      const rawName = `${s.firstName} ${s.lastName}`.trim()
      const mapTextLang = hasLatin(rawName) ? "en" : "ar"
      const contentLang =
        mapTextLang !== s.lang ? mapTextLang : s.lang || mapTextLang
      const name =
        contentLang !== lang
          ? nameTranslations.get(rawName) || rawName
          : rawName

      const rawClassroom = s.section?.classroom?.roomName || null
      const classroom = rawClassroom
        ? classroomTranslations.get(rawClassroom) || rawClassroom
        : null

      const gradeName =
        s.academicGrade?.gradeNumber != null
          ? getGradeLabel(s.academicGrade.gradeNumber, lang)
          : null

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
    <StudentsTable
      initialData={data}
      total={total}
      dictionary={dictionary?.students}
      lang={lang}
      perPage={sp.perPage}
      gradeOptions={gradeOptions}
      scope={sp.scope}
      permissions={permissions}
    />
  )
}
