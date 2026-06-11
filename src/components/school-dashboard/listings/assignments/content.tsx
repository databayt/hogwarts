// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import { getModel } from "@/lib/prisma-guards"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { type AssignmentRow } from "@/components/school-dashboard/listings/assignments/columns"
import { assignmentsSearchParams } from "@/components/school-dashboard/listings/assignments/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/listings/assignments/permissions"
import { AssignmentsTable } from "@/components/school-dashboard/listings/assignments/table"
import { Shell as PageContainer } from "@/components/table/shell"
import { localize } from "@/components/translation/localize"
import { search } from "@/components/translation/search"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

export default async function AssignmentsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await assignmentsSearchParams.parse(await searchParams)
  const { schoolId, role } = await getTenantContext()
  const permissions = getUIConfigForRole(role as Role | null | undefined)
  let data: AssignmentRow[] = []
  let total = 0
  const assignmentModel = getModel("assignment")
  if (schoolId && assignmentModel) {
    // Bilingual title search: matches storage lang and its cached translations.
    let titleFilter: object = {}
    if (sp.title) {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      const titleConditions = await search(
        sp.title,
        ["title"],
        schoolId,
        (school?.preferredLanguage as "ar" | "en") || "ar",
        lang === "en" ? "en" : "ar"
      )
      titleFilter = { OR: titleConditions }
    }
    const where: any = {
      schoolId,
      ...titleFilter,
      ...(sp.type ? { type: sp.type } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]
    const [rows, count] = await Promise.all([
      assignmentModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          class: {
            select: {
              name: true,
            },
          },
        },
      }),
      assignmentModel.count({ where }),
    ])
    // Batched title localization — ONE findMany for all rows.
    const localized = await localize("Assignment", rows, { schoolId })
    const titleById = new Map(localized.map((r: any) => [r.id, r.title]))
    data = rows.map((a: any) => ({
      id: a.id,
      title: titleById.get(a.id) ?? a.title,
      type: a.type,
      totalPoints: a.totalPoints,
      dueDate: (a.dueDate as Date).toISOString(),
      createdAt: (a.createdAt as Date).toISOString(),
    }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeadingSetter
          title={dictionary?.school?.assignments?.title || "Assignments"}
          description={
            dictionary?.school?.assignments?.description ||
            "Manage academic assignments and assessments"
          }
        />
        <AssignmentsTable
          initialData={data}
          total={total}
          dictionary={dictionary?.school?.assignments}
          common={dictionary?.school?.common}
          lang={lang}
          perPage={sp.perPage}
          permissions={permissions}
        />
      </div>
    </PageContainer>
  )
}
