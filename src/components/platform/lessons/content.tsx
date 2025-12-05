import { LessonsTable } from '@/components/platform/lessons/table'
import { type LessonRow } from '@/components/platform/lessons/columns'
import { SearchParams } from 'nuqs/server'
import { lessonsSearchParams } from '@/components/platform/lessons/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { type Locale } from '@/components/internationalization/config'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
  lang: Locale
}

export default async function LessonsContent({ searchParams, dictionary, lang }: Props) {
  const sp = await lessonsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: LessonRow[] = []
  let total = 0

  if (schoolId) {
    const where: any = {
      schoolId,
      ...(sp.title ? { title: { contains: sp.title, mode: 'insensitive' } } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
      ...(sp.status ? { status: sp.status } : {}),
      ...(sp.lessonDate ? { lessonDate: new Date(sp.lessonDate) } : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' as const : 'asc' as const }))
      : [{ lessonDate: 'desc' as const }, { startTime: 'asc' as const }]

    const [rows, count] = await Promise.all([
      db.lesson.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          class: {
            select: {
              name: true,
              subject: {
                select: { subjectName: true }
              },
              teacher: {
                select: {
                  givenName: true,
                  surname: true
                }
              }
            }
          }
        }
      }),
      db.lesson.count({ where }),
    ])

    data = rows.map((l: any) => ({
      id: l.id,
      title: l.title,
      className: l.class?.name || 'Unknown',
      teacherName: l.class?.teacher ? `${l.class.teacher.givenName} ${l.class.teacher.surname}` : 'Unknown',
      subjectName: l.class?.subject?.subjectName || 'Unknown',
      lessonDate: (l.lessonDate as Date).toISOString(),
      startTime: l.startTime,
      endTime: l.endTime,
      status: l.status,
      createdAt: (l.createdAt as Date).toISOString()
    }))
    total = count as number
  }
  
  return (
    <div className="space-y-6">
      <LessonsTable
        initialData={data}
        total={total}
        dictionary={dictionary?.lessons}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  )
}
