// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import { getModel } from "@/lib/prisma-guards"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type ClassRow } from "@/components/school-dashboard/listings/classes/columns"
import { classesSearchParams } from "@/components/school-dashboard/listings/classes/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/listings/classes/permissions"
import { ClassesTable } from "@/components/school-dashboard/listings/classes/table"
import { localize } from "@/components/translation/localize"
import { getLabels, getNames } from "@/components/translation/person"
import { search } from "@/components/translation/search"
import { fullName } from "@/components/translation/util"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function ClassesContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await classesSearchParams.parse(await searchParams)
  const { schoolId, role } = await getTenantContext()
  const permissions = getUIConfigForRole(role as Role | null | undefined)
  let data: ClassRow[] = []
  let total = 0
  const classModel = getModel("class")
  if (schoolId && classModel) {
    // Bilingual search: an English query matches Arabic-stored class names
    // (and vice versa) via the translation cache — no API cost.
    let nameFilter: object = {}
    if (sp.name) {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      const nameConditions = await search(
        sp.name,
        ["name"],
        schoolId,
        (school?.preferredLanguage as "ar" | "en") || "ar",
        lang === "en" ? "en" : "ar"
      )
      nameFilter = { OR: nameConditions }
    }
    const where: any = {
      schoolId,
      ...nameFilter,
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.termId ? { termId: sp.termId } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]
    const [rows, count] = await Promise.all([
      classModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          subject: {
            select: {
              name: true,
              lang: true,
            },
          },
          teacher: {
            select: {
              firstName: true,
              lastName: true,
              lang: true,
            },
          },
          term: {
            select: {
              termNumber: true,
            },
          },
          grade: {
            select: {
              name: true,
              lang: true,
            },
          },
          _count: {
            select: {
              studentClasses: true,
            },
          },
        },
      }),
      classModel.count({ where }),
    ])
    // ONE batched translation pass for the page: class names via localize,
    // subject/grade labels via deduped getLabels, teacher names via getNames
    // (replaces the per-row 4×getText N+1).
    const displayLang: "ar" | "en" = lang === "en" ? "en" : "ar"
    const [localizedRows, subjectLabels, gradeLabels, teacherNames] =
      await Promise.all([
        localize("Class", rows as any[], { schoolId, lang: displayLang }),
        getLabels(
          rows.map((c: any) => c.subject?.name),
          displayLang,
          schoolId
        ),
        getLabels(
          rows.map((c: any) => c.grade?.name),
          displayLang,
          schoolId
        ),
        getNames(
          rows.filter((c: any) => c.teacher),
          (c: any) => c.teacher,
          displayLang,
          schoolId
        ),
      ])
    data = localizedRows.map((c: any) => {
      const rawSubject = c.subject?.name || "Unknown"
      const rawGrade = c.grade?.name || ""
      const rawTeacher = c.teacher ? fullName(c.teacher) : ""
      return {
        id: c.id,
        name: c.name,
        subjectName: subjectLabels.get(rawSubject) ?? rawSubject,
        teacherName: rawTeacher
          ? (teacherNames.get(rawTeacher) ?? rawTeacher)
          : "-",
        termName: c.term?.termNumber
          ? lang === "ar"
            ? `الفصل ${c.term.termNumber}`
            : `Term ${c.term.termNumber}`
          : "-",
        gradeName: gradeLabels.get(rawGrade) ?? rawGrade,
        courseCode: c.courseCode || null,
        credits: c.credits || null,
        evaluationType: c.evaluationType || "NORMAL",
        enrolledStudents: c._count?.studentClasses || 0,
        maxCapacity: c.maxCapacity || 50,
        createdAt: (c.createdAt as Date).toISOString(),
      }
    })
    total = count as number
  }
  return (
    <div className="space-y-6">
      <ClassesTable
        initialData={data}
        total={total}
        dictionary={dictionary?.classes}
        lang={lang}
        perPage={sp.perPage}
        permissions={permissions}
      />
    </div>
  )
}
