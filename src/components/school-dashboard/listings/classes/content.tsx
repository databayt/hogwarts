import { SearchParams } from "nuqs/server"

import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type ClassRow } from "@/components/school-dashboard/listings/classes/columns"
import { classesSearchParams } from "@/components/school-dashboard/listings/classes/list-params"
import { ClassesTable } from "@/components/school-dashboard/listings/classes/table"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function ClassesContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await classesSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: ClassRow[] = []
  let total = 0
  const classModel = getModel("class")
  if (schoolId && classModel) {
    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.termId ? { termId: sp.termId } : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]
    const [rows, count] = await Promise.all([
      classModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          subject: {
            select: {
              subjectName: true,
              subjectNameAr: true,
            },
          },
          teacher: {
            select: {
              givenName: true,
              surname: true,
            },
          },
          term: {
            select: {
              termNumber: true,
            },
          },
          _count: {
            select: {
              studentClasses: true,
            },
          },
        },
      }),
      classModel.count({ where }),
    ])
    data = rows.map((c: any) => ({
      id: c.id,
      name: c.name,
      nameAr: c.nameAr || null,
      subjectName: c.subject?.subjectName || "Unknown",
      subjectNameAr: c.subject?.subjectNameAr || null,
      teacherName: c.teacher
        ? `${c.teacher.givenName} ${c.teacher.surname}`
        : "Unknown",
      termName: c.term?.termNumber ? `Term ${c.term.termNumber}` : "Unknown",
      courseCode: c.courseCode || null,
      credits: c.credits || null,
      evaluationType: c.evaluationType || "NORMAL",
      enrolledStudents: c._count?.studentClasses || 0,
      maxCapacity: c.maxCapacity || 50,
      createdAt: (c.createdAt as Date).toISOString(),
    }))
    total = count as number
  }
  return (
    <div className="space-y-6">
      <ClassesTable
        initialData={data}
        total={total}
        dictionary={dictionary?.classes}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  )
}
