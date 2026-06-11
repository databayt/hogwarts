// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getText } from "@/components/translation/display"
import { getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

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
  const roomName = await getText(
    room.roomName,
    (room.lang as "ar" | "en") || "ar",
    lang,
    schoolId
  )
  const typeName = await getText(
    room.classroomType.name,
    (room.classroomType.lang as "ar" | "en") || "ar",
    lang,
    schoolId
  )
  const gradeName = room.grade
    ? await getText(
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

  const displayLang: "ar" | "en" = lang === "en" ? "en" : "ar"
  // Batched teacher-name resolution for the classes list (getNames handles
  // transliteration fallback when the Google API is unavailable).
  const teacherNames = await getNames(
    classes.filter((c) => c.teacher),
    (c) => c.teacher!,
    displayLang,
    schoolId
  )

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
      classes={classes.map((c) => {
        const raw = c.teacher ? fullName(c.teacher) : ""
        return {
          id: c.id,
          name: c.name,
          gradeName: c.grade?.name ?? null,
          subject: c.subject?.name ?? "",
          teacher: raw ? (teacherNames.get(raw) ?? raw) : "",
          enrollment: c._count.studentClasses,
          maxCapacity: c.maxCapacity ?? 0,
        }
      })}
      utilization={{ usedSlots, totalSlots, rate: utilization }}
      hasActiveTerm={!!term}
    />
  )
}
