import { SubjectsTable } from '@/components/platform/subjects/table'
import { subjectColumns, type SubjectRow } from '@/components/platform/subjects/columns'
import { SearchParams } from 'nuqs/server'
import { subjectsSearchParams } from '@/components/platform/subjects/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import { type Locale } from '@/components/internationalization/config'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

export default async function SubjectsContent({ searchParams, dictionary, lang }: Props) {
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
        <PageHeader
          title={dictionary?.school?.subjects?.title || 'Subjects'}
          description={dictionary?.school?.subjects?.description || 'Manage academic subjects and their departments'}
          className="text-start max-w-none"
        />
        <SubjectsTable data={data} columns={subjectColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}
