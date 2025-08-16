import { StudentsTable } from '@/components/platform/students/table'
import { studentColumns, type StudentRow } from '@/components/platform/students/columns'
import { SearchParams } from 'nuqs/server'
import { studentsSearchParams } from '@/components/platform/students/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/platform/operator/lib/tenant'

export const metadata = { title: 'Dashboard: Students' }

export default async function StudentsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await studentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: StudentRow[] = []
  let total = 0
  if (schoolId && (db as any).student) {
    const where: any = {
      schoolId,
      ...(sp.name ? { OR: [
        { givenName: { contains: sp.name, mode: 'insensitive' } },
        { surname: { contains: sp.name, mode: 'insensitive' } },
      ] } : {}),
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
      (db as any).student.findMany({ where, orderBy, skip, take }),
      (db as any).student.count({ where }),
    ])
    data = rows.map((s: any) => ({ id: s.id, name: [s.givenName, s.surname].filter(Boolean).join(' '), className: '-', status: s.userId ? 'active' : 'inactive', createdAt: (s.createdAt as Date).toISOString() }))
    total = count as number
  }
  return (
    
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Students</h1>
          {/* <p className="text-sm text-muted-foreground">List and manage students (placeholder)</p> */}
        </div>
        <StudentsTable data={data} columns={studentColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
   
  )
}


