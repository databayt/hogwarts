import { ClassesTable } from '@/components/school/dashboard/classes/table'
import { classColumns, type ClassRow } from '@/components/school/dashboard/classes/columns'
import { Shell as PageContainer } from '@/components/table/shell'
import { SearchParams } from 'nuqs/server'
import { classesSearchParams } from '@/components/school/dashboard/classes/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/platform/operator/lib/tenant'

export const metadata = { title: 'Dashboard: Classes' }

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await classesSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: ClassRow[] = []
  let total = 0
  if (schoolId && (db as any).class) {
    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: 'insensitive' } } : {}),
      ...(sp.yearTerm ? { termId: { contains: sp.yearTerm, mode: 'insensitive' } } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ createdAt: 'desc' }]
    const [rows, count] = await Promise.all([
      (db as any).class.findMany({ where, orderBy, skip, take }),
      (db as any).class.count({ where }),
    ])
    data = rows.map((c: any) => ({ id: c.id, name: c.name, yearTerm: c.termId ?? '-', size: (c as any)._size ?? 0, createdAt: (c.createdAt as Date).toISOString() }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Classes</h1>
          <p className="text-sm text-muted-foreground">List and manage classes (placeholder)</p>
        </div>
        <ClassesTable data={data} columns={classColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}


