// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { localize } from "@/components/translation/localize"

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
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.classrooms
  const dc = d?.roomCapacity
  let data: ClassroomRow[] = []
  let total = 0
  // Select option lists for the add/edit dialog — fetched once here so the
  // dialog never fetches on open.
  let types: { id: string; name: string }[] = []
  let grades: { id: string; name: string }[] = []
  // School-wide capacity stats (folded in from the former Capacity tab).
  let totalCapacity = 0
  let roomsWithClasses = 0

  if (schoolId) {
    const [
      rows,
      count,
      classroomTypes,
      academicGrades,
      capacityAgg,
      withClasses,
    ] = await Promise.all([
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
          grade: { select: { id: true, name: true, gradeNumber: true } },
          _count: { select: { classes: true, timetables: true } },
          createdAt: true,
        },
      }),
      db.classroom.count({ where: { schoolId } }),
      db.classroomType.findMany({
        where: { schoolId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.academicGrade.findMany({
        where: { schoolId },
        select: { id: true, name: true },
        orderBy: { gradeNumber: "asc" },
      }),
      db.classroom.aggregate({
        where: { schoolId },
        _sum: { capacity: true },
      }),
      db.classroom.count({ where: { schoolId, classes: { some: {} } } }),
    ])
    types = classroomTypes
    grades = academicGrades
    totalCapacity = capacityAgg._sum.capacity ?? 0
    roomsWithClasses = withClasses

    const displayLang: "ar" | "en" = lang === "en" ? "en" : "ar"
    // Room names via localize. Type label (roomTypes dict) and grade label
    // ("Grade {n}" from gradeNumber) are resolved in the column — deterministic
    // and locale-correct without depending on the translation API.
    const localizedRooms = await localize("Classroom", rows as any[], {
      schoolId,
      lang: displayLang,
    })

    data = localizedRooms.map((r: any) => {
      return {
        id: r.id,
        roomName: r.roomName,
        capacity: r.capacity,
        typeName: r.classroomType.name,
        typeId: r.typeId,
        gradeName: r.grade?.name ?? null,
        gradeNumber: r.grade?.gradeNumber ?? null,
        gradeId: r.gradeId,
        classCount: r._count.classes,
        timetableCount: r._count.timetables,
        createdAt: (r.createdAt as Date).toISOString(),
      }
    })
    total = count
  }

  const avgCapacity = total > 0 ? Math.round(totalCapacity / total) : 0
  const avgUtilization =
    total > 0 ? Math.round((roomsWithClasses / total) * 100) : 0

  return (
    <div className="space-y-6">
      {total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                {dc?.totalRooms || "Total Rooms"}
              </p>
              <p className="text-2xl font-semibold">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                {dc?.totalCapacity || "Total Capacity"}
              </p>
              <p className="text-2xl font-semibold">{totalCapacity}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                {dc?.avgCapacity || "Avg Capacity"}
              </p>
              <p className="text-2xl font-semibold">{avgCapacity}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                {dc?.avgUtilization || "Avg Utilization"}
              </p>
              <p className="text-2xl font-semibold">{avgUtilization}%</p>
              <Progress value={avgUtilization} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </div>
      )}

      <ClassroomsTable
        initialData={data}
        total={total}
        lang={lang}
        subdomain={subdomain ?? ""}
        permissions={permissions}
        types={types}
        grades={grades}
      />
    </div>
  )
}
