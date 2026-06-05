// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { getDisplayText } from "@/lib/content-display"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type LiveClassRow } from "@/components/school-dashboard/listings/live-classes/columns"
import { liveClassesSearchParams } from "@/components/school-dashboard/listings/live-classes/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/listings/live-classes/permissions"
import {
  getLiveClassesList,
  getLiveClassFormOptions,
  type LiveClassFormOptions,
} from "@/components/school-dashboard/listings/live-classes/queries"
import { LiveClassesTable } from "@/components/school-dashboard/listings/live-classes/table"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function LiveClassesContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await liveClassesSearchParams.parse(await searchParams)
  const { schoolId, role } = await getTenantContext()
  const permissions = getUIConfigForRole(role as Role | null | undefined)
  const t = dictionary.liveClasses

  let data: LiveClassRow[] = []
  let total = 0
  // Resolve form dropdown options on the server (teachers/subjects/sections)
  // and hand them to the table as stable props. The create/edit form must not
  // fetch these on the client — a parent re-render loop would otherwise turn
  // the on-mount fetch into a request storm with flickering selects.
  let formOptions: LiveClassFormOptions = {
    teachers: [],
    subjects: [],
    sections: [],
  }

  if (schoolId) {
    try {
      const [list, options] = await Promise.all([
        getLiveClassesList(schoolId, {
          title: sp.title,
          status: sp.status,
          page: sp.page,
          perPage: sp.perPage,
          sort: sp.sort,
        }),
        getLiveClassFormOptions(schoolId),
      ])
      const { rows, count } = list
      formOptions = options

      // Map results with on-demand title translation (single-language storage).
      data = await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          title: await getDisplayText(
            r.title,
            (r.lang as "ar" | "en") || "ar",
            lang,
            schoolId!
          ),
          lang: r.lang,
          teacherId: r.teacherId,
          teacherName:
            `${r.teacher?.firstName ?? ""} ${r.teacher?.lastName ?? ""}`.trim(),
          subjectId: r.subjectId,
          subjectName: r.subject?.name ?? null,
          sectionId: r.sectionId,
          sectionName: r.section?.name ?? null,
          status: r.status,
          meetingUrl: r.meetingUrl,
          meetingProvider: r.meetingProvider,
          scheduledStart: r.scheduledStart
            ? new Date(r.scheduledStart).toISOString()
            : new Date().toISOString(),
          scheduledEnd: r.scheduledEnd
            ? new Date(r.scheduledEnd).toISOString()
            : new Date().toISOString(),
          createdAt: r.createdAt
            ? new Date(r.createdAt).toISOString()
            : new Date().toISOString(),
        }))
      )

      total = count
    } catch (error) {
      console.error("[LiveClassesContent] Error fetching live classes:", error)
      data = []
      total = 0
    }
  }

  return (
    <div className="space-y-6">
      <LiveClassesTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
        permissions={permissions}
        formOptions={formOptions}
      />
    </div>
  )
}
