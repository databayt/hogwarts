"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One data source for the family pages. Today (summary) and Records (full
 * history) read the same records through the same day-level math, so the
 * two screens can never disagree about a rate or an absence count.
 */
import { useEffect, useState, useTransition } from "react"

import { getUnexcusedAbsences } from "../actions/excuses"
import {
  getGuardianChildrenAttendance,
  getStudentOwnAttendance,
} from "../actions/records"
import { dayKey } from "./format"

export interface FamilyRecord {
  id: string
  date: string
  status: string
  sectionName: string
}

export interface FamilyPerson {
  id: string
  /** null for the signed-in student's own view */
  name: string | null
  records: FamilyRecord[]
}

export interface DaySummary {
  date: string
  status: string
}

export interface FamilyStats {
  days: number
  present: number
  absent: number
  late: number
  excused: number
  rate: number
}

// Worst status of the day wins: one absent period makes the day absent.
const SEVERITY: Record<string, number> = {
  ABSENT: 5,
  SICK: 4,
  EXCUSED: 3,
  LATE: 2,
  PRESENT: 1,
  HOLIDAY: 0,
}

/** Collapse records (daily + per-period) into one status per calendar day. */
export function toDays(records: FamilyRecord[]): DaySummary[] {
  const byDay = new Map<string, string>()
  for (const r of records) {
    const key = dayKey(r.date)
    const prev = byDay.get(key)
    if (!prev || (SEVERITY[r.status] ?? 0) > (SEVERITY[prev] ?? 0)) {
      byDay.set(key, r.status)
    }
  }
  return [...byDay.entries()]
    .map(([date, status]) => ({ date, status }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function statsOf(days: DaySummary[]): FamilyStats {
  const counted = days.filter((d) => d.status !== "HOLIDAY")
  const present = counted.filter((d) => d.status === "PRESENT").length
  const absent = counted.filter((d) => d.status === "ABSENT").length
  const late = counted.filter((d) => d.status === "LATE").length
  const excused = counted.filter(
    (d) => d.status === "EXCUSED" || d.status === "SICK"
  ).length
  const total = counted.length
  return {
    days: total,
    present,
    absent,
    late,
    excused,
    // LATE is still attendance; never add present + late as a "present" count.
    rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
  }
}

export function useFamilyAttendance() {
  const [isPending, startTransition] = useTransition()
  const [people, setPeople] = useState<FamilyPerson[] | null>(null)
  const [isGuardian, setIsGuardian] = useState(false)
  /** attendanceId → studentId of each absence without an excuse (guardians) */
  const [unexcused, setUnexcused] = useState<Map<string, string>>(new Map())
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    startTransition(async () => {
      const guardian = await getGuardianChildrenAttendance().catch(() => null)
      if (guardian?.success && guardian.data?.students.length) {
        setIsGuardian(true)
        setPeople(
          guardian.data.students.map((s) => ({
            id: s.id,
            name: s.name,
            records: s.attendances.map((a) => ({
              id: a.id,
              date: new Date(a.date).toISOString(),
              status: a.status,
              sectionName: a.className,
            })),
          }))
        )
        const open = await getUnexcusedAbsences().catch(() => null)
        if (open?.success && open.data) {
          setUnexcused(
            new Map(open.data.absences.map((a) => [a.id, a.studentId]))
          )
        }
        return
      }

      const own = await getStudentOwnAttendance().catch(() => null)
      if (own?.success && own.data) {
        setPeople([
          {
            id: "self",
            name: null,
            records: own.data.records.map((r) => ({
              id: r.id,
              date: new Date(r.date).toISOString(),
              status: r.status,
              sectionName: r.className ?? "",
            })),
          },
        ])
        return
      }
      setFailed(true)
    })
  }, [])

  return {
    loading: isPending || (!people && !failed),
    people,
    isGuardian,
    unexcused,
    failed,
  }
}

/** Status dot / pill colors, shared by Today and Records. */
export const STATUS_TONE: Record<string, { dot: string; pill: string }> = {
  PRESENT: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  ABSENT: {
    dot: "bg-destructive",
    pill: "bg-destructive/10 text-destructive",
  },
  LATE: {
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  EXCUSED: {
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  SICK: {
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  HOLIDAY: {
    dot: "bg-muted-foreground/30",
    pill: "bg-muted text-muted-foreground",
  },
}
