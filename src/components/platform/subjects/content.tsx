import { SubjectsTable } from '@/components/platform/subjects/table'
import { subjectColumns, type SubjectRow } from '@/components/platform/subjects/columns'
import { SearchParams } from 'nuqs/server'
import { subjectsSearchParams } from '@/components/platform/subjects/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/operator/lib/tenant'
import { Shell as PageContainer } from '@/components/table/shell'

export default async function SubjectsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await subjectsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: SubjectRow[] = []
  let total = 0
  if (schoolId && (db as any).subject) {
    const where: any = {
      schoolId,
      ...(sp.subjectName ? { subjectName: { contains: sp.subjectName, mode: 'insensitive' } } : {}),
      ...(sp.departmentId ? { departmentId: sp.departmentId } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ createdAt: 'desc' }]
    const [rows, count] = await Promise.all([
      (db as any).subject.findMany({ 
        where, 
        orderBy, 
        skip, 
        take,
        include: {
          department: {
            select: {
              departmentName: true
            }
          }
        }
      }),
      (db as any).subject.count({ where }),
    ])
    data = rows.map((s: any) => ({ 
      id: s.id, 
      subjectName: s.subjectName, 
      departmentName: s.department?.departmentName || 'Unknown', 
      createdAt: (s.createdAt as Date).toISOString() 
    }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Subjects</h1>
          <p className="text-sm text-muted-foreground">Manage academic subjects and their departments</p>
        </div>
        <SubjectsTable data={data} columns={subjectColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}
