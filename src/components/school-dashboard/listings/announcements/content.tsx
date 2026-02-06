import { SearchParams } from "nuqs/server"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type AnnouncementRow } from "@/components/school-dashboard/listings/announcements/columns"
import { announcementsSearchParams } from "@/components/school-dashboard/listings/announcements/list-params"
import { getAnnouncementsList } from "@/components/school-dashboard/listings/announcements/queries"
import { AnnouncementsTable } from "@/components/school-dashboard/listings/announcements/table"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function AnnouncementsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await announcementsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  const t = dictionary.announcements

  let data: AnnouncementRow[] = []
  let total = 0

  if (schoolId) {
    try {
      // Use shared query builder (caching removed due to multi-tenant complexity)
      // Admin table shows ALL announcements - single-language display
      const { rows, count } = await getAnnouncementsList(schoolId, {
        title: sp.title,
        scope: sp.scope,
        published: sp.published,
        page: sp.page,
        perPage: sp.perPage,
        sort: sp.sort,
      })

      // Map results to table format with single-language fields
      // CRITICAL FIX: Handle null/undefined dates to prevent server-side exceptions
      data = rows.map((a) => ({
        id: a.id,
        title: a.title,
        lang: a.lang,
        scope: a.scope,
        published: a.published,
        // Safe date serialization - fallback to current time if null/undefined
        createdAt: a.createdAt
          ? new Date(a.createdAt).toISOString()
          : new Date().toISOString(),
        createdBy: a.createdBy,
        priority: a.priority,
        pinned: a.pinned,
        featured: a.featured,
      }))

      total = count
    } catch (error) {
      // Log error for debugging but don't crash the page
      console.error(
        "[AnnouncementsContent] Error fetching announcements:",
        error
      )
      // Return empty data - page will show "No announcements" instead of crashing
      data = []
      total = 0
    }
  }

  return (
    <div className="space-y-6">
      <AnnouncementsTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  )
}
