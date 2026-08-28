// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getChildTodaySchedule } from "@/components/school-dashboard/timetable/actions"

import { getChildTimetable } from "./actions"
import { ChildTodayLive, type ChildTodayRow } from "./child-today-live"

interface Props {
  studentId: string
  dictionary?: Dictionary
  lang: Locale
}

// Map numeric dayOfWeek (0=Sunday, 1=Monday, etc.) to day names
const DAY_MAP: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
}

const DAYS_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]

const DAY_NAMES: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
}

export async function ChildTimetableView({
  studentId,
  dictionary,
  lang,
}: Props) {
  const t = dictionary?.parentPortal?.timetable
  // The weekly table below is a PATTERN — it cannot say whether a class is
  // online, because a live session only ever exists for a specific day. So the
  // live answer comes from today's schedule, fetched through the timetable
  // block's own guardian-gated action (which already runs `attachLiveClasses`)
  // rather than a second, drifting copy of that resolution here.
  //
  // Best-effort: a failure here must leave the weekly timetable standing. A
  // parent who cannot see the Join strip still needs to see the schedule.
  const [{ timetable }, today] = await Promise.all([
    getChildTimetable({ studentId }),
    getChildTodaySchedule({ childId: studentId }).catch(() => null),
  ])

  // Group timetable entries by day
  const timetableByDay = DAYS_ORDER.reduce(
    (acc, day) => {
      acc[day] = timetable
        .filter((entry) => DAY_MAP[entry.dayOfWeek] === day)
        .sort((a, b) => {
          const timeA = new Date(a.startTime).getTime()
          const timeB = new Date(b.startTime).getTime()
          return timeA - timeB
        })
      return acc
    },
    {} as Record<string, typeof timetable>
  )

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      {today && (
        <ChildTodayLive
          rows={today.schedule as ChildTodayRow[]}
          closure={today.closure ?? null}
          lang={lang}
          labels={{
            title: t?.todayTitle ?? "Today",
            description:
              t?.todayDescription ??
              "Your child's classes today. Online classes show a Join button while they are running.",
            online: t?.online ?? "Online",
            join: t?.join ?? "Join",
            empty: t?.noClassesToday ?? "No classes scheduled today.",
            closed: t?.closed ?? "School is closed today",
          }}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t?.title ?? "Weekly Timetable"}</CardTitle>
          <CardDescription>
            {timetable.length > 0
              ? (t?.showing?.replace("{count}", String(timetable.length)) ??
                `Showing ${timetable.length} scheduled class${timetable.length !== 1 ? "es" : ""}`)
              : (t?.noneAvailable ?? "No timetable available")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timetable.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              {t?.noneFound ?? "No timetable entries found"}
            </p>
          ) : (
            <div className="space-y-6">
              {DAYS_ORDER.map((day) => {
                const dayEntries = timetableByDay[day]
                if (dayEntries.length === 0) return null

                return (
                  <div key={day} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {t?.days?.[day as keyof typeof t.days] ??
                          DAY_NAMES[day]}
                      </h3>
                      <Badge variant="outline">
                        {dayEntries.length} {t?.classes ?? "classes"}
                      </Badge>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px]">
                              {t?.colPeriod ?? "Period"}
                            </TableHead>
                            <TableHead className="w-[140px]">
                              {t?.colTime ?? "Time"}
                            </TableHead>
                            <TableHead>{t?.colSubject ?? "Subject"}</TableHead>
                            <TableHead>{t?.colClass ?? "Class"}</TableHead>
                            <TableHead>{t?.colTeacher ?? "Teacher"}</TableHead>
                            <TableHead className="w-[100px]">
                              {t?.colRoom ?? "Room"}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayEntries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                {entry.periodName}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {formatTime(entry.startTime)} -{" "}
                                  {formatTime(entry.endTime)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  {entry.name}
                                </span>
                              </TableCell>
                              <TableCell>{entry.className}</TableCell>
                              <TableCell>{entry.teacherName}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {entry.roomName}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
