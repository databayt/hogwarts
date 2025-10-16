import { ParentsTable } from '@/components/platform/parents/table'
import { parentColumns, type ParentRow } from '@/components/platform/parents/columns'
import { SearchParams } from 'nuqs/server'
import { parentsSearchParams } from '@/components/platform/parents/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { Shell as PageContainer } from '@/components/table/shell'
import { type Locale } from '@/components/internationalization/config'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

export default async function ParentsContent({ searchParams, dictionary, lang }: Props) {
  const sp = await parentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: ParentRow[] = []
  let total = 0
  if (schoolId && (db as any).guardian) {
    const where: any = {
      schoolId,
      ...(sp.name ? { OR: [
        { givenName: { contains: sp.name, mode: 'insensitive' } },
        { surname: { contains: sp.name, mode: 'insensitive' } },
      ] } : {}),
      ...(sp.emailAddress ? { emailAddress: { contains: sp.emailAddress, mode: 'insensitive' } } : {}),
      ...(sp.status
        ? sp.status === 'active'
          ? { NOT: { userId: null } }
          : sp.status === 'inactive'
            ? { userId: null }
            : {}
        : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ createdAt: 'desc' }]
    const [rows, count] = await Promise.all([
      (db as any).guardian.findMany({ where, orderBy, skip, take }),
      (db as any).guardian.count({ where }),
    ])
    data = rows.map((p: any) => ({ 
      id: p.id, 
      name: [p.givenName, p.surname].filter(Boolean).join(' '), 
      emailAddress: p.emailAddress || '-', 
      status: p.userId ? 'active' : 'inactive', 
      createdAt: (p.createdAt as Date).toISOString() 
    }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">{dictionary?.school?.parents?.title || 'Parents'}</h1>
          {/* <p className="text-sm text-muted-foreground">List and manage parents (placeholder)</p> */}
        </div>
        <ParentsTable data={data} columns={parentColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}
