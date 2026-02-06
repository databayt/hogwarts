import { SearchParams } from "nuqs/server"

import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type SubjectRow } from "@/components/school-dashboard/listings/subjects/columns"
import { subjectsSearchParams } from "@/components/school-dashboard/listings/subjects/list-params"
import { SubjectsTable } from "@/components/school-dashboard/listings/subjects/table"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

export default async function SubjectsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await subjectsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: SubjectRow[] = []
  let total = 0
  const subjectModel = getModel("subject")
  if (schoolId && subjectModel) {
    const where: any = {
      schoolId,
      ...(sp.subjectName
        ? { subjectName: { contains: sp.subjectName, mode: "insensitive" } }
        : {}),
      ...(sp.departmentId ? { departmentId: sp.departmentId } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]
    const [rows, count] = await Promise.all([
      subjectModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          department: {
            select: {
              departmentName: true,
            },
          },
        },
      }),
      subjectModel.count({ where }),
    ])
    data = rows.map((s: any) => ({
      id: s.id,
      subjectName: s.subjectName,
      lang: (s.lang as string) || "ar",
      departmentName: s.department?.departmentName || "Unknown",
      createdAt: (s.createdAt as Date).toISOString(),
    }))
    total = count as number
  }
  return (
    <div className="space-y-6">
      <SubjectsTable
        initialData={data}
        total={total}
        dictionary={dictionary?.school?.subjects}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  )
}
