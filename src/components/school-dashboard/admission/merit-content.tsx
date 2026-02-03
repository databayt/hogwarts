import { SearchParams } from "nuqs/server"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { meritSearchParams } from "@/components/school-dashboard/admission/list-params"
import type { MeritRow } from "@/components/school-dashboard/admission/merit-columns"
import { MeritTable } from "@/components/school-dashboard/admission/merit-table"
import {
  getMeritList,
  getMeritStats,
} from "@/components/school-dashboard/admission/queries"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function MeritContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await meritSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  const t = dictionary.admission

  let data: MeritRow[] = []
  let total = 0
  let stats = { totalRanked: 0, selected: 0, waitlisted: 0, avgScore: 0 }

  if (schoolId) {
    try {
      const [listResult, statsResult] = await Promise.all([
        getMeritList(schoolId, {
          campaignId: sp.campaignId,
          category: sp.category,
          status: sp.status,
          page: sp.page,
          perPage: sp.perPage,
          sort: sp.sort,
        }),
        getMeritStats(schoolId, sp.campaignId || undefined),
      ])

      data = listResult.rows.map((a) => ({
        id: a.id,
        applicationNumber: a.applicationNumber,
        applicantName: `${a.firstName} ${a.lastName}`,
        firstName: a.firstName,
        lastName: a.lastName,
        applyingForClass: a.applyingForClass,
        category: a.category,
        status: a.status,
        meritScore: a.meritScore?.toString() ?? null,
        meritRank: a.meritRank,
        entranceScore: a.entranceScore?.toString() ?? null,
        interviewScore: a.interviewScore?.toString() ?? null,
        campaignName: a.campaign.name,
        campaignId: a.campaign.id,
      }))

      total = listResult.count
      stats = statsResult
    } catch (error) {
      console.error("[MeritContent] Error fetching merit list:", error)
      data = []
      total = 0
    }
  }

  return (
    <div className="space-y-6">
      <MeritTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
        campaignId={sp.campaignId || undefined}
        stats={stats}
      />
    </div>
  )
}
