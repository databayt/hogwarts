import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"

import { type ClassroomRow } from "./columns"
import { ClassroomsTable } from "./table"

interface Props {
  lang: Locale
}

export default async function ClassroomsContent({ lang }: Props) {
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
          classroomType: { select: { id: true, name: true } },
          _count: { select: { classes: true, timetables: true } },
          createdAt: true,
        },
      }),
      db.classroom.count({ where: { schoolId } }),
    ])

    data = rows.map((r) => ({
      id: r.id,
      roomName: r.roomName,
      capacity: r.capacity,
      typeName: r.classroomType.name,
      typeId: r.typeId,
      classCount: r._count.classes,
      timetableCount: r._count.timetables,
      createdAt: r.createdAt.toISOString(),
    }))
    total = count
  }

  return (
    <div className="space-y-6">
      <ClassroomsTable initialData={data} total={total} lang={lang} />
    </div>
  )
}
