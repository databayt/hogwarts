import { SubjectsTable } from '@/components/platform/subjects/table'
import { type SubjectRow } from '@/components/platform/subjects/columns'
import { SearchParams } from 'nuqs/server'
import { subjectsSearchParams } from '@/components/platform/subjects/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
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
              departmentName: true,
              departmentNameAr: true
            }
          }
        }
      }),
      (db as any).subject.count({ where }),
    ])
    data = rows.map((s: any) => ({
      id: s.id,
      subjectName: s.subjectName,
      subjectNameAr: s.subjectNameAr || null,
      departmentName: s.department?.departmentName || 'Unknown',
      departmentNameAr: s.department?.departmentNameAr || null,
      createdAt: (s.createdAt as Date).toISOString()
    }))
    total = count as number
  }
  return (
    <div className="space-y-6">
      <SubjectsTable initialData={data} total={total} perPage={sp.perPage} />
    </div>
  )
}
