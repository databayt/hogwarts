import { AnnouncementsTable } from '@/components/platform/announcements/table'
import { announcementColumns, type AnnouncementRow } from '@/components/platform/announcements/columns'
import { SearchParams } from 'nuqs/server'
import { announcementsSearchParams } from '@/components/platform/announcements/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/operator/lib/tenant'
import { Shell as PageContainer } from '@/components/table/shell'

export default async function AnnouncementsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await announcementsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: AnnouncementRow[] = []
  let total = 0
  if (schoolId && (db as any).announcement) {
    const where: any = {
      schoolId,
      ...(sp.title ? { title: { contains: sp.title, mode: 'insensitive' } } : {}),
      ...(sp.scope ? { scope: sp.scope } : {}),
      ...(sp.published ? { published: sp.published === 'true' } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ createdAt: 'desc' }]
    const [rows, count] = await Promise.all([
      (db as any).announcement.findMany({ where, orderBy, skip, take }),
      (db as any).announcement.count({ where }),
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
        <div>
          <h1 className="text-xl font-semibold">Announcements</h1>
          <p className="text-sm text-muted-foreground">Create and manage announcements for your school</p>
        </div>
        <AnnouncementsTable data={data} columns={announcementColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}



