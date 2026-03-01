"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import {
  ArrowLeft,
  Clock,
  DoorOpen,
  GraduationCap,
  Percent,
  User,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDictionary } from "@/components/internationalization/use-dictionary"

type SlotData = {
  id: string
  dayOfWeek: number
  periodId: string
  className: string
  classId: string
  gradeName: string | null
  gradeId: string | null
  subject: string
  teacher: string
  teacherId: string
}

type PeriodData = {
  id: string
  name: string
  startTime: string
  endTime: string
}

type ClassData = {
  id: string
  name: string
  gradeName: string | null
  subject: string
  teacher: string
  enrollment: number
  maxCapacity: number
}

interface RoomDetailProps {
  lang: string
  subdomain: string
  room: {
    id: string
    roomName: string
    capacity: number
    typeName: string
    gradeName: string | null
    gradeId: string | null
  }
  timetable: {
    slots: SlotData[]
    workingDays: number[]
    periods: PeriodData[]
  }
  classes: ClassData[]
  utilization: { usedSlots: number; totalSlots: number; rate: number }
  hasActiveTerm: boolean
}

export function RoomDetail({
  lang,
  subdomain,
  room,
  timetable,
  classes,
  utilization,
  hasActiveTerm,
}: RoomDetailProps) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.classrooms

  const DAY_LABELS = [
    d?.days?.sun || "Sun",
    d?.days?.mon || "Mon",
    d?.days?.tue || "Tue",
    d?.days?.wed || "Wed",
    d?.days?.thu || "Thu",
    d?.days?.fri || "Fri",
    d?.days?.sat || "Sat",
  ]

  const teachingPeriods = timetable.periods.filter(
    (p) =>
      !p.name.toLowerCase().includes("break") &&
      !p.name.toLowerCase().includes("lunch")
  )

  const getSlot = (
    dayOfWeek: number,
    periodId: string
  ): SlotData | undefined => {
    return timetable.slots.find(
      (s) => s.dayOfWeek === dayOfWeek && s.periodId === periodId
    )
  }

  const formatTime = (iso: string) => {
    const dt = new Date(iso)
    return `${dt.getUTCHours().toString().padStart(2, "0")}:${dt.getUTCMinutes().toString().padStart(2, "0")}`
  }

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return "text-red-500"
    if (rate >= 60) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${lang}/s/${subdomain}/classrooms`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">{room.roomName}</h2>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{room.typeName}</Badge>
            {room.gradeName ? (
              <Badge>{room.gradeName}</Badge>
            ) : (
              <Badge variant="secondary">{d?.shared || "Shared"}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="text-muted-foreground h-8 w-8" />
            <div>
              <p className="text-muted-foreground text-sm">
                {d?.capacity || "Capacity"}
              </p>
              <p className="text-2xl font-semibold">{room.capacity}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <DoorOpen className="text-muted-foreground h-8 w-8" />
            <div>
              <p className="text-muted-foreground text-sm">
                {d?.type || "Type"}
              </p>
              <p className="text-2xl font-semibold">{room.typeName}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <GraduationCap className="text-muted-foreground h-8 w-8" />
            <div>
              <p className="text-muted-foreground text-sm">
                {d?.grade || "Grade"}
              </p>
              <p className="text-2xl font-semibold">
                {room.gradeName || d?.shared || "Shared"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Percent className="text-muted-foreground h-8 w-8" />
            <div>
              <p className="text-muted-foreground text-sm">
                {d?.utilization || "Utilization"}
              </p>
              <p
                className={cn(
                  "text-2xl font-semibold",
                  getUtilizationColor(utilization.rate)
                )}
              >
                {utilization.rate}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization bar */}
      {hasActiveTerm && utilization.totalSlots > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {utilization.usedSlots} / {utilization.totalSlots}
              </span>
              <span
                className={cn(
                  "font-semibold",
                  getUtilizationColor(utilization.rate)
                )}
              >
                {utilization.rate}%
              </span>
            </div>
            <Progress value={utilization.rate} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule Grid */}
      {hasActiveTerm && teachingPeriods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {d?.weeklySchedule || "Weekly Schedule"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="border-e p-3 text-start">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{d?.period || "Period"}</span>
                      </div>
                    </th>
                    {timetable.workingDays.map((day) => (
                      <th key={day} className="min-w-[140px] p-3 text-center">
                        {DAY_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teachingPeriods.map((period) => (
                    <tr key={period.id} className="border-t">
                      <td className="bg-muted/50 border-e p-3">
                        <div className="font-medium">{period.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {formatTime(period.startTime)} -{" "}
                          {formatTime(period.endTime)}
                        </div>
                      </td>
                      {timetable.workingDays.map((day) => {
                        const slot = getSlot(day, period.id)
                        return (
                          <td
                            key={`${day}-${period.id}`}
                            className="border-e p-2"
                          >
                            {slot ? (
                              <div className="bg-primary/10 space-y-1 rounded-md p-2">
                                {slot.gradeName && (
                                  <Badge variant="default" className="text-xs">
                                    {slot.gradeName}
                                  </Badge>
                                )}
                                <div className="text-sm font-medium">
                                  {slot.className}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {slot.subject}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  <User className="me-1 h-3 w-3" />
                                  {slot.teacher}
                                </Badge>
                              </div>
                            ) : (
                              <div className="p-2 text-center text-sm text-green-600 italic">
                                {d?.available || "Available"}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No active term warning */}
      {!hasActiveTerm && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground py-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>
                {d?.noActiveTerm ||
                  "No active term found. Schedule data unavailable."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Classes */}
      {classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {d?.assignedClasses || "Assigned Classes"} ({classes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d?.class || "Class"}</TableHead>
                  <TableHead>{d?.grade || "Grade"}</TableHead>
                  <TableHead>{d?.subject || "Subject"}</TableHead>
                  <TableHead>{d?.teacher || "Teacher"}</TableHead>
                  <TableHead>{d?.enrollment || "Enrollment"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{cls.gradeName || "-"}</TableCell>
                    <TableCell>{cls.subject || "-"}</TableCell>
                    <TableCell>{cls.teacher || "-"}</TableCell>
                    <TableCell>
                      {cls.enrollment}/{cls.maxCapacity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
