import { AnnouncementsTable } from '@/components/platform/announcements/table'
import { type AnnouncementRow } from '@/components/platform/announcements/columns'
import { SearchParams } from 'nuqs/server'
import { announcementsSearchParams } from '@/components/platform/announcements/list-params'
import { getTenantContext } from '@/lib/tenant-context'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'
import { getAnnouncementsList } from '@/components/platform/announcements/queries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
  lang: Locale
}

export default async function AnnouncementsContent({ searchParams, dictionary, lang }: Props) {
  const sp = await announcementsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  const t = dictionary.announcements

  let data: AnnouncementRow[] = []
  let total = 0

  if (schoolId) {
    try {
      // Use shared query builder (caching removed due to multi-tenant complexity)
      // Admin table shows ALL announcements regardless of language
      // Language filtering is only for public-facing views (not admin management)
      const { rows, count } = await getAnnouncementsList(schoolId, {
        // Note: language filter removed - admin sees all announcements
        title: sp.title,
        scope: sp.scope,
        published: sp.published,
        page: sp.page,
        perPage: sp.perPage,
        sort: sp.sort,
      });

      // Map results to table format with safe date serialization
      // CRITICAL FIX: Handle null/undefined dates to prevent server-side exceptions
      data = rows.map((a) => ({
        id: a.id,
        title: a.title,
        language: a.language, // Include language in row data
        scope: a.scope,
        published: a.published,
        // Safe date serialization - fallback to current time if null/undefined
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
        createdBy: a.createdBy,
        priority: a.priority,
        pinned: a.pinned,
        featured: a.featured,
      }));

      total = count;
    } catch (error) {
      // Log error for debugging but don't crash the page
      console.error('[AnnouncementsContent] Error fetching announcements:', error);
      // Return empty data - page will show "No announcements" instead of crashing
      data = [];
      total = 0;
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



