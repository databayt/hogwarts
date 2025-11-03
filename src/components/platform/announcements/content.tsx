import { AnnouncementsTable } from '@/components/platform/announcements/table'
import { type AnnouncementRow } from '@/components/platform/announcements/columns'
import { SearchParams } from 'nuqs/server'
import { announcementsSearchParams } from '@/components/platform/announcements/list-params'
import { getTenantContext } from '@/lib/tenant-context'
import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
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
    // Use shared query builder (caching removed due to multi-tenant complexity)
    const { rows, count } = await getAnnouncementsList(schoolId, {
      title: sp.title,
      scope: sp.scope,
      published: sp.published,
      page: sp.page,
      perPage: sp.perPage,
      sort: sp.sort,
    });

    // Map results to table format
    data = rows.map((a) => ({
      id: a.id,
      title: a.title,
      scope: a.scope,
      published: a.published,
      createdAt: a.createdAt.toISOString(),
      createdBy: a.createdBy,
      priority: a.priority,
      pinned: a.pinned,
      featured: a.featured,
    }));

    total = count;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title={t.title}
          variant="dashboard"
          className="text-start max-w-none"
        />
        <AnnouncementsTable
          initialData={data}
          total={total}
          dictionary={t}
          lang={lang}
          perPage={sp.perPage}
        />
      </div>
    </PageContainer>
  )
}



