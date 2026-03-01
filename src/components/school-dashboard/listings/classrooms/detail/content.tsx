// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getDisplayText } from "@/lib/content-display"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getRoomClasses, getRoomDetail, getRoomTimetable } from "../actions"
import { RoomDetail } from "./room-detail"

interface Props {
  lang: Locale
  roomId: string
  subdomain: string
}

export default async function RoomDetailContent({
  lang,
  roomId,
  subdomain,
}: Props) {
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.classrooms

  if (!schoolId) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        {d?.missingSchool || "Missing school context"}
      </div>
    )
  }

  const room = await getRoomDetail({ id: roomId })

  if (!room) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        {d?.roomNotFound || "Room not found"}
      </div>
    )
  }

  const { term } = await resolveActiveTerm(schoolId)

  const [timetable, classes] = await Promise.all([
    term
      ? getRoomTimetable({ roomId, termId: term.id })
      : Promise.resolve({
          slots: [],
          workingDays: [] as number[],
          periods: [],
        }),
    getRoomClasses({ roomId }),
  ])

  // Translate display text
  const roomName = await getDisplayText(
    room.roomName,
    (room.lang as "ar" | "en") || "ar",
    lang,
    schoolId
  )
  const typeName = await getDisplayText(
    room.classroomType.name,
    (room.classroomType.lang as "ar" | "en") || "ar",
    lang,
    schoolId
  )
  const gradeName = room.grade
    ? await getDisplayText(
        room.grade.name,
        (room.grade.lang as "ar" | "en") || "ar",
        lang,
        schoolId
      )
    : null

  // Calculate utilization
  const teachingPeriods = timetable.periods.filter(
    (p) =>
      !p.name.toLowerCase().includes("break") &&
      !p.name.toLowerCase().includes("lunch")
  )
  const totalSlots = teachingPeriods.length * timetable.workingDays.length
  const usedSlots = timetable.slots.length
  const utilization =
    totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0

  return (
    <RoomDetail
      lang={lang}
      subdomain={subdomain ?? ""}
      room={{
        id: room.id,
        roomName,
        capacity: room.capacity,
        typeName,
        gradeName,
        gradeId: room.gradeId,
      }}
      timetable={timetable}
      classes={classes.map((c) => ({
        id: c.id,
        name: c.name,
        gradeName: c.grade?.name ?? null,
        subject: c.subject?.subjectName ?? "",
        teacher: c.teacher ? `${c.teacher.givenName} ${c.teacher.surname}` : "",
        enrollment: c._count.studentClasses,
        maxCapacity: c.maxCapacity ?? 0,
      }))}
      utilization={{ usedSlots, totalSlots, rate: utilization }}
      hasActiveTerm={!!term}
    />
  )
}
