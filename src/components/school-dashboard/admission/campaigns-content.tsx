// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { ADMIN_ROLES, isRoleIn } from "@/lib/rbac/ui-permissions"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { AdmissionAccessDenied } from "@/components/school-dashboard/admission/access-denied"
import type { CampaignRow } from "@/components/school-dashboard/admission/campaigns-columns"
import { CampaignsTable } from "@/components/school-dashboard/admission/campaigns-table"
import { campaignsSearchParams } from "@/components/school-dashboard/admission/list-params"
import { getCampaignsList } from "@/components/school-dashboard/admission/queries"
import { getLabels } from "@/components/translation/person"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function CampaignsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await campaignsSearchParams.parse(await searchParams)
  const { schoolId, role } = await getTenantContext()
  const t = dictionary.admission

  // Campaigns is an admin-only tab (getTabsForRole) — close the direct-URL
  // gap for STAFF/ACCOUNTANT, whose nav never shows it. Role is
  // session-derived; server actions stay independently permission-checked.
  if (!isRoleIn(role, ADMIN_ROLES)) {
    return <AdmissionAccessDenied dictionary={dictionary} />
  }

  let data: CampaignRow[] = []
  let total = 0

  if (schoolId) {
    try {
      const { rows, count } = await getCampaignsList(schoolId, {
        name: sp.name,
        status: sp.status,
        academicYear: sp.academicYear,
        page: sp.page,
        perPage: sp.perPage,
        sort: sp.sort,
      })

      // Resolve campaign names in ONE batched, deduped pass (getLabels) —
      // replaces the per-row getText N+1.
      const labels = await getLabels(
        rows.map((c) => c.name),
        lang,
        schoolId
      )

      data = rows.map((c) => ({
        id: c.id,
        name: labels.get(c.name) ?? c.name,
        academicYear: c.academicYear,
        startDate: c.startDate
          ? new Date(c.startDate).toISOString()
          : new Date().toISOString(),
        endDate: c.endDate
          ? new Date(c.endDate).toISOString()
          : new Date().toISOString(),
        status: c.status,
        totalSeats: c.totalSeats,
        applicationFee: c.applicationFee?.toString() ?? null,
        applicationsCount: c._count.applications,
        createdAt: c.createdAt
          ? new Date(c.createdAt).toISOString()
          : new Date().toISOString(),
      }))

      total = count
    } catch (error) {
      console.error("[CampaignsContent] Error fetching campaigns:", error)
      data = []
      total = 0
    }
  }

  return (
    <div className="space-y-6">
      <CampaignsTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  )
}
