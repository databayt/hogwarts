"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Attendance › Reports › Records.
 *
 * The raw marks: one filter row (period, section, status, search), one
 * table, one export. Figures live on the Overview — not repeated here.
 * Status and method names come from `attendanceHub`, pagination strings
 * from `attendanceHub.table`, dates are Gregorian with Latin digits.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { getAttendanceReport, getSectionsForSelection } from "../actions"
import { formatDay, formatTime } from "../analytics/format"
import { AttendanceSectionNav } from "../ui/section-nav"
import { AttendanceReportExportButton } from "./export-button"

interface ReportRecord {
  id: string
  date: string
  studentId: string
  studentName: string
  sectionId: string | null
  className: string
  status: string
  method: string
  checkInTime?: string
  checkOutTime?: string
  notes?: string | null
}

interface Props {
  dictionary?: Dictionary
  locale?: string
  initialFilters?: {
    sectionId?: string
    studentId?: string
    status?: string
    from?: string
    to?: string
  }
}

type RangeKey = "week" | "month" | "quarter" | "custom"

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "SICK"] as const

const STATUS_DOT: Record<string, string> = {
  PRESENT: "bg-emerald-500",
  ABSENT: "bg-red-500",
  LATE: "bg-amber-500",
  EXCUSED: "bg-sky-500",
  SICK: "bg-violet-500",
  HOLIDAY: "bg-muted-foreground",
}

const PAGE_SIZE = 50

function presetRange(key: Exclude<RangeKey, "custom">) {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  from.setDate(
    from.getDate() - (key === "week" ? 6 : key === "month" ? 29 : 89)
  )
  return { from, to }
}

const fill = (tpl: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    tpl
  )

export function ReportsContent({
  dictionary,
  locale = "ar",
  initialFilters,
}: Props) {
  const lang = locale
  const d = dictionary as any
  const t = d?.attendanceReports?.records ?? {}
  const rangeT = d?.attendanceReports?.overview?.range ?? {}
  const hub = d?.attendanceHub ?? {}
  const tableT = hub.table ?? {}
  const cols = t.columns ?? {}

  const initialCustom =
    initialFilters?.from || initialFilters?.to
      ? {
          from: initialFilters.from
            ? new Date(initialFilters.from)
            : presetRange("month").from,
          to: initialFilters.to ? new Date(initialFilters.to) : new Date(),
        }
      : null

  const [range, setRange] = useState<RangeKey>(
    initialCustom ? "custom" : "month"
  )
  const [section, setSection] = useState(initialFilters?.sectionId || "all")
  const [status, setStatus] = useState(initialFilters?.status || "all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const [records, setRecords] = useState<ReportRecord[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<
    { id: string; name: string; gradeName: string }[]
  >([])

  const dates = useMemo(
    () =>
      range === "custom" && initialCustom
        ? initialCustom
        : presetRange(range === "custom" ? "month" : range),
    // initialCustom is derived from props once; range drives the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAttendanceReport({
        dateFrom: dates.from.toISOString(),
        dateTo: dates.to.toISOString(),
        sectionId: section !== "all" ? section : undefined,
        studentId: initialFilters?.studentId,
        status: status !== "all" ? [status as any] : undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
      if ("records" in res && res.records) {
        setRecords(res.records as ReportRecord[])
        setTotal(res.pagination?.total ?? 0)
        setTotalPages(Math.max(1, res.pagination?.totalPages ?? 1))
      } else {
        setRecords([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error("[attendance records] load failed", error)
    } finally {
      setLoading(false)
    }
  }, [dates, section, status, page, initialFilters?.studentId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getSectionsForSelection().then((r) => {
      if (r.success && r.data) setSections(r.data.sections)
    })
  }, [])

  const shown = useMemo(() => {
    if (!query) return records
    const q = query.toLowerCase()
    return records.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q)
    )
  }, [records, query])

  const rangeOptions: { value: RangeKey; label: React.ReactNode }[] = [
    { value: "week", label: rangeT.week ?? "7 days" },
    { value: "month", label: rangeT.month ?? "30 days" },
    { value: "quarter", label: rangeT.quarter ?? "90 days" },
    ...(initialCustom
      ? [
          {
            value: "custom" as const,
            label: `${formatDay(initialCustom.from, lang)} – ${formatDay(initialCustom.to, lang)}`,
          },
        ]
      : []),
  ]

  const statusLabel = (s: string) => hub.status?.[s] ?? s
  const methodLabel = (m: string) =>
    hub.methods?.[m] ?? m.replace(/_/g, " ").toLowerCase()

  const resetPage =
    <T,>(fn: (v: T) => void) =>
    (v: T) => {
      fn(v)
      setPage(1)
    }

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="reports" dictionary={dictionary} />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={range}
          onValueChange={resetPage(setRange)}
          options={rangeOptions}
        />
        <Select value={section} onValueChange={resetPage(setSection)}>
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
        <Select value={status} onValueChange={resetPage(setStatus)}>
          <SelectTrigger className="w-full rounded-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t.allStatuses ?? "All statuses"}
            </SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative w-full sm:w-[220px]">
          <Search className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder ?? "Search student or section"}
            className="rounded-full ps-9"
          />
        </div>
        <div className="ms-auto">
          <AttendanceReportExportButton
            filters={{
              sectionId: section !== "all" ? section : undefined,
              studentId: initialFilters?.studentId,
              status: status !== "all" ? status : undefined,
              from: dates.from.toISOString(),
              to: dates.to.toISOString(),
            }}
            sectionName={
              section !== "all"
                ? sections.find((s) => s.id === section)?.name
                : undefined
            }
            locale={lang}
          />
        </div>
      </div>

      <div className="bg-card overflow-hidden rounded-2xl border">
        {loading && records.length === 0 ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">
              {t.empty ?? "No records match these filters."}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t.emptyHint ?? "Try a wider period or another section."}
            </p>
          </div>
        ) : (
          <Table className={cn(loading && "opacity-60")}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-5">{cols.date ?? "Date"}</TableHead>
                <TableHead>{cols.student ?? "Student"}</TableHead>
                <TableHead className="max-md:hidden">
                  {cols.section ?? "Section"}
                </TableHead>
                <TableHead>{cols.status ?? "Status"}</TableHead>
                <TableHead className="max-md:hidden">
                  {cols.method ?? "Method"}
                </TableHead>
                <TableHead className="max-md:hidden">
                  {cols.checkIn ?? "Check-in"}
                </TableHead>
                <TableHead className="max-lg:hidden">
                  {cols.checkOut ?? "Check-out"}
                </TableHead>
                <TableHead className="pe-5 max-lg:hidden">
                  {cols.notes ?? "Notes"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground ps-5 whitespace-nowrap tabular-nums">
                    {formatDay(r.date, lang, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{r.studentName}</TableCell>
                  <TableCell className="text-muted-foreground max-md:hidden">
                    {r.className || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          STATUS_DOT[r.status] ?? "bg-muted-foreground"
                        )}
                      />
                      {statusLabel(r.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-md:hidden">
                    {methodLabel(r.method)}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums max-md:hidden">
                    {r.checkInTime && r.status !== "ABSENT"
                      ? formatTime(r.checkInTime, lang)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums max-lg:hidden">
                    {r.checkOutTime ? formatTime(r.checkOutTime, lang) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[220px] truncate pe-5 max-lg:hidden">
                    {(r.notes && (hub.notes?.[r.notes] ?? r.notes)) || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground tabular-nums">
            {fill(tableT.showingOf ?? "Showing {shown} of {total}", {
              shown: shown.length,
              total,
            })}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              {tableT.previous ?? "Previous"}
            </Button>
            <span className="text-muted-foreground tabular-nums">
              {fill(tableT.pageOf ?? "Page {page} of {pages}", {
                page,
                pages: totalPages,
              })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              {tableT.next ?? "Next"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
