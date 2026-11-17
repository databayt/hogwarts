// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Prisma } from "@prisma/client"
import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import {
  assignmentRowSelect,
  safeOrderBy,
  safeTypeFilter,
  toAssignmentRow,
  type AssignmentRow,
} from "@/components/school-dashboard/listings/assignments/list-core"
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

/** The management view: table, create, export — ADMIN, TEACHER, STAFF. */
export default async function StaffAssignmentsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const [sp, { schoolId, role }] = await Promise.all([
    searchParams.then((p) => assignmentsSearchParams.parse(p)),
    getTenantContext(),
  ])
  const permissions = getUIConfigForRole(role as Role | null | undefined)
  let data: AssignmentRow[] = []
  let total = 0
  const assignmentModel = db.schoolAssignment
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
    const type = safeTypeFilter(sp.type)
    const where: Prisma.SchoolAssignmentWhereInput = {
      schoolId,
      wizardStep: null,
      ...titleFilter,
      ...(type ? { type } : {}),
    }
    const orderBy = safeOrderBy(sp.sort)
    const [rows, count] = await Promise.all([
      assignmentModel.findMany({
        where,
        orderBy,
        skip: (sp.page - 1) * sp.perPage,
        take: sp.perPage,
        select: assignmentRowSelect,
      }),
      assignmentModel.count({ where }),
    ])
    // Batched title localization — ONE findMany for all rows.
    const localized = await localize("Assignment", rows, { schoolId })
    const titleById = new Map(localized.map((r: any) => [r.id, r.title]))
    data = rows.map((a) => ({
      ...toAssignmentRow(a),
      title: titleById.get(a.id) ?? a.title,
    }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeadingSetter
          title={dictionary?.school?.assignments?.title ?? ""}
          description={dictionary?.school?.assignments?.description ?? ""}
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
