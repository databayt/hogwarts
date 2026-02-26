// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type LessonRow } from "@/components/school-dashboard/listings/lessons/columns"
import { lessonsSearchParams } from "@/components/school-dashboard/listings/lessons/list-params"
import { LessonsTable } from "@/components/school-dashboard/listings/lessons/table"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function LessonsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await lessonsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: LessonRow[] = []
  let total = 0

  if (schoolId) {
    const where: any = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
      ...(sp.status ? { status: sp.status } : {}),
      ...(sp.lessonDate ? { lessonDate: new Date(sp.lessonDate) } : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({
            [s.id]: s.desc ? ("desc" as const) : ("asc" as const),
          }))
        : [{ lessonDate: "desc" as const }, { startTime: "asc" as const }]

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
              lang: true,
              subject: {
                select: { subjectName: true, lang: true },
              },
              teacher: {
                select: {
                  givenName: true,
                  surname: true,
                },
              },
            },
          },
        },
      }),
      db.lesson.count({ where }),
    ])

    data = await Promise.all(
      rows.map(async (l: any) => ({
        id: l.id,
        title: l.title,
        className: l.class?.name
          ? await getDisplayText(
              l.class.name,
              l.class.lang || "ar",
              lang,
              schoolId!
            )
          : "Unknown",
        teacherName: l.class?.teacher
          ? `${l.class.teacher.givenName} ${l.class.teacher.surname}`
          : "Unknown",
        subjectName: l.class?.subject?.subjectName
          ? await getDisplayText(
              l.class.subject.subjectName,
              l.class.subject.lang || "ar",
              lang,
              schoolId!
            )
          : "Unknown",
        lessonDate: (l.lessonDate as Date).toISOString(),
        startTime: l.startTime,
        endTime: l.endTime,
        status: l.status,
        createdAt: (l.createdAt as Date).toISOString(),
      }))
    )
    total = count as number
  }

  return (
    <div className="space-y-6">
      <LessonsTable
        initialData={data}
        total={total}
        dictionary={dictionary?.lessons}
        common={dictionary?.common}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  )
}
