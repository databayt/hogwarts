import { TeachersTable } from '@/components/platform/teachers/table'
import { type TeacherRow } from '@/components/platform/teachers/columns'
import { SearchParams } from 'nuqs/server'
import { teachersSearchParams } from '@/components/platform/teachers/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary?: Dictionary['school']
}

export default async function TeachersContent({ searchParams, dictionary }: Props) {
  const sp = await teachersSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: TeacherRow[] = []
  let total = 0
  if (schoolId && (db as any).teacher) {
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
      (db as any).teacher.findMany({ where, orderBy, skip, take }),
      (db as any).teacher.count({ where }),
    ])
    data = rows.map((t: any) => ({ 
      id: t.id, 
      name: [t.givenName, t.surname].filter(Boolean).join(' '), 
      emailAddress: t.emailAddress || '-', 
      status: t.userId ? 'active' : 'inactive', 
      createdAt: (t.createdAt as Date).toISOString() 
    }))
    total = count as number
  }
  return (
    <div className="space-y-6">
      <TeachersTable initialData={data} total={total} dictionary={dictionary?.teachers} perPage={sp.perPage} />
    </div>
  )
}
