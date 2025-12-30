import { SearchParams } from "nuqs/server"

import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { getDisplayName } from "@/lib/transliterate-name"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type StudentRow } from "@/components/platform/students/columns"
import { studentsSearchParams } from "@/components/platform/students/list-params"
import { StudentsTable } from "@/components/platform/students/table"

interface Props {
  searchParams: Promise<SearchParams>
  school?: any
  dictionary?: Dictionary["school"]
  lang: Locale
}

export default async function StudentsContent({
  searchParams,
  school,
  dictionary,
  lang,
}: Props) {
  const sp = await studentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()

  // Use school from props if available, otherwise fall back to tenant context
  const effectiveSchoolId = school?.id || schoolId

  let data: StudentRow[] = []
  let total = 0
  const studentModel = getModel("student")
  if (effectiveSchoolId && studentModel) {
    const where: any = {
      schoolId: effectiveSchoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
        : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]
    const [rows, count] = await Promise.all([
      studentModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: {
            select: {
              studentClasses: true,
              results: true,
            },
          },
          studentClasses: {
            take: 1,
            include: {
              class: {
                select: { name: true },
              },
            },
          },
        },
      }),
      studentModel.count({ where }),
    ])
    data = rows.map((s: any) => ({
      id: s.id,
      userId: s.userId,
      name: getDisplayName(s.givenName, s.surname, lang),
      className: s.studentClasses?.[0]?.class?.name || "-",
      status: s.userId ? "active" : "inactive",
      createdAt: (s.createdAt as Date).toISOString(),
      classCount: s._count?.studentClasses || 0,
      gradeCount: s._count?.results || 0,
    }))
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
