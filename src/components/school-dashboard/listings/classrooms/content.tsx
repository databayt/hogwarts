// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"

import { type ClassroomRow } from "./columns"
import { ClassroomsTable } from "./table"

interface Props {
  lang: Locale
  subdomain: string
}

export default async function ClassroomsContent({ lang, subdomain }: Props) {
  const { schoolId } = await getTenantContext()
  let data: ClassroomRow[] = []
  let total = 0

  if (schoolId) {
    const [rows, count] = await Promise.all([
      db.classroom.findMany({
        where: { schoolId },
        orderBy: { roomName: "asc" },
        take: 20,
        select: {
          id: true,
          roomName: true,
          capacity: true,
          typeId: true,
          gradeId: true,
          lang: true,
          classroomType: { select: { id: true, name: true, lang: true } },
          grade: { select: { id: true, name: true, lang: true } },
          _count: { select: { classes: true, timetables: true } },
          createdAt: true,
        },
      }),
      db.classroom.count({ where: { schoolId } }),
    ])

    data = await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        roomName: await getDisplayText(
          r.roomName,
          (r.lang as "ar" | "en") || "ar",
          lang,
          schoolId!
        ),
        capacity: r.capacity,
        typeName: await getDisplayText(
          r.classroomType.name,
          (r.classroomType.lang as "ar" | "en") || "ar",
          lang,
          schoolId!
        ),
        typeId: r.typeId,
        gradeName: r.grade
          ? await getDisplayText(
              r.grade.name,
              (r.grade.lang as "ar" | "en") || "ar",
              lang,
              schoolId!
            )
          : null,
        gradeId: r.gradeId,
        classCount: r._count.classes,
        timetableCount: r._count.timetables,
        createdAt: r.createdAt.toISOString(),
      }))
    )
    total = count
  }

  return (
    <div className="space-y-6">
      <ClassroomsTable
        initialData={data}
        total={total}
        lang={lang}
        subdomain={subdomain ?? ""}
      />
    </div>
  )
}
