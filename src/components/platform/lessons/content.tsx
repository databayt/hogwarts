import { LessonsTable } from '@/components/platform/lessons/table'
import { lessonColumns, type LessonRow } from '@/components/platform/lessons/columns'
import { SearchParams } from 'nuqs/server'
import { lessonsSearchParams } from '@/components/platform/lessons/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/operator/lib/tenant'
import { Shell as PageContainer } from '@/components/table/shell'

export default async function LessonsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await lessonsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: LessonRow[] = []
  let total = 0
  
  if (schoolId && (db as any).lesson) {
    const where: any = {
      schoolId,
      ...(sp.title ? { title: { contains: sp.title, mode: 'insensitive' } } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.status ? { status: sp.status } : {}),
      ...(sp.lessonDate ? { lessonDate: new Date(sp.lessonDate) } : {}),
    }
    
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ lessonDate: 'desc' }, { startTime: 'asc' }]
      
    const [rows, count] = await Promise.all([
      (db as any).lesson.findMany({ 
        where, 
        orderBy, 
        skip, 
        take,
        include: {
          class: {
            select: { name: true }
          },
          teacher: {
            select: {
              givenName: true,
              surname: true
            }
          },
          subject: {
            select: { subjectName: true }
          }
        }
      }),
      (db as any).lesson.count({ where }),
    ])
    
    data = rows.map((l: any) => ({ 
      id: l.id, 
      title: l.title, 
      className: l.class?.name || 'Unknown', 
      teacherName: l.teacher ? `${l.teacher.givenName} ${l.teacher.surname}` : 'Unknown', 
      subjectName: l.subject?.subjectName || 'Unknown', 
      lessonDate: (l.lessonDate as Date).toISOString(), 
      startTime: l.startTime, 
      endTime: l.endTime, 
      status: l.status, 
      createdAt: (l.createdAt as Date).toISOString() 
    }))
    total = count as number
  }
  
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Lessons</h1>
          <p className="text-sm text-muted-foreground">Plan and manage your lessons</p>
        </div>
        <LessonsTable data={data} columns={lessonColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
      </div>
    </PageContainer>
  )
}
