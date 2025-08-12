import { AnnouncementsContent } from '@/components/platform/announcements/content'
import { announcementsSearchParams } from '@/components/platform/announcements/list-params'
import { SearchParams } from 'nuqs/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/platform/operator/lib/tenant'
import { announcementColumns, type AnnouncementRow } from '@/components/platform/announcements/columns'
import { AnnouncementsTable } from '@/components/platform/announcements/table'
import type { Prisma, AnnouncementScope } from '@prisma/client'

export const metadata = { title: 'Dashboard: Announcements' }

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await announcementsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()

  const where: Prisma.AnnouncementWhereInput = {
    ...(schoolId ? { schoolId } : {}),
    ...(sp.search ? { title: { contains: sp.search, mode: 'insensitive' } } : {}),
    ...(sp.title ? { title: { contains: sp.title, mode: 'insensitive' } } : {}),
    ...(sp.scope ? { scope: sp.scope as AnnouncementScope } : {}),
    ...(sp.published === 'true' ? { published: true } : {}),
    ...(sp.published === 'false' ? { published: false } : {}),
  }

  const page = sp.page
  const take = sp.perPage
  const skip = (page - 1) * take

  let data: AnnouncementRow[] = []
  let total = 0

  // Query only if Announcement model exists in the current Prisma schema
  if ((db as any).announcement && schoolId) {
    const [rows, count] = await Promise.all([
      (db as any).announcement.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      (db as any).announcement.count({ where }),
    ])
    data = rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      scope: a.scope,
      published: !!a.published,
      createdAt: (a.createdAt as Date).toISOString(),
    }))
    total = count as number
  }

  return (
    <>
      <AnnouncementsContent />
      <AnnouncementsTable data={data} columns={announcementColumns} pageCount={Math.max(1, Math.ceil((total as number) / take))} />
    </>
  )
}


