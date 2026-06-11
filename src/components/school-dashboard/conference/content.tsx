// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type LiveClassRow } from "@/components/school-dashboard/conference/columns"
import { liveClassesSearchParams } from "@/components/school-dashboard/conference/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/conference/list-permissions"
import {
  getLiveClassesList,
  getLiveClassFormOptions,
  type LiveClassFormOptions,
} from "@/components/school-dashboard/conference/queries"
import { LiveClassesTable } from "@/components/school-dashboard/conference/table"
import { localize } from "@/components/translation/localize"
import { getLabels, getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

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

      // ONE batched translation pass: titles via localize, teacher names via
      // getNames, subject/section labels via getLabels (replaces per-row getText).
      const displayLang: "ar" | "en" = lang === "en" ? "en" : "ar"
      const [localizedRows, teacherNames, labels] = await Promise.all([
        localize("Conference", rows, { schoolId, lang: displayLang }),
        getNames(
          rows.filter((r) => r.teacher),
          (r: (typeof rows)[number]) => r.teacher!,
          displayLang,
          schoolId
        ),
        getLabels(
          rows.flatMap((r) => [r.subject?.name, r.section?.name]),
          displayLang,
          schoolId
        ),
      ])
      data = localizedRows.map((r) => {
        const rawTeacher = r.teacher ? fullName(r.teacher) : ""
        return {
          id: r.id,
          title: r.title,
          lang: r.lang,
          teacherId: r.teacherId,
          teacherName: rawTeacher
            ? (teacherNames.get(rawTeacher) ?? rawTeacher)
            : "",
          subjectId: r.subjectId,
          subjectName: r.subject?.name
            ? (labels.get(r.subject.name) ?? r.subject.name)
            : null,
          sectionId: r.sectionId,
          sectionName: r.section?.name
            ? (labels.get(r.section.name) ?? r.section.name)
            : null,
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
        }
      })

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
