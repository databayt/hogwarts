import { AnnouncementsTable } from '@/components/platform/announcements/table'
import { type AnnouncementRow } from '@/components/platform/announcements/columns'
import { SearchParams } from 'nuqs/server'
import { announcementsSearchParams } from '@/components/platform/announcements/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

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
    const where: any = {
      schoolId,
      ...(sp.title ? { title: { contains: sp.title, mode: 'insensitive' } } : {}),
      ...(sp.scope ? { scope: sp.scope } : {}),
      ...(sp.published ? { published: sp.published === 'true' } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' as const : 'asc' as const }))
      : [{ createdAt: 'desc' as const }]
    const [rows, count] = await Promise.all([
      db.announcement.findMany({ where, orderBy, skip, take }),
      db.announcement.count({ where }),
    ])
    data = rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      scope: a.scope,
      published: a.published,
      createdAt: (a.createdAt as Date).toISOString()
    }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title={t.title}
          description={t.description}
          className="text-start max-w-none"
        />
        <AnnouncementsTable data={data} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} dictionary={t} lang={lang} />
      </div>
    </PageContainer>
  )
}



