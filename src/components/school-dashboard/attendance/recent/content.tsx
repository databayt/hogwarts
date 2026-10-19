"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Attendance › Reports › Activity.
 *
 * The latest marks as a compact list grouped by day (Today, Yesterday, then
 * dates). Relative times come from Intl.RelativeTimeFormat in the page's
 * language; an absent student shows no arrival time. The layout carries the
 * page heading — this view adds none of its own.
 */
import * as React from "react"
import { RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { getRecentAttendance, getSectionsForSelection } from "../actions"
import {
  dayKey,
  formatDay,
  formatTime,
  relativeTime,
} from "../analytics/format"
import { AttendanceSectionNav } from "../ui/section-nav"

interface Props {
  dictionary?: Dictionary
  locale?: string
}

interface ActivityRecord {
  id: string
  studentName: string
  className: string
  status: string
  method: string
  checkInTime?: string
  markedAt: string
}

type StatusFilter = "all" | "PRESENT" | "LATE" | "ABSENT"

const STATUS_DOT: Record<string, string> = {
  PRESENT: "bg-emerald-500",
  ABSENT: "bg-red-500",
  LATE: "bg-amber-500",
  EXCUSED: "bg-sky-500",
  SICK: "bg-violet-500",
}

export function RecentActivityContent({
  dictionary: dictionaryProp,
  locale = "ar",
}: Props) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const lang = locale
  const d = dictionary as any
  const t = d?.attendanceReports?.activity ?? {}
  const hub = d?.attendanceHub ?? {}

  const [records, setRecords] = React.useState<ActivityRecord[]>([])
  const [sections, setSections] = React.useState<
    { id: string; name: string; gradeName: string }[]
  >([])
  const [section, setSection] = React.useState("all")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await getRecentAttendance({
        limit: 100,
        sectionId: section !== "all" ? section : undefined,
      })
      setRecords(
        res.records.map((r) => ({
          id: r.id,
          studentName: r.studentName,
          className: r.className,
          status: String(r.status),
          method: String(r.method),
          checkInTime: r.checkInTime,
          markedAt: r.markedAt,
        }))
      )
    } catch (error) {
      console.error("[attendance activity] load failed", error)
    } finally {
      setLoading(false)
    }
  }, [section])

  React.useEffect(() => {
    load()
  }, [load])

  React.useEffect(() => {
    getSectionsForSelection().then((r) => {
      if (r.success && r.data) setSections(r.data.sections)
    })
  }, [])

  const groups = React.useMemo(() => {
    const filtered =
      status === "all" ? records : records.filter((r) => r.status === status)
    const today = dayKey(new Date())
    const y = new Date()
    y.setDate(y.getDate() - 1)
    const yesterday = dayKey(y)
    const map = new Map<string, ActivityRecord[]>()
    for (const r of filtered) {
      const k = dayKey(r.markedAt)
      const list = map.get(k) ?? []
      list.push(r)
      map.set(k, list)
    }
    return [...map.entries()].map(([k, items]) => ({
      key: k,
      label:
        k === today
          ? (t.today ?? "Today")
          : k === yesterday
            ? (t.yesterday ?? "Yesterday")
            : formatDay(items[0].markedAt, lang, {
                weekday: "long",
                day: "numeric",
                month: "long",
              }),
      items,
    }))
  }, [records, status, lang, t.today, t.yesterday])

  const statusLabel = (s: string) => hub.status?.[s] ?? s
  const methodLabel = (m: string) =>
    hub.methods?.[m] ?? m.replace(/_/g, " ").toLowerCase()

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="reports" dictionary={dictionary} />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "all", label: t.all ?? "All" },
            { value: "PRESENT", label: statusLabel("PRESENT") },
            { value: "LATE", label: statusLabel("LATE") },
            { value: "ABSENT", label: statusLabel("ABSENT") },
          ]}
        />
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="w-full rounded-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {d?.attendanceReports?.overview?.allSections ?? "All sections"}
            </SelectItem>
            {sections.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.gradeName} · {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="ms-auto rounded-full"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          {t.refresh ?? "Refresh"}
        </Button>
      </div>

      {loading && records.length === 0 ? (
        <div className="space-y-2 rounded-2xl border p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          {t.empty ?? "No attendance has been marked yet."}
        </p>
      ) : (
        <div className={cn("space-y-6", loading && "opacity-60")}>
          {groups.map((g) => (
            <section key={g.key} className="space-y-2">
              <h2 className="text-muted-foreground px-4 text-xs font-medium">
                {g.label}
              </h2>
              <ul className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
                {g.items.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        STATUS_DOT[r.status] ?? "bg-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.studentName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {[
                          statusLabel(r.status),
                          r.className,
                          methodLabel(r.method),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="text-muted-foreground shrink-0 text-end text-xs">
                      <p>{relativeTime(r.markedAt, lang)}</p>
                      {r.checkInTime && r.status !== "ABSENT" ? (
                        <p className="tabular-nums">
                          {(t.checkIn ?? "Arrived {time}").replace(
                            "{time}",
                            formatTime(r.checkInTime, lang)
                          )}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
