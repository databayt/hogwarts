// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { localize } from "@/components/translation/localize"
import { getLabels } from "@/components/translation/person"

import { type ClassroomRow } from "./columns"
import { getUIConfigForRole } from "./permissions"
import { ClassroomsTable } from "./table"

interface Props {
  lang: Locale
  subdomain: string
}

export default async function ClassroomsContent({ lang, subdomain }: Props) {
  const { schoolId, role } = await getTenantContext()
  const permissions = getUIConfigForRole(role as Role | null | undefined)
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

    const displayLang: "ar" | "en" = lang === "en" ? "en" : "ar"
    // ONE batched translation pass: room names via localize, type/grade labels
    // via deduped getLabels — replaces the per-row 3×getText N+1.
    const [localizedRooms, typeLabels, gradeLabels] = await Promise.all([
      localize("Classroom", rows as any[], { schoolId, lang: displayLang }),
      getLabels(
        rows.map((r) => r.classroomType.name),
        displayLang,
        schoolId
      ),
      getLabels(
        rows.map((r) => r.grade?.name),
        displayLang,
        schoolId
      ),
    ])

    data = localizedRooms.map((r: any) => {
      const rawType = r.classroomType.name
      const rawGrade = r.grade?.name ?? ""
      return {
        id: r.id,
        roomName: r.roomName,
        capacity: r.capacity,
        typeName: typeLabels.get(rawType) ?? rawType,
        typeId: r.typeId,
        gradeName: r.grade ? (gradeLabels.get(rawGrade) ?? rawGrade) : null,
        gradeId: r.gradeId,
        classCount: r._count.classes,
        timetableCount: r._count.timetables,
        createdAt: (r.createdAt as Date).toISOString(),
      }
    })
    total = count
  }

  return (
    <div className="space-y-6">
      <ClassroomsTable
        initialData={data}
        total={total}
        lang={lang}
        subdomain={subdomain ?? ""}
        permissions={permissions}
      />
    </div>
  )
}
