import { StudentsTable } from '@/components/platform/students/table'
import { type StudentRow } from '@/components/platform/students/columns'
import { SearchParams } from 'nuqs/server'
import { studentsSearchParams } from '@/components/platform/students/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

interface Props {
  searchParams: Promise<SearchParams>;
  school?: any;
  dictionary?: Dictionary['school'];
  lang: Locale;
}

export default async function StudentsContent({ searchParams, school, dictionary, lang }: Props) {
  const sp = await studentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  
  // Use school from props if available, otherwise fall back to tenant context
  const effectiveSchoolId = school?.id || schoolId
  
  let data: StudentRow[] = []
  let total = 0
  if (effectiveSchoolId && (db as any).student) {
    const where: any = {
      schoolId: effectiveSchoolId,
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
    <StudentsTable
      initialData={data}
      total={total}
      dictionary={dictionary?.students}
      lang={lang}
      perPage={sp.perPage}
    />
  )
}


