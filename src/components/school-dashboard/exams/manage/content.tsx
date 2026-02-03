import { ExamStatus, ExamType, type Prisma } from "@prisma/client"
import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { Shell as PageContainer } from "@/components/table/shell"

import { type ExamRow } from "./columns"
import { examsSearchParams } from "./list-params"
import { ExamsTable } from "./table"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

export default async function ExamsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await examsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: ExamRow[] = []
  let total = 0

  if (schoolId) {
    const where: Prisma.ExamWhereInput = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.examType ? { examType: sp.examType as ExamType } : {}),
      ...(sp.status ? { status: sp.status as ExamStatus } : {}),
      ...(sp.examDate ? { examDate: new Date(sp.examDate) } : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ examDate: "desc" }, { startTime: "asc" }]

    const [rows, count] = await Promise.all([
      db.exam.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          class: {
            select: { name: true },
          },
          subject: {
            select: { subjectName: true },
          },
        },
      }),
      db.exam.count({ where }),
    ])

    data = rows.map((e) => ({
      id: e.id,
      title: e.title,
      className: e.class?.name || "Unknown",
      subjectName: e.subject?.subjectName || "Unknown",
      examDate: e.examDate.toISOString(),
      startTime: e.startTime,
      endTime: e.endTime,
      duration: e.duration,
      totalMarks: e.totalMarks,
      examType: e.examType,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    }))
    total = count
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <ExamsTable initialData={data} total={total} perPage={sp.perPage} />
      </div>
    </PageContainer>
  )
}
