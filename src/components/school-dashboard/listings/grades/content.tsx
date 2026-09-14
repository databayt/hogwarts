// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type ResultRow } from "@/components/school-dashboard/listings/grades/columns"
import { resultsSearchParams } from "@/components/school-dashboard/listings/grades/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/listings/grades/permissions"
import {
  formatResultRow,
  getChildrenIdsForGuardian,
  getResultsList,
} from "@/components/school-dashboard/listings/grades/queries"
import { ResultsTable } from "@/components/school-dashboard/listings/grades/table"
import { getLabels } from "@/components/translation/person"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function GradesContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await resultsSearchParams.parse(await searchParams)
  const { schoolId, role } = await getTenantContext()
  const permissions = getUIConfigForRole(role as Role | null | undefined)
  const t = dictionary.grades

  let data: ResultRow[] = []
  let total = 0

  // Students see only their own results; guardians only their children's.
  // Mirrors the auto-scope in the getResults action (client load-more/search).
  let studentIds: string[] | undefined
  if (schoolId && (role === "STUDENT" || role === "GUARDIAN")) {
    const userId = (await auth())?.user?.id
    if (!userId) {
      studentIds = []
    } else if (role === "GUARDIAN") {
      studentIds = await getChildrenIdsForGuardian(userId, schoolId)
    } else {
      const student = await db.student.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })
      studentIds = student ? [student.id] : []
    }
  }

  if (schoolId && studentIds?.length !== 0) {
    try {
      // Use centralized query builder from queries.ts
      const { rows, count } = await getResultsList(schoolId, {
        studentId: sp.studentId || undefined,
        studentIds,
        assignmentId: sp.assignmentId || undefined,
        classId: sp.classId || undefined,
        grade: sp.grade || undefined,
        page: sp.page,
        perPage: sp.perPage,
        sort: sp.sort,
      })

      // Map results, then translate ALL text columns in ONE batched, deduped
      // pass (getLabels) — replaces the per-row 3×getText N+1.
      const rawData = rows.map((r) => formatResultRow(r))
      const labels = await getLabels(
        rawData.flatMap((row) => [
          row.studentName,
          row.assignmentTitle,
          row.className,
        ]),
        lang,
        schoolId
      )
      data = rawData.map((row) => ({
        ...row,
        studentName: labels.get(row.studentName) ?? row.studentName,
        assignmentTitle: labels.get(row.assignmentTitle) ?? row.assignmentTitle,
        className: labels.get(row.className) ?? row.className,
      }))
      total = count
    } catch (error) {
      // Log error for debugging but don't crash the page
      console.error("[GradesContent] Error fetching results:", error)
      // Return empty data - page will show "No results" instead of crashing
      data = []
      total = 0
    }
  }

  return (
    <div className="space-y-6">
      <ResultsTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
        permissions={permissions}
      />
    </div>
  )
}
