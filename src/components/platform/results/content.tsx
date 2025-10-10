import { ResultsTable } from '@/components/platform/results/table'
import { resultColumns, type ResultRow } from '@/components/platform/results/columns'
import { SearchParams } from 'nuqs/server'
import { resultsSearchParams } from '@/components/platform/results/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/operator/lib/tenant'
import { Shell as PageContainer } from '@/components/table/shell'
import { type Locale } from '@/components/internationalization/config'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

export default async function ResultsContent({ searchParams, dictionary, lang }: Props) {
  const sp = await resultsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: ResultRow[] = []
  let total = 0
  if (schoolId && (db as any).result) {
    const where: any = {
      schoolId,
      ...(sp.studentId ? { studentId: sp.studentId } : {}),
      ...(sp.assignmentId ? { assignmentId: sp.assignmentId } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
      ...(sp.grade ? { grade: sp.grade } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ createdAt: 'desc' }]
    const [rows, count] = await Promise.all([
      (db as any).result.findMany({ 
        where, 
        orderBy, 
        skip, 
        take,
        include: {
          student: {
            select: {
              givenName: true,
              surname: true
            }
          },
          assignment: {
            select: {
              title: true,
              totalPoints: true
            }
          },
          class: {
            select: {
              name: true
            }
          }
        }
      }),
      (db as any).result.count({ where }),
    ])
    data = rows.map((r: any) => ({ 
      id: r.id, 
      studentName: r.student ? `${r.student.givenName} ${r.student.surname}` : 'Unknown',
      assignmentTitle: r.assignment?.title || 'Unknown',
      className: r.class?.name || 'Unknown',
      score: r.score,
      maxScore: r.maxScore,
      percentage: r.percentage,
      grade: r.grade,
      createdAt: (r.createdAt as Date).toISOString() 
    }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Results</h1>
          <p className="text-sm text-muted-foreground">Manage academic results and grades</p>
        </div>
        <ResultsTable data={data} columns={resultColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}
