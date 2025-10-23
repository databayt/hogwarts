import { ClassesTable } from '@/components/platform/classes/table'
import { type ClassRow } from '@/components/platform/classes/columns'
import { SearchParams } from 'nuqs/server'
import { classesSearchParams } from '@/components/platform/classes/list-params'
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

export default async function ClassesContent({ searchParams, dictionary, lang }: Props) {
  const sp = await classesSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: ClassRow[] = []
  let total = 0
  if (schoolId && (db as any).class) {
    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: 'insensitive' } } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.termId ? { termId: sp.termId } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ createdAt: 'desc' }]
    const [rows, count] = await Promise.all([
      (db as any).class.findMany({ 
        where, 
        orderBy, 
        skip, 
        take,
        include: {
          subject: {
            select: {
              subjectName: true
            }
          },
          teacher: {
            select: {
              givenName: true,
              surname: true
            }
          },
          term: {
            select: {
              termNumber: true
            }
          }
        }
      }),
      (db as any).class.count({ where }),
    ])
    data = rows.map((c: any) => ({
      id: c.id,
      name: c.name,
      subjectName: c.subject?.subjectName || 'Unknown',
      teacherName: c.teacher ? `${c.teacher.givenName} ${c.teacher.surname}` : 'Unknown',
      termName: c.term?.termNumber ? `Term ${c.term.termNumber}` : 'Unknown',
      createdAt: (c.createdAt as Date).toISOString()
    }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title={dictionary?.school?.classes?.title || 'Classes'}
          description={dictionary?.school?.classes?.description || 'Manage academic classes and schedules'}
          className="text-start max-w-none"
        />
        <ClassesTable data={data} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}
