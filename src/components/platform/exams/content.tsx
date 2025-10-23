import { ExamsTable } from '@/components/platform/exams/table'
import { examColumns, type ExamRow } from '@/components/platform/exams/columns'
import { SearchParams } from 'nuqs/server'
import { examsSearchParams } from '@/components/platform/exams/list-params'
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

export default async function ExamsContent({ searchParams, dictionary, lang }: Props) {
  const sp = await examsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: ExamRow[] = []
  let total = 0
  
  if (schoolId && (db as any).exam) {
    const where: any = {
      schoolId,
      ...(sp.title ? { title: { contains: sp.title, mode: 'insensitive' } } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.examType ? { examType: sp.examType } : {}),
      ...(sp.status ? { status: sp.status } : {}),
      ...(sp.examDate ? { examDate: new Date(sp.examDate) } : {}),
    }
    
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ examDate: 'desc' }, { startTime: 'asc' }]
      
    const [rows, count] = await Promise.all([
      (db as any).exam.findMany({ 
        where, 
        orderBy, 
        skip, 
        take,
        include: {
          class: {
            select: { name: true }
          },
          subject: {
            select: { subjectName: true }
          }
        }
      }),
      (db as any).exam.count({ where }),
    ])
    
    data = rows.map((e: any) => ({ 
      id: e.id, 
      title: e.title, 
      className: e.class?.name || 'Unknown', 
      subjectName: e.subject?.subjectName || 'Unknown', 
      examDate: (e.examDate as Date).toISOString(), 
      startTime: e.startTime, 
      endTime: e.endTime, 
      duration: e.duration, 
      totalMarks: e.totalMarks, 
      examType: e.examType, 
      status: e.status, 
      createdAt: (e.createdAt as Date).toISOString() 
    }))
    total = count as number
  }
  
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title={dictionary?.school?.exams?.title || 'Exams'}
          description={dictionary?.school?.exams?.description || 'Schedule and manage your exams'}
          className="text-start max-w-none"
        />
        <ExamsTable data={data} columns={examColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}
