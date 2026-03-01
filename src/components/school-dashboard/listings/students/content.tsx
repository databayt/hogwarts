// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { getDisplayText } from "@/lib/content-display"
import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { getDisplayName } from "@/lib/transliterate-name"
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

export default async function StudentsContent({
  searchParams,
  school,
  dictionary,
  lang,
}: Props) {
  const sp = await studentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()

  // Use school from props if available, otherwise fall back to tenant context
  const effectiveSchoolId = school?.id || schoolId

  let data: StudentRow[] = []
  let total = 0
  const studentModel = getModel("student")
  if (effectiveSchoolId && studentModel) {
    const where: any = {
      schoolId: effectiveSchoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
        : {}),
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
    data = await Promise.all(
      rows.map(async (s: any) => {
        return {
          id: s.id,
          userId: s.userId,
          name: getDisplayName(s.givenName, s.surname, lang),
          sectionName: s.section?.name
            ? await getDisplayText(
                s.section.name,
                s.section.lang || "ar",
                lang,
                effectiveSchoolId!
              )
            : s.academicGrade?.name
              ? await getDisplayText(
                  s.academicGrade.name,
                  s.academicGrade.lang || "ar",
                  lang,
                  effectiveSchoolId!
                )
              : "-",
          status: s.userId ? "active" : "inactive",
          createdAt: (s.createdAt as Date).toISOString(),
          classCount: s._count?.studentClasses || 0,
          gradeCount: s._count?.results || 0,
        }
      })
    )
    total = count as number
  }
  return (
    <StudentsTable
      initialData={data}
      total={total}
      dictionary={dictionary?.students}
      lang={lang}
      perPage={sp.perPage}
    />
  )
}
