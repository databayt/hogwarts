import { AssignmentsTable } from '@/components/platform/assignments/table'
import { assignmentColumns, type AssignmentRow } from '@/components/platform/assignments/columns'
import { SearchParams } from 'nuqs/server'
import { assignmentsSearchParams } from '@/components/platform/assignments/list-params'
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

export default async function AssignmentsContent({ searchParams, dictionary, lang }: Props) {
  const sp = await assignmentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: AssignmentRow[] = []
  let total = 0
  if (schoolId && (db as any).assignment) {
    const where: any = {
      schoolId,
      ...(sp.title ? { title: { contains: sp.title, mode: 'insensitive' } } : {}),
      ...(sp.type ? { type: sp.type } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ createdAt: 'desc' }]
    const [rows, count] = await Promise.all([
      (db as any).assignment.findMany({ 
        where, 
        orderBy, 
        skip, 
        take,
        include: {
          class: {
            select: {
              name: true
            }
          }
        }
      }),
      (db as any).assignment.count({ where }),
    ])
    data = rows.map((a: any) => ({ 
      id: a.id, 
      title: a.title, 
      type: a.type, 
      totalPoints: a.totalPoints,
      dueDate: (a.dueDate as Date).toISOString(),
      createdAt: (a.createdAt as Date).toISOString() 
    }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Assignments</h1>
          <p className="text-sm text-muted-foreground">Manage academic assignments and assessments</p>
        </div>
        <AssignmentsTable data={data} columns={assignmentColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}
