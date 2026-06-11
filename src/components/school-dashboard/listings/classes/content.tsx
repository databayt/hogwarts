// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { getModel } from "@/lib/prisma-guards"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type ClassRow } from "@/components/school-dashboard/listings/classes/columns"
import { classesSearchParams } from "@/components/school-dashboard/listings/classes/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/listings/classes/permissions"
import { ClassesTable } from "@/components/school-dashboard/listings/classes/table"
import { getText } from "@/components/translation/display"

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
    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
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
    data = await Promise.all(
      rows.map(async (c: any) => ({
        id: c.id,
        name: await getText(
          c.name,
          (c.lang as "ar" | "en") || "ar",
          lang,
          schoolId!
        ),
        subjectName: await getText(
          c.subject?.name || "Unknown",
          (c.subject?.lang as "ar" | "en") || "ar",
          lang,
          schoolId!
        ),
        teacherName: c.teacher
          ? await getText(
              `${c.teacher.firstName} ${c.teacher.lastName}`,
              (c.teacher.lang as "ar" | "en") || "ar",
              lang,
              schoolId!
            )
          : "-",
        termName: c.term?.termNumber
          ? lang === "ar"
            ? `الفصل ${c.term.termNumber}`
            : `Term ${c.term.termNumber}`
          : "-",
        gradeName: await getText(
          c.grade?.name || "",
          (c.grade?.lang as "ar" | "en") || "ar",
          lang,
          schoolId!
        ),
        courseCode: c.courseCode || null,
        credits: c.credits || null,
        evaluationType: c.evaluationType || "NORMAL",
        enrolledStudents: c._count?.studentClasses || 0,
        maxCapacity: c.maxCapacity || 50,
        createdAt: (c.createdAt as Date).toISOString(),
      }))
    )
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
