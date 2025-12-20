import { SearchParams } from "nuqs/server"

import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type AssignmentRow } from "@/components/platform/assignments/columns"
import { assignmentsSearchParams } from "@/components/platform/assignments/list-params"
import { AssignmentsTable } from "@/components/platform/assignments/table"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

export default async function AssignmentsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await assignmentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: AssignmentRow[] = []
  let total = 0
  const assignmentModel = getModel("assignment")
  if (schoolId && assignmentModel) {
    const where: any = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.type ? { type: sp.type } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]
    const [rows, count] = await Promise.all([
      assignmentModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          class: {
            select: {
              name: true,
            },
          },
        },
      }),
      assignmentModel.count({ where }),
    ])
    data = rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      totalPoints: a.totalPoints,
      dueDate: (a.dueDate as Date).toISOString(),
      createdAt: (a.createdAt as Date).toISOString(),
    }))
    total = count as number
  }
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeadingSetter
          title={dictionary?.school?.assignments?.title || "Assignments"}
          description={
            dictionary?.school?.assignments?.description ||
            "Manage academic assignments and assessments"
          }
        />
        <AssignmentsTable
          initialData={data}
          total={total}
          dictionary={dictionary?.school?.assignments}
          common={dictionary?.school?.common}
          lang={lang}
          perPage={sp.perPage}
        />
      </div>
    </PageContainer>
  )
}
